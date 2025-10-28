<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once __DIR__ . "/../src/Database.php";
$config = require __DIR__ . "/../src/Config.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Authorization, Content-Type");
    http_response_code(204);
    exit();
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["message" => "This endpoint only accepts GET requests."]);
    exit();
}

$apiKey = $config["dashboard_api_key"];
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
    http_response_code(403);
    echo json_encode(["message" => "Invalid API key."]);
    exit();
}

try {
    $pdo = Database::getConnection();

    $sql = "SELECT * FROM events";
    $params = [];
    $where_clauses = [];

    if (!empty($_GET["website_id"])) {
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
            : 500;
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
        if (!empty($row["event_data"])) {
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
