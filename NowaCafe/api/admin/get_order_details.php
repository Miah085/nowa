<?php
header('Content-Type: application/json');
require '../db_connect.php';

// Handle both GET and POST requests
$order_id = null;

if (isset($_GET['id'])) {
    $order_id = $_GET['id'];
} else {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['order_id'])) {
        $order_id = $data['order_id'];
    }
}

if ($order_id) {
    try {
        // Get order details
        $stmt = $conn->prepare("
            SELECT t.*, u.username as customer
            FROM transactions t
            JOIN users u ON t.user_id = u.user_id
            WHERE t.transaction_id = ?
        ");
        $stmt->execute([$order_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            echo json_encode(["success" => false, "message" => "Order not found"]);
            exit;
        }

        // Get order items
        $itemsStmt = $conn->prepare("
            SELECT ti.*, p.name as product_name
            FROM transaction_items ti
            JOIN products p ON ti.product_id = p.product_id
            WHERE ti.transaction_id = ?
        ");
        $itemsStmt->execute([$order_id]);
        $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Format response
        echo json_encode([
            "success" => true,
            "order" => [
                "transaction_id" => $order['transaction_id'],
                "customer" => $order['customer'],
                "date" => date('M d, Y h:i A', strtotime($order['transaction_date'])),
                "total" => number_format($order['total_amount'], 2),
                "status" => $order['status']
            ],
            "items" => array_map(function($item) {
                return [
                    "product_name" => $item['product_name'],
                    "quantity" => $item['quantity'],
                    "subtotal" => number_format($item['subtotal'], 2)
                ];
            }, $items)
        ]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing order ID"]);
}
?>
