<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    $employees = $conn->query("
        SELECT user_id, username, email, role, status, phone
        FROM users 
        WHERE role IN ('admin', 'staff')
        ORDER BY username ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "employees" => $employees]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
