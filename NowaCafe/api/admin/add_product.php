<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['name']) && isset($data['price'])) {
    try {
        $sql = "INSERT INTO products (name, description, price, category, image_url, stock_quantity, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['name'],
            $data['description'] ?? '',
            $data['price'],
            $data['category'] ?? 'Coffee',
            $data['image_url'] ?? '',
            $data['stock_quantity'] ?? 100,
            1
        ]);

        echo json_encode(["success" => true, "message" => "Product added successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}
?>
