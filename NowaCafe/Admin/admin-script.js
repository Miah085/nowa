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

// LOGOUT MODAL LOGIC (UPDATED)
document.getElementById('logoutBtn').addEventListener('click', () => {
    openModal('logoutModal');
});

document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '../login/login.html';
});

// ========== MODAL SYSTEM ==========
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = 'auto';
}

function openModal(modalId) {
    closeAllModals();
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', closeAllModals));
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeAllModals(); });
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
            cards[0].textContent = `$${parseFloat(data.stats.revenue || 0).toFixed(2)}`;
            cards[1].textContent = data.stats.orders || 0;
            cards[2].textContent = data.stats.employees || 0;
            cards[3].textContent = data.stats.rating || 'N/A';
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

async function deleteInventory(id) {
    if (confirm('Delete this item?')) {
        await fetch('../api/admin/delete_inventory.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inventory_id: id })
        });
        loadInventory();
    }
}

// ========== PRODUCTS ==========
async function loadProducts() {
    const response = await fetch('../api/admin/get_products.php');
    const data = await response.json();
    if (data.success) {
        document.querySelector('.products-grid').innerHTML = data.products.map(p => `
            <div class="product-card">
                <img src="../${p.image_url}" onerror="this.src='../landing/assets/espresso.jpg'" alt="${p.name}">
                <h4>${p.name}</h4>
                <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
                <div class="product-actions">
                    <button class="btn-edit" onclick='openEditProduct(${JSON.stringify(p)})'>Edit</button>
                    <button class="btn-delete" onclick="deleteProduct(${p.product_id})">Delete</button>
                </div>
            </div>
        `).join('');
    }
}

document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('addProductForm').reset();
    document.getElementById('productModalTitle').textContent = "Add New Product";
    document.getElementById('prodId').value = "";
    openModal('addProductModal');
});

function openEditProduct(product) {
    document.getElementById('productModalTitle').textContent = "Edit Product";
    document.getElementById('prodId').value = product.product_id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodStock').value = product.stock_quantity;
    document.getElementById('prodImage').value = product.image_url;
    document.getElementById('prodDesc').value = product.description;
    openModal('addProductModal');
}

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const url = id ? '../api/admin/edit_product.php' : '../api/admin/add_product.php';

    const formData = {
        product_id: id,
        name: document.getElementById('prodName').value,
        category: document.getElementById('prodCategory').value,
        price: document.getElementById('prodPrice').value,
        stock_quantity: document.getElementById('prodStock').value,
        image_url: document.getElementById('prodImage').value || 'assets/default.jpg',
        description: document.getElementById('prodDesc').value
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
            showNotification(id ? 'Product Updated' : 'Product Added');
            closeModal();
            loadProducts();
        } else showNotification(data.message, 'error');
    } catch (e) { showNotification('Error saving product', 'error'); }
});

async function deleteProduct(id) {
    if (confirm('Delete product?')) {
        await fetch('../api/admin/delete_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: id })
        });
        loadProducts();
    }
}

// ========== EMPLOYEES ==========
async function loadEmployees() {
    const response = await fetch('../api/admin/get_employees.php');
    const data = await response.json();
    if (data.success) {
        document.querySelector('#employees tbody').innerHTML = data.employees.map(e => `
            <tr>
                <td>${e.username}</td>
                <td>${e.email}</td>
                <td>${e.role}</td>
                <td><span class="status active">Active</span></td>
                <td>
                    <button class="btn-edit" onclick='openEditEmployee(${JSON.stringify(e)})'>Edit</button>
                    <button class="btn-delete" onclick="deleteEmployee(${e.user_id})">Remove</button>
                </td>
            </tr>
        `).join('');
    }
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
    const url = id ? '../api/admin/edit_employee.php' : '../api/admin/add_employee.php';

    const formData = {
        user_id: id,
        username: document.getElementById('empName').value,
        email: document.getElementById('empEmail').value,
        phone: document.getElementById('empPhone').value,
        role: document.getElementById('empRole').value,
        password: document.getElementById('empPassword').value
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

async function deleteEmployee(id) {
    if (confirm('Remove employee?')) {
        await fetch('../api/admin/delete_employee.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: id })
        });
        loadEmployees();
    }
}

// ========== ORDERS & CUSTOMERS ==========
async function loadOrders() {
    const response = await fetch('../api/admin/get_orders.php');
    const data = await response.json();
    if (data.success) {
        document.querySelector('#orders tbody').innerHTML = data.orders.map(o => `
            <tr>
                <td>#${o.transaction_id}</td>
                <td>${o.customer}</td>
                <td>${new Date(o.transaction_date).toLocaleDateString()}</td>
                <td>${o.item_count}</td>
                <td>$${parseFloat(o.total_amount).toFixed(2)}</td>
                <td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td>
                <td><button class="btn-view" onclick="viewOrder(${o.transaction_id})">View</button></td>
            </tr>
        `).join('');
    }
}

async function viewOrder(id) {
    const response = await fetch(`../api/admin/get_order_details.php?id=${id}`);
    const data = await response.json();
    if (data.success) {
        document.getElementById('viewOrderId').textContent = `#${data.order.transaction_id}`;
        document.getElementById('viewOrderCustomer').value = data.order.customer;
        document.getElementById('viewOrderDate').value = data.order.date;
        document.getElementById('viewOrderTotal').textContent = data.order.total;
        document.getElementById('viewOrderItems').innerHTML = data.items.map(item => `
            <tr><td>${item.product_name}</td><td>${item.quantity}</td><td>$${item.subtotal}</td></tr>
        `).join('');
        openModal('viewOrderModal');
    }
}

async function loadCustomers() {
    const response = await fetch('../api/admin/get_customers.php');
    const data = await response.json();
    if (data.success) {
        document.querySelector('#customers tbody').innerHTML = data.customers.map(c => `
            <tr>
                <td>${c.username}</td>
                <td>${c.email}</td>
                <td>${c.total_orders}</td>
                <td>$${parseFloat(c.total_spent).toFixed(2)}</td>
                <td><button class="btn-view" onclick="viewCustomer(${c.user_id})">View</button></td>
            </tr>
        `).join('');
    }
}

async function viewCustomer(id) {
    const response = await fetch(`../api/admin/get_customer_details.php?id=${id}`);
    const data = await response.json();
    if (data.success) {
        document.getElementById('viewCustName').value = data.customer.username;
        document.getElementById('viewCustEmail').value = data.customer.email;
        document.getElementById('viewCustOrders').textContent = data.customer.total_orders;
        document.getElementById('viewCustSpent').textContent = `$${parseFloat(data.customer.total_spent).toFixed(2)}`;
        openModal('viewCustomerModal');
    }
}

async function loadStockMovements() {
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
}

async function loadAnalytics() {
    const response = await fetch('../api/admin/get_analytics.php');
    const data = await response.json();
    if (data.success) {
        const v = document.querySelectorAll('.analytics-value');
        v[0].textContent = `$${data.analytics.weekly_revenue}`;
        v[1].textContent = `$${data.analytics.monthly_revenue}`;
        v[2].textContent = data.analytics.best_seller;
    }
}

async function loadSettings() {
    const response = await fetch('../api/admin/get_settings.php');
    const data = await response.json();
    if (data.success) {
        const form = document.querySelector('.settings-form');
        form.querySelector('input[type="text"]').value = data.settings.cafe_name;
        form.querySelector('input[type="email"]').value = data.settings.email;
    }
}