import { useState, useEffect, useMemo } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

interface AnalyticsEvent {
  id: number;
  website_id: string;
  session_id: string;
  event_name: string;
  event_data: {
    path?: string;
    path_not_found?: string;
    [key: string]: any;
  } | null;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

function App() {
  const [allEvents, setAllEvents] = useState<AnalyticsEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AnalyticsEvent[]>([]);
  const [websiteIds, setWebsiteIds] = useState<string[]>([]);

  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_URL || !API_KEY) {
      setError(
        "Configuration error: API URL or Key is not defined. Please check your .env file.",
      );
      setIsLoading(false);
      return;
    }

    const fetchAllEvents = async () => {
      setIsLoading(true);
      try {
        const headers = new Headers();
        headers.append("Authorization", `Bearer ${API_KEY}`);
        const response = await fetch(API_URL, { headers });

        if (!response.ok) {
          throw new Error(
            `Network response was not ok. Status: ${response.status}`,
          );
        }

        const data: AnalyticsEvent[] = await response.json();
        setAllEvents(data);

        const uniqueIds = [...new Set(data.map((event) => event.website_id))];
        setWebsiteIds(uniqueIds);

        setError(null);
      } catch (e: any) {
        setError(e.message || "An unknown error occurred while fetching data.");
      } finally {
    setIsLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  useEffect(() => {
    let events = allEvents;

    if (selectedWebsiteId !== "all") {
      events = events.filter((event) => event.website_id === selectedWebsiteId);
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      events = events.filter((event) => new Date(event.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      events = events.filter((event) => new Date(event.timestamp) <= end);
    }

    setFilteredEvents(events);
  }, [selectedWebsiteId, startDate, endDate, allEvents]);

  const summaryStats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const pageviews = filteredEvents.filter(
      (e) => e.event_name === "pageview",
    ).length;
    const uniqueSessions = new Set(filteredEvents.map((e) => e.session_id))
      .size;
    const uniqueVisitors = new Set(filteredEvents.map((e) => e.ip_address))
      .size;

    return { totalEvents, pageviews, uniqueSessions, uniqueVisitors };
  }, [filteredEvents]);

  const topPages = useMemo(() => {
    const pageCounts: Record<string, number> = {};
    filteredEvents.forEach((event) => {
      if (event.event_name === "pageview" && event.event_data?.path) {
        const path = event.event_data.path;
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      }
    });

    return Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredEvents]);

  const top404Paths = useMemo(() => {
    const pathCounts: Record<string, number> = {};
    filteredEvents.forEach((event) => {
      if (
        event.event_name === "404_not_found" &&
        event.event_data?.path_not_found
      ) {
        const path = event.event_data.path_not_found;
        pathCounts[path] = (pathCounts[path] || 0) + 1;
      }
    });

    return Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredEvents]);

  const renderContent = () => {
    if (isLoading) {
      return <p className="status-message">Loading event data...</p>;
    }

    if (error) {
      return (
        <p className="status-message error">
          Error: {error}. Make sure the API is accessible and CORS headers are
          configured.
        </p>
      );
    }

    if (allEvents.length === 0) {
      return (
        <p className="status-message">
          No events have been tracked yet. Use the tracking snippet or curl to
          send an event.
        </p>
      );
    }

    const maxPageViews =
      topPages.length > 0 ? Math.max(...topPages.map(([, count]) => count)) : 1;

    return (
      <>
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">
              {summaryStats.totalEvents.toLocaleString()}
            </div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {summaryStats.pageviews.toLocaleString()}
            </div>
            <div className="stat-label">Page Views</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {summaryStats.uniqueSessions.toLocaleString()}
            </div>
            <div className="stat-label">Unique Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {summaryStats.uniqueVisitors.toLocaleString()}
            </div>
            <div className="stat-label">Unique Visitors</div>
          </div>
        </div>

        {/* Top Pages Chart */}
        {topPages.length > 0 && (
          <div className="chart-container">
            <h3>Top Pages</h3>
            <div className="bar-chart">
              {topPages.map(([page, count]) => (
                <div key={page} className="bar-item">
                  <div className="bar-label" title={page}>
                    {page || "/"}
                  </div>
                  <div
                    className="bar-fill"
                    style={{ width: `${(count / maxPageViews) * 100}%` }}
                  ></div>
                  <div className="bar-value">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 404 Not Found Paths Table */}
        {top404Paths.length > 0 && (
          <div className="chart-container">
            <h3>Top 404 Not Found Paths</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {top404Paths.map(([path, count]) => (
                    <tr key={path}>
                      <td>{path}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Latest Events Table */}
        <h3>Latest Events</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Name</th>
                <th>IP Address</th>
                <th>Event Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.slice(0, 50).map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.timestamp).toLocaleString()}</td>
                  <td>{event.event_name}</td>
                  <td>{event.ip_address}</td>
                  <td>
                    <pre>
                      {event.event_data
                        ? JSON.stringify(event.event_data, null, 2)
                        : "N/A"}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEvents.length === 0 && (
            <p className="status-message">
              No events found for the selected filters.
            </p>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '48px', width: '48px' }} />
          <h1>Analytics Dashboard</h1>
        </div>
        <p>Track and analyze visitor events across your websites in real-time</p>
      </header>

      <div className="toolbar">
        <label htmlFor="website-filter">Website:</label>
        <select
          id="website-filter"
          value={selectedWebsiteId}
          onChange={(e) => setSelectedWebsiteId(e.target.value)}
          disabled={websiteIds.length === 0}
        >
          <option value="all">All Websites</option>
          {websiteIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <label htmlFor="start-date">Start Date:</label>
        <input
          type="date"
          id="start-date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label htmlFor="end-date">End Date:</label>
        <input
          type="date"
          id="end-date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <main className="dashboard-main">{renderContent()}</main>
      
      <footer style={{ 
        marginTop: '3rem', 
        padding: '2rem 0', 
        textAlign: 'center', 
        color: '#666',
        borderTop: '1px solid #e2e8f0'
      }}>
        <p>© 2024 Analytics Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
