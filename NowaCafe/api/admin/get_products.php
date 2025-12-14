<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    $products = $conn->query("
        SELECT * FROM products 
        ORDER BY name ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "products" => $products]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>