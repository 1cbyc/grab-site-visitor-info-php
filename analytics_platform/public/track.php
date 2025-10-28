<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../src/Database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'This endpoint only accepts POST requests.']);
    exit;
}

$json_data = file_get_contents('php://input');
$data = json_decode($json_data);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON payload provided.']);
    exit;
}

if (empty($data->website_id) || empty($data->event_name)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required parameters: website_id and event_name.']);
    exit;
}

$website_id = htmlspecialchars(strip_tags($data->website_id));
$session_id = isset($data->session_id) ? htmlspecialchars(strip_tags($data->session_id)) : uniqid('sess_', true);
$event_name = htmlspecialchars(strip_tags($data->event_name));

$event_data_json = isset($data->event_data) ? json_encode($data->event_data) : null;
if ($event_data_json === false) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid event_data. Must be a valid JSON object.']);
    exit;
}

$ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

try {
    $pdo = Database::getConnection();

    $sql = "
        INSERT INTO events (website_id, session_id, event_name, event_data, ip_address, user_agent)
        VALUES (:website_id, :session_id, :event_name, :event_data, :ip_address, :user_agent)
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->bindParam(':website_id', $website_id);
    $stmt->bindParam(':session_id', $session_id);
    $stmt->bindParam(':event_name', $event_name);
    $stmt->bindParam(':event_data', $event_data_json);
    $stmt->bindParam(':ip_address', $ip_address);
    $stmt->bindParam(':user_agent', $user_agent);

    $stmt->execute();

    http_response_code(204);

} catch (Exception $e) {
    error_log("Tracking API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'An internal error occurred. The event was not tracked.']);
}
