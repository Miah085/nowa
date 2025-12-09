<?php
header('Content-Type: application/json');
error_reporting(0);
require 'db_connect.php';

try {
    // Fetch Archived, Rejected, or Voided orders
    // We limit to 50 so it doesn't crash the browser
    $sql = "SELECT t.transaction_id, t.transaction_date, t.total_amount, t.status, u.username 
            FROM transactions t
            JOIN users u ON t.user_id = u.user_id
            WHERE t.status IN ('Archived', 'Rejected', 'Voided')
            ORDER BY t.transaction_date DESC 
            LIMIT 50";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "orders" => $orders]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>