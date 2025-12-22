<?php
//
header('Content-Type: application/json');
session_set_cookie_params(0, '/');
session_start(); 
require 'db_connect.php'; 
date_default_timezone_set('Asia/Manila'); 

function generateOrderCode() {
    return strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
}

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email']) && isset($data['items']) && isset($data['total'])) {
    $email = $data['email'];
    $items = $data['items'];
    $total_amount = $data['total'];
    // Default to 'cash' if missing
    $payment_method = isset($data['payment_method']) ? $data['payment_method'] : 'cash'; 
    $token = generateOrderCode();

    try {
        $conn->beginTransaction();

        // 1. Validate User
        $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) throw new Exception("User not found.");
        $user_id = $user['user_id'];

        // 2. Insert Transaction Header (WITH PAYMENT METHOD)
        $sql = "INSERT INTO transactions (user_id, order_token, total_amount, status, payment_method, transaction_date) VALUES (?, ?, ?, 'Pending', ?, NOW())";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user_id, $token, $total_amount, $payment_method]);
        $transaction_id = $conn->lastInsertId();

        // 3. Insert Items
        $sql_item = "INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)";
        $stmt_item = $conn->prepare($sql_item);

        foreach ($items as $item) {
            $subtotal = $item['price'] * $item['quantity'];
            $pid = isset($item['id']) ? $item['id'] : $item['product_id']; 
            $stmt_item->execute([$transaction_id, $pid, $item['quantity'], $subtotal]);
        }

        // 4. CLEAR THE CART from Database for this user
        $clear_cart = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
        $clear_cart->execute([$user_id]);

        $conn->commit();
        
        echo json_encode([
            "success" => true, 
            "message" => "Order placed!", 
            "id" => $transaction_id,
            "order_token" => $token
        ]);

    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Incomplete data"]);
}
?>