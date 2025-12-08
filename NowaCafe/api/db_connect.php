<?php
// File: C:\xampp\htdocs\nowa\db_connection.php

$host = "localhost";
$port = "4306";      // Keep this as 4306 since we found that worked before
$username = "root";
$password = ""; // <--- TYPE YOUR NEW XAMPP PASSWORD HERE
$dbname = "nowacafe_db";

try {
    $conn = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // echo "Connected successfully"; 
} catch(PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "Database Connection Failed: " . $e->getMessage()]);
    exit;
}
?>