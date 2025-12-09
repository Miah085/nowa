<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require 'db_connect.php'; 

// Set Timezone to match your location (Philippines)
date_default_timezone_set('Asia/Manila'); 

function generateOrderCode() {
    return strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
}

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email']) && isset($data['items']) && isset($data['total'])) {
    $email = $data['email'];
    $items = $data['items'];
    $total_amount = $data['total'];
    $token = generateOrderCode();

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) throw new Exception("User not found.");
        $user_id = $user['user_id'];

        // Insert Order
        $sql = "INSERT INTO transactions (user_id, order_token, total_amount, status, transaction_date) VALUES (?, ?, ?, 'Pending', NOW())";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user_id, $token, $total_amount]);
        $transaction_id = $conn->lastInsertId();

        // Insert Items
        $sql_item = "INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)";
        $stmt_item = $conn->prepare($sql_item);

        foreach ($items as $item) {
            $subtotal = $item['price'] * $item['quantity'];
            $stmt_item->execute([$transaction_id, $item['id'], $item['quantity'], $subtotal]);
        }

        $conn->commit();
        
        // Calculate Expiration Time (Now + 20 mins)
        // We use DB time to be consistent
        $stmt_time = $conn->query("SELECT DATE_ADD(transaction_date, INTERVAL 20 MINUTE) as expiry FROM transactions WHERE transaction_id = $transaction_id");
        $expiry = $stmt_time->fetchColumn();

        echo json_encode([
            "success" => true, 
            "message" => "Order placed!", 
            "id" => $transaction_id,
            "order_token" => $token,
            "expiry_time" => $expiry // Send this to frontend
        ]);

    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Incomplete data"]);
}
?>