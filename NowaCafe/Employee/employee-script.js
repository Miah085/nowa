let currentTab = 'active';

window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');

    if (!isLoggedIn || (userRole !== 'staff' && userRole !== 'employee')) {
        alert('Access denied. Staff privileges required.');
        window.location.href = '../Login/login.html';
        return;
    }

    if (userName) {
        if (document.getElementById('userName')) document.getElementById('userName').textContent = userName;
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
    }

    // Load Data
    loadData();
    loadMenu();
    loadSchedule(userEmail); // Pass email to function
    renderProfile(userName, userEmail, userRole);

    // Timers
    setInterval(loadData, 5000);
    setInterval(updateTimers, 1000);

    setupVerification();
    setupNavigation();
    setupLogout();
});

// --- NAVIGATION ---
function setupNavigation() {
    const pageTitle = document.getElementById('pageTitle');
    const titles = { 'orders': 'Order Management', 'menu': 'Menu', 'schedule': 'Schedule', 'profile': 'Profile' };

    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            link.classList.add('active');
            const sectionId = link.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            if (pageTitle && titles[sectionId]) pageTitle.textContent = titles[sectionId];
        });
    });

    const toggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
}

// --- FIXED SCHEDULE FUNCTION ---
function loadSchedule(email) {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;

    if (!email) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Email not found in session.</td></tr>';
        return;
    }

    // Send email via POST
    fetch('../api/get_schedule.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.schedule && data.schedule.length > 0) {
                    tbody.innerHTML = data.schedule.map(shift => {
                        const start = formatTime(shift.start_time);
                        const end = formatTime(shift.end_time);

                        return `
                        <tr>
                            <td style="font-weight:bold;">${shift.day_of_week}</td>
                            <td>${start}</td>
                            <td>${end}</td>
                            <td style="text-align:center;">
                                <span style="background:#d1fae5; color:#065f46; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">Scheduled</span>
                            </td>
                        </tr>`;
                    }).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#888;">No shifts assigned yet.</td></tr>';
                }
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">${data.message}</td></tr>`;
            }
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Connection Error. Check console.</td></tr>';
        });
}

function formatTime(timeString) {
    if (!timeString) return "-";
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

// --- MODALS, ORDERS, PROFILE ---
window.showCustomAlert = function (title, message) {
    const modal = document.getElementById('alertModal');
    const titleEl = document.getElementById('alertTitle');
    const msgEl = document.getElementById('alertMessage');
    if (modal && titleEl && msgEl) {
        titleEl.textContent = title;
        msgEl.textContent = message;
        modal.classList.add('active');
    } else { alert(`${title}: ${message}`); }
}

window.closeAlertModal = function () {
    const modal = document.getElementById('alertModal');
    if (modal) modal.classList.remove('active');
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('active');
        });
    }
}

window.closeLogoutModal = function () {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.classList.remove('active');
}

window.confirmLogout = function () {
    sessionStorage.clear();
    window.location.href = '../Login/login.html';
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
});

window.switchTab = function (tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

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

function loadData() {
    if (currentTab === 'archive') return;
    fetch('../api/get_active_orders.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.stats) {
                    if (document.getElementById('statPending')) document.getElementById('statPending').textContent = data.stats.pending;
                    if (document.getElementById('statProgress')) document.getElementById('statProgress').textContent = data.stats.processing;
                    if (document.getElementById('statCompleted')) document.getElementById('statCompleted').textContent = data.stats.completed;
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
            <div class="order-total">Total: ₱${parseFloat(order.total).toFixed(2)}</div>
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
            if (minsAgo < 1) timer.textContent = "🕒 Just now";
            else if (minsAgo < 60) timer.textContent = `🕒 ${minsAgo} mins ago`;
            else timer.textContent = `🕒 ${Math.floor(minsAgo / 60)} hrs ago`;
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

function loadMenu() {
    const container = document.querySelector('.menu-grid');
    if (!container) return;

    container.innerHTML = '<p class="loading-text">Loading menu...</p>';

    fetch('../api/admin/get_products.php')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.products) {
                if (data.products.length === 0) {
                    container.innerHTML = '<p class="loading-text">No items found.</p>';
                    return;
                }

                container.innerHTML = data.products.map(item => {
                    // --- IMAGE PATH FIX ---
                    // 1. Get path from DB (e.g., "assets/products/my_image.jpg")
                    let dbPath = item.image_url;
                    let displayPath;

                    // 2. Default Fallback
                    const fallbackImg = '../Login/assets/cup.png';

                    // 3. Construct the correct path relative to the Employee folder
                    if (!dbPath) {
                        displayPath = fallbackImg;
                    } else if (dbPath.startsWith('http')) {
                        displayPath = dbPath; // It's an online link
                    } else {
                        // The DB says "assets/...", so we just add "../" to step out of the "Employee" folder
                        // Result: "../assets/products/my_image.jpg"
                        displayPath = `../${dbPath}`;
                    }
                    // ----------------------

                    // Availability Logic
                    const isActive = item.is_active == 1;
                    const statusClass = isActive ? '' : 'unavailable-item';
                    const btnText = isActive ? 'Mark Out of Stock' : 'Set as Available';
                    const btnClass = isActive ? 'btn-mark-out' : 'btn-mark-in';
                    const newStatus = isActive ? 0 : 1;

                    return `
                    <div class="menu-card ${statusClass}">
                        <div class="menu-img-container">
                            <img src="${displayPath}" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="${item.name}">
                            ${!isActive ? '<div class="overlay-unavailable">UNAVAILABLE</div>' : ''}
                        </div>
                        <div class="menu-info">
                            <div class="menu-header">
                                <h3>${item.name}</h3>
                                <span class="price">₱${parseFloat(item.price).toFixed(2)}</span>
                            </div>
                            <p class="category">${item.category}</p>
                            <p class="stock-info">Stock: <strong>${item.stock_quantity}</strong></p>
                            
                            <div class="menu-actions">
                                <button class="${btnClass}" onclick="toggleProductAvailability(${item.product_id}, ${newStatus})">
                                    ${btnText}
                                </button>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            } else {
                container.innerHTML = `<p class="loading-text" style="color:red">Error: ${data.message}</p>`;
            }
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = '<p class="loading-text" style="color:red">Connection Failed. Check console.</p>';
        });
}

// --- UPDATED TOGGLE FUNCTION (Pointing to api/admin) ---
window.toggleProductAvailability = function (id, newStatus) {
    // UPDATED PATH: ../api/admin/update_product_status.php
    fetch('../api/admin/update_product_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, is_active: newStatus })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadMenu(); // Refresh menu
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(err => alert("Connection failed."));
};

// --- NEW FUNCTION: TOGGLE AVAILABILITY ---
window.toggleProductAvailability = function (id, newStatus) {
    // Optimistic UI update (optional, but good for UX)
    // For now, we'll just reload the menu after success

    fetch('../api/admin/update_product_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, is_active: newStatus })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadMenu(); // Reload the grid to show changes
            } else {
                alert("Error updating status: " + data.message);
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Connection failed.");
        });
};

function loadArchiveOrders() {
    fetch('../api/get_archived_orders.php').then(res => res.json()).then(data => {
        const tbody = document.getElementById('archiveTableBody');
        if (tbody && data.success) {
            if (data.orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">No archived orders found.</td></tr>';
                return;
            }
            tbody.innerHTML = data.orders.map(o => {
                let statusClass = 'low';
                if (o.status === 'Completed') statusClass = 'available';
                else if (o.status === 'Voided') statusClass = 'voided';
                return `
                <tr>
                    <td style="font-weight:bold;">#${o.id}</td>
                    <td>${o.customer}</td>
                    <td style="font-weight:bold;">₱${o.total}</td>
                    <td>${o.time}</td>
                    <td style="text-align:center;"><span class="stock-status ${statusClass}">${o.status}</span></td>
                </tr>`;
            }).join('');
        }
    });
}

function renderProfile(name, email, role) {
    const container = document.querySelector('.profile-container');
    if (!container) return;
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

window.handlePasswordUpdate = function (e) {
    e.preventDefault();
    const email = document.getElementById('profileEmail').value;
    const pass = document.getElementById('newPassword').value;
    if (!pass) { showCustomAlert("Error", "Password cannot be empty."); return; }
    fetch('../api/update_profile.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, new_password: pass }) })
        .then(res => res.json())
        .then(data => {
            showCustomAlert(data.success ? "Success" : "Error", data.message);
            if (data.success) document.getElementById('newPassword').value = '';
        });
};

window.updateStatus = function (orderId, newStatus) {
    if (newStatus === 'Voided' && !confirm(`Confirm Void Order #${orderId}?`)) return;
    fetch('../api/update_order_status.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, status: newStatus }) })
        .then(res => res.json())
        .then(data => {
            if (data.success) { loadData(); loadMenu(); }
            else { showCustomAlert("Error", data.message); }
        });
};

function setupVerification() {
    const btn = document.getElementById('verifyBtn');
    const input = document.getElementById('orderCodeInput');
    const resBox = document.getElementById('verificationResult');
    if (btn) {
        btn.addEventListener('click', () => {
            const code = input.value.trim();
            if (!code) { showCustomAlert("Input Required", "Please enter a valid order code."); return; }
            fetch('../api/validate_code.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code }) })
                .then(res => res.json())
                .then(data => {
                    if (!data.success) { showCustomAlert("Verification Failed", data.message); if (resBox) resBox.style.display = 'none'; }
                    else {
                        if (resBox) { resBox.style.display = 'block'; resBox.textContent = data.message; resBox.style.background = '#d1fae5'; resBox.style.color = '#065f46'; }
                        input.value = '';
                        setTimeout(() => switchTab('active'), 1000);
                        loadData();
                    }
                })
                .catch(err => { showCustomAlert("Error", "Server connection failed."); });
        });
    }
}

let currentEditOrder = null;
let currentEditItems = [];

window.openEditModal = function (order) {
    currentEditOrder = order;
    currentEditItems = JSON.parse(JSON.stringify(order.items));
    document.getElementById('editOrderId').textContent = order.id;
    renderEditTable();
    document.getElementById('editOrderModal').classList.add('active');
}

window.closeEditModal = function () {
    document.getElementById('editOrderModal').classList.remove('active');
}

function renderEditTable() {
    const tbody = document.getElementById('editItemsBody');
    if (currentEditItems.length === 0) {
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

window.updateEditQty = function (index, change) {
    const newQty = parseInt(currentEditItems[index].quantity) + change;
    if (newQty > 0) {
        currentEditItems[index].quantity = newQty;
        renderEditTable();
    }
}

window.removeEditItem = function (index) {
    currentEditItems.splice(index, 1);
    renderEditTable();
}

window.saveOrderChanges = function () {
    if (!currentEditOrder) return;
    const itemsToSend = currentEditItems.map(item => ({ product_id: item.product_id, quantity: item.quantity }));
    fetch('../api/edit_order.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: currentEditOrder.id, items: itemsToSend }) })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeEditModal();
                loadData();
                showCustomAlert("Success", "Order updated successfully!");
            } else {
                showCustomAlert("Update Failed", data.message);
            }
        })
        .catch(err => showCustomAlert("Error", "Failed to save changes."));
}