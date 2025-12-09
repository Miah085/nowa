<?php
header('Content-Type: application/json');
error_reporting(0); // Fixes JSON parsing errors
require 'db_connect.php'; 

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['code'])) {
    $code = trim($data['code']);

    try {
        $stmt = $conn->prepare("SELECT transaction_id, transaction_date, status, total_amount FROM transactions WHERE order_token = ?");
        $stmt->execute([$code]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            echo json_encode(["success" => false, "message" => "❌ Invalid Code! Order not found."]);
            exit;
        }

        if ($order['status'] == 'Completed') {
            echo json_encode(["success" => false, "message" => "⚠️ This code was already scanned."]);
            exit;
        }

        // Check 20 min expiration
        $sql_diff = "SELECT TIMESTAMPDIFF(MINUTE, ?, NOW()) as minutes_passed";
        $stmt_diff = $conn->prepare($sql_diff);
        $stmt_diff->execute([$order['transaction_date']]);
        $time_data = $stmt_diff->fetch(PDO::FETCH_ASSOC);

        if ($time_data['minutes_passed'] > 20) {
            // Auto-Archive if expired
            $conn->prepare("UPDATE transactions SET status = 'Archived' WHERE transaction_id = ?")->execute([$order['transaction_id']]);
            echo json_encode(["success" => false, "message" => "⏰ Code EXPIRED (20 min limit). Order Archived."]);
            exit;
        }

        // Mark Completed
        $update = $conn->prepare("UPDATE transactions SET status = 'Completed' WHERE transaction_id = ?");
        $update->execute([$order['transaction_id']]);

        echo json_encode([
            "success" => true, 
            "message" => "✅ Valid! Order #" . $order['transaction_id'] . " Confirmed."
        ]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "DB Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "No code provided"]);
}
?>