<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['user_id']) && isset($data['username']) && isset($data['email'])) {
    try {
        $sql = "UPDATE users 
                SET username = ?, email = ?, phone = ?, role = ?, status = ?
                WHERE user_id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['username'],
            $data['email'],
            $data['phone'] ?? null,
            $data['role'] ?? 'staff',
            $data['status'] ?? 'active',
            $data['user_id']
        ]);

        echo json_encode(["success" => true, "message" => "Employee updated successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>
