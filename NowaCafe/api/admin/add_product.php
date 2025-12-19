<?php
header('Content-Type: application/json');
require '../db_connect.php';

// Check if data is coming via POST (standard form submission with files)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Validate required fields
    if (isset($_POST['name']) && isset($_POST['price'])) {
        try {
            // 1. Handle Image Upload
            $image_path = 'assets/default.jpg'; // Default fallback

            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                // Define upload directory (../../assets/products/)
                $uploadDir = '../../assets/products/';
                
                // Create directory if it doesn't exist
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                // Generate unique filename to prevent overwriting
                $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
                $filename = uniqid('prod_') . '.' . $extension;
                $targetFile = $uploadDir . $filename;

                // Move file
                if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
                    // Save path relative to project root
                    $image_path = 'assets/products/' . $filename;
                }
            } else {
                // If a manual URL was provided (fallback for older logic)
                $image_path = $_POST['image_url'] ?? 'assets/default.jpg';
            }

            // 2. Insert into Database
            $sql = "INSERT INTO products (name, description, price, category, image_url, stock_quantity, is_active) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $_POST['name'],
                $_POST['description'] ?? '',
                $_POST['price'],
                $_POST['category'] ?? 'Coffee',
                $image_path,
                $_POST['stock_quantity'] ?? 100,
                1
            ]);

            echo json_encode(["success" => true, "message" => "Product added successfully"]);

        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Missing name or price"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
?>