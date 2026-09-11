import type { Response, Request } from 'express';

export interface LiveSyncEvent {
  type:
    | 'FAVORITE_TOGGLED'
    | 'WHATSAPP_STATUS_CHANGED'
    | 'WHATSAPP_MESSAGE'
    | 'SONG_REQUEST_ADDED'
    | 'SONG_REQUEST_UPDATED'
    | 'PRAYER_ADDED'
    | 'PRAYER_UPDATED'
    | 'STATION_UPDATED'
    | 'SCHEDULE_UPDATED'
    | 'DONATION_RECEIVED'
    | 'HEARTBEAT';
  stationId?: string;
  userId?: string;
  data?: any;
  timestamp: string;
}

// Active SSE client connections
const liveClients = new Set<Response>();

/**
 * Handle incoming SSE connection from client browsers
 */
export function handleLiveEventsStream(req: Request, res: Response): void {
  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering on Nginx/Railway proxies
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection event
  const initialPayload: LiveSyncEvent = {
    type: 'HEARTBEAT',
    timestamp: new Date().toISOString(),
    data: { message: 'Connected to Christian Radios Live Sync Engine' },
  };
  res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

  liveClients.add(res);

  // Remove client on disconnect
  req.on('close', () => {
    liveClients.delete(res);
  });

  req.on('end', () => {
    liveClients.delete(res);
  });
}

// Every connected browser receives every event on the public /api/public/events
// stream, so anything broadcast is effectively public. Station and session
// records carry gateway credentials, which must never be included.
const SECRET_KEYS = new Set([
  'metaAccessToken',
  'metaAppSecret',
  'metaVerifyToken',
  'pairingToken',
  'passwordHash',
  'accessToken',
  'apiKey',
  'secretKey',
  'consumerSecret',
  'clientSecret',
  'webhookSecret',
]);

function scrubSecrets(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => scrubSecrets(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEYS.has(key)) continue;
    result[key] = scrubSecrets(val, depth + 1);
  }
  return result;
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcastLiveEvent(
  type: LiveSyncEvent['type'],
  data?: any,
  meta?: { stationId?: string; userId?: string }
): void {
  const eventPayload: LiveSyncEvent = {
    type,
    stationId: meta?.stationId,
    userId: meta?.userId,
    data: scrubSecrets(data),
    timestamp: new Date().toISOString(),
  };

  const message = `data: ${JSON.stringify(eventPayload)}\n\n`;

  for (const client of Array.from(liveClients)) {
    try {
      client.write(message);
    } catch {
      liveClients.delete(client);
    }
  }
}

// Keep-alive heartbeat every 20 seconds to prevent connection timeouts
setInterval(() => {
  const pingMessage = `: keepalive ${Date.now()}\n\n`;
  for (const client of Array.from(liveClients)) {
    try {
      client.write(pingMessage);
    } catch {
      liveClients.delete(client);
    }
  }
}, 20000);
