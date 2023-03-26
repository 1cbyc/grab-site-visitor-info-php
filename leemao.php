<?php
// You can get the user's IP address
$ip_address = $_SERVER['REMOTE_ADDR'];

// You can get the user's MAC address (requires PHP 5.3+ and Linux)
$mac_address = shell_exec("arp -a $ip_address | awk '{print $4}'");

// You can get the user's device information too my guy
$user_agent = $_SERVER['HTTP_USER_AGENT'];

// Just make sure to store the data in a database or file with this (I prefer file)
$data = array(
    'ip_address' => $ip_address,
    'mac_address' => $mac_address,
    'user_agent' => $user_agent
);

// Connect to a database
$db_host = 'localhost';
$db_name = 'db-name';
$db_user = 'username';
$db_pass = 'password';
$db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);

// Insert the data into a table
$sql = "INSERT INTO visitors (ip_address, mac_address, user_agent) VALUES (:ip_address, :mac_address, :user_agent)";
$stmt = $db->prepare($sql);
$stmt->execute($data);
?>
