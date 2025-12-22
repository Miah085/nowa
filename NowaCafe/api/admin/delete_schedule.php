<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['schedule_id'])) {
    try {
        $stmt = $conn->prepare("DELETE FROM schedules WHERE schedule_id = ?");
        $stmt->execute([$data['schedule_id']]);
        echo json_encode(["success" => true, "message" => "Shift removed"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing ID"]);
}
?>