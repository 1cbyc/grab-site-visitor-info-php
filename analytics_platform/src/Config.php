<?php

class Config
{
    private static $config = null;

    public static function load($configFile = null)
    {
        if (self::$config !== null) {
            return self::$config;
        }

        if ($configFile === null) {
            $configFile = __DIR__ . '/../config.php';
        }

        if (file_exists($configFile)) {
            self::$config = require $configFile;
        } else {
            self::$config = [
                'api_key' => $_ENV['ANALYTICS_API_KEY'] ?? 'CHANGE_THIS_TO_A_SECURE_RANDOM_KEY',
                'api_base_url' => $_ENV['ANALYTICS_API_BASE_URL'] ?? '',
                'database' => [
                    'path' => __DIR__ . '/../db/analytics.db',
                ],
                'cors' => [
                    'allowed_origins' => '*',
                    'allowed_methods' => ['GET', 'OPTIONS'],
                    'allowed_headers' => ['Authorization', 'Content-Type'],
                    'max_age' => 3600,
                ],
                'app' => [
                    'name' => 'Analytics Platform',
                    'version' => '1.0.0',
                ],
            ];
        }

        return self::$config;
    }

    public static function get($key, $default = null)
    {
        if (self::$config === null) {
            self::load();
        }

        $keys = explode('.', $key);
        $value = self::$config;

        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }

        return $value;
    }

    public static function all()
    {
        if (self::$config === null) {
            self::load();
        }
        return self::$config;
    }
}
