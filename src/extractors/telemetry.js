// Analytics, crash reporting, and tracking. Matches known vendor hosts/SDK markers plus event-call patterns.
import { scanLines } from './common.js';

export const TRACKER_HOSTS = [
  'google-analytics.com', 'googletagmanager.com', 'analytics.google.com', 'doubleclick.net', 'segment.io', 'segment.com',
  'sentry.io', 'ingest.sentry.io', 'mixpanel.com', 'amplitude.com', 'posthog.com', 'datadoghq.com', 'browser-intake-datadoghq.com',
  'bugsnag.com', 'statsig.com', 'featuregates.org', 'launchdarkly.com', 'split.io', 'optimizely.com', 'heap.io', 'heapanalytics.com',
  'hotjar.com', 'fullstory.com', 'logrocket.com', 'newrelic.com', 'nr-data.net', 'appcenter.ms', 'app-measurement.com',
  'firebaseio.com', 'crashlytics.com', 'rudderstack.com', 'plausible.io', 'clarity.ms', 'braze.com', 'intercom.io', 'customer.io',
];
const SDK_MARKERS = /\b(Sentry\.init|@sentry\/[a-z-]+|posthog\.init|mixpanel\.init|amplitude\.(?:init|getInstance)|analytics\.load|gtag\(|datadogRum\.init|Bugsnag\.start|statsig\.initialize|LDClient\.initialize|crashReporter\.start)/g;
const EVENT_CALL = /\b(?:track|trackEvent|logEvent|captureEvent|sendEvent|recordEvent|reportEvent|analytics\.(?:track|page|identify|screen)|posthog\.capture|mixpanel\.track|amplitude\.track|gtag)\(\s*["'`]([^"'`]{2,80})["'`]/g;

export function extractTelemetry(sources, domains) {
  const out = scanLines(sources, [
    { re: SDK_MARKERS, group: 1, map: v => `sdk:${v.replace(/\($/, '')}`, meta: () => ({ kind: 'sdk' }) },
    { re: EVENT_CALL, map: v => `event:${v}`, meta: () => ({ kind: 'event' }) },
  ], { skipVendor: true });
  for (const [host, d] of domains) {
    if (TRACKER_HOSTS.some(t => host === t || host.endsWith('.' + t))) out.set(`host:${host}`, { ...d, value: `host:${host}`, meta: { kind: 'tracker-host' } });
  }
  return out;
}
