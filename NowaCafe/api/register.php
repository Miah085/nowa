<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['username']) && isset($data['email']) && isset($data['password'])) {
    $username = $data['username'];
    $email = $data['email'];
    $password = $data['password'];

    // Check if email already exists
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Email already registered"]);
        exit;
    }

    // Hash password and Insert
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $sql = "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'customer')";
    $stmt = $conn->prepare($sql);
    
    if ($stmt->execute([$username, $email, $hashed_password])) {
        echo json_encode(["success" => true, "message" => "Account created successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error creating account"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Please fill all fields"]);
}
?>