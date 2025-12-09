let currentTab = 'active';

window.addEventListener('DOMContentLoaded', () => {
    // --- Login Check ---
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');

    if (!isLoggedIn || (userRole !== 'staff' && userRole !== 'employee')) {
        alert('Access denied. Staff privileges required.');
        window.location.href = '../Login/login.html'; 
        return;
    }
    
    if(userName) {
        if(document.getElementById('userName')) document.getElementById('userName').textContent = userName;
        const avatarEl = document.getElementById('userAvatar');
        if(avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
    }

    // --- Init ---
    loadData();
    setInterval(loadData, 5000); // Live sync
    setupVerification();
});

// --- Tab Switching ---
window.switchTab = function(tabName) {
    currentTab = tabName;
    
    // UI Updates
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    // Find the button that was clicked (if event exists) or manually highlight based on logic
    if(event && event.target) event.target.classList.add('active'); 

    // Show/Hide Containers
    const viewActive = document.getElementById('viewActive');
    const viewPending = document.getElementById('viewPending');

    if (viewActive && viewPending) {
        viewActive.style.display = tabName === 'active' ? 'block' : 'none';
        viewPending.style.display = tabName === 'pending' ? 'block' : 'none';
    }

    loadData(); // Refresh current view
};

// --- Load Active & Pending ---
function loadData() {
    fetch('../api/get_active_orders.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Update Stats
                if(data.stats) {
                    const statPending = document.getElementById('statPending');
                    const statProgress = document.getElementById('statProgress');
                    const statCompleted = document.getElementById('statCompleted');
                    
                    if(statPending) statPending.textContent = data.stats.pending;
                    if(statProgress) statProgress.textContent = data.stats.processing;
                    if(statCompleted) statCompleted.textContent = data.stats.completed;
                }

                // Filter Arrays
                const pendingOrders = data.orders.filter(o => o.status === 'Pending');
                const activeOrders = data.orders.filter(o => o.status === 'Processing');

                // Render Active (Processing)
                renderGrid('activeGrid', activeOrders, 'active');

                // Render Pending
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

    grid.innerHTML = orders.map(order => {
        // Check if expired for styling
        const isExpired = order.time.includes("EXPIRED");
        const timeColor = isExpired ? 'red' : '#6b5442';

        return `
        <div class="order-card ${type === 'active' ? 'processing' : 'pending'}">
            <div class="order-header">
                <span class="order-id">#${order.id}</span>
                <span class="order-status" style="background:${type==='pending'?'#fef3c7':'#dbeafe'}; color:${type==='pending'?'#92400e':'#1e40af'}; padding:4px 8px; border-radius:10px;">${order.status}</span>
            </div>
            <div class="order-details">
                <p class="customer-name">${order.customer}</p>
                
                <p class="order-time" style="font-weight:bold; color:${timeColor}; margin: 5px 0;">
                    ⏳ ${order.time}
                </p>

                <p style="font-size:1.1rem; color:#6b5442; font-weight:bold; margin-top:5px; background:#f5f1ed; padding:8px; text-align:center; border-radius:6px; letter-spacing:1px;">${order.token}</p>
            </div>
            <div class="order-items" style="max-height:100px; overflow-y:auto; margin-bottom:10px; border-top:1px dashed #eee; padding-top:5px;">
                ${order.items.map(item => `<p style="margin:2px 0;">• ${item.quantity}x ${item.name}</p>`).join('')}
            </div>
            <div class="order-total" style="font-weight:bold; margin-bottom:10px;">Total: $${order.total}</div>
            
            <div class="order-actions" style="display:flex; gap:10px;">
                ${getButtons(order, type)}
            </div>
        </div>
    `}).join('');
}

function getButtons(order, type) {
    if (type === 'pending') {
        // Pending: Accept (Wide) + Void (Small)
        return `
            <button class="btn-accept" style="flex: 2; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer;" onclick="updateStatus(${order.id}, 'Processing')">Accept</button>
            <button class="btn-reject" style="flex: 1; background:#ef4444; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer;" onclick="updateStatus(${order.id}, 'Voided')">Void</button>
        `;
    } else {
        // Active/Processing: Done (Wide) + Cancel (Small)
        return `
            <button class="btn-complete" style="flex: 2; background:#3b82f6; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;" onclick="updateStatus(${order.id}, 'Completed')">Done</button>
            <button class="btn-reject" style="flex: 1; background:#ef4444; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer;" onclick="updateStatus(${order.id}, 'Voided')">Cancel</button>
        `;
    }
}

// --- Status Updates ---
window.updateStatus = function(orderId, newStatus) {
    // Only confirm for destructive actions (Void/Cancel)
    if (newStatus === 'Voided' && !confirm(`Are you sure you want to Cancel/Void Order #${orderId}?`)) return;

    fetch('../api/update_order_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadData(); // Refresh immediately
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(() => alert("Connection failed"));
};

// --- Verification ---
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
                    // If verified, it likely moved to Active, so switch view
                    switchTab('active'); 
                    
                    // Manually update tab styling if needed
                    const tabs = document.querySelectorAll('.tab-btn');
                    if(tabs.length > 0) {
                        tabs.forEach(t => t.classList.remove('active'));
                        tabs[0].classList.add('active'); // Assume Active is first
                    }
                }
            });
        });
    }
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Logout?')) {
            sessionStorage.clear();
            window.location.href = '../Login/login.html';
        }
    });
}