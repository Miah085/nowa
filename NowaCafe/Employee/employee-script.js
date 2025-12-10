let currentTab = 'active';

window.addEventListener('DOMContentLoaded', () => {
    // --- 1. Security Check ---
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail'); 

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
    loadData();              
    loadMenu();              
    loadSchedule(userEmail); 
    renderProfile(userName, userEmail, userRole);

    // --- 4. Timers ---
    setInterval(loadData, 5000); // Data sync (5s)
    setInterval(updateTimers, 1000); // UI Timer (1s)

    setupVerification();
    setupNavigation();
});

// --- NAVIGATION & TABS ---
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            link.classList.add('active');
            const sectionId = link.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });

    const toggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    if(toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
}

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

// --- DATA LOADING ---
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
                updateTimers();
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
                <p class="order-time js-timer" data-ts="${order.timestamp}" data-type="${type}" style="font-weight:bold; color:#6b5442;">Loading...</p>
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

function updateTimers() {
    const timers = document.querySelectorAll('.js-timer');
    const now = Math.floor(Date.now() / 1000); 

    timers.forEach(timer => {
        const timestamp = parseInt(timer.getAttribute('data-ts'));
        const type = timer.getAttribute('data-type');

        if (type === 'pending') {
            const expiryTime = timestamp + (20 * 60); 
            const diff = expiryTime - now;
            if (diff > 0) {
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                timer.textContent = `⏳ ${mins}:${secs < 10 ? '0' : ''}${secs} left`;
                timer.style.color = "#d9534f"; 
            } else {
                timer.textContent = "⚠️ Expired";
                timer.style.color = "red";
            }
        } else {
            const elapsed = now - timestamp;
            const minsAgo = Math.floor(elapsed / 60);
            if(minsAgo < 1) timer.textContent = "🕒 Just now";
            else if(minsAgo < 60) timer.textContent = `🕒 ${minsAgo} mins ago`;
            else timer.textContent = `🕒 ${Math.floor(minsAgo/60)} hrs ago`;
            timer.style.color = "#6b5442";
        }
    });
}

function getButtons(order, type) {
    if (type === 'pending') {
        return `
            <div style="display:flex; flex-direction:column; gap:5px; width:100%;">
                <div style="display:flex; gap:5px;">
                    <button class="btn-accept" style="flex:1;" onclick="updateStatus(${order.id}, 'Processing')">Accept</button>
                    <button class="btn-reject" style="flex:1;" onclick="updateStatus(${order.id}, 'Voided')">Void</button>
                </div>
                <button class="btn-edit-order" onclick='openEditModal(${JSON.stringify(order)})'>✎ Edit Order</button>
            </div>
        `;
    } else {
        return `
            <button class="btn-complete" style="flex: 2;" onclick="updateStatus(${order.id}, 'Completed')">Done</button>
            <button class="btn-reject" style="flex: 1;" onclick="updateStatus(${order.id}, 'Voided')">Cancel</button>
        `;
    }
}

// 2. MENU
function loadMenu() {
    const container = document.querySelector('.menu-grid');
    if(!container) return;

    fetch('../api/get_products.php')
        .then(res => res.json())
        .then(data => {
            if(data.success && data.products.length > 0) {
                container.innerHTML = data.products.map(item => {
                    let filename = item.image_url ? item.image_url.split('/').pop() : '';
                    if(filename === 'cappuccino.jpg') filename = 'capuccino.jpg';
                    
                    const imgPath = filename 
                        ? `../Landingpage/assets/${filename}` 
                        : '../Login/assets/cup.png'; 
                    const fallbackImg = '../Login/assets/cup.png';

                    const stock = parseInt(item.stock_quantity) || 0; 
                    let stockClass = stock > 10 ? 'available' : (stock === 0 ? 'out' : 'low');
                    let stockText = stock > 10 ? 'In Stock' : (stock === 0 ? 'Out of Stock' : 'Low Stock');

                    return `
                    <div class="menu-item">
                        <div class="menu-item-image">
                            <img src="${imgPath}" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="${item.name}">
                            <div class="menu-overlay"><span class="stock-badge ${stockClass}">${stockText}</span></div>
                        </div>
                        <div class="menu-item-info">
                            <h3>${item.name}</h3>
                            <p class="description">Stock: ${stock} units</p>
                            <span class="price">$${parseFloat(item.price).toFixed(2)}</span>
                        </div>
                    </div>
                `}).join('');
            } else {
                container.innerHTML = '<p>No menu items found.</p>';
            }
        });
}

// 3. SCHEDULE
function loadSchedule(email) {
    // FIX: Specifically target the container inside the #schedule section
    const container = document.querySelector('#schedule .schedule-container');
    
    if(!container) return;
    if(!email) { 
        container.innerHTML = '<p style="text-align:center;">No email found. Relogin.</p>'; 
        return; 
    }

    fetch('../api/get_schedule.php', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email: email }) 
    })
    .then(res => res.json())
    .then(data => {
        // Debugging: Check console to see if ID is found
        console.log("Schedule Data:", data);

        let html = `
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Shift</th>
                        <th>Hours</th>
                    </tr>
                </thead>
                <tbody>`;
        
        if (data.success && data.schedule && data.schedule.length > 0) {
            html += data.schedule.map(shift => {
                const start = formatTime(shift.start_time);
                const end = formatTime(shift.end_time);
                const type = parseInt(shift.start_time) < 12 ? "Morning" : "Afternoon";
                return `<tr><td>${shift.day_of_week}</td><td>${type}</td><td>${start} - ${end}</td></tr>`;
            }).join('');
        } else {
            html += `<tr><td colspan="3" style="text-align:center;">No schedule found for this user.</td></tr>`;
        }
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    });
}

// --- FIX 2: ARCHIVE (Added Colors) ---
function loadArchiveOrders() {
    fetch('../api/get_archived_orders.php').then(res => res.json()).then(data => {
        const tbody = document.getElementById('archiveTableBody');
        if(tbody && data.success) {
            if (data.orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">No archived orders found.</td></tr>';
                return;
            }
            tbody.innerHTML = data.orders.map(o => {
                // Color Logic
                let statusClass = 'low';
                if (o.status === 'Completed') statusClass = 'available';
                else if (o.status === 'Voided') statusClass = 'voided';

                return `
                <tr>
                    <td style="font-weight:bold;">#${o.id}</td>
                    <td>${o.customer}</td>
                    <td style="font-weight:bold;">$${o.total}</td>
                    <td>${o.time}</td>
                    <td style="text-align:center;">
                        <span class="stock-status ${statusClass}">${o.status}</span>
                    </td>
                </tr>`;
            }).join('');
        }
    });
}

// 4. PROFILE
function renderProfile(name, email, role) {
    const container = document.querySelector('.profile-container');
    if(!container) return;
    container.innerHTML = `
        <form class="profile-form" onsubmit="handlePasswordUpdate(event)">
            <div class="form-group"><label>Full Name</label><input type="text" value="${name}" readonly style="background:#f0f0f0;"></div>
            <div class="form-group"><label>Email</label><input type="email" value="${email}" id="profileEmail" readonly style="background:#f0f0f0;"></div>
            <div class="form-group"><label>Position</label><input type="text" value="${role.toUpperCase()}" readonly style="background:#f0f0f0;"></div>
            <div class="form-group"><label>Change Password</label><input type="password" id="newPassword" placeholder="Enter new password" required></div>
            <button type="submit" class="btn-primary">Update Password</button>
        </form>
    `;
}

window.handlePasswordUpdate = function(e) {
    e.preventDefault();
    const email = document.getElementById('profileEmail').value;
    const pass = document.getElementById('newPassword').value;
    fetch('../api/update_profile.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, new_password: pass }) })
    .then(res => res.json())
    .then(data => { alert(data.message); if(data.success) document.getElementById('newPassword').value = ''; });
};

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
    fetch('../api/update_order_status.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, status: newStatus }) })
    .then(res => res.json()).then(data => { if(data.success) { loadData(); loadMenu(); } else alert(data.message); });
};

function setupVerification() {
    const btn = document.getElementById('verifyBtn');
    const input = document.getElementById('orderCodeInput');
    const resBox = document.getElementById('verificationResult');
    if(btn) {
        btn.addEventListener('click', () => {
            const code = input.value.trim();
            if(!code) return alert("Enter code");
            fetch('../api/validate_code.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code }) })
            .then(res => res.json())
            .then(data => {
                resBox.style.display = 'block'; resBox.textContent = data.message;
                resBox.style.background = data.success ? '#d1fae5' : '#fee2e2';
                resBox.style.color = data.success ? '#065f46' : '#991b1b';
                if(data.success) { input.value = ''; switchTab('active'); }
            });
        });
    }
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => { if (confirm('Logout?')) { sessionStorage.clear(); window.location.href = '../Login/login.html'; } });

// --- EDIT ORDER MODAL LOGIC ---
let currentEditOrder = null;
let currentEditItems = [];

window.openEditModal = function(order) {
    currentEditOrder = order;
    currentEditItems = JSON.parse(JSON.stringify(order.items)); 
    document.getElementById('editOrderId').textContent = order.id;
    renderEditTable();
    document.getElementById('editOrderModal').style.display = 'flex';
}

window.closeEditModal = function() {
    document.getElementById('editOrderModal').style.display = 'none';
}

function renderEditTable() {
    const tbody = document.getElementById('editItemsBody');
    if(currentEditItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="color:red; text-align:center;">Order empty. Saving will void items.</td></tr>';
        return;
    }
    tbody.innerHTML = currentEditItems.map((item, index) => `
        <tr>
            <td style="text-align:left; font-weight:bold;">${item.name}</td>
            <td>
                <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                    <button class="qty-btn-mini" onclick="updateEditQty(${index}, -1)">-</button>
                    <span style="font-weight:bold; width:20px;">${item.quantity}</span>
                    <button class="qty-btn-mini" onclick="updateEditQty(${index}, 1)">+</button>
                </div>
            </td>
            <td><button class="btn-remove-mini" onclick="removeEditItem(${index})">✕</button></td>
        </tr>
    `).join('');
}

window.updateEditQty = function(index, change) {
    const newQty = parseInt(currentEditItems[index].quantity) + change;
    if (newQty > 0) {
        currentEditItems[index].quantity = newQty;
        renderEditTable();
    }
}

window.removeEditItem = function(index) {
    currentEditItems.splice(index, 1);
    renderEditTable();
}

window.saveOrderChanges = function() {
    if(!currentEditOrder) return;
    const itemsToSend = currentEditItems.map(item => ({ product_id: item.product_id, quantity: item.quantity }));
    fetch('../api/edit_order.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: currentEditOrder.id, items: itemsToSend }) })
    .then(res => res.json())
    .then(data => { if(data.success) { closeEditModal(); loadData(); alert("Updated!"); } else alert(data.message); })
    .catch(err => alert("Error saving"));
}