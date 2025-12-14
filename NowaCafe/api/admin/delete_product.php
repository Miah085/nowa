<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['product_id'])) {
    try {
        $stmt = $conn->prepare("UPDATE products SET is_active = 0 WHERE product_id = ?");
        $stmt->execute([$data['product_id']]);

        echo json_encode(["success" => true, "message" => "Product deleted successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing product ID"]);
}
?>
