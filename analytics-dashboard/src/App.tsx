import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import "./App.css";

const API_URL = "https://nsisonglabs.com/analytics_platform/public/api.php";
const API_KEY = "SUPER_SECRET_API_KEY";

interface AnalyticsEvent {
  id: number;
  website_id: string;
  session_id: string;
  event_name: string;
  event_data: {
    path?: string;
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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setFilteredEvents(data);

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
    if (selectedWebsiteId === "all") {
      setFilteredEvents(allEvents);
    } else {
      setFilteredEvents(
        allEvents.filter((event) => event.website_id === selectedWebsiteId),
      );
    }
  }, [selectedWebsiteId, allEvents]);

  const summaryStats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const pageviews = filteredEvents.filter(
      (e) => e.event_name === "pageview" || e.event_name === "pageview-success",
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
      if ((event.event_name === "pageview" || event.event_name === "pageview-success") && event.event_data?.path) {
        const path = event.event_data.path;
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      }
    });

    return Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Get top 5 pages
  }, [filteredEvents]);

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedWebsiteId(e.target.value);
  };

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
              {filteredEvents.slice(0, 50).map(
                (
                  event, // Show latest 50
                ) => (
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
                ),
              )}
            </tbody>
          </table>
          {filteredEvents.length === 0 && (
            <p className="status-message">
              No events found for the selected website.
            </p>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <p>A modern frontend powered by React and TypeScript.</p>
      </header>

      <div className="toolbar">
        <label htmlFor="website-filter">Filter by Website:</label>
        <select
          id="website-filter"
          value={selectedWebsiteId}
          onChange={handleFilterChange}
          disabled={websiteIds.length === 0}
        >
          <option value="all">All Websites</option>
          {websiteIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <main className="dashboard-main">{renderContent()}</main>
    </div>
  );
}

export default App;
