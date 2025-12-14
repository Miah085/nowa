<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['product_id']) && isset($data['name']) && isset($data['price'])) {
    try {
        $sql = "UPDATE products 
                SET name = ?, description = ?, price = ?, category = ?, stock_quantity = ?
                WHERE product_id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['name'],
            $data['description'] ?? '',
            $data['price'],
            $data['category'] ?? 'Coffee',
            $data['stock_quantity'] ?? 100,
            $data['product_id']
        ]);

        echo json_encode(["success" => true, "message" => "Product updated successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>