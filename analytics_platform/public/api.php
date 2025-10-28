<?php

require_once __DIR__ . "/../src/Config.php";
require_once __DIR__ . "/../src/Database.php";

$config = Config::load();
$corsConfig = $config['cors'] ?? [];

header("Access-Control-Allow-Origin: " . ($corsConfig['allowed_origins'] ?? '*'));
header("Access-Control-Allow-Methods: " . implode(', ', $corsConfig['allowed_methods'] ?? ['GET', 'OPTIONS']));
header("Access-Control-Allow-Headers: " . implode(', ', $corsConfig['allowed_headers'] ?? ['Authorization', 'Content-Type']));
header("Access-Control-Max-Age: " . ($corsConfig['max_age'] ?? 3600));
header("Content-Type: application/json; charset=UTF-8");

$apiKey = $config['api_key'] ?? 'CHANGE_THIS_TO_A_SECURE_RANDOM_KEY';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit();
}

$auth_header = $_SERVER["HTTP_AUTHORIZATION"] ?? null;
if (!$auth_header) {
    http_response_code(401);
    echo json_encode(["message" => "Authorization header is missing."]);
    exit();
}

$token = null;
if (preg_match("/Bearer\s(\S+)/", $auth_header, $matches)) {
    $token = $matches[1];
}

if ($token !== $apiKey) {
    http_response_code(401);
    echo json_encode(["message" => "Invalid API key."]);
    exit();
}

try {
    $pdo = Database::getConnection();

    $sql = "SELECT * FROM events";
    $params = [];
    $where_clauses = [];

    if (isset($_GET["website_id"])) {
        $where_clauses[] = "website_id = :website_id";
        $params[":website_id"] = $_GET["website_id"];
    }

    if (count($where_clauses) > 0) {
        $sql .= " WHERE " . implode(" AND ", $where_clauses);
    }

    $sql .= " ORDER BY timestamp DESC";

    $limit =
        isset($_GET["limit"]) && is_numeric($_GET["limit"])
            ? (int) $_GET["limit"]
            : 100;
    $sql .= " LIMIT :limit";
    $params[":limit"] = $limit;

    $stmt = $pdo->prepare($sql);

    foreach ($params as $key => &$val) {
        $param_type = $key === ":limit" ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindParam($key, $val, $param_type);
    }

    $stmt->execute();
    $results = $stmt->fetchAll();

    foreach ($results as &$row) {
        if ($row["event_data"]) {
            $row["event_data"] = json_decode($row["event_data"]);
        }
    }

    http_response_code(200);
    echo json_encode($results);
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "message" => "An internal error occurred. Could not retrieve data.",
    ]);
}
