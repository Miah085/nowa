<?php
header('Content-Type: application/json');

// Enable error reporting for debugging (but don't print to screen)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Fix: Look for db_connect.php two folders up (../../)
$paths = [
    '../../db_connect.php', // If db_connect is in root
    '../db_connect.php'     // If db_connect is in api/
];

$conn = null;
foreach ($paths as $path) {
    if (file_exists($path)) {
        require $path;
        break;
    }
}

if (!$conn) {
    echo json_encode(["success" => false, "message" => "Critical: db_connect.php not found."]);
    exit;
}

try {
    // Only fetch products that are NOT deleted
    $products = $conn->query("SELECT * FROM products WHERE is_deleted = 0 ORDER BY category, name")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "products" => $products]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>