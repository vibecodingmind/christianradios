import { db } from '../db.js';
import { radioImportService } from './importService.js';
import { checkSingleStream } from '../streamMonitor.js';
import type { RadioStationSyncLog, Station } from '../types.js';

export async function syncStationFromSource(
  stationId: string,
  triggeredBy: string,
  force = false
): Promise<{ success: boolean; station: Station; changedFields: string[]; message: string }> {
  const station = db.stations.findById(stationId);
  if (!station) {
    throw new Error('Station not found');
  }

  const sourceUrl = station.sourceUrl;
  if (!sourceUrl) {
    throw new Error('This station was created manually and has no linked external source.');
  }

  const provider = radioImportService.getProviderForUrl(sourceUrl);
  let extracted;
  try {
    extracted = await provider.extract(sourceUrl);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Sync fetch failed';
    const failLog: RadioStationSyncLog = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stationId,
      triggeredBy,
      sourceType: station.sourceType || 'IMPORTED_OTHER',
      status: 'FAILED',
      changedFields: [],
      details: `Sync failed: ${errorMsg}`,
      createdAt: new Date().toISOString(),
    };
    db.syncLogs.create(failLog);

    const source = db.stationSources.findByStationId(stationId);
    if (source) {
      db.stationSources.update(source.id, {
        syncStatus: 'FAILED',
        syncErrorMessage: errorMsg,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    throw new Error(`Synchronization failed: ${errorMsg}`);
  }

  const changedFields: string[] = [];
  const updates: Partial<Station> = {
    lastSyncedAt: new Date().toISOString(),
  };

  // Safe field sync
  if (extracted.streamUrl && extracted.streamUrl !== station.streamUrl) {
    updates.streamUrl = extracted.streamUrl;
    changedFields.push('streamUrl');
  }

  if (extracted.bitrateKbps && extracted.bitrateKbps !== station.bitrateKbps) {
    updates.bitrateKbps = extracted.bitrateKbps;
    changedFields.push('bitrateKbps');
  }

  if (force) {
    if (extracted.name && extracted.name !== station.name) {
      updates.name = extracted.name;
      changedFields.push('name');
    }
    if (extracted.description && extracted.description !== station.description) {
      updates.description = extracted.description;
      changedFields.push('description');
    }
    if (extracted.logoUrl && extracted.logoUrl !== station.logoUrl) {
      updates.logoUrl = extracted.logoUrl;
      changedFields.push('logoUrl');
    }
  }

  const updatedStation = db.stations.update(stationId, updates);

  // Update source record
  const source = db.stationSources.findByStationId(stationId);
  if (source) {
    db.stationSources.update(source.id, {
      syncStatus: 'SUCCESS',
      syncErrorMessage: undefined,
      lastSyncedAt: new Date().toISOString(),
    });
  }

  // Create sync log
  const syncLog: RadioStationSyncLog = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId,
    sourceId: source?.id,
    triggeredBy,
    sourceType: station.sourceType || 'IMPORTED_OTHER',
    status: 'SUCCESS',
    changedFields,
    details: changedFields.length > 0
      ? `Updated fields: ${changedFields.join(', ')}`
      : 'Metadata re-verified. No changes required.',
    createdAt: new Date().toISOString(),
  };
  db.syncLogs.create(syncLog);

  // Trigger stream check
  setTimeout(() => {
    checkSingleStream(stationId).catch(() => {});
  }, 500);

  return {
    success: true,
    station: updatedStation!,
    changedFields,
    message: changedFields.length > 0
      ? `Station synchronized successfully. Updated: ${changedFields.join(', ')}`
      : 'Station metadata synchronized. Remote stream and data are up to date.',
  };
}
