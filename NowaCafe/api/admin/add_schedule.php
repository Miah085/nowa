<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['user_id']) && isset($data['day']) && isset($data['start']) && isset($data['end'])) {
    try {
        $stmt = $conn->prepare("INSERT INTO schedules (user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['user_id'],
            $data['day'],
            $data['start'],
            $data['end']
        ]);
        echo json_encode(["success" => true, "message" => "Shift added successfully"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing fields"]);
}
?>