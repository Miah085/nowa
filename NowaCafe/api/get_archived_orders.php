<?php
header('Content-Type: application/json');
error_reporting(0);
require 'db_connect.php';

try {
    // 1. UPDATED SQL: Fetch 'Completed' and 'Voided' orders instead of Pending/Processing
    $sql = "SELECT t.transaction_id, t.transaction_date, t.total_amount, t.status, t.order_token, u.username
            FROM transactions t
            JOIN users u ON t.user_id = u.user_id
            WHERE t.status IN ('Completed', 'Voided')
            ORDER BY t.transaction_date DESC
            LIMIT 50"; // Added LIMIT to prevent loading too many old orders
            
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

        // 2. UPDATED TIME LOGIC: Show the actual Date instead of a countdown
        $phpDate = strtotime($order['transaction_date']);
        $formattedDate = date('M d, Y h:i A', $phpDate); // e.g., "Dec 10, 2025 08:30 PM"

        $orderList[] = [
            'id' => $t_id,
            'token' => $order['order_token'] ?? '---',
            'customer' => $order['username'],
            'total' => $order['total_amount'],
            'status' => $order['status'],
            'time' => $formattedDate, // Sending the formatted date
            'items' => $items
        ];
    }

    // 3. Stats (Optional: You can keep these or remove them if not used in the archive tab)
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