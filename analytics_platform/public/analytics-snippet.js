(function () {
  if (!window.fetch || !window.JSON || !window.localStorage) {
    console.warn(
      "Analytics snippet: Browser does not support required features.",
    );
    return;
  }

  const userConfig = window.analyticsConfig || {};
  const websiteId = userConfig.websiteId;
  const scriptHost = "https://nsisonglabs.com";
  const endpoint = `${scriptHost}/analytics_platform/public/track.php`;

  if (!websiteId) {
    console.error(
      "Analytics snippet: 'websiteId' is not configured in 'window.analyticsConfig'.",
    );
    return;
  }

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

  function track404() {
    sendEvent("404_not_found", { path_not_found: window.location.pathname });
  }

  const publicApi = window.analytics || {};
  publicApi.track = sendEvent;
  publicApi.track404 = track404;
  window.analytics = publicApi;

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
