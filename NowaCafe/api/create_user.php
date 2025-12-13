<?php
// RUN: http://localhost/nowa/NowaCafe/api/create_user.php
require 'db_connect.php';

// --- EDIT THESE 4 LINES ---
$new_username = "Andrea";
$new_email    = "admin1@nowacafe.com";
$new_password = "admin123"; 
$new_role     = "admin"; // Options: 'admin', 'staff', 'customer'

// 1. Check if email exists
$check = $conn->prepare("SELECT email FROM users WHERE email = ?");
$check->execute([$new_email]);
if($check->rowCount() > 0){
    die("<h3>Error: User with email $new_email already exists!</h3>");
}

// 2. Hash the password
$hash = password_hash($new_password, PASSWORD_DEFAULT);

// 3. Insert into Database
$sql = "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if ($stmt->execute([$new_username, $new_email, $hash, $new_role])) {
    echo "<h1>User Created Successfully!</h1>";
    echo "Username: $new_username <br>";
    echo "Email: $new_email <br>";
    echo "Role: $new_role <br>";
    echo "Password: $new_password <br>";
} else {
    echo "Error creating user.";
}
?>