<?php
header('Content-Type: application/json');
require 'db_connect.php';

try {
    // Fetch only active orders (Pending or Processing)
    // We join tables to get the USERNAME of the customer
    $sql = "SELECT t.transaction_id, t.transaction_date, t.total_amount, t.status, t.order_token, u.username 
            FROM transactions t
            JOIN users u ON t.user_id = u.user_id
            WHERE t.status IN ('Pending', 'Processing')
            ORDER BY t.transaction_date ASC"; // Oldest orders first (FIFO)
            
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orderList = [];

    foreach ($orders as $order) {
        $t_id = $order['transaction_id'];

        // Get items for this order
        $sql_items = "SELECT ti.quantity, p.name 
                      FROM transaction_items ti 
                      JOIN products p ON ti.product_id = p.product_id 
                      WHERE ti.transaction_id = ?";
        $stmt_items = $conn->prepare($sql_items);
        $stmt_items->execute([$t_id]);
        $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        // Calculate "Time Ago"
        $timeAgo = round((time() - strtotime($order['transaction_date'])) / 60) . " mins ago";

        $orderList[] = [
            'id' => $t_id,
            'token' => $order['order_token'],
            'customer' => $order['username'],
            'total' => $order['total_amount'],
            'status' => $order['status'],
            'time' => $timeAgo,
            'items' => $items
        ];
    }

    echo json_encode(["success" => true, "orders" => $orderList]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>