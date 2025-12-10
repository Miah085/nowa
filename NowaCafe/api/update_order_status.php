<?php
header('Content-Type: application/json');
error_reporting(0);
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['order_id']) && isset($data['status'])) {
    $id = $data['order_id'];
    $new_status = $data['status']; 

    try {
        // Start Transaction to ensure everything happens or nothing happens
        $conn->beginTransaction();

        // 1. Get the CURRENT status of the order
        // We need this to ensure we don't deduct stock twice if clicked multiple times
        $checkStmt = $conn->prepare("SELECT status FROM transactions WHERE transaction_id = ?");
        $checkStmt->execute([$id]);
        $current_status = $checkStmt->fetchColumn();

        // 2. DEDUCT STOCK LOGIC
        // Only deduct if the NEW status is 'Completed' AND it wasn't 'Completed' before
        if ($new_status === 'Completed' && $current_status !== 'Completed') {
            
            // Fetch the items in this order
            $itemsStmt = $conn->prepare("SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?");
            $itemsStmt->execute([$id]);
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Prepare the deduction query
            // GREATEST(..., 0) prevents stock from going below 0
            $deductStmt = $conn->prepare("UPDATE products SET stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE product_id = ?");

            foreach ($items as $item) {
                $deductStmt->execute([$item['quantity'], $item['product_id']]);
            }
        }

        // 3. Update the Order Status
        $updateSql = "UPDATE transactions SET status = ? WHERE transaction_id = ?";
        $updateStmt = $conn->prepare($updateSql);
        
        if ($updateStmt->execute([$new_status, $id])) {
            $conn->commit(); // Save all changes
            echo json_encode(["success" => true, "message" => "Updated order #$id to $new_status"]);
        } else {
            $conn->rollBack(); // Undo changes if failed
            echo json_encode(["success" => false, "message" => "Update failed"]);
        }

    } catch (PDOException $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing data"]);
}
?>