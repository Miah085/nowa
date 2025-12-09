<?php
header('Content-Type: application/json');
error_reporting(0);
require 'db_connect.php'; 

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['code'])) {
    $code = trim($data['code']);

    try {
        $stmt = $conn->prepare("SELECT transaction_id, status FROM transactions WHERE order_token = ?");
        $stmt->execute([$code]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            echo json_encode(["success" => false, "message" => "❌ Invalid Code!"]);
            exit;
        }

        // Logic Check
        if ($order['status'] == 'Processing') {
            echo json_encode(["success" => false, "message" => "⚠️ Order is already Active/Processing!"]);
            exit;
        }
        if ($order['status'] == 'Completed') {
            echo json_encode(["success" => false, "message" => "⚠️ Order was already completed."]);
            exit;
        }

        // MOVE TO PROCESSING (Active)
        $update = $conn->prepare("UPDATE transactions SET status = 'Processing' WHERE transaction_id = ?");
        $update->execute([$order['transaction_id']]);

        echo json_encode([
            "success" => true, 
            "message" => "✅ Verified! Order #" . $order['transaction_id'] . " is now ACTIVE."
        ]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "No code provided"]);
}
?>