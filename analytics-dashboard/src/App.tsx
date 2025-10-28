import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "https://nsisonglabs.com/analytics_platform/public/api.php";
const API_KEY = "SUPER_SECRET_API_KEY";

interface AnalyticsEvent {
  id: number;
  website_id: string;
  session_id: string;
  event_name: string;
  event_data: Record<string, any> | null;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

function App() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const totalEvents = events.length;
  const pageviews = events.filter(e => e.event_name === 'pageview').length;
  const uniqueSessions = new Set(events.map(e => e.session_id)).size;
  const uniqueIPs = new Set(events.map(e => e.ip_address)).size;
  
  const pages: Record<string, number> = {};
  events.forEach(event => {
    if (event.event_data?.path) {
      const path = event.event_data.path;
      pages[path] = (pages[path] || 0) + 1;
    }
  });
  const topPages = Object.entries(pages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  const eventTypes: Record<string, number> = {};
  events.forEach(event => {
    eventTypes[event.event_name] = (eventTypes[event.event_name] || 0) + 1;
  });
  const sortedEventTypes = Object.entries(eventTypes).sort((a, b) => b[1] - a[1]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const headers = new Headers();
        headers.append("Authorization", `Bearer ${API_KEY}`);

        const response = await fetch(API_URL, { headers });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: AnalyticsEvent[] = await response.json();
        setEvents(data);
        setError(null);
      } catch (e: any) {
        setError(e.message || "An unknown error occurred while fetching data.");
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <p className="status-message">Loading event data...</p>;
    }

    if (error) {
      return (
        <>
          <p className="status-message error">Error: {error}</p>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
            Make sure the API is accessible and CORS headers are configured.
          </p>
        </>
      );
    }

    if (events.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h2>No events tracked yet</h2>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            Start tracking events using the JavaScript tracker or test page.
          </p>
        </div>
      );
    }

    const maxPageViews = topPages.length > 0 ? Math.max(...topPages.map(([, count]) => count)) : 1;

    return (
      <>
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalEvents.toLocaleString()}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pageviews.toLocaleString()}</div>
            <div className="stat-label">Page Views</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uniqueSessions.toLocaleString()}</div>
            <div className="stat-label">Unique Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uniqueIPs.toLocaleString()}</div>
            <div className="stat-label">Unique Visitors</div>
          </div>
        </div>

        {/* Top Pages Chart */}
        {topPages.length > 0 && (
          <div className="chart-container">
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>📄 Top Pages</h3>
            <div className="bar-chart">
              {topPages.map(([page, count]) => (
                <div key={page} className="bar-item">
                  <div className="bar-label">{page || '/'}</div>
                  <div className="bar-fill" style={{ width: `${(count / maxPageViews) * 100}%` }}></div>
                  <div className="bar-value">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Types */}
        {sortedEventTypes.length > 0 && (
          <div className="chart-container" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🎯 Event Types</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {sortedEventTypes.map(([type, count]) => (
                <span key={type} className="tag">
                  {type} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Latest Events Table */}
        <h3 style={{ marginTop: '2rem' }}>📋 Latest Events</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Website</th>
                <th>Event</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 50).map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.timestamp).toLocaleString()}</td>
                  <td><span className="tag">{event.website_id}</span></td>
                  <td>{event.event_name}</td>
                  <td>{event.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>📊 Analytics Dashboard</h1>
        <p>A modern frontend powered by React and TypeScript.</p>
      </header>
      <main className="dashboard-main">{renderContent()}</main>
    </div>
  );
}

export default App;
