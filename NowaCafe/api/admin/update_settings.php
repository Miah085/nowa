<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['cafe_name']) && isset($data['email'])) {
    try {
        $sql = "UPDATE cafe_settings 
                SET cafe_name = ?, email = ?, phone = ?, address = ?
                WHERE setting_id = 1";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['cafe_name'],
            $data['email'],
            $data['phone'],
            $data['address']
        ]);

        echo json_encode(["success" => true, "message" => "Settings updated successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>