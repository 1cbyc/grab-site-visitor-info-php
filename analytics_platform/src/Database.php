<?php

class Database
{
    private static $pdo = null;

    public static function getConnection()
    {
        if (self::$pdo === null) {
            $db_path = __DIR__ . '/../db/analytics.db';
            $db_dir = dirname($db_path);

            try {
                if (!is_dir($db_dir)) {
                    mkdir($db_dir, 0755, true);
                }

                self::$pdo = new PDO('sqlite:' . $db_path);
                self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

                self::createEventsTable();

            } catch (PDOException $e) {
                error_log("Database setup failed: " . $e->getMessage());
                throw new Exception("Could not connect to or set up the database.");
            }
        }

        return self::$pdo;
    }

    private static function createEventsTable()
    {
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

        try {
            self::$pdo->exec($sql);
        } catch (PDOException $e) {
            error_log("Failed to create 'events' table: " . $e->getMessage());
            throw new Exception("Database table initialization failed.");
        }
    }
}
