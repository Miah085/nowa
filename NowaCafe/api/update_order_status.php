<?php
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['order_id']) && isset($data['status'])) {
    $id = $data['order_id'];
    $status = $data['status']; // 'Processing', 'Completed', or 'Rejected'

    try {
        $sql = "UPDATE transactions SET status = ? WHERE transaction_id = ?";
        $stmt = $conn->prepare($sql);
        
        if ($stmt->execute([$status, $id])) {
            echo json_encode(["success" => true, "message" => "Order updated to $status"]);
        } else {
            echo json_encode(["success" => false, "message" => "Update failed"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing data"]);
}
?>