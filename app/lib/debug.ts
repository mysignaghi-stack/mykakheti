type AnyArgs = Array<unknown>;

const isClient = typeof window !== 'undefined';

const debugEnabled = () => {
  if (isClient) {
    return process.env.NEXT_PUBLIC_DEBUG === 'true';
  }
  return process.env.DEBUG_LOGS === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true';
};

export const debugLog = (...args: AnyArgs) => {
  if (!debugEnabled()) return;
  console.log('[debug]', ...args);
};

export const debugWarn = (...args: AnyArgs) => {
  if (!debugEnabled()) return;
  console.warn('[debug]', ...args);
};

export const debugError = (...args: AnyArgs) => {
  if (!debugEnabled()) return;
  console.error('[debug]', ...args);
};
