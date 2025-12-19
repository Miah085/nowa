<?php
header('Content-Type: application/json');

// 1. Look for db_connect.php (Robust check)
$paths = ['../db_connect.php', '../../db_connect.php'];
$conn = null;
foreach ($paths as $path) {
    if (file_exists($path)) {
        require $path;
        break;
    }
}

if (!$conn) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

try {
    // 2. Fetch products that are NOT deleted
    // We fetch everything (even out of stock) so we can show them as "Sold Out" instead of hiding them completely
    $sql = "SELECT product_id, name, description, price, category, image_url, stock_quantity, is_active 
            FROM products 
            WHERE is_deleted = 0 
            ORDER BY category, name";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "products" => $products]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>