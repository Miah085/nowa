<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email']) && isset($data['password'])) {
    $email = $data['email'];
    $password = $data['password'];

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify hashed password
    if ($user && password_verify($password, $user['password_hash'])) {
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "role" => $user['role'],
            "username" => $user['username'],
            "email" => $user['email']
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid email or password"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
}
?>