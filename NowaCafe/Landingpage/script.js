let cart = [];
let myOrdersData = [];
let orderInterval; 

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadCart(); // Auto-clears broken data
    setupStaticMenuListeners();
    setupEventListeners();
    updateCartUI();
});

// --- 1. Event Listeners ---
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

    document.getElementById('closeCart').addEventListener('click', closeActions);
    document.getElementById('cartOverlay').addEventListener('click', closeActions);
    document.getElementById('closeOrders').addEventListener('click', closeActions);
    document.getElementById('closeCheckout').addEventListener('click', closeActions);
    document.getElementById('closeConfirmation').addEventListener('click', closeActions);

    document.getElementById('backToOrdersBtn').addEventListener('click', () => {
        document.getElementById('confirmationModal').classList.remove('active');
        document.getElementById('ordersModal').classList.add('active');
    });

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

// --- 2. Global Scroll ---
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

// --- 3. Menu Listeners (Grab Image) ---
function setupStaticMenuListeners() {
    document.querySelectorAll('.menu-item button').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.menu-item');
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            const price = card.getAttribute('data-price');
            
            // FIX: Grab image source (defaults to cup.png if missing)
            const imgEl = card.querySelector('img');
            const image = imgEl ? imgEl.src : 'assets/cup.png';

            addToCart(id, name, price, image);
        });
    });
}

function addToCart(id, name, price, image) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        // Save the image URL in the cart item
        cart.push({ id: id, name: name, price: parseFloat(price), quantity: 1, image: image });
    }
    saveCart();
    updateCartUI();
    showNotification("Added!");
}

// --- 4. UI Update (With Images) ---
function updateCartUI() {
    const count = document.getElementById('cartCount');
    const items = document.getElementById('cartItems');
    const totalDiv = document.getElementById('cartTotal');
    const total = cart.reduce((s,i)=>s+(i.price*i.quantity),0);
    
    if(count) {
        count.textContent = cart.reduce((s,i)=>s+i.quantity,0);
        count.style.display = cart.length > 0 ? 'block' : 'none';
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

// --- 5. FIXED: Auto-Repair Cart ---
function loadCart() { 
    try { 
        cart = JSON.parse(localStorage.getItem('cart') || '[]'); 
        
        // CHECK: If any item is missing an image, the data is old. Clear it.
        const isBroken = cart.some(item => !item.image);
        if (cart.length > 0 && isBroken) {
            console.log("Old cart data detected. Resetting to fix images.");
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
        if (userName) { const avatarEl = document.getElementById('profileAvatar'); if(avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase(); }
    }
}
function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'notification success show';
    n.innerHTML = `✓ ${msg}`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
}

// --- Receipt View (No Timer) ---
window.viewReceipt = function(index) {
    const order = myOrdersData[index];
    const modal = document.getElementById('confirmationModal');
    const gotItBtn = document.getElementById('closeConfirmation'); 
    const backBtn = document.getElementById('backToOrdersBtn');
    const timerDiv = document.getElementById('orderTimer');

    gotItBtn.style.display = 'none'; 
    backBtn.style.display = 'block'; 
    if(timerDiv) { timerDiv.style.display = 'none'; if(orderInterval) clearInterval(orderInterval); }

    document.getElementById('orderCode').textContent = order.token;
    document.getElementById('orderSummary').innerHTML = order.items.map(item => 
        `<div>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</div>`
    ).join('');
    
    document.getElementById('ordersModal').classList.remove('active');
    modal.classList.add('active');
};

// --- Place Order (With Timer) ---
function placeOrder() {
    const email = sessionStorage.getItem('userEmail');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    fetch('../api/place_order.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, items: cart, total: total.toFixed(2) }) })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const modal = document.getElementById('confirmationModal');
            const gotItBtn = document.getElementById('closeConfirmation');
            const backBtn = document.getElementById('backToOrdersBtn');
            const timerDiv = document.getElementById('orderTimer');
            
            gotItBtn.style.display = 'block'; backBtn.style.display = 'none';   
            document.getElementById('orderCode').textContent = data.order_token;
            
            if(timerDiv) { timerDiv.style.display = 'block'; startCountdown(data.expiry_time); }

            document.getElementById('orderSummary').innerHTML = cart.map(item => 
                `<div>${item.name} x${item.quantity} - $${(item.price*item.quantity).toFixed(2)}</div>`
            ).join('');
            
            cart = []; localStorage.removeItem('cart'); updateCartUI();
            document.getElementById('checkoutModal').classList.remove('active');
            modal.classList.add('active');
        } else alert("Error: " + data.message);
    }).catch(() => alert("Connection Error"));
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
            timerDisplay.textContent = "Code Expired!"; timerDisplay.style.color = "red"; clearInterval(orderInterval); return;
        }
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        timerDisplay.textContent = `Code Expires in: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        timerDisplay.style.color = "#d9534f";
    }
    update(); orderInterval = setInterval(update, 1000);
}