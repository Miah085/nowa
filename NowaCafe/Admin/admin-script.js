// Check if user is logged in and has admin role
window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    // const userEmail = sessionStorage.getItem('userEmail'); // Old way
    const userName = sessionStorage.getItem('userName');      // New way

    if (!isLoggedIn || userRole !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = '../login/login.html';
        return;
    }

    // Display user NAME instead of email
    document.getElementById('userName').textContent = userName; 
});

// Sidebar navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Hide all sections
        contentSections.forEach(section => section.classList.remove('active'));
        
        // Show selected section
        const sectionId = item.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
        
        // Update page title
        const sectionName = item.textContent.trim();
        pageTitle.textContent = sectionName;
    });
});

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '../login/login.html';
    }
});

// Add Product Button
document.getElementById('addProductBtn').addEventListener('click', () => {
    alert('Add Product feature - Connect to database to add new products');
});

// Add Employee Button
document.getElementById('addEmployeeBtn').addEventListener('click', () => {
    alert('Add Employee feature - Connect to database to add new employees');
});

// Edit buttons
document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
        alert('Edit feature - Connect to database to edit this item');
    });
});

// Delete buttons
document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this item?')) {
            alert('Delete feature - Connect to database to delete this item');
        }
    });
});

// View buttons
document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', () => {
        alert('View details - Connect to database to show full details');
    });
});

// Settings save button
const settingsSection = document.getElementById('settings');
if (settingsSection) {
    const saveBtn = settingsSection.querySelector('.btn-primary');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            alert('Settings saved successfully!');
        });
    }
}

// ========== INVENTORY MANAGEMENT ==========

// Inventory Management Functions
const addInventoryBtn = document.getElementById('addInventoryBtn');
const addInventoryModal = document.getElementById('addInventoryModal');
const updateStockModal = document.getElementById('updateStockModal');

// Make sure modals are hidden on page load
document.addEventListener('DOMContentLoaded', () => {
    closeAllModals();
});

// Helper function to close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

// Open Add Inventory Modal
if (addInventoryBtn) {
    addInventoryBtn.addEventListener('click', () => {
        closeAllModals();
        addInventoryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

// Close modals when clicking X button
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        closeAllModals();
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeAllModals();
    }
});

function closeModal() {
    closeAllModals();
}

// Update Stock Function
function updateStock(button) {
    const row = button.closest('tr');
    const itemName = row.querySelector('td:first-child strong').textContent;
    
    closeAllModals();
    updateStockModal.classList.add('active');
    updateStockModal.querySelector('input[readonly]').value = itemName;
    document.body.style.overflow = 'hidden';
}

// Edit Inventory Function
function editInventory(button) {
    const row = button.closest('tr');
    const itemName = row.querySelector('td:first-child strong').textContent;
    
    showNotification(`Editing ${itemName} - Connect to database to enable editing`);
}

// Delete Inventory Function
function deleteInventory(button) {
    const row = button.closest('tr');
    const itemName = row.querySelector('td:first-child strong').textContent;
    
    if (confirm(`Are you sure you want to delete ${itemName} from inventory?`)) {
        row.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            row.remove();
            showNotification(`${itemName} removed from inventory`);
        }, 500);
    }
}

// Add Inventory Form Submission
const addInventoryForm = document.getElementById('addInventoryForm');
if (addInventoryForm) {
    addInventoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        showNotification('New inventory item added successfully!');
        closeModal();
        addInventoryForm.reset();
    });
}

// Update Stock Form Submission
const updateStockForm = document.getElementById('updateStockForm');
if (updateStockForm) {
    updateStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        showNotification('Stock updated successfully!');
        closeModal();
        updateStockForm.reset();
    });
}

// Inventory Search
const inventorySearch = document.getElementById('inventorySearch');
if (inventorySearch) {
    inventorySearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const tableRows = document.querySelectorAll('#inventoryTableBody tr');
        
        tableRows.forEach(row => {
            const itemName = row.querySelector('td:first-child').textContent.toLowerCase();
            const category = row.querySelectorAll('td')[1].textContent.toLowerCase();
            
            if (itemName.includes(searchTerm) || category.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Auto-generate low stock alerts
function checkLowStock() {
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    let lowStockCount = 0;
    let outOfStockCount = 0;
    
    rows.forEach(row => {
        const statusBadge = row.querySelector('.status-badge');
        if (statusBadge && statusBadge.classList.contains('low')) lowStockCount++;
        if (statusBadge && statusBadge.classList.contains('out')) outOfStockCount++;
    });
    
    // Update alert cards if they exist
    const alertCards = document.querySelectorAll('.alert-card');
    if (alertCards.length >= 2) {
        alertCards[0].querySelector('p').textContent = `${lowStockCount} items below minimum quantity`;
        alertCards[1].querySelector('p').textContent = `${outOfStockCount} items need immediate restock`;
    }
}

// Run low stock check on page load
setTimeout(() => {
    if (document.getElementById('inventory')) {
        checkLowStock();
    }
}, 500);