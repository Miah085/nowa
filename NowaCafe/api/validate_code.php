<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require 'db_connect.php'; 

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['code'])) {
    $code = trim($data['code']);

    try {
        // 1. Find the order with this token
        $stmt = $conn->prepare("SELECT transaction_id, transaction_date, status, total_amount FROM transactions WHERE order_token = ?");
        $stmt->execute([$code]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            echo json_encode(["success" => false, "message" => "❌ Invalid Code! Order not found."]);
            exit;
        }

        // 2. Check if already used
        if ($order['status'] == 'Completed') {
            echo json_encode(["success" => false, "message" => "⚠️ This code has ALREADY been claimed!"]);
            exit;
        }

        // 3. Check 20 Minute Expiration
        // We compare the transaction_date with current time
        $sql_time = "SELECT TIMESTAMPDIFF(MINUTE, transaction_date, NOW()) as minutes_passed";
        $stmt_time = $conn->query($sql_time); // Simple check relative to the specific row isn't needed if we trust server time, but let's be precise:
        
        // Better SQL to check specific row time diff:
        $sql_diff = "SELECT TIMESTAMPDIFF(MINUTE, ?, NOW()) as minutes_passed";
        $stmt_diff = $conn->prepare($sql_diff);
        $stmt_diff->execute([$order['transaction_date']]);
        $time_data = $stmt_diff->fetch(PDO::FETCH_ASSOC);

        if ($time_data['minutes_passed'] > 20) {
            // Optional: Mark as Voided if expired
            $conn->prepare("UPDATE transactions SET status = 'Voided' WHERE transaction_id = ?")->execute([$order['transaction_id']]);
            
            echo json_encode(["success" => false, "message" => "⏰ Code EXPIRED! (Time limit exceeded)"]);
            exit;
        }

        // 4. Success - Mark as Completed
        $update = $conn->prepare("UPDATE transactions SET status = 'Completed' WHERE transaction_id = ?");
        $update->execute([$order['transaction_id']]);

        echo json_encode([
            "success" => true, 
            "message" => "✅ Success! Order #" . $order['transaction_id'] . " ($" . $order['total_amount'] . ") is confirmed."
        ]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Please enter a code."]);
}
?>