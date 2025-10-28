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
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0;
            font-size: 2em;
        }
        h2 {
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .bar-chart {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .bar-item {
            display: flex;
            align-items: center;
        }
        .bar-label {
            min-width: 150px;
            font-size: 0.9em;
        }
        .bar-fill {
            height: 30px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        .bar-value {
            margin-left: 10px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            text-align: left;
        }
        th {
            background-color: #f8f8f8;
            font-weight: bold;
        }
        tr:hover {
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
            border-radius: 4px;
        }
        .tag {
            display: inline-block;
            padding: 4px 12px;
            background: #667eea;
            color: white;
            border-radius: 12px;
            font-size: 0.85em;
            margin: 2px;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .empty-state-icon {
            font-size: 4em;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>

    <?php
    require_once __DIR__ . '/../src/Config.php';
    $config = Config::load();
    $apiKey = $config['api_key'] ?? 'CHANGE_THIS_TO_A_SECURE_RANDOM_KEY';

$api_url = sprintf(
    "%s://%s%s/api.php",
    isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off' ? 'https' : 'http',
    $_SERVER['HTTP_HOST'],
    dirname($_SERVER['REQUEST_URI'])
);

    $options = [
        'http' => [
            'header' => "Authorization: Bearer " . $apiKey . "\r\n",
            'method' => 'GET'
        ]
    ];
$context = stream_context_create($options);

$response = @file_get_contents($api_url, false, $context);
$events = [];

if ($response !== FALSE) {
    $events = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $events = [];
    }
}

// Calculate stats
$totalEvents = count($events);
$uniqueSessions = count(array_unique(array_column($events, 'session_id')));
$uniqueIPs = count(array_unique(array_column($events, 'ip_address')));

// Count event types
$eventTypes = [];
foreach ($events as $event) {
    $type = $event['event_name'] ?? 'unknown';
    $eventTypes[$type] = ($eventTypes[$type] ?? 0) + 1;
}
arsort($eventTypes);

// Get pageviews
$pageviews = $eventTypes['pageview'] ?? 0;

// Get top pages
$pages = [];
foreach ($events as $event) {
    if (isset($event['event_data']) && is_object($event['event_data'])) {
        $path = $event['event_data']->path ?? $event['event_data']->{'page_name'} ?? null;
        if ($path) {
            $pages[$path] = ($pages[$path] ?? 0) + 1;
        }
    }
}
arsort($pages);
$topPages = array_slice($pages, 0, 10, true);
?>

<div class="container">
    <div class="header">
        <h1>📊 Analytics Dashboard</h1>
        <p>Real-time visitor tracking and analytics</p>
    </div>

    <?php if (empty($events)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h2>No events tracked yet</h2>
            <p>Start tracking events using the JavaScript tracker or API.</p>
            <div class="info-box">
                <strong>Quick Start:</strong><br>
                1. Add <code>&lt;script src="tracker.js"&gt;&lt;/script&gt;</code> to your website<br>
                2. Or test with <a href="test.html" style="color: #2196F3;">test.html</a><br>
                3. Reload this page to see your analytics
            </div>
        </div>
    <?php else: ?>
        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value"><?php echo number_format($totalEvents); ?></div>
                <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?php echo number_format($pageviews); ?></div>
                <div class="stat-label">Page Views</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?php echo number_format($uniqueSessions); ?></div>
                <div class="stat-label">Unique Sessions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?php echo number_format($uniqueIPs); ?></div>
                <div class="stat-label">Unique Visitors</div>
            </div>
        </div>

        <!-- Top Pages Chart -->
        <?php if (!empty($topPages)): ?>
        <div class="chart-container">
            <h2>📄 Top Pages</h2>
            <div class="bar-chart">
                <?php
                $maxValue = max($topPages);
                foreach ($topPages as $page => $count):
                    $width = ($count / $maxValue) * 100;
                ?>
                <div class="bar-item">
                    <div class="bar-label"><?php echo htmlspecialchars($page ?: '/'); ?></div>
                    <div class="bar-fill" style="width: <?php echo $width; ?>%;"></div>
                    <div class="bar-value"><?php echo $count; ?></div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Event Types -->
        <?php if (!empty($eventTypes)): ?>
        <div class="chart-container">
            <h2>🎯 Event Types</h2>
            <?php foreach ($eventTypes as $type => $count): ?>
                <span class="tag"><?php echo htmlspecialchars($type); ?> (<?php echo $count; ?>)</span>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <!-- Latest Events Table -->
        <h2>📋 Latest Events</h2>
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Website</th>
                    <th>Event</th>
                    <th>IP Address</th>
                    <th>User Agent</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach (array_slice($events, 0, 50) as $event): ?>
                <tr>
                    <td><?php echo htmlspecialchars($event['timestamp'] ?? ''); ?></td>
                    <td><span class="tag"><?php echo htmlspecialchars($event['website_id'] ?? ''); ?></span></td>
                    <td><?php echo htmlspecialchars($event['event_name'] ?? ''); ?></td>
                    <td><?php echo htmlspecialchars($event['ip_address'] ?? ''); ?></td>
                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <?php echo htmlspecialchars($event['user_agent'] ?? ''); ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>

    <div class="info-box" style="margin-top: 30px;">
        <h3>💡 How to Use</h3>
        <p><strong>Option 1 - JavaScript Tracker:</strong> Include <code>tracker.js</code> on your website for automatic tracking.</p>
        <p><strong>Option 2 - API:</strong> Send POST requests to <code>track.php</code> with event data.</p>
        <p><strong>Option 3 - Test Page:</strong> Visit <a href="test.html" style="color: #2196F3;">test.html</a> to see the tracker in action.</p>
    </div>
</div>

</body>
</html>
