/**
 * Root component for the Docusaurus site with GDPR-compliant cookie consent
 * for Google Analytics integration
 * 
 * @file src/theme/Root.tsx
 * @description Custom theme component to implement GDPR-compliant cookie consent
 * for Google Analytics tracking
 */

import React, { useEffect, useState } from 'react';
import CookieConsent from 'react-cookie-consent';
import { useLocation } from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

/**
 * Custom Root component that wraps the entire application to provide
 * cookie consent functionality
 */
export default function Root({ children }): JSX.Element {
  const location = useLocation();
  const isBrowser = useIsBrowser();
  const [hasConsent, setHasConsent] = useState(false);

  // Check for existing consent when the component mounts
  useEffect(() => {
    if (isBrowser) {
      const consentValue = localStorage.getItem('gdpr-analytics-consent');
      if (consentValue === 'true') {
        setHasConsent(true);
        enableAnalytics();
      } else if (consentValue === 'false') {
        setHasConsent(false);
        disableAnalytics();
      } else {
        // No consent decision yet, set default to deny
        disableAnalytics();
      }
    }
  }, [isBrowser]);

  // Track page views when location changes, but only if consent is given
  useEffect(() => {
    if (isBrowser && hasConsent && typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-J4S7Q0VMHR', {
        page_path: location.pathname,
      });
    }
  }, [location, hasConsent, isBrowser]);

  /**
   * Enable analytics tracking by updating consent state
   */
  const enableAnalytics = () => {
    if (
      ExecutionEnvironment.canUseDOM &&
      typeof window.gtag !== 'undefined'
    ) {
      // Enable analytics tracking
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied', // We're denying ad storage by default
      });
    }
  };

  /**
   * Disable analytics tracking by updating consent state
   */
  const disableAnalytics = () => {
    if (
      ExecutionEnvironment.canUseDOM &&
      typeof window.gtag !== 'undefined'
    ) {
      // Disable analytics tracking
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    }
  };

  /**
   * Handle user accepting analytics cookies
   */
  const handleAccept = () => {
    setHasConsent(true);
    localStorage.setItem('gdpr-analytics-consent', 'true');
    enableAnalytics();
  };

  /**
   * Handle user declining analytics cookies
   */
  const handleDecline = () => {
    setHasConsent(false);
    localStorage.setItem('gdpr-analytics-consent', 'false');
    disableAnalytics();
  };

  return (
    <>
      {isBrowser && (
        <CookieConsent
          location="bottom"
          buttonText="Accept"
          declineButtonText="Decline"
          cookieName="gdpr-analytics-consent"
          style={{
            background: '#2B373B',
            fontSize: '14px',
            alignItems: 'center',
          }}
          buttonStyle={{
            background: '#4e9bb9',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '4px',
            padding: '8px 16px',
          }}
          declineButtonStyle={{
            background: 'transparent',
            color: '#fff',
            fontSize: '14px',
            border: '1px solid #fff',
            borderRadius: '4px',
            padding: '8px 16px',
          }}
          enableDeclineButton
          onAccept={handleAccept}
          onDecline={handleDecline}
          expires={150} // Cookie expires after 150 days
        >
          This website uses cookies to enhance the user experience and analyze site traffic.
          We use Google Analytics to understand how our site is being used. 
          Your data is anonymized and processed in compliance with GDPR.{' '}
          <a 
            href="/privacy" 
            style={{ textDecoration: 'underline', color: 'white' }}
          >
            Learn more
          </a>
        </CookieConsent>
      )}
      {children}
    </>
  );
}