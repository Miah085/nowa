<?php
$host = "127.0.0.1";
$username = "nowa_user";  // UPDATED: New username
$password = "password123"; // UPDATED: New password
$dbname = "nowacafe_db";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Return JSON error if connection fails
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "Database Connection Failed: " . $e->getMessage()]);
    exit;
}
?>