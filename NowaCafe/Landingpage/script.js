let cart = [];
let myOrdersData = [];
let orderInterval; 

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadCart(); 
    loadMenu(); // <--- NEW: Loads dynamic menu
    setupEventListeners();
    updateCartUI();
});

// --- 1. Load Dynamic Menu ---
function loadMenu() {
    const grid = document.getElementById('menuGrid');
    if(!grid) return;

    // Show loading state
    grid.innerHTML = '<p style="text-align:center; width:100%;">Loading menu...</p>';

    fetch('../api/get_products.php')
        .then(res => res.json())
        .then(data => {
            if(data.success && data.products.length > 0) {
                grid.innerHTML = data.products.map(item => {
                    const stock = parseInt(item.stock_quantity) || 0;
                    const isOutOfStock = stock <= 0;
                    
                    // Image Path Fix
                    let filename = item.image_url ? item.image_url.split('/').pop() : '';
                    if(filename === 'cappuccino.jpg') filename = 'capuccino.jpg'; // Handle typo if needed
                    const imgPath = filename ? `assets/${filename}` : 'assets/cup.png';

                    // Button Logic
                    const btnClass = isOutOfStock ? 'add-to-cart btn-disabled' : 'add-to-cart';
                    const btnText = isOutOfStock ? 'Sold Out' : 'Add to Cart';
                    const cardClass = isOutOfStock ? 'menu-item unavailable' : 'menu-item';
                    const clickAction = isOutOfStock ? '' : `onclick="addToCart('${item.product_id}', '${item.name}', '${item.price}', '${imgPath}')"`;

                    return `
                    <div class="${cardClass}" data-category="${item.category}" data-id="${item.product_id}">
                        <div class="menu-item-image">
                            <img src="${imgPath}" onerror="this.src='assets/cup.png'" alt="${item.name}">
                            <div class="menu-overlay">
                                <button class="${btnClass}" ${clickAction}>${btnText}</button>
                            </div>
                        </div>
                        <div class="menu-item-info">
                            <h3>${item.name}</h3>
                            <p>${item.description || 'Delicious coffee'}</p>
                            <span class="price">$${parseFloat(item.price).toFixed(2)}</span>
                        </div>
                    </div>
                    `;
                }).join('');

                setupCategoryFiltering();
            } else {
                grid.innerHTML = '<p>No items available right now.</p>';
            }
        })
        .catch(err => {
            console.error(err);
            grid.innerHTML = '<p>Error loading menu.</p>';
        });
}

// --- 2. Category Filtering ---
function setupCategoryFiltering() {
    const buttons = document.querySelectorAll('.category-btn');
    const items = document.querySelectorAll('.menu-item');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Active class
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');

            items.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// --- 3. Cart Logic ---
function addToCart(id, name, price, image) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id: id, name: name, price: parseFloat(price), quantity: 1, image: image });
    }
    saveCart();
    updateCartUI();
    showNotification("Added to cart!");
}

// --- 4. Event Listeners & UI ---
function setupEventListeners() {
    const orderNowBtn = document.getElementById('orderNowBtn');
    if (orderNowBtn) orderNowBtn.addEventListener('click', scrollToMenu);

    const myOrdersBtn = document.getElementById('myOrdersBtn');
    const ordersModal = document.getElementById('ordersModal');
    if (myOrdersBtn && ordersModal) {
        myOrdersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ordersModal.classList.add('active');
            loadMyOrders();
        });
    }

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

    const closeActions = () => {
        document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    };

    document.getElementById('cartBtn').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.add('active');
        document.getElementById('cartOverlay').classList.add('active');
    });

    // Close buttons
    ['closeCart', 'cartOverlay', 'closeOrders', 'closeCheckout', 'closeConfirmation'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('click', closeActions);
    });

    document.getElementById('backToOrdersBtn').addEventListener('click', () => {
        document.getElementById('confirmationModal').classList.remove('active');
        document.getElementById('ordersModal').classList.add('active');
    });

    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (sessionStorage.getItem('isLoggedIn') !== 'true') return alert('Please login to checkout.');
        if (cart.length === 0) return alert('Your cart is empty.');
        
        document.getElementById('checkoutItems').innerHTML = cart.map(i => 
            `<div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>${i.name} x${i.quantity}</span>
                <span>$${(i.price*i.quantity).toFixed(2)}</span>
             </div>`
        ).join('');
        
        const total = cart.reduce((s,i)=>s+(i.price*i.quantity),0);
        document.getElementById('checkoutTotal').textContent = `$${total.toFixed(2)}`;
        
        closeActions();
        document.getElementById('checkoutModal').classList.add('active');
    });

    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
}

// --- 5. Shared Utilities ---
function scrollToMenu() {
    const section = document.getElementById('menu');
    if(section) section.scrollIntoView({ behavior: 'smooth' });
}
function scrollToContact() {
    const section = document.getElementById('contact');
    if(section) section.scrollIntoView({ behavior: 'smooth' });
}
window.scrollToMenu = scrollToMenu;
window.scrollToContact = scrollToContact;

function updateCartUI() {
    const count = document.getElementById('cartCount');
    const items = document.getElementById('cartItems');
    const totalDiv = document.getElementById('cartTotal');
    const total = cart.reduce((s,i)=>s+(i.price*i.quantity),0);
    
    if(count) {
        const qty = cart.reduce((s,i)=>s+i.quantity,0);
        count.textContent = qty;
        count.style.display = qty > 0 ? 'block' : 'none';
    }
    
    if(cart.length === 0) {
        items.innerHTML = `
            <div style="text-align:center; padding:40px; color:#888;">
                <p>Your cart is empty</p>
                <button onclick="document.getElementById('closeCart').click(); scrollToMenu()" style="margin-top:10px; background:none; border:none; color:#6b5442; font-weight:bold; cursor:pointer;">Browse Menu</button>
            </div>`;
    } else {
        items.innerHTML = cart.map(i => `
            <div class="cart-item">
                <img src="${i.image}" alt="${i.name}" class="cart-item-img" onerror="this.src='assets/cup.png'">
                <div class="cart-item-details">
                    <h4>${i.name}</h4>
                    <span class="cart-item-price">$${(i.price * i.quantity).toFixed(2)}</span>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="changeQty('${i.id}',-1)">-</button>
                    <span class="qty-val">${i.quantity}</span>
                    <button class="qty-btn" onclick="changeQty('${i.id}',1)">+</button>
                </div>
            </div>
        `).join('');
    }
    
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

function loadCart() { 
    try { 
        cart = JSON.parse(localStorage.getItem('cart') || '[]'); 
        if (cart.some(item => !item.image)) {
            cart = [];
            localStorage.removeItem('cart');
        }
    } catch(e){ cart=[]; } 
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }

function checkLoginStatus() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const userName = sessionStorage.getItem('userName');
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('userProfile').style.display = 'flex';
        document.getElementById('profileName').textContent = userName;
        const avatarEl = document.getElementById('profileAvatar');
        if(avatarEl && userName) avatarEl.textContent = userName.charAt(0).toUpperCase();
    }
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'notification success show';
    n.innerHTML = `✓ ${msg}`;
    // Inline styling for the notification if not in CSS
    n.style.position = 'fixed';
    n.style.top = '20px';
    n.style.right = '20px';
    n.style.backgroundColor = '#4caf50';
    n.style.color = 'white';
    n.style.padding = '15px 25px';
    n.style.borderRadius = '8px';
    n.style.zIndex = '9999';
    n.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
}

// --- Order API Functions ---
function placeOrder() {
    const email = sessionStorage.getItem('userEmail');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    fetch('../api/place_order.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, items: cart, total: total.toFixed(2) }) })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const modal = document.getElementById('confirmationModal');
            document.getElementById('closeConfirmation').style.display = 'block';
            document.getElementById('backToOrdersBtn').style.display = 'none';
            
            document.getElementById('orderCode').textContent = data.order_token;
            if(document.getElementById('orderTimer')) { 
                document.getElementById('orderTimer').style.display = 'block'; 
                startCountdown(data.expiry_time); 
            }

            document.getElementById('orderSummary').innerHTML = cart.map(item => 
                `<div>${item.name} x${item.quantity} - $${(item.price*item.quantity).toFixed(2)}</div>`
            ).join('');
            
            cart = []; localStorage.removeItem('cart'); updateCartUI();
            document.getElementById('checkoutModal').classList.remove('active');
            modal.classList.add('active');
        } else alert("Error: " + data.message);
    }).catch(() => alert("Connection Error"));
}

function loadMyOrders() {
    const email = sessionStorage.getItem('userEmail');
    if(!email) return;
    
    fetch('../api/get_user_orders.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email }) })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            myOrdersData = data.orders; // Store for receipt view
            const list = document.getElementById('ordersList');
            if(data.orders.length === 0) {
                list.innerHTML = '<p class="no-orders">No orders found.</p>';
                return;
            }
            list.innerHTML = data.orders.map((o, index) => `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-code-badge">${o.token}</span>
                        <span class="order-status ${o.status === 'Completed' ? 'status-completed' : 'status-pending'}">${o.status}</span>
                    </div>
                    <div class="order-items">
                        ${o.items.map(i => `<div class="order-item-row"><span>${i.name} x${i.quantity}</span><span>$${parseFloat(i.subtotal).toFixed(2)}</span></div>`).join('')}
                    </div>
                    <div class="order-total"><strong>Total: $${o.total}</strong></div>
                    <p class="order-date">${o.date}</p>
                    <button onclick="viewReceipt(${index})" style="width:100%; margin-top:10px; padding:8px; cursor:pointer;">View Code</button>
                </div>
            `).join('');
        }
    });
}

function startCountdown(expiryString) {
    const timerDisplay = document.getElementById('orderTimer');
    if (!timerDisplay) return;
    if (orderInterval) clearInterval(orderInterval);
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
        timerDisplay.style.color = "#d9534f";
    }
    update(); 
    orderInterval = setInterval(update, 1000);
}

window.viewReceipt = function(index) {
    const order = myOrdersData[index];
    const modal = document.getElementById('confirmationModal');
    
    document.getElementById('closeConfirmation').style.display = 'none'; 
    document.getElementById('backToOrdersBtn').style.display = 'block'; 
    if(document.getElementById('orderTimer')) document.getElementById('orderTimer').style.display = 'none';
    if(orderInterval) clearInterval(orderInterval);

    document.getElementById('orderCode').textContent = order.token;
    document.getElementById('orderSummary').innerHTML = order.items.map(item => 
        `<div>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</div>`
    ).join('');
    
    document.getElementById('ordersModal').classList.remove('active');
    modal.classList.add('active');
};