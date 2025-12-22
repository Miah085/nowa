<?php
session_set_cookie_params(0, '/');
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Session expired. Please login again.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['product_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid product.']);
    exit;
}

$product_id = intval($data['product_id']);
$quantity = 1;

try {
    // Check if item exists
    $checkSql = "SELECT cart_id, quantity FROM cart WHERE user_id = ? AND product_id = ?";
    $stmt = $conn->prepare($checkSql);
    $stmt->execute([$user_id, $product_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $new_qty = $existing['quantity'] + 1;
        $updateSql = "UPDATE cart SET quantity = ? WHERE cart_id = ?";
        $stmt = $conn->prepare($updateSql);
        $stmt->execute([$new_qty, $existing['cart_id']]);
    } else {
        $insertSql = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($insertSql);
        $stmt->execute([$user_id, $product_id, $quantity]);
    }

    echo json_encode(['success' => true, 'message' => 'Added to cart!']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
?>