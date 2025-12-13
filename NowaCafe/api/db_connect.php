<?php
$host = "localhost";
$port = "3306";      
$username = "root";
$password = "";      
$dbname = "nowacafe_db";

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $conn = new PDO($dsn, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    die(json_encode(["success" => false, "message" => "Connection Error: " . $e->getMessage()]));
}
?>