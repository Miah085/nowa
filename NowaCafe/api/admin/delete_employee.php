<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['user_id'])) {
    try {
        $stmt = $conn->prepare("UPDATE users SET status = 'inactive' WHERE user_id = ?");
        $stmt->execute([$data['user_id']]);

        echo json_encode(["success" => true, "message" => "Employee removed successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing user ID"]);
}
?>
