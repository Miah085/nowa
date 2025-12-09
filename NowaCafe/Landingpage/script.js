let cart = [];
let myOrdersData = [];

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadCart();
    setupStaticMenuListeners();
    setupEventListeners();
    updateCartUI();
});

// --- 1. Event Listeners (Buttons & Modals) ---
function setupEventListeners() {
    // Order Now Button (Header)
    const orderNowBtn = document.getElementById('orderNowBtn');
    if (orderNowBtn) {
        orderNowBtn.addEventListener('click', scrollToMenu);
    }

    // My Orders Button
    const myOrdersBtn = document.getElementById('myOrdersBtn');
    const ordersModal = document.getElementById('ordersModal');
    if (myOrdersBtn && ordersModal) {
        myOrdersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ordersModal.classList.add('active');
            loadMyOrders();
        });
    }

    // Profile & Logout
    const profileTrigger = document.getElementById('profileTrigger');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileTrigger) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        document.addEventListener('click', () => profileDropdown.classList.remove('active'));
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Log out?')) {
                sessionStorage.clear();
                window.location.reload();
            }
        });
    }

    // Modal Closing Logic
    const closeActions = () => {
        document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    };

    document.getElementById('cartBtn').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.add('active');
        document.getElementById('cartOverlay').classList.add('active');
    });

    document.getElementById('closeCart').addEventListener('click', closeActions);
    document.getElementById('cartOverlay').addEventListener('click', closeActions);
    document.getElementById('closeOrders').addEventListener('click', closeActions);
    document.getElementById('closeCheckout').addEventListener('click', closeActions);
    document.getElementById('closeConfirmation').addEventListener('click', closeActions);

    // Back Button (History View)
    document.getElementById('backToOrdersBtn').addEventListener('click', () => {
        document.getElementById('confirmationModal').classList.remove('active');
        document.getElementById('ordersModal').classList.add('active');
    });

    // Checkout Button
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (sessionStorage.getItem('isLoggedIn') !== 'true') return alert('Please login.');
        if (cart.length === 0) return alert('Cart empty.');
        
        document.getElementById('checkoutItems').innerHTML = cart.map(i => 
            `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>${i.name} x${i.quantity}</span><span>$${(i.price*i.quantity).toFixed(2)}</span></div>`
        ).join('');
        document.getElementById('checkoutTotal').textContent = `$${cart.reduce((s,i)=>s+(i.price*i.quantity),0).toFixed(2)}`;
        
        closeActions();
        document.getElementById('checkoutModal').classList.add('active');
    });

    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
}

// --- 2. Global Scroll Functions (FIXED: Moved here so HTML can see them) ---
function scrollToMenu() {
    const section = document.getElementById('menu');
    if(section) section.scrollIntoView({ behavior: 'smooth' });
}

function scrollToContact() {
    const section = document.getElementById('contact');
    if(section) section.scrollIntoView({ behavior: 'smooth' });
}

// Expose to window (Just in case)
window.scrollToMenu = scrollToMenu;
window.scrollToContact = scrollToContact;


// --- 3. Fetch My Orders ---
function loadMyOrders() {
    const email = sessionStorage.getItem('userEmail');
    const list = document.getElementById('ordersList');
    
    if (!email) return;
    
    list.innerHTML = '<p style="text-align:center">Loading...</p>';

    fetch('../api/get_user_orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.orders.length > 0) {
            myOrdersData = data.orders;
            
            list.innerHTML = data.orders.map((order, index) => `
                <div onclick="viewReceipt(${index})" style="cursor:pointer; border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:8px; background:#f9f9f9; transition: background 0.2s;">
                    <div style="display:flex; justify-content:space-between; font-weight:bold;">
                        <span>Order #${order.id}</span>
                        <span style="color:#6b5442;">${order.token}</span>
                    </div>
                    <div style="font-size:0.9rem; color:#666; margin:5px 0;">
                        ${order.date} • ${order.items.length} Items
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px; padding-top:5px; border-top:1px dashed #ccc;">
                        <span style="text-transform:uppercase; font-size:0.8rem; padding:2px 6px; background:${order.status==='Pending'?'#fff3cd':'#d4edda'}; border-radius:4px;">${order.status}</span>
                        <strong>$${order.total}</strong>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p class="no-orders">No past orders.</p>';
        }
    })
    .catch(() => list.innerHTML = '<p class="no-orders">Error loading orders.</p>');
}

// --- 4. View Receipt (History) ---
window.viewReceipt = function(index) {
    const order = myOrdersData[index];
    const modal = document.getElementById('confirmationModal');
    const gotItBtn = document.getElementById('closeConfirmation'); 
    const backBtn = document.getElementById('backToOrdersBtn');
    
    gotItBtn.style.display = 'none'; 
    backBtn.style.display = 'block'; 

    document.getElementById('orderCode').textContent = order.token;
    document.getElementById('orderSummary').innerHTML = order.items.map(item => 
        `<div>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</div>`
    ).join('');
    
    document.getElementById('ordersModal').classList.remove('active');
    modal.classList.add('active');
};

// --- 5. Place Order (New) ---
let orderInterval; // Global variable for timer

function placeOrder() {
    const email = sessionStorage.getItem('userEmail');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    fetch('../api/place_order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, items: cart, total: total.toFixed(2) })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const modal = document.getElementById('confirmationModal');
            const gotItBtn = document.getElementById('closeConfirmation');
            const backBtn = document.getElementById('backToOrdersBtn');
            
            gotItBtn.style.display = 'block'; 
            backBtn.style.display = 'none';   

            document.getElementById('orderCode').textContent = data.order_token;
            
            // --- START TIMER ---
            startCountdown(data.expiry_time);

            document.getElementById('orderSummary').innerHTML = cart.map(item => 
                `<div>${item.name} x${item.quantity} - $${(item.price*item.quantity).toFixed(2)}</div>`
            ).join('');
            
            cart = [];
            localStorage.removeItem('cart');
            updateCartUI();
            
            document.getElementById('checkoutModal').classList.remove('active');
            modal.classList.add('active');
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(() => alert("Connection Error"));
}

// --- TIMER HELPER FUNCTION ---
function startCountdown(expiryString) {
    const timerDisplay = document.getElementById('orderTimer');
    if (!timerDisplay) return;
    
    // Clear any existing timer
    if (orderInterval) clearInterval(orderInterval);

    // Convert SQL date string to JS Date
    // Replace ' ' with 'T' for Safari/iOS compatibility
    const expiryDate = new Date(expiryString.replace(' ', 'T'));

    function update() {
        const now = new Date();
        const diff = expiryDate - now;

        if (diff <= 0) {
            timerDisplay.textContent = "Code Expired!";
            timerDisplay.style.color = "red";
            clearInterval(orderInterval);
            return;
        }

        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        timerDisplay.textContent = `Code Expires in: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        timerDisplay.style.color = "#d9534f"; // Reddish
    }

    update(); // Run once immediately
    orderInterval = setInterval(update, 1000); // Update every second
}

// --- 6. Static Listeners & Cart ---
function setupStaticMenuListeners() {
    document.querySelectorAll('.menu-item button').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.menu-item');
            addToCart(card.getAttribute('data-id'), card.getAttribute('data-name'), card.getAttribute('data-price'));
        });
    });
}

function addToCart(id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) existing.quantity++;
    else cart.push({ id: id, name: name, price: parseFloat(price), quantity: 1 });
    saveCart();
    updateCartUI();
    showNotification("Added!");
}

function updateCartUI() {
    const count = document.getElementById('cartCount');
    const items = document.getElementById('cartItems');
    const totalDiv = document.getElementById('cartTotal');
    const total = cart.reduce((s,i)=>s+(i.price*i.quantity),0);
    
    if(count) {
        count.textContent = cart.reduce((s,i)=>s+i.quantity,0);
        count.style.display = cart.length > 0 ? 'block' : 'none';
    }
    
    if(cart.length===0) items.innerHTML = '<p class="empty-cart">Empty</p>';
    else items.innerHTML = cart.map(i => 
        `<div class="cart-item">
            <div><h4>${i.name}</h4><p>$${i.price}</p></div>
            <div>
                <button onclick="changeQty('${i.id}',-1)">-</button>
                <span>${i.quantity}</span>
                <button onclick="changeQty('${i.id}',1)">+</button>
            </div>
         </div>`
    ).join('');
    
    if(totalDiv) totalDiv.textContent = `$${total.toFixed(2)}`;
}

window.changeQty = function(id, d) {
    const item = cart.find(i => i.id === id);
    if(item) {
        item.quantity += d;
        if(item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
    }
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function loadCart() { try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch(e){ cart=[]; } }
function checkLoginStatus() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const userName = sessionStorage.getItem('userName');
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('userProfile').style.display = 'flex';
        document.getElementById('profileName').textContent = userName;
        if (userName) document.getElementById('profileAvatar').textContent = userName.charAt(0).toUpperCase();
    }
}
function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'notification success show';
    n.innerHTML = `✓ ${msg}`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
}