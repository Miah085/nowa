<?php
require '../db_connect.php';

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="stock_movements_report.csv"');

// Create a file pointer connected to the output stream
$output = fopen('php://output', 'w');

// Output the column headings
fputcsv($output, array('Date', 'Item Name', 'Action', 'Quantity', 'Notes', 'Performed By'));

// Fetch all movements (No LIMIT)
$sql = "
    SELECT 
        sm.movement_date,
        i.item_name,
        sm.action_type,
        sm.quantity,
        sm.notes,
        u.username as performed_by
    FROM stock_movements sm
    LEFT JOIN inventory i ON sm.inventory_id = i.inventory_id
    LEFT JOIN users u ON sm.performed_by = u.user_id
    ORDER BY sm.movement_date DESC
";

$rows = $conn->query($sql);

while ($row = $rows->fetch(PDO::FETCH_ASSOC)) {
    // Format the date if needed
    $row['action_type'] = ucfirst($row['action_type']);
    fputcsv($output, $row);
}

fclose($output);
exit;
?>