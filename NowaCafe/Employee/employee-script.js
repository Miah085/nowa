window.addEventListener('DOMContentLoaded', () => {
    // --- Login Check (Keep this part) ---
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');

    if (!isLoggedIn || (userRole !== 'staff' && userRole !== 'employee')) {
        alert('Access denied. Staff privileges required.');
        window.location.href = '../Login/login.html'; 
        return;
    }
    if(document.getElementById('userName')) {
        document.getElementById('userName').textContent = userName;
    }

    // --- NEW: Load Real Data ---
    loadLiveOrders();
    
    // Auto-Refresh every 10 seconds to catch new orders
    setInterval(loadLiveOrders, 10000); 
    
    // Setup manual refresh button (optional) or verification logic
    setupVerification();
});

// --- 1. Load Live Orders ---
function loadLiveOrders() {
    const grid = document.getElementById('liveOrdersGrid');
    if (!grid) return;

    fetch('../api/get_active_orders.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.orders.length === 0) {
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No active orders right now.</p>';
                    return;
                }

                grid.innerHTML = data.orders.map(order => `
                    <div class="order-card ${order.status.toLowerCase()}">
                        <div class="order-header">
                            <span class="order-id">#${order.id}</span>
                            <span class="order-status">${order.status}</span>
                        </div>
                        <div class="order-details">
                            <p class="customer-name">${order.customer}</p>
                            <p class="order-time">${order.time}</p>
                            <p style="font-size:0.9rem; color:#6b5442; font-weight:bold;">Code: ${order.token}</p>
                        </div>
                        <div class="order-items">
                            ${order.items.map(item => `<p>• ${item.quantity}x ${item.name}</p>`).join('')}
                        </div>
                        <div class="order-total">Total: $${order.total}</div>
                        <div class="order-actions">
                            ${getButtons(order)}
                        </div>
                    </div>
                `).join('');
                
                // Update Stats
                updateStats(data.orders);
            }
        })
        .catch(err => console.error("Error loading orders:", err));
}

// Helper: Determine which buttons to show based on status
function getButtons(order) {
    if (order.status === 'Pending') {
        return `
            <button class="btn-accept" onclick="updateStatus(${order.id}, 'Processing')">Accept</button>
            <button class="btn-reject" onclick="updateStatus(${order.id}, 'Rejected')">Reject</button>
        `;
    } else if (order.status === 'Processing') {
        return `
            <button class="btn-complete" onclick="updateStatus(${order.id}, 'Completed')">Mark Ready / Complete</button>
        `;
    }
    return '';
}

// --- 2. Update Status (Backend) ---
window.updateStatus = function(orderId, newStatus) {
    if (!confirm(`Mark Order #${orderId} as ${newStatus}?`)) return;

    fetch('../api/update_order_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Reload immediately to show change
            loadLiveOrders();
            // showNotification(`Order #${orderId} updated!`);
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(err => alert("Connection Failed"));
};

// --- 3. Verification Logic (Keep your existing one) ---
function setupVerification() {
    const verifyBtn = document.getElementById('verifyBtn');
    const codeInput = document.getElementById('orderCodeInput');
    const resultBox = document.getElementById('verificationResult');

    if (verifyBtn && codeInput) {
        verifyBtn.addEventListener('click', () => {
            const code = codeInput.value.trim();
            if (!code) return alert("Enter a code");

            fetch('../api/validate_code.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    codeInput.value = '';
                    loadLiveOrders(); // Refresh list to remove the completed order
                } else {
                    alert(data.message);
                }
            });
        });
    }
}

// --- 4. Simple Stats Update ---
function updateStats(orders) {
    const pending = orders.filter(o => o.status === 'Pending').length;
    const processing = orders.filter(o => o.status === 'Processing').length;
    
    // Find the statistic boxes by text content (or add IDs to HTML for better precision)
    const boxes = document.querySelectorAll('.stat-box');
    if (boxes.length >= 2) {
        boxes[0].querySelector('.stat-number').textContent = pending;
        boxes[1].querySelector('.stat-number').textContent = processing;
    }
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        if (confirm('Logout?')) {
            sessionStorage.clear();
            window.location.href = '../Login/login.html';
        }
    });
}