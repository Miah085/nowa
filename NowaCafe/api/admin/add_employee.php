<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['username']) && isset($data['email']) && isset($data['password']) && isset($data['role'])) {
    try {
        // Check if email exists
        $check = $conn->prepare("SELECT email FROM users WHERE email = ?");
        $check->execute([$data['email']]);
        if ($check->rowCount() > 0) {
            echo json_encode(["success" => false, "message" => "Email already exists"]);
            exit;
        }

        $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (username, email, password_hash, role, phone, status) 
                VALUES (?, ?, ?, ?, ?, 'active')";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['username'],
            $data['email'],
            $hashed_password,
            $data['role'],
            $data['phone'] ?? null
        ]);

        echo json_encode(["success" => true, "message" => "Employee added successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>
Sent