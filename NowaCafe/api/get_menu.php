<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow requests from landing page

// Correctly include the database connection (same folder)
require_once 'db_connect.php';

try {
    // Fetch products that are active and not deleted
    // We check stock > 0 in the SQL to only send available items, 
    // OR send all and let Javascript handle the "Sold Out" badge (preferred)
    $sql = "SELECT product_id, name, description, price, category, image_url, stock_quantity, is_active 
            FROM products 
            WHERE is_deleted = 0 
            ORDER BY category, name";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "products" => $products]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>