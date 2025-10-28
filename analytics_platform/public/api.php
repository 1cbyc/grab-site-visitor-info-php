<?php

// --- Setup ---
header("Content-Type: application/json; charset=UTF-8");

// --- Secure CORS Policy ---
// Define the *only* domain that is allowed to access this API.
$allowed_origin = "https://grabip.nsisong.com";
$request_origin = $_SERVER["HTTP_ORIGIN"] ?? "";

// Only set the ACAO header if the request origin is on our allow list.
if ($request_origin === $allowed_origin) {
    header("Access-Control-Allow-Origin: " . $allowed_origin);
} else {
    // If the origin is not allowed, we don't send the ACAO header.
    // The browser will then enforce the Same-Origin Policy and block the request.
    // This is more secure than sending a generic error.
}

// --- Dependency Loading ---
require_once __DIR__ . "/../src/Database.php";
$config = require __DIR__ . "/../src/Config.php";

// --- Preflight Request Handling ---
// Browsers send an OPTIONS request first to check CORS permissions.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    // Only respond to OPTIONS requests if the origin is allowed.
    if ($request_origin === $allowed_origin) {
        header("Access-Control-Allow-Methods: GET, OPTIONS");
        header("Access-Control-Allow-Headers: Authorization, Content-Type");
        http_response_code(204); // No Content
        exit();
    } else {
        // If the origin is not whitelisted, deny the preflight request.
        http_response_code(403); // Forbidden
        exit();
    }
}

// --- Authentication ---
// Ensure the request method is GET.
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "This endpoint only accepts GET requests."]);
    exit();
}

$apiKey = $config["dashboard_api_key"];
$auth_header = $_SERVER["HTTP_AUTHORIZATION"] ?? null;

if (!$auth_header) {
    http_response_code(401); // Unauthorized
    echo json_encode(["message" => "Authorization header is missing."]);
    exit();
}

$token = null;
if (preg_match("/Bearer\s(\S+)/", $auth_header, $matches)) {
    $token = $matches[1];
}

if ($token !== $apiKey) {
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "Invalid API key."]);
    exit();
}

// --- Main Logic ---
try {
    $pdo = Database::getConnection();

    // --- Query Building ---
    $sql = "SELECT * FROM events";
    $params = [];
    $where_clauses = [];

    // Filter by website_id if provided.
    if (!empty($_GET["website_id"])) {
        $where_clauses[] = "website_id = :website_id";
        $params[":website_id"] = $_GET["website_id"];
    }

    // Append WHERE clauses if any exist.
    if (count($where_clauses) > 0) {
        $sql .= " WHERE " . implode(" AND ", $where_clauses);
    }

    // Order by most recent events first.
    $sql .= " ORDER BY timestamp DESC";

    // Add a limit for pagination (default to 500).
    $limit =
        isset($_GET["limit"]) && is_numeric($_GET["limit"])
            ? (int) $_GET["limit"]
            : 500;
    $sql .= " LIMIT :limit";
    $params[":limit"] = $limit;

    // --- Execution ---
    $stmt = $pdo->prepare($sql);

    // Bind all the parameters.
    foreach ($params as $key => &$val) {
        $param_type = $key === ":limit" ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindParam($key, $val, $param_type);
    }

    $stmt->execute();
    $results = $stmt->fetchAll();

    // The event_data is stored as a JSON string. Decode it for a cleaner API response.
    foreach ($results as &$row) {
        if (!empty($row["event_data"])) {
            $row["event_data"] = json_decode($row["event_data"]);
        }
    }

    // --- Response ---
    http_response_code(200); // OK
    echo json_encode($results);
} catch (Exception $e) {
    // Log the detailed error to the server's error log for debugging.
    error_log("API Error: " . $e->getMessage());
    // Send a generic 500 error to the client.
    http_response_code(500);
    echo json_encode([
        "message" => "An internal error occurred. Could not retrieve data.",
    ]);
}
