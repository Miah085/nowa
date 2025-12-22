<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    // Get today's revenue
    $today_revenue = $conn->query("
        SELECT COALESCE(SUM(total_amount), 0) as revenue 
        FROM transactions 
        WHERE DATE(transaction_date) = CURDATE() AND status = 'Completed'
    ")->fetch(PDO::FETCH_ASSOC);

    // Get today's order count
    $today_orders = $conn->query("
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE DATE(transaction_date) = CURDATE()
    ")->fetchColumn();

    // Get active employees
    $active_employees = $conn->query("
        SELECT COUNT(*) as count 
        FROM users 
        WHERE role IN ('admin', 'staff') AND status = 'active'
    ")->fetchColumn();

    // Get recent orders with customer names
    $recent_orders = $conn->query("
        SELECT t.transaction_id, t.total_amount, t.status, u.username as customer
        FROM transactions t
        JOIN users u ON t.user_id = u.user_id
        ORDER BY t.transaction_date DESC
        LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "stats" => [
            "revenue" => $today_revenue['revenue'],
            "orders" => $today_orders,
            "employees" => $active_employees,
            "rating" => 4.8 // This can be from a reviews table later
        ],
        "recent_orders" => $recent_orders
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>