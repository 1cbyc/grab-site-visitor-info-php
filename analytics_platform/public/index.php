<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            background-color: #f4f4f9;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2 {
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            border: 1px solid #ddd;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f8f8f8;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        code {
            background-color: #eee;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 4px;
        }
        .info-box {
            background-color: #eef7ff;
            border-left: 5px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>Analytics Dashboard</h1>
    <p>This dashboard displays the last 100 events tracked by the system.</p>

    <div class="info-box">
        <h2>How to Track an Event</h2>
        <p>Send a POST request to the <code>track.php</code> endpoint with a JSON payload. Here is an example using cURL:</p>
        <pre><code>curl -X POST -H "Content-Type: application/json" \
-d '{
  "website_id": "my-test-site",
  "session_id": "session_12345",
  "event_name": "pageview",
  "event_data": {
    "path": "/home",
    "referrer": "https://google.com"
  }
}' \
http://<?php echo $_SERVER['HTTP_HOST']; ?>/analytics_platform/public/track.php</code></pre>
    </div>

    <h2>Latest Events</h2>

    <?php
    define('API_KEY', 'SUPER_SECRET_API_KEY');

    $api_url = sprintf(
        "%s://%s%s/api.php",
        isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off' ? 'https' : 'http',
        $_SERVER['HTTP_HOST'],
        dirname($_SERVER['REQUEST_URI'])
    );

    $options = [
        'http' => [
            'header' => "Authorization: Bearer " . API_KEY . "\r\n",
            'method' => 'GET'
        ]
    ];
    $context = stream_context_create($options);

    $response = @file_get_contents($api_url, false, $context);

    if ($response === FALSE) {
        echo "<p><strong>Error:</strong> Could not fetch data from the API. Check API key and server logs.</p>";
    } else {
        $events = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo "<p><strong>Error:</strong> Invalid JSON response from API.</p>";
        } elseif (empty($events)) {
            echo "<p>No events have been tracked yet.</p>";
        } else {
    ?>
    <table>
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Website ID</th>
                <th>Event Name</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Event Data</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($events as $event): ?>
            <tr>
                <td><?php echo htmlspecialchars($event['timestamp']); ?></td>
                <td><?php echo htmlspecialchars($event['website_id']); ?></td>
                <td><?php echo htmlspecialchars($event['event_name']); ?></td>
                <td><?php echo htmlspecialchars($event['ip_address']); ?></td>
                <td><?php echo htmlspecialchars($event['user_agent']); ?></td>
                <td>
                    <pre><?php echo htmlspecialchars(json_encode($event['event_data'], JSON_PRETTY_PRINT)); ?></pre>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <?php
        }
    }
    ?>
</div>

</body>
</html>
