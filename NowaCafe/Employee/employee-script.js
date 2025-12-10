let currentTab = 'active';

window.addEventListener('DOMContentLoaded', () => {
    // --- 1. Security Check ---
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail'); // Needed for schedule

    if (!isLoggedIn || (userRole !== 'staff' && userRole !== 'employee')) {
        alert('Access denied. Staff privileges required.');
        window.location.href = '../Login/login.html'; 
        return;
    }
    
    // --- 2. Initialize UI ---
    if(userName) {
        if(document.getElementById('userName')) document.getElementById('userName').textContent = userName;
        const avatarEl = document.getElementById('userAvatar');
        if(avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
    }

    // --- 3. Load All Data ---
    loadData();              // Load Orders
    loadMenu();              // Load Menu items (NEW)
    loadSchedule(userEmail); // Load Schedule (NEW)

    // Live sync for orders only
    setInterval(loadData, 5000); 

    setupVerification();
    setupNavigation();
});

// --- NAVIGATION & TABS ---
function setupNavigation() {
    // Sidebar Navigation
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // UI Active State
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            link.classList.add('active');

            // Show Section
            const sectionId = link.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Mobile Menu
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    if(toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
}

// --- ORDER TABS ---
window.switchTab = function(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active'); 

    document.getElementById('viewActive').style.display = 'none';
    document.getElementById('viewPending').style.display = 'none';
    document.getElementById('viewArchive').style.display = 'none';

    if (tabName === 'active') document.getElementById('viewActive').style.display = 'block';
    if (tabName === 'pending') document.getElementById('viewPending').style.display = 'block';
    if (tabName === 'archive') {
        document.getElementById('viewArchive').style.display = 'block';
        loadArchiveOrders();
    }
    if (tabName !== 'archive') loadData(); 
};

// --- DATA LOADING FUNCTIONS ---

// 1. ORDERS
function loadData() {
    fetch('../api/get_active_orders.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if(data.stats) {
                    if(document.getElementById('statPending')) document.getElementById('statPending').textContent = data.stats.pending;
                    if(document.getElementById('statProgress')) document.getElementById('statProgress').textContent = data.stats.processing;
                    if(document.getElementById('statCompleted')) document.getElementById('statCompleted').textContent = data.stats.completed;
                }
                const pendingOrders = data.orders.filter(o => o.status === 'Pending');
                const activeOrders = data.orders.filter(o => o.status === 'Processing');
                renderGrid('activeGrid', activeOrders, 'active');
                renderGrid('pendingGrid', pendingOrders, 'pending');
            }
        });
}

function renderGrid(elementId, orders, type) {
    const grid = document.getElementById(elementId);
    if (!grid) return;
    if (orders.length === 0) {
        grid.innerHTML = `<p class="loading-text">No ${type} orders.</p>`;
        return;
    }
    grid.innerHTML = orders.map(order => `
        <div class="order-card ${type === 'active' ? 'processing' : 'pending'}">
            <div class="order-header">
                <span class="order-id">#${order.id}</span>
                <span class="order-status">${order.status}</span>
            </div>
            <div class="order-details">
                <p class="customer-name">${order.customer}</p>
                <p class="order-time">⏳ ${order.time}</p>
                <p style="font-size:1.1rem; color:#6b5442; font-weight:bold; margin-top:5px; background:#f5f1ed; padding:8px; text-align:center; border-radius:6px; letter-spacing:1px;">${order.token}</p>
            </div>
            <div class="order-items" style="max-height:100px; overflow-y:auto;">
                ${order.items.map(item => `<p>• ${item.quantity}x ${item.name}</p>`).join('')}
            </div>
            <div class="order-total">Total: $${order.total}</div>
            <div class="order-actions" style="display:flex; gap:10px;">
                ${getButtons(order, type)}
            </div>
        </div>
    `).join('');
}

function getButtons(order, type) {
    if (type === 'pending') {
        return `<button class="btn-accept" style="flex:2;" onclick="updateStatus(${order.id}, 'Processing')">Accept</button>
                <button class="btn-reject" style="flex:1;" onclick="updateStatus(${order.id}, 'Voided')">Void</button>`;
    } else {
        return `<button class="btn-complete" style="flex:2;" onclick="updateStatus(${order.id}, 'Completed')">Done</button>
                <button class="btn-reject" style="flex:1;" onclick="updateStatus(${order.id}, 'Voided')">Cancel</button>`;
    }
}

// 2. MENU (NEW FUNCTION)
function loadMenu() {
    const container = document.querySelector('.menu-grid');
    if(!container) return;

    fetch('../api/get_products.php')
        .then(res => res.json())
        .then(data => {
            if(data.success && data.products.length > 0) {
                container.innerHTML = data.products.map(item => {
                    // Logic to set image path
                    let imgPath = item.image_url ? `../Landingpage/assets/${item.image_url}` : '../Landingpage/assets/cup.png';
                    // Determine stock status
                    let stockClass = item.stock_quantity > 10 ? 'available' : 'low';
                    let stockText = item.stock_quantity > 10 ? 'In Stock' : 'Low Stock';
                    
                    return `
                    <div class="menu-card">
                        <img src="${imgPath}" onerror="this.src='../Landingpage/assets/cup.png'" alt="${item.name}">
                        <div class="menu-info">
                            <h3>${item.name}</h3>
                            <p>$${parseFloat(item.price).toFixed(2)}</p>
                            <span class="stock-status ${stockClass}">
                                ${stockText} (${item.stock_quantity})
                            </span>
                        </div>
                    </div>
                `}).join('');
            } else {
                container.innerHTML = '<p>No menu items found or database connection failed.</p>';
            }
        });
}

// 3. SCHEDULE (NEW FUNCTION)
function loadSchedule(email) {
    const container = document.querySelector('.schedule-container');
    if(!container) return;

    fetch('../api/get_schedule.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    })
    .then(res => res.json())
    .then(data => {
        let html = `
            <table class="schedule-table">
                <thead><tr><th>Day</th><th>Shift</th><th>Hours</th></tr></thead>
                <tbody>`;
        
        if (data.success && data.schedule && data.schedule.length > 0) {
            html += data.schedule.map(shift => {
                const start = formatTime(shift.start_time);
                const end = formatTime(shift.end_time);
                const type = parseInt(shift.start_time) < 12 ? "Morning" : "Afternoon";
                return `<tr><td>${shift.day_of_week}</td><td>${type}</td><td>${start} - ${end}</td></tr>`;
            }).join('');
        } else {
            html += `<tr><td colspan="3" style="text-align:center;">No schedule assigned yet.</td></tr>`;
        }
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    });
}

// --- UTILS ---
function formatTime(timeString) {
    if(!timeString) return "-";
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

window.updateStatus = function(orderId, newStatus) {
    if (newStatus === 'Voided' && !confirm(`Confirm Void Order #${orderId}?`)) return;
    fetch('../api/update_order_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
    }).then(res => res.json()).then(data => {
        if(data.success) loadData();
        else alert(data.message);
    });
};

function loadArchiveOrders() {
    fetch('../api/get_archived_orders.php')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('archiveTableBody');
            if(tbody && data.success) {
                tbody.innerHTML = data.orders.map(o => `<tr><td>#${o.id}</td><td>${o.customer}</td><td>$${o.total}</td><td>${o.time}</td><td>${o.status}</td></tr>`).join('');
            }
        });
}

function setupVerification() {
    const btn = document.getElementById('verifyBtn');
    const input = document.getElementById('orderCodeInput');
    const resBox = document.getElementById('verificationResult');

    if(btn) {
        btn.addEventListener('click', () => {
            const code = input.value.trim();
            if(!code) return alert("Enter code");
            fetch('../api/validate_code.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            })
            .then(res => res.json())
            .then(data => {
                resBox.style.display = 'block';
                resBox.textContent = data.message;
                resBox.style.background = data.success ? '#d1fae5' : '#fee2e2';
                resBox.style.color = data.success ? '#065f46' : '#991b1b';
                if(data.success) {
                    input.value = '';
                    switchTab('active'); 
                }
            });
        });
    }
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (confirm('Logout?')) { sessionStorage.clear(); window.location.href = '../Login/login.html'; }
});