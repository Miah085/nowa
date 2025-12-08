<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require '../../db_connection.php'; 

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email']) && isset($data['items']) && isset($data['total'])) {
    $email = $data['email'];
    $items = $data['items'];
    $total_amount = $data['total'];

    try {
        $conn->beginTransaction();

        // 1. Get User ID
        $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) throw new Exception("User not found.");
        $user_id = $user['user_id'];

        // 2. Insert Transaction
        $sql = "INSERT INTO transactions (user_id, total_amount, status) VALUES (?, ?, 'Pending')";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user_id, $total_amount]);
        $transaction_id = $conn->lastInsertId();

        // 3. Insert Items
        $sql_item = "INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)";
        $stmt_item = $conn->prepare($sql_item);

        foreach ($items as $item) {
            $subtotal = $item['price'] * $item['quantity'];
            $stmt_item->execute([$transaction_id, $item['id'], $item['quantity'], $subtotal]);
        }

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Order placed!", "id" => $transaction_id]);

    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Incomplete data"]);
}
?>