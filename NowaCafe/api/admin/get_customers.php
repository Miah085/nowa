<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    $customers = $conn->query("
        SELECT 
            u.user_id,
            u.username,
            u.email,
            COUNT(t.transaction_id) as total_orders,
            COALESCE(SUM(t.total_amount), 0) as total_spent
        FROM users u
        LEFT JOIN transactions t ON u.user_id = t.user_id
        WHERE u.role = 'customer'
        GROUP BY u.user_id
        ORDER BY total_spent DESC
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "customers" => $customers]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
