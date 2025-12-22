<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['user_id']) && isset($data['username']) && isset($data['email'])) {
    try {
        // Base query
        $sql = "UPDATE users SET username = ?, email = ?, phone = ?, role = ?";
        $params = [
            $data['username'],
            $data['email'],
            $data['phone'] ?? null,
            $data['role'] ?? 'staff'
        ];

        // 1. Handle Password Update (Only if provided)
        if (!empty($data['password'])) {
            $sql .= ", password_hash = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        // 2. Handle Status (Only if provided)
        if (isset($data['status'])) {
            $sql .= ", status = ?";
            $params[] = $data['status'];
        }

        // Add WHERE clause
        $sql .= " WHERE user_id = ?";
        $params[] = $data['user_id'];
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        echo json_encode(["success" => true, "message" => "Employee updated successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>