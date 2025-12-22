<?php
session_set_cookie_params(0, '/');
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents("php://input"), true);

$product_id = $data['product_id'];
$action = $data['action']; // 'increase', 'decrease', or 'remove'

try {
    // Get current quantity
    $stmt = $conn->prepare("SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$user_id, $product_id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit;
    }

    $new_qty = $item['quantity'];

    if ($action === 'increase') {
        $new_qty++;
    } elseif ($action === 'decrease') {
        $new_qty--;
    } elseif ($action === 'remove') {
        $new_qty = 0;
    }

    if ($new_qty > 0) {
        // Update Quantity
        $update = $conn->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?");
        $update->execute([$new_qty, $user_id, $product_id]);
    } else {
        // Remove Item completely
        $delete = $conn->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
        $delete->execute([$user_id, $product_id]);
    }

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>