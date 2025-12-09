<?php
header('Content-Type: application/json');
error_reporting(0);
require 'db_connect.php';

try {
    // 1. Fetch Active Orders (Pending & Processing) - NEWEST FIRST
    $sql = "SELECT t.transaction_id, t.transaction_date, t.total_amount, t.status, t.order_token, u.username 
            FROM transactions t
            JOIN users u ON t.user_id = u.user_id
            WHERE t.status IN ('Pending', 'Processing')
            ORDER BY t.transaction_date DESC"; // <--- FIXED SORTING
            
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orderList = [];
    foreach ($orders as $order) {
        $t_id = $order['transaction_id'];

        // Get items
        $sql_items = "SELECT ti.quantity, p.name 
                      FROM transaction_items ti 
                      JOIN products p ON ti.product_id = p.product_id 
                      WHERE ti.transaction_id = ?";
        $stmt_items = $conn->prepare($sql_items);
        $stmt_items->execute([$t_id]);
        $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        $timeAgo = round((time() - strtotime($order['transaction_date'])) / 60) . " mins ago";

        $orderList[] = [
            'id' => $t_id,
            'token' => $order['order_token'] ?? '---',
            'customer' => $order['username'],
            'total' => $order['total_amount'],
            'status' => $order['status'],
            'time' => $timeAgo,
            'items' => $items
        ];
    }

    // 2. Calculate Stats
    $pending = $conn->query("SELECT COUNT(*) FROM transactions WHERE status = 'Pending'")->fetchColumn();
    $processing = $conn->query("SELECT COUNT(*) FROM transactions WHERE status = 'Processing'")->fetchColumn();
    // Completed TODAY only
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