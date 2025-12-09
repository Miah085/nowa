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
    
    // FIX: Update Name AND Avatar
    if(userName) {
        if(document.getElementById('userName')) {
            document.getElementById('userName').textContent = userName;
        }
        // Grab the first letter and capitalize it
        const avatarEl = document.getElementById('userAvatar') || document.querySelector('.user-avatar');
        if(avatarEl) {
            avatarEl.textContent = userName.charAt(0).toUpperCase();
        }
    }

    // --- Load Data ---
    loadLiveOrders();
    setInterval(loadLiveOrders, 5000); // Poll every 5s

    setupVerification();
    setupArchive();
});

// --- 1. Load Live Orders ---
function loadLiveOrders() {
    const grid = document.getElementById('liveOrdersGrid');
    if (!grid) return;

    fetch('../api/get_active_orders.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Update Stats
                if(data.stats) {
                    document.getElementById('statPending').textContent = data.stats.pending;
                    document.getElementById('statProgress').textContent = data.stats.processing;
                    document.getElementById('statCompleted').textContent = data.stats.completed;
                }

                // Update Grid
                if (data.orders.length === 0) {
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No active orders.</p>';
                    return;
                }

                grid.innerHTML = data.orders.map(order => `
                    <div class="order-card ${order.status.toLowerCase()}">
                        <div class="order-header">
                            <span class="order-id">#${order.id}</span>
                            <span class="order-status" style="background:${order.status==='Pending'?'#fef3c7':'#dbeafe'}; padding:4px 8px; border-radius:10px;">${order.status}</span>
                        </div>
                        <div class="order-details">
                            <p class="customer-name">${order.customer}</p>
                            <p class="order-time">${order.time}</p>
                            <p style="font-size:1.1rem; color:#6b5442; font-weight:bold; margin-top:5px; background:#eee; padding:5px; text-align:center; border-radius:4px;">${order.token}</p>
                        </div>
                        <div class="order-items" style="max-height:100px; overflow-y:auto; margin-bottom:10px; border-top:1px dashed #eee; padding-top:5px;">
                            ${order.items.map(item => `<p style="margin:2px 0;">• ${item.quantity}x ${item.name}</p>`).join('')}
                        </div>
                        <div class="order-total" style="font-weight:bold; margin-bottom:10px;">Total: $${order.total}</div>
                        <div class="order-actions" style="display:flex; gap:5px;">
                            ${getButtons(order)}
                        </div>
                    </div>
                `).join('');
            }
        })
        .catch(err => console.error("Sync Error:", err));
}

function getButtons(order) {
    if (order.status === 'Pending') {
        return `
            <button class="btn-accept" style="flex:1; background:#10b981; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;" onclick="updateStatus(${order.id}, 'Processing')">Accept</button>
            <button class="btn-reject" style="flex:1; background:#ef4444; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;" onclick="updateStatus(${order.id}, 'Archived')">Archive</button>
        `;
    } else if (order.status === 'Processing') {
        return `
            <button class="btn-complete" style="width:100%; background:#3b82f6; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;" onclick="updateStatus(${order.id}, 'Completed')">Mark Ready</button>
        `;
    }
    return '';
}

// --- 2. Update Status ---
window.updateStatus = function(orderId, newStatus) {
    const action = newStatus === 'Archived' ? 'Archive' : 'Update';
    if (!confirm(`${action} Order #${orderId}?`)) return;

    fetch('../api/update_order_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadLiveOrders();
        } else {
            alert("Error: " + data.message);
        }
    });
};

// --- 3. Verify Logic ---
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
                    loadLiveOrders();
                }
            });
        });
    }
}

// --- 4. Archive Modal Logic ---
function setupArchive() {
    const modal = document.getElementById('archiveModal');
    const btn = document.getElementById('viewArchiveBtn');
    const close = document.getElementById('closeArchive');
    const list = document.getElementById('archiveList');

    if(btn) {
        btn.addEventListener('click', () => {
            modal.style.display = 'flex'; // Use Flex to center
            list.innerHTML = '<p>Loading...</p>';
            
            fetch('../api/get_archived_orders.php')
                .then(res => res.json())
                .then(data => {
                    if(data.success && data.orders.length > 0) {
                        list.innerHTML = data.orders.map(o => `
                            <div style="border-bottom:1px solid #ccc; padding:10px;">
                                <strong>#${o.transaction_id}</strong> - ${o.username} ($${o.total_amount})<br>
                                <small>${o.transaction_date}</small> - <span style="color:red;">${o.status}</span>
                            </div>
                        `).join('');
                    } else {
                        list.innerHTML = '<p style="padding:10px;">No archived orders.</p>';
                    }
                });
        });
    }

    if(close) {
        close.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
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