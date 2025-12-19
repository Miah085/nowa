<?php
header('Content-Type: application/json');
require '../db_connect.php';

if (isset($_GET['user_id'])) {
    try {
        $stmt = $conn->prepare("
            SELECT * FROM schedules 
            WHERE user_id = ? 
            ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time
        ");
        $stmt->execute([$_GET['user_id']]);
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "schedules" => $schedules]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing User ID"]);
}
?>