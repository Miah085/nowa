<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['item_name']) && isset($data['category']) && isset($data['current_stock']) && 
    isset($data['unit']) && isset($data['min_quantity'])) {
    
    try {
        $conn->beginTransaction(); // Start transaction for safety

        // 1. Insert into Inventory
        $sql = "INSERT INTO inventory (item_name, category, quantity, current_stock, unit, reorder_level, min_quantity, unit_cost, supplier) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stock = $data['current_stock'];
        $min = $data['min_quantity'];
        
        $stmt->execute([
            $data['item_name'],
            $data['category'],
            $stock,
            $stock,
            $data['unit'],
            $min,
            $min,
            $data['unit_cost'] ?? null,
            $data['supplier'] ?? null
        ]);

        $inventory_id = $conn->lastInsertId();

        // ---------------------------------------------------------
        // DYNAMIC USER ID FETCHING
        // ---------------------------------------------------------
        
        // Step 1: Check if a specific user_id was passed
        $user_id = $data['user_id'] ?? null;

        // Step 2: If no ID provided, find any valid Admin in the database
        if (!$user_id) {
            // Get the first active admin found in the database
            $admin_query = "SELECT user_id FROM users WHERE role = 'admin' AND status = 'active' LIMIT 1";
            $admin_stmt = $conn->prepare($admin_query);
            $admin_stmt->execute();
            $admin_row = $admin_stmt->fetch(PDO::FETCH_ASSOC);

            if ($admin_row) {
                $user_id = $admin_row['user_id'];
            } else {
                // Failsafe: If no admin exists, try getting ANY active user or throw error
                // This prevents the foreign key error even if no admin is found
                $any_user_query = "SELECT user_id FROM users WHERE status = 'active' LIMIT 1";
                $any_user_stmt = $conn->prepare($any_user_query);
                $any_user_stmt->execute();
                $any_user_row = $any_user_stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($any_user_row) {
                     $user_id = $any_user_row['user_id'];
                } else {
                     throw new Exception("No active users found to perform this action.");
                }
            }
        }

        // 3. Log the stock movement using the dynamic $user_id
        $movement_sql = "INSERT INTO stock_movements (inventory_id, action_type, quantity, notes, performed_by) 
                        VALUES (?, 'in', ?, 'Initial stock', ?)";
        $movement_stmt = $conn->prepare($movement_sql);
        $movement_stmt->execute([$inventory_id, $data['current_stock'], $user_id]);

        $conn->commit(); // Save changes
        echo json_encode(["success" => true, "message" => "Inventory item added successfully"]);

    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack(); // Undo changes on error
        }
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>