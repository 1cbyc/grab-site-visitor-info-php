<?php

return [
    'api_key' => $_ENV['ANALYTICS_API_KEY'] ?? 'CHANGE_THIS_TO_A_SECURE_RANDOM_KEY',
    
    'api_base_url' => $_ENV['ANALYTICS_API_BASE_URL'] ?? 'https://yourdomain.com/analytics_platform/public',
    
    'database' => [
        'path' => __DIR__ . '/db/analytics.db',
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

