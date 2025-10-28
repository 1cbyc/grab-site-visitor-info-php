import { useState, useEffect } from "react";
import "./App.css";

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
    console.log("Component mounted. Ready to fetch data.");
    setIsLoading(false);
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <p>Displaying events tracked by your secure PHP backend.</p>
      </header>
      <main className="dashboard-main">
        {isLoading && <p>Loading event data...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {!isLoading && !error && (
          <p>
            Data fetching will be implemented here. Currently, there are{" "}
            {events.length} events.
          </p>
        )}
      </main>
    </div>
  );
}

export default App;
