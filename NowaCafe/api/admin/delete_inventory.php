<?php
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['inventory_id'])) {
    try {
        // SOFT DELETE: Update the flag instead of deleting the row
        $stmt = $conn->prepare("UPDATE inventory SET is_deleted = 1 WHERE inventory_id = ?");
        $stmt->execute([$data['inventory_id']]);

        echo json_encode(["success" => true, "message" => "Inventory item deleted successfully"]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Missing inventory ID"]);
}
?>