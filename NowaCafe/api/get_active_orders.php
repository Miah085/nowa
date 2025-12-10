<?php
header('Content-Type: application/json');
error_reporting(0);
require 'db_connect.php';

// 1. FIX TIMEZONE (Crucial for correct calculations)
date_default_timezone_set('Asia/Manila');

try {
    $sql = "SELECT t.transaction_id, t.transaction_date, t.total_amount, t.status, t.order_token, u.username 
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

        $sql_items = "SELECT ti.quantity, p.name, p.product_id, p.price 
                      FROM transaction_items ti 
                      JOIN products p ON ti.product_id = p.product_id 
                      WHERE ti.transaction_id = ?";
        $stmt_items = $conn->prepare($sql_items);
        $stmt_items->execute([$t_id]);
        $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        // Convert DB time to Unix Timestamp
        $timestamp = strtotime($order['transaction_date']);
        
        // Calculate standard "Time Ago" for Active Orders
        $elapsed = time() - $timestamp;
        $minsAgo = floor($elapsed / 60);
        $timeString = ($minsAgo < 1) ? "Just now" : "$minsAgo mins ago";

        $orderList[] = [
            'id' => $t_id,
            'token' => $order['order_token'] ?? '---',
            'customer' => $order['username'],
            'total' => $order['total_amount'],
            'status' => $order['status'],
            'timestamp' => $timestamp, // Send raw time for JS countdown
            'time_ago' => $timeString, // Send pre-calc string for Active
            'items' => $items
        ];
    }

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