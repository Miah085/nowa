<?php
session_set_cookie_params(0, '/');
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    // If not logged in, return empty cart
    echo json_encode(['success' => true, 'cart' => []]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Join cart with products to get name, price, and image
    $sql = "SELECT c.cart_id, c.product_id, c.quantity, p.name, p.price, p.image_url 
            FROM cart c 
            JOIN products p ON c.product_id = p.product_id 
            WHERE c.user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    $cart_items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'cart' => $cart_items]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>