<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require 'db_connect.php'; 

// Generate a short random code (e.g., "A7X9-2B")
function generateOrderCode() {
    return strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
}

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email']) && isset($data['items']) && isset($data['total'])) {
    $email = $data['email'];
    $items = $data['items'];
    $total_amount = $data['total'];
    
    // Create the unique code
    $token = generateOrderCode();

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) throw new Exception("User not found.");
        $user_id = $user['user_id'];

        // Save order with the TOKEN
        $sql = "INSERT INTO transactions (user_id, order_token, total_amount, status) VALUES (?, ?, ?, 'Pending')";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user_id, $token, $total_amount]);
        $transaction_id = $conn->lastInsertId();

        $sql_item = "INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)";
        $stmt_item = $conn->prepare($sql_item);

        foreach ($items as $item) {
            $subtotal = $item['price'] * $item['quantity'];
            $stmt_item->execute([$transaction_id, $item['id'], $item['quantity'], $subtotal]);
        }

        $conn->commit();
        
        // Send the token back to frontend
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