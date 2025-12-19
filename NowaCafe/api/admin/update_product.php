<?php
header('Content-Type: application/json');
require '../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (isset($_POST['product_id']) && isset($_POST['name']) && isset($_POST['price'])) {
        try {
            // 1. Handle Image Upload (If a new file is sent)
            $image_path = null;

            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../../assets/products/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

                $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
                $filename = uniqid('prod_') . '.' . $extension;
                $targetFile = $uploadDir . $filename;

                if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
                    $image_path = 'assets/products/' . $filename;
                }
            }

            // 2. Prepare Update Query
            $sql = "UPDATE products SET name=?, description=?, price=?, category=?, stock_quantity=?";
            $params = [
                $_POST['name'],
                $_POST['description'] ?? '',
                $_POST['price'],
                $_POST['category'] ?? 'Coffee',
                $_POST['stock_quantity'] ?? 100
            ];

            // Only update image_url if a new image was uploaded
            if ($image_path) {
                $sql .= ", image_url=?";
                $params[] = $image_path;
            }

            $sql .= " WHERE product_id=?";
            $params[] = $_POST['product_id'];

            // 3. Execute
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);

            echo json_encode(["success" => true, "message" => "Product updated successfully"]);

        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
?>