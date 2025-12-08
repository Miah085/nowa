<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
require '../../db_connection.php'; 

try {
    $sql = "SELECT * FROM products WHERE is_active = 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "products" => $products]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>