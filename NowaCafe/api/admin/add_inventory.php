<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['item_name']) && isset($data['category']) && isset($data['current_stock']) && 
    isset($data['unit']) && isset($data['min_quantity'])) {
    
    try {
        // Check if columns exist, use appropriate column names
        $sql = "INSERT INTO inventory (item_name, category, quantity, current_stock, unit, reorder_level, min_quantity, unit_cost, supplier) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stock = $data['current_stock'];
        $min = $data['min_quantity'];
        
        $stmt->execute([
            $data['item_name'],
            $data['category'],
            $stock,  // for quantity column
            $stock,  // for current_stock column
            $data['unit'],
            $min,    // for reorder_level column
            $min,    // for min_quantity column
            $data['unit_cost'] ?? null,
            $data['supplier'] ?? null
        ]);

        // Log the stock movement
        $inventory_id = $conn->lastInsertId();
        $user_id = $data['user_id'] ?? 1;

        $movement_sql = "INSERT INTO stock_movements (inventory_id, action_type, quantity, notes, performed_by) 
                        VALUES (?, 'in', ?, 'Initial stock', ?)";
        $movement_stmt = $conn->prepare($movement_sql);
        $movement_stmt->execute([$inventory_id, $data['current_stock'], $user_id]);

        echo json_encode(["success" => true, "message" => "Inventory item added successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>
