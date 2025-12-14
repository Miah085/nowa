<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    $orders = $conn->query("
        SELECT 
            t.transaction_id,
            t.transaction_date,
            t.total_amount,
            t.status,
            u.username as customer,
            COUNT(ti.item_id) as item_count
        FROM transactions t
        JOIN users u ON t.user_id = u.user_id
        LEFT JOIN transaction_items ti ON t.transaction_id = ti.transaction_id
        GROUP BY t.transaction_id
        ORDER BY t.transaction_date DESC
        LIMIT 50
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "orders" => $orders]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
