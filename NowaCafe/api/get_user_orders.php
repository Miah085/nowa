<?php
//
session_set_cookie_params(0, '/');
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

// 1. Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please log in']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // 2. Fetch Transactions (Orders)
    $sql = "SELECT transaction_id, order_token, total_amount, status, transaction_date 
            FROM transactions 
            WHERE user_id = ? 
            ORDER BY transaction_date DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orders = [];

    // 3. Loop through each order to get its items
    foreach ($transactions as $trans) {
        $t_id = $trans['transaction_id'];
        
        // Fetch Items for this specific transaction
        $sql_items = "SELECT ti.quantity, ti.subtotal, p.name 
                      FROM transaction_items ti 
                      JOIN products p ON ti.product_id = p.product_id 
                      WHERE ti.transaction_id = ?";
        $stmt_items = $conn->prepare($sql_items);
        $stmt_items->execute([$t_id]);
        $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        // Build the order object
        $orders[] = [
            'token' => $trans['order_token'],
            'status' => $trans['status'],
            'total' => $trans['total_amount'],
            'date' => date("M d, Y h:i A", strtotime($trans['transaction_date'])),
            'items' => $items
        ];
    }

    echo json_encode(['success' => true, 'orders' => $orders]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>