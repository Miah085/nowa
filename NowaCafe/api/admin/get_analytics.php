<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    // Weekly revenue
    $weekly = $conn->query("
        SELECT COALESCE(SUM(total_amount), 0) as revenue 
        FROM transactions 
        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
        AND status = 'Completed'
    ")->fetch(PDO::FETCH_ASSOC);

    // Monthly revenue
    $monthly = $conn->query("
        SELECT COALESCE(SUM(total_amount), 0) as revenue 
        FROM transactions 
        WHERE MONTH(transaction_date) = MONTH(CURDATE()) 
        AND YEAR(transaction_date) = YEAR(CURDATE())
        AND status = 'Completed'
    ")->fetch(PDO::FETCH_ASSOC);

    // Best selling product
    $best_seller = $conn->query("
        SELECT p.name, SUM(ti.quantity) as total_sold
        FROM transaction_items ti
        JOIN products p ON ti.product_id = p.product_id
        JOIN transactions t ON ti.transaction_id = t.transaction_id
        WHERE t.status = 'Completed'
        GROUP BY p.product_id
        ORDER BY total_sold DESC
        LIMIT 1
    ")->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "analytics" => [
            "weekly_revenue" => $weekly['revenue'],
            "monthly_revenue" => $monthly['revenue'],
            "best_seller" => $best_seller['name'] ?? 'N/A',
            "best_seller_count" => $best_seller['total_sold'] ?? 0
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>