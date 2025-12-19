<?php
header('Content-Type: application/json');
require '../db_connect.php';

// Handle both GET and POST requests
$customer_id = null;

if (isset($_GET['id'])) {
    $customer_id = $_GET['id'];
} else {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['customer_id'])) {
        $customer_id = $data['customer_id'];
    }
}

if ($customer_id) {
    try {
        // Get customer details with order stats
        $stmt = $conn->prepare("
            SELECT 
                u.user_id,
                u.username,
                u.email,
                COUNT(t.transaction_id) as total_orders,
                COALESCE(SUM(t.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN transactions t ON u.user_id = t.user_id AND t.status = 'Completed'
            WHERE u.user_id = ?
            GROUP BY u.user_id
        ");
        $stmt->execute([$customer_id]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$customer) {
            echo json_encode(["success" => false, "message" => "Customer not found"]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "customer" => [
                "user_id" => $customer['user_id'],
                "username" => $customer['username'],
                "email" => $customer['email'],
                "total_orders" => $customer['total_orders'],
                "total_spent" => number_format($customer['total_spent'], 2)
            ]
        ]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing customer ID"]);
}
?>