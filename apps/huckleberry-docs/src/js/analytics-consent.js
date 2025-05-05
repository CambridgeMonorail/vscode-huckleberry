// Initialize Google's consent mode with default settings (everything denied)
window.dataLayer = window.dataLayer || [];
function gtag(...args) {
  dataLayer.push(args);
}

/**
 * Set default consent to denied for analytics_storage and ad_storage
 * This ensures no tracking happens before user consent
 */
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  wait_for_update: 500, // Wait for 500ms before firing any tags
});

// Check if user has already given consent
const hasAnalyticsConsent = localStorage.getItem('gdpr-analytics-consent') === 'true';

// If user has previously consented, update the consent state
if (hasAnalyticsConsent) {
  gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied', // Keep ad storage denied as we're not using it
  });
}