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
      return <p className="status-message error">Error: {error}</p>;
    }

    if (events.length === 0) {
      return (
        <p className="status-message">
          No events have been tracked yet. Run the curl command to send a test
          event.
        </p>
      );
    }

    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Name</th>
              <th>Website ID</th>
              <th>IP Address</th>
              <th>Event Data</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.timestamp}</td>
                <td>{event.event_name}</td>
                <td>{event.website_id}</td>
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
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <p>A modern frontend powered by React and TypeScript.</p>
      </header>
      <main className="dashboard-main">{renderContent()}</main>
    </div>
  );
}

export default App;
