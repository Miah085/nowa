<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['inventory_id']) && isset($data['action']) && isset($data['quantity'])) {
    try {
        $conn->beginTransaction();

        // Get current stock - handle both column names
        $stmt = $conn->prepare("SELECT COALESCE(current_stock, quantity, 0) as stock, item_name FROM inventory WHERE inventory_id = ?");
        $stmt->execute([$data['inventory_id']]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            echo json_encode(["success" => false, "message" => "Item not found"]);
            exit;
        }

        $current_stock = $item['stock'];
        $quantity = floatval($data['quantity']);
        $new_stock = $current_stock;

        // Calculate new stock based on action
        switch ($data['action']) {
            case 'in':
                $new_stock = $current_stock + $quantity;
                break;
            case 'out':
                $new_stock = max(0, $current_stock - $quantity);
                break;
            case 'adjust':
                $new_stock = $quantity;
                $quantity = $quantity - $current_stock;
                break;
        }

        // Update inventory - update both columns to be safe
        $update_sql = "UPDATE inventory SET quantity = ?, current_stock = ? WHERE inventory_id = ?";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->execute([$new_stock, $new_stock, $data['inventory_id']]);

        // Log movement
        $user_id = $data['user_id'] ?? 1;
        $movement_sql = "INSERT INTO stock_movements (inventory_id, action_type, quantity, notes, performed_by) 
                        VALUES (?, ?, ?, ?, ?)";
        $movement_stmt = $conn->prepare($movement_sql);
        $movement_stmt->execute([
            $data['inventory_id'],
            $data['action'],
            abs($quantity),
            $data['notes'] ?? '',
            $user_id
        ]);

        $conn->commit();
        echo json_encode([
            "success" => true, 
            "message" => "Stock updated successfully",
            "new_stock" => $new_stock
        ]);

    } catch (PDOException $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>