<?php
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['order_id']) && isset($data['items'])) {
    $order_id = $data['order_id'];
    $items = $data['items']; // Array of {product_id, quantity}

    try {
        $conn->beginTransaction();

        // 1. Check if order exists and is Pending
        $check = $conn->prepare("SELECT status FROM transactions WHERE transaction_id = ?");
        $check->execute([$order_id]);
        $status = $check->fetchColumn();

        if ($status !== 'Pending') {
            echo json_encode(["success" => false, "message" => "Only Pending orders can be edited."]);
            exit;
        }

        // 2. Clear old items
        $delete = $conn->prepare("DELETE FROM transaction_items WHERE transaction_id = ?");
        $delete->execute([$order_id]);

        // 3. Insert new items and calculate total
        $new_total = 0;
        $insert = $conn->prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)");
        
        // Prepare price lookup
        $price_stmt = $conn->prepare("SELECT price FROM products WHERE product_id = ?");

        foreach ($items as $item) {
            $qty = intval($item['quantity']);
            if ($qty > 0) {
                // Get current price
                $price_stmt->execute([$item['product_id']]);
                $price = $price_stmt->fetchColumn();
                
                $subtotal = $price * $qty;
                $new_total += $subtotal;

                $insert->execute([$order_id, $item['product_id'], $qty, $subtotal]);
            }
        }

        // 4. Update Transaction Total
        $update = $conn->prepare("UPDATE transactions SET total_amount = ? WHERE transaction_id = ?");
        $update->execute([$new_total, $order_id]);

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Order updated successfully"]);

    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing data"]);
}
?>