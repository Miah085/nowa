<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    $movements = $conn->query("
        SELECT 
            sm.movement_date,
            i.item_name,
            sm.action_type,
            sm.quantity,
            u.username as performed_by
        FROM stock_movements sm
        JOIN inventory i ON sm.inventory_id = i.inventory_id
        JOIN users u ON sm.performed_by = u.user_id
        ORDER BY sm.movement_date DESC
        LIMIT 10
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "movements" => $movements]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>