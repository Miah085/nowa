<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['inventory_id']) && isset($data['action']) && isset($data['quantity'])) {
    try {
        $conn->beginTransaction();

        // 1. Get current stock
        $stmt = $conn->prepare("SELECT COALESCE(current_stock, quantity, 0) as stock, item_name FROM inventory WHERE inventory_id = ?");
        $stmt->execute([$data['inventory_id']]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            echo json_encode(["success" => false, "message" => "Item not found"]);
            exit;
        }

        $current_stock = floatval($item['stock']);
        $quantity = floatval($data['quantity']);
        $new_stock = $current_stock;

        // 2. Calculate new stock based on action
        switch ($data['action']) {
            case 'in':
                $new_stock = $current_stock + $quantity;
                break;
            case 'out':
                $new_stock = max(0, $current_stock - $quantity);
                break;
            case 'adjust':
                $new_stock = $quantity;
                // For log adjustment, calculate difference
                $quantity = $quantity - $current_stock;
                break;
        }

        // 3. Update inventory table
        $update_sql = "UPDATE inventory SET quantity = ?, current_stock = ? WHERE inventory_id = ?";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->execute([$new_stock, $new_stock, $data['inventory_id']]);

        // ---------------------------------------------------------
        // DYNAMIC USER ID FETCHING (Fix for Foreign Key Error)
        // ---------------------------------------------------------
        
        // Step A: Check if a specific user_id was passed from frontend
        $user_id = $data['user_id'] ?? null;

        // Step B: If no ID provided, automatically find a valid ADMIN
        if (!$user_id) {
            // Select the first active user with role 'admin'
            $admin_query = "SELECT user_id FROM users WHERE role = 'admin' AND status = 'active' LIMIT 1";
            $admin_stmt = $conn->prepare($admin_query);
            $admin_stmt->execute();
            $admin_row = $admin_stmt->fetch(PDO::FETCH_ASSOC);

            if ($admin_row) {
                $user_id = $admin_row['user_id'];
            } else {
                // If no admin is found at all, stop the transaction to prevent error
                throw new Exception("System Error: No active admin user found to verify this stock update.");
            }
        }

        // 4. Log movement
        $movement_sql = "INSERT INTO stock_movements (inventory_id, action_type, quantity, notes, performed_by) 
                        VALUES (?, ?, ?, ?, ?)";
        $movement_stmt = $conn->prepare($movement_sql);
        $movement_stmt->execute([
            $data['inventory_id'],
            $data['action'],
            abs($quantity),
            $data['notes'] ?? '',
            $user_id // Uses the dynamic ID found above
        ]);

        $conn->commit();
        echo json_encode([
            "success" => true, 
            "message" => "Stock updated successfully",
            "new_stock" => $new_stock
        ]);

    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
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