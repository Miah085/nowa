<?php
header('Content-Type: application/json');
error_reporting(0);
require 'db_connect.php';

try {
    // We calculate 'seconds_remaining' using DB time
    // 1200 seconds = 20 minutes
    $sql = "SELECT t.transaction_id, t.transaction_date, t.total_amount, t.status, t.order_token, u.username,
            (1200 - TIMESTAMPDIFF(SECOND, t.transaction_date, NOW())) as seconds_remaining
            FROM transactions t
            JOIN users u ON t.user_id = u.user_id
            WHERE t.status IN ('Pending', 'Processing')
            ORDER BY t.transaction_date DESC"; 
            
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orderList = [];
    foreach ($orders as $order) {
        $t_id = $order['transaction_id'];

        $sql_items = "SELECT ti.quantity, p.name 
                      FROM transaction_items ti 
                      JOIN products p ON ti.product_id = p.product_id 
                      WHERE ti.transaction_id = ?";
        $stmt_items = $conn->prepare($sql_items);
        $stmt_items->execute([$t_id]);
        $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        // Calculate display time
        $rem = intval($order['seconds_remaining']);
        if ($rem > 0) {
            $mins = floor($rem / 60);
            $secs = $rem % 60;
            $timeDisplay = "Expires in: " . $mins . "m " . $secs . "s";
            $is_expired = false;
        } else {
            $timeDisplay = "⚠️ EXPIRED";
            $is_expired = true;
        }

        $orderList[] = [
            'id' => $t_id,
            'token' => $order['order_token'] ?? '---',
            'customer' => $order['username'],
            'total' => $order['total_amount'],
            'status' => $order['status'],
            'time' => $timeDisplay, // Now shows Countdown instead of "ago"
            'is_expired' => $is_expired,
            'items' => $items
        ];
    }

    // Stats
    $pending = $conn->query("SELECT COUNT(*) FROM transactions WHERE status = 'Pending'")->fetchColumn();
    $processing = $conn->query("SELECT COUNT(*) FROM transactions WHERE status = 'Processing'")->fetchColumn();
    $completed = $conn->query("SELECT COUNT(*) FROM transactions WHERE status = 'Completed' AND DATE(transaction_date) = CURDATE()")->fetchColumn();

    echo json_encode([
        "success" => true, 
        "orders" => $orderList,
        "stats" => [
            "pending" => $pending,
            "processing" => $processing,
            "completed" => $completed
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>