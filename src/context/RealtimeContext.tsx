import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';

export type LiveEventType =
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
  | 'HEARTBEAT'
  | 'ALL';

export interface LiveSyncMessage {
  type: LiveEventType;
  stationId?: string;
  userId?: string;
  data?: any;
  timestamp: string;
}

interface RealtimeContextValue {
  emitLocalSync: (type: LiveEventType, data?: any, meta?: { stationId?: string; userId?: string }) => void;
  subscribe: (type: LiveEventType, callback: (event: LiveSyncMessage) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const BROADCAST_CHANNEL_NAME = 'christian_radios_live_sync';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const listenersRef = useRef<Map<LiveEventType, Set<(event: LiveSyncMessage) => void>>>(new Map());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Dispatch an event to all local subscribers
  const dispatchToListeners = useCallback((message: LiveSyncMessage) => {
    // Specific subscribers
    const specificListeners = listenersRef.current.get(message.type);
    if (specificListeners) {
      specificListeners.forEach((cb) => {
        try {
          cb(message);
        } catch (err) {
          console.error('[RealtimeSync] Listener error:', err);
        }
      });
    }

    // Catch-all subscribers
    const allListeners = listenersRef.current.get('ALL');
    if (allListeners) {
      allListeners.forEach((cb) => {
        try {
          cb(message);
        } catch (err) {
          console.error('[RealtimeSync] Wildcard listener error:', err);
        }
      });
    }

    // Dispatch DOM event for decoupled window listeners
    try {
      window.dispatchEvent(new CustomEvent('cr_live_sync', { detail: message }));
    } catch {}
  }, []);

  // BroadcastChannel for cross-tab communication
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channelRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data && event.data.type) {
          dispatchToListeners(event.data);
        }
      };
      return () => {
        bc.close();
      };
    }
  }, [dispatchToListeners]);

  // Connect to SSE stream from server
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    function connectSSE() {
      if (!isMounted) return;
      try {
        es = new EventSource('/api/public/events');
        eventSourceRef.current = es;

        es.onmessage = (event) => {
          try {
            const data: LiveSyncMessage = JSON.parse(event.data);
            if (data.type && data.type !== 'HEARTBEAT') {
              dispatchToListeners(data);
              // Also forward through BroadcastChannel so other tabs know
              channelRef.current?.postMessage(data);
            }
          } catch {}
        };

        es.onerror = () => {
          es?.close();
          // Retry connection after 4 seconds
          if (isMounted) {
            reconnectTimeout = setTimeout(connectSSE, 4000);
          }
        };
      } catch (err) {
        if (isMounted) {
          reconnectTimeout = setTimeout(connectSSE, 5000);
        }
      }
    }

    connectSSE();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (es) {
        es.close();
      }
    };
  }, [dispatchToListeners]);

  // Public emit function
  const emitLocalSync = useCallback(
    (type: LiveEventType, data?: any, meta?: { stationId?: string; userId?: string }) => {
      const message: LiveSyncMessage = {
        type,
        stationId: meta?.stationId,
        userId: meta?.userId,
        data,
        timestamp: new Date().toISOString(),
      };

      dispatchToListeners(message);
      channelRef.current?.postMessage(message);
    },
    [dispatchToListeners]
  );

  // Subscription registration
  const subscribe = useCallback((type: LiveEventType, callback: (event: LiveSyncMessage) => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    const set = listenersRef.current.get(type)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        listenersRef.current.delete(type);
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ emitLocalSync, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

/**
 * Hook to listen for specific realtime live events
 */
export function useLiveSyncListener(
  type: LiveEventType,
  callback: (event: LiveSyncMessage) => void,
  deps: any[] = []
) {
  const { subscribe } = useRealtime();
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const unsubscribe = subscribe(type, (event) => {
      cbRef.current(event);
    });
    return unsubscribe;
  }, [type, subscribe, ...deps]);
}
