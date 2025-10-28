/**
 * Analytics Snippet (v2 - Domain Aware)
 *
 * This script is embedded on a client's website to track user events.
 * It automatically determines the API endpoint from its own script location.
 *
 * --- How to use ---
 *
 * 1. Basic Setup (put before </body>):
 *
 * <script>
 *   window.analyticsConfig = {
 *     websiteId: 'your-unique-website-id'
 *   };
 * </script>
 * <script async defer src="https://your-domain.com/analytics_platform/public/analytics-snippet.js"></script>
 *
 *
 * 2. Tracking Custom Events (e.g., button click):
 *
 * <button onclick="analytics.track('signup_click', { plan: 'premium' })">Sign Up</button>
 *
 *
 * 3. Tracking 404 "Not Found" Errors:
 *    On your website's 404 error page, add this script snippet:
 *
 * <script>
 *   if (window.analytics) {
 *     window.analytics.track404();
 *   }
 * </script>
 *
 */
(function () {
  // Exit if the browser doesn't support the required APIs or this script.
  if (
    !window.fetch ||
    !window.JSON ||
    !window.localStorage ||
    !document.currentScript
  ) {
    console.warn(
      "Analytics snippet: Browser does not support required features.",
    );
    return;
  }

  const userConfig = window.analyticsConfig || {};
  const websiteId = userConfig.websiteId;

  // --- Dynamic Endpoint Detection ---
  const currentScript = document.currentScript;
  const scriptSrc = new URL(currentScript.src);
  const scriptHost = scriptSrc.origin; // e.g., "https://nsisonglabs.com"
  const endpoint = `${scriptHost}/analytics_platform/public/track.php`;

  if (!websiteId) {
    console.error(
      "Analytics snippet: 'websiteId' is not configured in 'window.analyticsConfig'.",
    );
    return;
  }

  // --- Session Management ---
  function getSessionId() {
    let sessionId = localStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      localStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  }

  // --- Core Tracking Logic ---
  async function sendEvent(eventName, eventData = {}) {
    const payload = {
      website_id: websiteId,
      session_id: getSessionId(),
      event_name: eventName,
      event_data: {
        ...eventData,
        path: window.location.pathname,
        referrer: document.referrer,
        screen_width: window.screen.width,
        language: navigator.language,
      },
    };

    try {
      // Use fetch with keepalive to ensure the request is sent even if the page is being unloaded.
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (error) {
      console.error("Analytics snippet:", error);
    }
  }

  // --- 404 Tracking Function ---
  function track404() {
    sendEvent("404_not_found", { path_not_found: window.location.pathname });
  }

  // --- Public API ---
  // Expose a global 'analytics' object for custom event tracking.
  const publicApi = window.analytics || {};
  publicApi.track = sendEvent;
  publicApi.track404 = track404;
  window.analytics = publicApi;

  // --- Automatic Pageview Tracking ---
  // Do not track a pageview automatically if the user has opted out.
  if (userConfig.doNotTrackPageview) {
    return;
  }

  const trackPageView = () => sendEvent("pageview");

  if (document.readyState === "complete") {
    trackPageView();
  } else {
    window.addEventListener("load", trackPageView, { once: true });
  }
})();
