<?php

/**
 * Diagnostic File Viewer
 *
 * This script is for debugging purposes only. It reads the source code of the
 * `api.php` file from the server's filesystem and displays it as plain text.
 * This helps confirm which version of the code is actually live.
 *
 * WARNING: This file should be deleted after the debugging is complete.
 */

// Set a header to ensure the content is interpreted as HTML.
header('Content-Type: text/html; charset=UTF-8');

// Define the path to the file we want to inspect.
$target_file_path = __DIR__ . '/api.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>API File Source Viewer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            background-color: #f4f4f9;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        pre {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 4px;
            white-space: pre-wrap; /* Allows text to wrap */
            word-wrap: break-word; /* Breaks long lines */
        }
        code {
            font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
            font-size: 14px;
        }
        .error {
            color: #d8000c;
            background-color: #ffbaba;
            border: 1px solid;
            padding: 15px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Source Code of <code>api.php</code></h1>
        <p>This is the exact content of the <code>api.php</code> file currently on the server.</p>

        <?php if (file_exists($target_file_path)): ?>
            <pre><code><?php
                // Read the file content and escape it for safe HTML display.
                $file_content = file_get_contents($target_file_path);
                echo htmlspecialchars($file_content);
            ?></code></pre>
        <?php else: ?>
            <p class="error">
                <strong>Error:</strong> The file <code><?php echo htmlspecialchars($target_file_path); ?></code> could not be found. Please ensure it has been uploaded to the correct directory.
            </p>
        <?php endif; ?>
    </div>
</body>
</html>
