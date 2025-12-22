<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    // Added WHERE clause to filter out deleted items
    $inventory = $conn->query("
        SELECT 
            inventory_id,
            item_name,
            COALESCE(category, 'Other Supplies') as category,
            COALESCE(quantity, current_stock, 0) as current_stock,
            unit,
            COALESCE(min_quantity, reorder_level, 10) as min_quantity,
            unit_cost,
            supplier,
            last_updated,
            CASE 
                WHEN COALESCE(quantity, current_stock, 0) = 0 THEN 'out'
                WHEN COALESCE(quantity, current_stock, 0) < COALESCE(min_quantity, reorder_level, 10) THEN 'low'
                ELSE 'good'
            END as status
        FROM inventory
        WHERE is_deleted = 0  
        ORDER BY item_name ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Get stock alerts counts
    $low_stock = 0;
    $out_of_stock = 0;
    $good_stock = 0;

    foreach ($inventory as $item) {
        if ($item['status'] == 'out') $out_of_stock++;
        else if ($item['status'] == 'low') $low_stock++;
        else $good_stock++;
    }

    echo json_encode([
        "success" => true,
        "inventory" => $inventory,
        "alerts" => [
            "low" => $low_stock,
            "out" => $out_of_stock,
            "good" => $good_stock
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>