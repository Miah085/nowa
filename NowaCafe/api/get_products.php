<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require 'db_connect.php'; 

try {
    // Select all products (removed 'WHERE is_active = 1' just in case your DB doesn't have that column yet)
    $sql = "SELECT * FROM products";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "products" => $products]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>