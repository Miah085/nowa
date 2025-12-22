/* Fixed script.js with Scroll Locking and Custom Alerts */
let cart = [];
let myOrdersData = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Setup
    checkLoginStatus();
    setupProfileDropdown();

    // 2. Load Data
    loadMenu();
    fetchCartFromDB();

    // 3. Event Listeners
    setupEventListeners();
});

// --- HELPER: Custom Alert Modal ---
function showCustomAlert(message, title = "Notice") {
    const modal = document.getElementById('alertModal');
    const msgEl = document.getElementById('alertMessage');
    const titleEl = document.getElementById('alertTitle');

    if (modal && msgEl && titleEl) {
        msgEl.textContent = message;
        titleEl.textContent = title;
        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    } else {
        alert(message); // Fallback
    }
}

// --- LOGIN & PROFILE LOGIC ---
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');

    if (isLoggedIn) {
        const userName = sessionStorage.getItem('userName') || 'User';
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            document.getElementById('profileName').textContent = userName;
            const avatar = document.getElementById('profileAvatar');
            if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }
}

function setupProfileDropdown() {
    const profileTrigger = document.getElementById('profileTrigger');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileTrigger && profileDropdown) {
        const newTrigger = profileTrigger.cloneNode(true);
        profileTrigger.parentNode.replaceChild(newTrigger, profileTrigger);

        newTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!newTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
}

function forceLogout() {
    sessionStorage.clear();
    cart = [];
    updateCartUI();
    window.location.href = "../Login/login.html";
}

// --- BUTTON LISTENERS ---
function setupEventListeners() {

    // --- NEW: CONTACT FORM LISTENER ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            const formData = new FormData(contactForm);

            fetch('../api/submit_contact.php', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showCustomAlert("Thank you! We have received your message.", "Message Sent");
                        contactForm.reset();
                    } else {
                        showCustomAlert(data.message || "Failed to send message.", "Error");
                    }
                })
                .catch(err => {
                    console.error(err);
                    showCustomAlert("An error occurred. Please try again later.", "Network Error");
                })
                .finally(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                });
        });
    }
    // ----------------------------------

    const heroMenu = document.getElementById('heroMenuBtn');
    const heroVisit = document.getElementById('heroVisitBtn');
    if (heroMenu) heroMenu.addEventListener('click', () => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }));
    if (heroVisit) heroVisit.addEventListener('click', () => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }));

    const myOrdersBtn = document.getElementById('myOrdersBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadMyOrders();
            // --- FIX: Lock Background Scroll ---
            document.body.classList.add('no-scroll');

            document.getElementById('ordersModal').classList.add('active');
            document.getElementById('profileDropdown').classList.remove('active');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            forceLogout();
        });
    }

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            document.getElementById('cartSidebar').classList.add('active');
            document.getElementById('cartOverlay').classList.add('active');
            // Optional: Lock scroll for cart sidebar too if desired
            document.body.classList.add('no-scroll');
        });
    }

    // --- FIX: UPDATED CLOSE LOGIC for Alerts ---
    const closeIDs = ['closeCart', 'cartOverlay', 'closeCheckout', 'closeConfirmation', 'closeConfirmBtn', 'closeOrders', 'closeAlert', 'alertOkBtn'];

    closeIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => {
            // SPECIAL CASE: Closing Alert Modal
            if (id === 'closeAlert' || id === 'alertOkBtn') {
                document.getElementById('alertModal').classList.remove('active');

                // If cart is NOT active, we can unlock scroll. If cart IS active, keep scroll locked.
                const cartActive = document.getElementById('cartSidebar').classList.contains('active');
                if (!cartActive) {
                    document.body.classList.remove('no-scroll');
                }
                return; // Stop processing other close logic
            }

            // STANDARD: Close All Active Modals (Except Sidebar if not clicked)
            document.querySelectorAll('.active').forEach(e => {
                e.classList.remove('active');
            });

            // Remove the lock class
            document.body.classList.remove('no-scroll');

            const drop = document.getElementById('profileDropdown');
            if (drop) drop.classList.remove('active');
        });
    });

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            // --- MODIFIED: Use Custom Alert instead of Browser Alert ---
            if (cart.length === 0) {
                showCustomAlert("Your cart is empty!", "Cart Empty");
                return;
            }
            if (sessionStorage.getItem('isLoggedIn') !== 'true') {
                showCustomAlert("Please login to continue.", "Login Required");
                return;
            }

            const itemsDiv = document.getElementById('checkoutItems');
            if (itemsDiv) {
                itemsDiv.innerHTML = cart.map(i =>
                    `<div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>${i.name} x${i.quantity}</span>
                        <span>₱${(i.price * i.quantity).toFixed(2)}</span>
                     </div>`
                ).join('');
            }
            document.getElementById('checkoutTotal').textContent = `₱${cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}`;

            document.getElementById('cartSidebar').classList.remove('active');
            document.getElementById('cartOverlay').classList.remove('active');

            // --- FIX: Lock Background Scroll for Checkout Modal ---
            document.body.classList.add('no-scroll');
            document.getElementById('checkoutModal').classList.add('active');
        });
    }

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
            const email = sessionStorage.getItem('userEmail');
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const paymentInput = document.querySelector('input[name="paymentMethod"]:checked');
            const paymentMethod = paymentInput ? paymentInput.value : 'cash';

            fetch('../api/place_order.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    items: cart,
                    total: total.toFixed(2),
                    payment_method: paymentMethod
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (document.getElementById('orderCode')) document.getElementById('orderCode').textContent = data.order_token;

                        const summaryDiv = document.getElementById('orderSummary');
                        if (summaryDiv) {
                            summaryDiv.innerHTML = cart.map(item =>
                                `<div style="display:flex; justify-content:space-between;">
                                <span>${item.name} x${item.quantity}</span>
                                <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                             </div>`
                            ).join('') + `<div style="border-top:1px solid #ccc; margin-top:5px; padding-top:5px; font-weight:bold; text-align:right;">Total: ₱${total.toFixed(2)} (${paymentMethod})</div>`;
                        }

                        cart = [];
                        fetchCartFromDB();
                        updateCartUI();
                        document.getElementById('checkoutModal').classList.remove('active');
                        // Note: We don't remove 'no-scroll' here because we are opening another modal immediately
                        document.getElementById('confirmationModal').classList.add('active');
                    } else {
                        showCustomAlert("Error: " + data.message, "Order Failed");
                    }
                });
        });
    }
}

// --- DATA FETCHING & FILTERING ---
function fetchCartFromDB() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        cart = []; updateCartUI(); return;
    }
    fetch('../api/get_cart.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cart = data.cart.map(item => ({
                    id: item.product_id,
                    name: item.name,
                    price: parseFloat(item.price),
                    quantity: parseInt(item.quantity),
                    image: item.image_url ? `../${item.image_url}` : 'assets/cup.png'
                }));
                updateCartUI();
            }
        });
}

function loadMyOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '<p style="text-align:center;">Loading...</p>';
    fetch('../api/get_user_orders.php')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.orders.length > 0) {
                ordersList.innerHTML = data.orders.map(order => `
                    <div style="border-bottom:1px solid #eee; padding:10px 0;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>#${order.token}</strong>
                            <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; color:#666; font-size:0.9rem;">
                            <span>${order.date}</span>
                            <span>₱${parseFloat(order.total).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                ordersList.innerHTML = '<p style="text-align:center;">No orders found.</p>';
            }
        });
}

async function addToCart(id, name, price, image) {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') return window.location.href = "../Login/login.html";
    const res = await fetch('../api/add_to_cart.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id })
    });
    const data = await res.json();
    if (data.success) { fetchCartFromDB(); showNotification("Added!"); }
    else { if (data.message && data.message.includes("Session")) forceLogout(); else showCustomAlert(data.message, "Error"); }
}

async function changeQty(id, direction) {
    await fetch('../api/update_cart.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, action: direction === 1 ? 'increase' : 'decrease' })
    });
    fetchCartFromDB();
}

// 2. UPDATED LOAD MENU (With Safe Category Check)
function loadMenu() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;

    fetch('../api/get_menu.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                grid.innerHTML = data.products.map(item => {
                    let displayImg = item.image_url && !item.image_url.startsWith('../') ? '../' + item.image_url : 'assets/cup.png';
                    const safeName = item.name.replace(/'/g, "\\'");
                    const stock = parseInt(item.stock_quantity) || 0;
                    const isActive = parseInt(item.is_active) === 1;
                    const isUnavailable = stock <= 0 || !isActive;
                    const btnClass = isUnavailable ? 'add-to-cart btn-disabled' : 'add-to-cart';
                    const btnText = isUnavailable ? 'Sold Out' : 'Add to Cart';
                    const clickAction = isUnavailable ? '' : `onclick="addToCart('${item.product_id}', '${safeName}', '${item.price}', '${displayImg}')"`;

                    // FIXED: Fallback for missing category to prevent filter bugs
                    const safeCategory = (item.category || 'other').toLowerCase();

                    return `
                    <div class="menu-item ${isUnavailable ? 'unavailable' : ''}" data-category="${safeCategory}">
                        <div class="menu-item-image">
                            <img src="${displayImg}" onerror="this.src='assets/cup.png'">
                            ${isUnavailable ? '<div class="sold-out-overlay">SOLD OUT</div>' : ''}
                        </div>
                        <div class="menu-item-info">
                            <h3>${item.name}</h3>
                            <span class="price">₱${parseFloat(item.price).toFixed(2)}</span>
                            <p>${item.description}</p>
                            <button class="${btnClass}" ${clickAction}>${btnText}</button>
                        </div>
                    </div>`;
                }).join('');

                // Call filter setup AFTER items are added to DOM
                setupCategoryFiltering();
            }
        });
}

// 3. UPDATED FILTERING LOGIC
function setupCategoryFiltering() {
    const buttons = document.querySelectorAll('.category-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all, add to clicked
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Get filter text (lowercase for safety)
            const filterValue = e.target.getAttribute('data-category').toLowerCase().trim();
            const menuItems = document.querySelectorAll('.menu-item');

            menuItems.forEach(item => {
                // Get item category (handle nulls)
                const itemCategory = (item.getAttribute('data-category') || '').toLowerCase();

                // LOGIC: Show if 'all', or exact match, or if 'pastries' contains 'pastry'
                if (filterValue === 'all' || itemCategory === filterValue || itemCategory.includes(filterValue) || filterValue.includes(itemCategory)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

function updateCartUI() {
    const count = document.getElementById('cartCount');
    const items = document.getElementById('cartItems');
    const totalDiv = document.getElementById('cartTotal');
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    if (count) { count.textContent = cart.reduce((s, i) => s + i.quantity, 0); count.style.display = cart.length > 0 ? 'block' : 'none'; }
    if (items) items.innerHTML = cart.length ? cart.map(i => `
        <div class="cart-item">
            <img src="${i.image}" class="cart-item-img">
            <div class="cart-item-details"><h4>${i.name}</h4><span>₱${(i.price * i.quantity).toFixed(2)}</span></div>
            <div class="cart-item-actions"><button onclick="changeQty('${i.id}',-1)">-</button><span>${i.quantity}</span><button onclick="changeQty('${i.id}',1)">+</button></div>
        </div>`).join('') : '<p style="text-align:center;">Empty</p>';
    if (totalDiv) totalDiv.textContent = `₱${total.toFixed(2)}`;
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.innerHTML = `✓ ${msg}`;
    n.style.cssText = 'position:fixed; top:20px; right:20px; background:#4caf50; color:white; padding:15px; border-radius:8px; z-index:9999; animation:fadeIn 0.3s;';
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
}