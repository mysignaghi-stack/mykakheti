import { supabase } from './supabase';

type Payload = any;

const listenersInsert = new Set<(payload: Payload) => void>();
const listenersDelete = new Set<(payload: Payload) => void>();

let initialized = false;
let bc: BroadcastChannel | null = null;

function init() {
  if (initialized) return;
  initialized = true;

  console.debug('[squareRealtime] init channel');

  const channel = supabase.channel('square_global_channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'square_messages' },
      (payload) => {
        console.debug('[squareRealtime] INSERT payload', payload);
        for (const l of Array.from(listenersInsert)) {
          try { l(payload); } catch (err) { console.error('listener insert error', err); }
        }
        try { bc?.postMessage({ type: 'INSERT', payload }); } catch {}
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'square_messages' },
      (payload) => {
        console.debug('[squareRealtime] DELETE payload', payload);
        for (const l of Array.from(listenersDelete)) {
          try { l(payload); } catch (err) { console.error('listener delete error', err); }
        }
        try { bc?.postMessage({ type: 'DELETE', payload }); } catch {}
      }
    )
    .subscribe();

  // Keep the channel alive; consumers will remove listeners when unmounting.
  // Do not remove channel on unsubscribe to keep a single global subscription.
  // If needed, we could implement a reference count and remove when 0.
  void channel;

  // BroadcastChannel mirror for same-origin windows/tabs
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('square_realtime_channel');
      bc.addEventListener('message', (ev) => {
        const { type, payload } = ev.data || {};
        if (type === 'INSERT') {
          console.debug('[squareRealtime] bc INSERT', payload);
          for (const l of Array.from(listenersInsert)) {
            try { l(payload); } catch (err) { console.error('listener insert error', err); }
          }
        } else if (type === 'DELETE') {
          console.debug('[squareRealtime] bc DELETE', payload);
          for (const l of Array.from(listenersDelete)) {
            try { l(payload); } catch (err) { console.error('listener delete error', err); }
          }
        }
      });
    }
  } catch (err) {
    console.warn('BroadcastChannel init failed', err);
  }
}

export function onMessageInsert(fn: (payload: Payload) => void) {
  init();
  listenersInsert.add(fn);
  return () => listenersInsert.delete(fn);
}

export function onMessageDelete(fn: (payload: Payload) => void) {
  init();
  listenersDelete.add(fn);
  return () => listenersDelete.delete(fn);
}

export function broadcastInsert(payload: Payload) {
  try { bc?.postMessage({ type: 'INSERT', payload }); } catch (e) { /* ignore */ }
}

export function broadcastDelete(payload: Payload) {
  try { bc?.postMessage({ type: 'DELETE', payload }); } catch (e) { /* ignore */ }
}
