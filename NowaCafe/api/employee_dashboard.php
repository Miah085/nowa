<?php
session_start();
include 'db_connect.php'; // Ensure this file exists and connects to your DB

// Check if user is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'staff') {
    header("Location: login.php");
    exit();
}

$employee_id = $_SESSION['user_id'];

// 1. FETCH EMPLOYEE DETAILS
$stmt = $conn->prepare("SELECT * FROM users WHERE user_id = ?");
$stmt->bind_param("i", $employee_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

// Handle Password Update
$message = "";
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_password'])) {
    $new_pass = $_POST['new_password'];
    if (!empty($new_pass)) {
        // In a real app, use password_hash($new_pass, PASSWORD_DEFAULT)
        $update_stmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
        $update_stmt->bind_param("si", $new_pass, $employee_id);
        if ($update_stmt->execute()) {
            $message = "Password updated successfully!";
        } else {
            $message = "Error updating password.";
        }
    }
}
?>