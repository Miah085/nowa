<?php
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email'])) {
    $email = $data['email'];

    try {
        $stmt = $conn->prepare("SELECT user_id, username FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(["success" => false, "message" => "User not found for email: $email"]);
            exit;
        }

        // 2. Fetch Schedule
        $sql = "SELECT day_of_week, start_time, end_time FROM schedules WHERE user_id = ? ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";
        $schedStmt = $conn->prepare($sql);
        $schedStmt->execute([$user['user_id']]);
        $shifts = $schedStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true, 
            "debug_user_id" => $user['user_id'], 
            "schedule" => $shifts
        ]);

    } catch (PDOException $e) {
        // This is where it was failing before!
        echo json_encode(["success" => false, "message" => "DB Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "No email provided in request"]);
}
?>