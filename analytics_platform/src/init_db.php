<?php

$db_path = __DIR__ . '/../db/analytics.db';
$db_dir = dirname($db_path);

if (!is_dir($db_dir)) {
    if (!mkdir($db_dir, 0755, true)) {
        die("Error: Could not create the database directory.\n");
    }
}

try {
    $pdo = new PDO('sqlite:' . $db_path);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Database file created successfully at: " . $db_path . "\n";

    $sql = "
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        website_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_data TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ";

    $pdo->exec($sql);

    echo "Table 'events' created successfully.\n";

} catch (PDOException $e) {
    die("Database error: " . $e->getMessage() . "\n");
}
