window.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadInventory();
    loadProducts();
    loadOrders();
    loadEmployees();
    loadCustomers();
    loadAnalytics();
    loadSettings();
    loadStockMovements();

    // Initialize Search and Filters
    setupSearchAndFilters();
});

// Sidebar & Navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        contentSections.forEach(section => section.classList.remove('active'));
        const sectionId = item.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
        pageTitle.textContent = item.textContent.trim();

        if (sectionId === 'inventory') { loadInventory(); loadStockMovements(); }
        if (sectionId === 'products') loadProducts();
        if (sectionId === 'orders') loadOrders();
        if (sectionId === 'employees') loadEmployees();
        if (sectionId === 'customers') loadCustomers();
        if (sectionId === 'analytics') loadAnalytics();
    });
});

const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
menuToggle.addEventListener('click', () => { sidebar.classList.toggle('active'); });

// LOGOUT MODAL LOGIC
document.getElementById('logoutBtn').addEventListener('click', () => {
    openModal('logoutModal');
});

document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '../login/login.html';
});

// ========== NEW: SEARCH AND FILTERS SETUP ==========
function setupSearchAndFilters() {
    // 1. Inventory Search
    const inventorySearch = document.getElementById('inventorySearch');
    if (inventorySearch) {
        inventorySearch.addEventListener('keyup', function (e) {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#inventoryTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    // 2. Orders Filter
    const orderFilter = document.getElementById('orderStatusFilter');
    if (orderFilter) {
        orderFilter.addEventListener('change', function (e) {
            const status = e.target.value;
            const rows = document.querySelectorAll('#ordersTableBody tr');

            rows.forEach(row => {
                // Find the status span within the row
                const statusBadge = row.querySelector('.status');
                if (statusBadge) {
                    const rowStatus = statusBadge.textContent.trim();
                    if (status === 'All Orders' || rowStatus === status) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    }
}

// ========== MODAL SYSTEM ==========
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = 'auto';
}

function openModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', closeAllModals));

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeAllModals();
});

function closeModal() { closeAllModals(); }

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 100px; right: 20px;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white; padding: 1rem 1.5rem; border-radius: 10px;
        z-index: 10000; animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ========== DASHBOARD ==========
async function loadDashboardStats() {
    try {
        const response = await fetch('../api/admin/get_dashboard_stats.php');
        const data = await response.json();
        if (data.success) {
            const cards = document.querySelectorAll('.stat-card h3');
            if (cards[0]) cards[0].textContent = `₱${parseFloat(data.stats.revenue || 0).toFixed(2)}`;
            if (cards[1]) cards[1].textContent = data.stats.orders || 0;
            if (cards[2]) cards[2].textContent = data.stats.employees || 0;
            if (cards[3]) cards[3].textContent = data.stats.rating || 'N/A';
        }
    } catch (e) { console.error(e); }
}

// ========== INVENTORY ==========
async function loadInventory() {
    try {
        const response = await fetch('../api/admin/get_inventory.php');
        const data = await response.json();
        if (data.success) {
            document.getElementById('inventoryTableBody').innerHTML = data.inventory.map(item => `
                <tr>
                    <td><strong>${item.item_name}</strong></td>
                    <td>${item.category}</td>
                    <td>${item.current_stock} ${item.unit}</td>
                    <td>${item.unit}</td>
                    <td>${item.min_quantity} ${item.unit}</td>
                    <td><span class="status-badge ${item.status === 'out' ? 'out' : item.status === 'low' ? 'low' : 'good'}">${item.status.toUpperCase()}</span></td>
                    <td>${new Date(item.last_updated).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-icon" onclick="openUpdateStock(${item.inventory_id}, '${item.item_name}')">↻</button>
                        <button class="btn-icon danger" onclick="deleteInventory(${item.inventory_id})">✕</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) { }
}

document.getElementById('addInventoryBtn').addEventListener('click', () => {
    document.getElementById('addInventoryForm').reset();
    document.getElementById('inventoryModalTitle').textContent = "Add New Inventory Item";
    document.getElementById('inventoryId').value = "";
    openModal('addInventoryModal');
});

// Download Stock Report Button
const downloadBtn = document.getElementById('downloadStockBtn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        window.location.href = '../api/admin/export_stock_movements.php';
    });
}

document.getElementById('addInventoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        item_name: document.getElementById('invName').value,
        category: document.getElementById('invCategory').value,
        current_stock: document.getElementById('invStock').value,
        unit: document.getElementById('invUnit').value,
        min_quantity: document.getElementById('invMin').value,
        unit_cost: document.getElementById('invCost').value,
        supplier: document.getElementById('invSupplier').value
    };

    try {
        const response = await fetch('../api/admin/add_inventory.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Item Saved Successfully');
            closeModal();
            loadInventory();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) { showNotification('Error saving item', 'error'); }
});

function openUpdateStock(id, name) {
    document.getElementById('updateStockForm').reset();
    document.getElementById('updateStockName').value = name;
    document.getElementById('updateStockForm').dataset.id = id;
    openModal('updateStockModal');
}

document.getElementById('updateStockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = e.target.dataset.id;
    const formData = {
        inventory_id: id,
        action: document.getElementById('updateStockAction').value,
        quantity: document.getElementById('updateStockQty').value,
        notes: document.getElementById('updateStockNotes').value
    };

    try {
        const response = await fetch('../api/admin/update_stock.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Stock updated');
            closeModal();
            loadInventory();
            loadStockMovements();
        } else showNotification(data.message, 'error');
    } catch (e) { showNotification('Error updating stock', 'error'); }
});

// --- INVENTORY DELETE MODAL ---
let itemToDeleteId = null;
function deleteInventory(id) {
    itemToDeleteId = id;
    openModal('deleteModal');
}
async function confirmDelete() {
    if (!itemToDeleteId) return;
    try {
        const response = await fetch('../api/admin/delete_inventory.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inventory_id: itemToDeleteId })
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Item deleted successfully', 'success');
            loadInventory();
        } else {
            showNotification(data.message || 'Error deleting item', 'error');
        }
    } catch (e) {
        showNotification('An error occurred while deleting', 'error');
    } finally {
        closeModal();
        itemToDeleteId = null;
    }
}

// ========== PRODUCTS ==========
async function loadProducts() {
    try {
        const response = await fetch('../api/admin/get_products.php');
        const data = await response.json();
        if (data.success) {
            document.querySelector('.products-grid').innerHTML = data.products.map(p => `
                <div class="product-card">
                    <img src="../${p.image_url}" onerror="this.src='../landing/assets/espresso.jpg'" alt="${p.name}">
                    <h4>${p.name}</h4>
                    <p class="product-price">₱${parseFloat(p.price).toFixed(2)}</p>
                    <div class="product-actions">
                        <button class="btn-edit" onclick='openEditProduct(${JSON.stringify(p)})'>Edit</button>
                        <button class="btn-delete" onclick="deleteProduct(${p.product_id})">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { }
}

document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('addProductForm').reset();
    document.getElementById('productModalTitle').textContent = "Add New Product";
    document.getElementById('prodId').value = "";
    document.getElementById('prodImage').value = ""; // Clear file input
    openModal('addProductModal');
});

function openEditProduct(product) {
    document.getElementById('productModalTitle').textContent = "Edit Product";
    document.getElementById('prodId').value = product.product_id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodStock').value = product.stock_quantity;
    document.getElementById('prodImage').value = ""; // Clear file input
    document.getElementById('prodDesc').value = product.description;
    openModal('addProductModal');
}

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const id = document.getElementById('prodId').value;

    if (id) formData.append('product_id', id);
    formData.append('name', document.getElementById('prodName').value);
    formData.append('category', document.getElementById('prodCategory').value);
    formData.append('price', document.getElementById('prodPrice').value);
    formData.append('stock_quantity', document.getElementById('prodStock').value);
    formData.append('description', document.getElementById('prodDesc').value);

    const fileInput = document.getElementById('prodImage');
    if (fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }

    const url = id ? '../api/admin/update_product.php' : '../api/admin/add_product.php';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showNotification(id ? 'Product Updated' : 'Product Added');
            closeModal();
            loadProducts();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error saving product', 'error');
    }
});

// --- PRODUCT DELETE MODAL LOGIC ---
let productToDeleteId = null;

function deleteProduct(id) {
    productToDeleteId = id;
    openModal('deleteProductModal');
}

async function confirmDeleteProduct() {
    if (!productToDeleteId) return;

    try {
        const response = await fetch('../api/admin/delete_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productToDeleteId })
        });
        const data = await response.json();

        if (data.success) {
            showNotification('Product deleted successfully', 'success');
            loadProducts();
        } else {
            showNotification(data.message || 'Error deleting product', 'error');
        }
    } catch (e) {
        showNotification('An error occurred while deleting', 'error');
    } finally {
        closeModal();
        productToDeleteId = null;
    }
}

// ========== EMPLOYEES ==========
async function loadEmployees() {
    try {
        const response = await fetch('../api/admin/get_employees.php');
        const data = await response.json();
        if (data.success) {
            document.querySelector('#employees tbody').innerHTML = data.employees.map(e => `
                <tr>
                    <td>${e.username}</td>
                    <td>${e.email}</td>
                    <td>${e.role}</td>
                    <td><span class="status active">Active</span></td>
                    <td style="display: flex; gap: 5px;">
                        <button class="btn-edit" onclick='openEditEmployee(${JSON.stringify(e)})'>Edit</button>
                        <button class="btn-secondary" style="display:flex; align-items:center; gap:5px; padding: 5px 10px; font-weight: normal;" onclick="openSchedule(${e.user_id}, '${e.username}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Schedule
                        </button>
                        <button class="btn-delete" onclick="deleteEmployee(${e.user_id})">Remove</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) { }
}

document.getElementById('addEmployeeBtn').addEventListener('click', () => {
    document.getElementById('addEmployeeForm').reset();
    document.getElementById('employeeModalTitle').textContent = "Add New Employee";
    document.getElementById('empId').value = "";
    openModal('addEmployeeModal');
});

function openEditEmployee(emp) {
    document.getElementById('employeeModalTitle').textContent = "Edit Employee";
    document.getElementById('empId').value = emp.user_id;
    document.getElementById('empName').value = emp.username;
    document.getElementById('empEmail').value = emp.email;
    document.getElementById('empPhone').value = emp.phone || '';
    document.getElementById('empRole').value = emp.role;
    openModal('addEmployeeModal');
}

document.getElementById('addEmployeeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('empId').value;
    const url = id ? '../api/admin/update_employee.php' : '../api/admin/add_employee.php';

    const formData = {
        user_id: id,
        username: document.getElementById('empName').value,
        email: document.getElementById('empEmail').value,
        phone: document.getElementById('empPhone').value,
        role: document.getElementById('empRole').value,
        password: document.getElementById('empPassword').value,
        status: 'active'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
            showNotification(id ? 'Employee Updated' : 'Employee Added');
            closeModal();
            loadEmployees();
        } else showNotification(data.message, 'error');
    } catch (e) { showNotification('Error saving employee', 'error'); }
});

// --- EMPLOYEE DELETE MODAL LOGIC ---
let employeeToDeleteId = null;

function deleteEmployee(id) {
    employeeToDeleteId = id;
    openModal('deleteEmployeeModal');
}

async function confirmDeleteEmployee() {
    if (!employeeToDeleteId) return;

    try {
        const response = await fetch('../api/admin/delete_employee.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: employeeToDeleteId })
        });
        const data = await response.json();

        if (data.success) {
            showNotification('Employee removed successfully', 'success');
            loadEmployees();
        } else {
            showNotification(data.message || 'Error removing employee', 'error');
        }
    } catch (e) {
        showNotification('An error occurred while removing', 'error');
    } finally {
        closeModal();
        employeeToDeleteId = null;
    }
}

// --- SCHEDULE MANAGEMENT LOGIC (Admin Side) ---
let scheduleToDeleteId = null; // Stores ID for deletion

async function openSchedule(userId, username) {
    document.getElementById('scheduleUserId').value = userId;
    document.getElementById('scheduleModalTitle').textContent = `Manage Schedule: ${username}`;
    openModal('scheduleModal');
    loadEmployeeSchedule(userId);
}

async function loadEmployeeSchedule(userId) {
    try {
        const response = await fetch(`../api/admin/get_employee_schedule.php?user_id=${userId}`);
        const data = await response.json();
        const tbody = document.getElementById('scheduleTableBody');

        if (data.success && data.schedules.length > 0) {
            tbody.innerHTML = data.schedules.map(s => `
                <tr>
                    <td>${s.day_of_week}</td>
                    <td>${formatTime(s.start_time)} - ${formatTime(s.end_time)}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteSchedule(${s.schedule_id})">Remove</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #888;">No shifts assigned yet.</td></tr>';
        }
    } catch (e) { console.error(e); }
}

function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

document.getElementById('addScheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('scheduleUserId').value;

    const formData = {
        user_id: userId,
        day: document.getElementById('schedDay').value,
        start: document.getElementById('schedStart').value,
        end: document.getElementById('schedEnd').value
    };

    try {
        const response = await fetch('../api/admin/add_schedule.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
            loadEmployeeSchedule(userId);
        } else {
            alert(data.message);
        }
    } catch (e) { console.error(e); }
});

// --- SCHEDULE DELETE MODAL LOGIC ---
function deleteSchedule(scheduleId) {
    scheduleToDeleteId = scheduleId;
    openModal('deleteScheduleModal');
}

async function confirmDeleteSchedule() {
    if (!scheduleToDeleteId) return;

    // Get the current user ID being viewed to reload their schedule
    const userId = document.getElementById('scheduleUserId').value;

    try {
        const response = await fetch('../api/admin/delete_schedule.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule_id: scheduleToDeleteId })
        });
        const data = await response.json();

        if (data.success) {
            showNotification('Shift removed successfully', 'success');
            loadEmployeeSchedule(userId); // Reload the list
        } else {
            showNotification(data.message || 'Error removing shift', 'error');
        }
    } catch (e) {
        showNotification('An error occurred', 'error');
    } finally {
        closeModal();
        scheduleToDeleteId = null;
    }
}

// ========== ORDERS & CUSTOMERS ==========
async function loadOrders() {
    try {
        const response = await fetch('../api/admin/get_orders.php');
        const data = await response.json();
        if (data.success) {
            // FIXED: Target the specific body ID
            document.getElementById('ordersTableBody').innerHTML = data.orders.map(o => `
                <tr>
                    <td>#${o.transaction_id}</td>
                    <td>${o.customer}</td>
                    <td>${new Date(o.transaction_date).toLocaleDateString()}</td>
                    <td>${o.item_count}</td>
                    <td>₱${parseFloat(o.total_amount).toFixed(2)}</td>
                    <td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td>
                    <td><button class="btn-view" onclick="viewOrder(${o.transaction_id})">View</button></td>
                </tr>
            `).join('');
        }
    } catch (e) { }
}

async function viewOrder(id) {
    try {
        const response = await fetch(`../api/admin/get_order_details.php?id=${id}`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('viewOrderId').textContent = `#${data.order.transaction_id}`;
            document.getElementById('viewOrderCustomer').value = data.order.customer;
            document.getElementById('viewOrderDate').value = data.order.date;
            document.getElementById('viewOrderTotal').textContent = data.order.total;
            document.getElementById('viewOrderItems').innerHTML = data.items.map(item => `
                <tr><td>${item.product_name}</td><td>${item.quantity}</td><td>₱${item.subtotal}</td></tr>
            `).join('');
            openModal('viewOrderModal');
        }
    } catch (e) { }
}

async function loadCustomers() {
    try {
        const response = await fetch('../api/admin/get_customers.php');
        const data = await response.json();
        if (data.success) {
            document.querySelector('#customers tbody').innerHTML = data.customers.map(c => `
                <tr>
                    <td>${c.username}</td>
                    <td>${c.email}</td>
                    <td>${c.total_orders}</td>
                    <td>₱${parseFloat(c.total_spent).toFixed(2)}</td>
                    <td><button class="btn-view" onclick="viewCustomer(${c.user_id})">View</button></td>
                </tr>
            `).join('');
        }
    } catch (e) { }
}

async function viewCustomer(id) {
    try {
        const response = await fetch(`../api/admin/get_customer_details.php?id=${id}`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('viewCustName').value = data.customer.username;
            document.getElementById('viewCustEmail').value = data.customer.email;
            document.getElementById('viewCustOrders').textContent = data.customer.total_orders;
            document.getElementById('viewCustSpent').textContent = `₱${parseFloat(data.customer.total_spent).toFixed(2)}`;
            openModal('viewCustomerModal');
        } else {
            showNotification(data.message || 'Error fetching details', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('An error occurred', 'error');
    }
}

async function loadStockMovements() {
    try {
        const response = await fetch('../api/admin/get_stock_movements.php');
        const data = await response.json();
        if (data.success) {
            document.querySelector('.stock-history tbody').innerHTML = data.movements.map(m => `
                <tr>
                    <td>${new Date(m.movement_date).toLocaleString()}</td>
                    <td>${m.item_name}</td>
                    <td><span class="action-badge ${m.action_type}">${m.action_type}</span></td>
                    <td>${m.action_type === 'in' ? '+' : '-'}${m.quantity}</td>
                    <td>${m.performed_by}</td>
                </tr>
            `).join('');
        }
    } catch (e) { }
}

async function loadAnalytics() {
    try {
        const response = await fetch('../api/admin/get_analytics.php');
        const data = await response.json();
        if (data.success) {
            const v = document.querySelectorAll('.analytics-value');
            if (v[0]) v[0].textContent = `₱${data.analytics.weekly_revenue}`;
            if (v[1]) v[1].textContent = `₱${data.analytics.monthly_revenue}`;
            if (v[2]) v[2].textContent = data.analytics.best_seller;
        }
    } catch (e) { }
}

async function loadSettings() {
    try {
        const response = await fetch('../api/admin/get_settings.php');
        const data = await response.json();
        if (data.success) {
            const form = document.querySelector('.settings-form');
            if (form) {
                form.querySelector('input[type="text"]').value = data.settings.cafe_name;
                form.querySelector('input[type="email"]').value = data.settings.email;
            }
        }
    } catch (e) { }
}