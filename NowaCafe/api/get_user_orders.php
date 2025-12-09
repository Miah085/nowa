<?php
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email'])) {
    $email = $data['email'];

    try {
        $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(["success" => false, "message" => "User not found"]);
            exit;
        }

        $sql = "SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $history = [];
        foreach ($transactions as $trans) {
            // UPDATED: Fetch product name and price details
            $sql_items = "SELECT ti.quantity, ti.subtotal, p.name, p.price 
                          FROM transaction_items ti 
                          JOIN products p ON ti.product_id = p.product_id 
                          WHERE ti.transaction_id = ?";
            $stmt_items = $conn->prepare($sql_items);
            $stmt_items->execute([$trans['transaction_id']]);
            $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);
            
            $history[] = [
                'id' => $trans['transaction_id'],
                'token' => $trans['order_token'], 
                'total' => $trans['total_amount'],
                'date' => $trans['transaction_date'],
                'status' => $trans['status'],
                'items' => $items // Sending full item list now
            ];
        }

        echo json_encode(["success" => true, "orders" => $history]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
}
?>