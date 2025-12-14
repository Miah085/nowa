<?php
header('Content-Type: application/json');
require '../db_connect.php';

try {
    $settings = $conn->query("SELECT * FROM cafe_settings LIMIT 1")->fetch(PDO::FETCH_ASSOC);

    if (!$settings) {
        // Create default settings if none exist
        $conn->query("INSERT INTO cafe_settings (cafe_name, email, phone, address) 
                     VALUES ('Café Nowa', 'admin@cafenowa.com', '+63 123 456 7890', 
                     '123 Coffee Street, Mendez-Nuñez, Calabarzon, Philippines')");
        $settings = $conn->query("SELECT * FROM cafe_settings LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    }

    echo json_encode(["success" => true, "settings" => $settings]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
