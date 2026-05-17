'use client';

type AnalyticsEventName =
  | 'sign_up'
  | 'add_listing'
  | 'add_service'
  | 'service_request'
  | 'phone_click'
  | 'facebook_share'
  | 'share'
  | 'copy_link';

type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const metaEvents: Partial<Record<AnalyticsEventName, string>> = {
  sign_up: 'CompleteRegistration',
  add_listing: 'Lead',
  add_service: 'Lead',
  service_request: 'Lead',
  phone_click: 'Contact',
  facebook_share: 'Share',
  share: 'Share',
};

export function trackEvent(eventName: AnalyticsEventName, params: AnalyticsEventParams = {}) {
  if (typeof window === 'undefined') return;

  try {
    window.gtag?.('event', eventName, params);
  } catch {
    // Analytics must never block the user flow.
  }

  try {
    const metaEvent = metaEvents[eventName];
    if (metaEvent) {
      window.fbq?.('track', metaEvent, params);
    }
    window.fbq?.('trackCustom', eventName, params);
  } catch {
    // Analytics must never block the user flow.
  }
}
