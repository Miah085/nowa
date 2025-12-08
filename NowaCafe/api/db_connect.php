<?php
// C:\xampp\htdocs\nowa\db_connection.php

$host = "localhost";
$port = "4306";      // UPDATED: The correct port from your XAMPP
$username = "root";  // Back to root
$password = "";      // Back to empty (no password)
$dbname = "nowacafe_db";

try {
    // Notice specifically the ";port=$port" part added inside here
    $conn = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // echo "Database Connected Successfully!"; 
} catch(PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "Database Connection Failed: " . $e->getMessage()]);
    exit;
}
?>