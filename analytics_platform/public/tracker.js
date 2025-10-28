(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        endpoint: window.ANALYTICS_ENDPOINT || '/analytics_platform/public/track.php',
        websiteId: window.ANALYTICS_WEBSITE_ID || window.location.hostname,
        sessionId: null,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        enabled: true
    };

    // Session Management
    function getOrCreateSessionId() {
        if (CONFIG.sessionId) return CONFIG.sessionId;

        const storedSessionId = localStorage.getItem('analytics_session_id');
        const sessionTimestamp = localStorage.getItem('analytics_session_timestamp');
        const now = Date.now();

        // Check if session expired
        if (storedSessionId && sessionTimestamp && (now - parseInt(sessionTimestamp)) < CONFIG.sessionTimeout) {
            CONFIG.sessionId = storedSessionId;
            return storedSessionId;
        }

        // Create new session
        CONFIG.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('analytics_session_id', CONFIG.sessionId);
        localStorage.setItem('analytics_session_timestamp', now.toString());
        
        return CONFIG.sessionId;
    }

    // Get page info
    function getPageInfo() {
        return {
            path: window.location.pathname,
            referrer: document.referrer,
            search: window.location.search,
            hash: window.location.hash,
            title: document.title,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    // Track event
    function trackEvent(eventName, eventData = {}) {
        if (!CONFIG.enabled) return;

        const sessionId = getOrCreateSessionId();
        const pageInfo = getPageInfo();

        const payload = {
            website_id: CONFIG.websiteId,
            session_id: sessionId,
            event_name: eventName,
            event_data: {
                ...pageInfo,
                ...eventData
            }
        };

        // Send to backend
        sendEvent(payload);
    }

    // Send event to server
    function sendEvent(payload) {
        // Use sendBeacon for better reliability
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(CONFIG.endpoint, blob);
        } else {
            // Fallback to fetch
            fetch(CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }).catch(function(error) {
                console.error('Analytics tracking failed:', error);
            });
        }
    }

    // Track pageview on load
    function trackPageview() {
        trackEvent('pageview', {
            load_time: performance.now()
        });
    }

    // Track page exit (beforeunload)
    function trackPageExit() {
        trackEvent('page_exit', {
            time_on_page: Date.now() - parseInt(localStorage.getItem('analytics_session_timestamp') || Date.now())
        });
    }

    // Initialize tracker
    function init() {
        if (typeof window.Analytics !== 'undefined') {
            console.warn('Analytics tracker already initialized');
            return;
        }

        // Track initial pageview
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', trackPageview);
        } else {
            trackPageview();
        }

        // Track page exit
        window.addEventListener('beforeunload', trackPageExit);

        // Expose public API
        window.Analytics = {
            track: trackEvent,
            trackPageview: trackPageview,
            identify: function(userId) {
                trackEvent('identify', { user_id: userId });
            },
            page: function(pageName) {
                trackEvent('page_view', { page_name: pageName });
            },
            getSessionId: getOrCreateSessionId
        };

        // Auto-track common events
        setupAutoTracking();
    }

    // Setup auto-tracking for common elements
    function setupAutoTracking() {
        // Track clicks on elements with data-analytics attribute
        document.addEventListener('click', function(e) {
            const element = e.target.closest('[data-analytics]');
            if (element) {
                const eventName = element.getAttribute('data-analytics');
                const eventData = element.getAttribute('data-analytics-data');
                
                trackEvent(eventName || 'click', {
                    element_tag: element.tagName.toLowerCase(),
                    element_text: element.textContent?.substring(0, 100),
                    ...(eventData ? JSON.parse(eventData) : {})
                });
            }
        });

        // Track form submissions
        document.addEventListener('submit', function(e) {
            if (e.target.tagName === 'FORM') {
                const form = e.target;
                trackEvent('form_submit', {
                    form_id: form.id || form.name || 'unnamed',
                    form_action: form.action
                });
            }
        });
    }

    // Start initialization
    init();

})();
