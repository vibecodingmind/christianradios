import http from 'http';
import https from 'https';
import { URL } from 'url';
import { db } from './db.js';
import { validateStreamUrl } from './ssrf.js';
import type { StreamHealthCheck, StreamStatus } from './types.js';

export async function checkSingleStream(stationId: string): Promise<StreamHealthCheck> {
  const station = db.stations.findById(stationId);
  if (!station) {
    throw new Error('Station not found');
  }

  const ssrfCheck = await validateStreamUrl(station.streamUrl);
  if (!ssrfCheck.isValid) {
    const failedCheck: StreamHealthCheck = {
      id: `hc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stationId,
      checkedAt: new Date().toISOString(),
      isOnline: false,
      statusCode: 0,
      responseTimeMs: 0,
      errorMessage: ssrfCheck.error || 'SSRF validation rejected URL',
    };
    db.healthChecks.log(failedCheck);
    db.stations.update(stationId, {
      streamStatus: 'OFFLINE',
      lastCheckedAt: new Date().toISOString(),
    });
    return failedCheck;
  }

  const startTime = Date.now();
  const targetUrl = new URL(station.streamUrl);
  const isHttps = targetUrl.protocol === 'https:';
  const client = isHttps ? https : http;

  return new Promise<StreamHealthCheck>((resolve) => {
    const timeoutMs = (db.settings.get().streamTimeoutSeconds || 8) * 1000;
    let resolved = false;

    const finalize = (
      isOnline: boolean,
      statusCode: number,
      errorMessage?: string,
      contentType?: string
    ) => {
      if (resolved) return;
      resolved = true;
      const responseTimeMs = Date.now() - startTime;
      const checkRecord: StreamHealthCheck = {
        id: `hc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        stationId,
        checkedAt: new Date().toISOString(),
        isOnline,
        statusCode,
        responseTimeMs,
        errorMessage,
        contentType,
      };

      db.healthChecks.log(checkRecord);
      const updates: {
        streamStatus: StreamStatus;
        lastCheckedAt: string;
        lastOnlineAt?: string;
        responseLatencyMs?: number;
      } = {
        streamStatus: isOnline ? 'ONLINE' : 'OFFLINE',
        lastCheckedAt: new Date().toISOString(),
        responseLatencyMs: responseTimeMs,
      };

      if (isOnline) {
        updates.lastOnlineAt = new Date().toISOString();
        
        // If there was an active outage for this station, mark it resolved
        const activeOutages = db.streamOutages.getActive().filter((o) => o.stationId === stationId);
        for (const outage of activeOutages) {
          db.streamOutages.resolve(outage.id);
          // Calculate outage duration
          const startMs = new Date(outage.detectedAt).getTime();
          const durationMins = Math.max(1, Math.round((Date.now() - startMs) / 60000));
          outage.outageDurationMinutes = durationMins;

          // Dispatch recovery notification to station owner
          db.notifications.create({
            id: `notif_${Date.now()}_rec`,
            userId: station.ownerId,
            title: `Stream Recovered: ${station.name} is Back Online`,
            message: `Your stream broadcast is once again reachable and online. Outage lasted approximately ${durationMins} minute(s).`,
            type: 'STREAM_RECOVERED',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // Stream is offline: check if an active outage alert already exists
        const existingOutages = db.streamOutages.getActive().filter((o) => o.stationId === stationId);
        if (existingOutages.length === 0) {
          const newOutage = db.streamOutages.create({
            id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            stationId: station.id,
            stationName: station.name,
            ownerId: station.ownerId,
            detectedAt: new Date().toISOString(),
            status: 'ACTIVE_OUTAGE',
            errorReason: errorMessage || `HTTP status ${statusCode || 'Unreachable'}`,
          });

          // Dispatch outage notification to station owner
          db.notifications.create({
            id: `notif_${Date.now()}_out`,
            userId: station.ownerId,
            title: `Stream Outage Alert: ${station.name}`,
            message: `Our automated monitoring system was unable to reach your audio stream at ${station.streamUrl}. Error: ${newOutage.errorReason}. Please inspect your broadcast server.`,
            type: 'STREAM_OUTAGE',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      db.stations.update(stationId, updates);
      resolve(checkRecord);
    };

    try {
      const req = client.request(
        targetUrl,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'ChristianRadios-Monitor/1.0 (Christian Online Radio SaaS)',
            Accept: '*/*',
            'Icy-MetaData': '1',
            Range: 'bytes=0-1024', // Request small chunk to avoid downloading entire stream
          },
          timeout: timeoutMs,
        },
        (res) => {
          const statusCode = res.statusCode || 0;
          const contentType = res.headers['content-type'] || '';
          // 200, 206 (Partial Content), or 302/301 redirects
          const isSuccess =
            (statusCode >= 200 && statusCode < 300) ||
            statusCode === 301 ||
            statusCode === 302 ||
            statusCode === 307;

          // Destroy stream immediately after receiving headers/chunk
          res.on('data', () => {
            req.destroy();
          });

          res.on('end', () => {
            finalize(isSuccess, statusCode, isSuccess ? undefined : `HTTP ${statusCode}`, contentType);
          });

          res.on('close', () => {
            finalize(isSuccess, statusCode, isSuccess ? undefined : `HTTP ${statusCode}`, contentType);
          });

          // In case connection stays open
          setTimeout(() => {
            req.destroy();
            finalize(isSuccess, statusCode, undefined, contentType);
          }, 1500);
        }
      );

      req.on('timeout', () => {
        req.destroy();
        finalize(false, 408, `Stream connection timed out after ${timeoutMs / 1000}s`);
      });

      req.on('error', (err) => {
        finalize(false, 0, err.message || 'Connection failed');
      });

      req.end();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network error';
      finalize(false, 0, msg);
    }
  });
}

export async function checkBatchOfStreams(batchSize = 25): Promise<{ total: number; checked: number }> {
  const activeStations = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  if (activeStations.length === 0) return { total: 0, checked: 0 };

  // Sort by lastCheckedAt ascending (oldest checked first)
  const sorted = [...activeStations].sort((a, b) => {
    const timeA = a.lastCheckedAt ? new Date(a.lastCheckedAt).getTime() : 0;
    const timeB = b.lastCheckedAt ? new Date(b.lastCheckedAt).getTime() : 0;
    return timeA - timeB;
  });

  const batch = sorted.slice(0, batchSize);

  // Run batch with concurrency of 5 to avoid CPU/network spikes
  const concurrency = 5;
  for (let i = 0; i < batch.length; i += concurrency) {
    const chunk = batch.slice(i, i + concurrency);
    await Promise.allSettled(chunk.map((station) => checkSingleStream(station.id)));
  }

  // Ensure database persists after batch check completes
  db.saveImmediately();

  return { total: activeStations.length, checked: batch.length };
}

export async function runAllStreamHealthChecks(): Promise<{ total: number; online: number; offline: number }> {
  // Backwards compatible wrapper for manual triggers
  const res = await checkBatchOfStreams(50);
  return { total: res.total, online: res.checked, offline: 0 };
}

let monitorIntervalTimer: NodeJS.Timeout | null = null;

export function startStreamMonitorWorker() {
  if (monitorIntervalTimer) {
    clearInterval(monitorIntervalTimer);
  }

  const intervalMinutes = db.settings.get().streamCheckIntervalMinutes || 5;
  const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

  console.log(`[StreamMonitor] Background worker initialized. Interval: ${intervalMinutes} min.`);

  // Initial lightweight batch check 15 seconds after startup
  setTimeout(() => {
    checkBatchOfStreams(20).catch((err) =>
      console.error('[StreamMonitor] Initial run error:', err)
    );
  }, 15000);

  monitorIntervalTimer = setInterval(() => {
    checkBatchOfStreams(20).catch((err) =>
      console.error('[StreamMonitor] Periodic check error:', err)
    );
  }, intervalMs);
}
