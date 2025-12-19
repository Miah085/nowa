<?php
header('Content-Type: application/json');

// 1. Robustly look for db_connect.php
// Since this file is in api/admin/, we check:
// - ../../db_connect.php (Root folder)
// - ../db_connect.php (api folder)
$paths = [
    '../../db_connect.php', 
    '../db_connect.php'
];

$conn = null;
foreach ($paths as $path) {
    if (file_exists($path)) {
        require $path;
        break;
    }
}

if (!$conn) {
    echo json_encode(["success" => false, "message" => "Database connection failed. db_connect.php not found."]);
    exit;
}

// 2. Get the input data
$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['product_id']) && isset($data['is_active'])) {
    try {
        $stmt = $conn->prepare("UPDATE products SET is_active = :status WHERE product_id = :id");
        $stmt->bindParam(':status', $data['is_active'], PDO::PARAM_INT);
        $stmt->bindParam(':id', $data['product_id'], PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Status updated successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Update failed - Database did not accept change."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
}
?>