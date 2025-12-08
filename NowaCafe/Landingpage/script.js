// Cart State
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadCart();
    
    // NEW: Load menu from database
    loadMenuFromDB();
    
    setupEventListeners();
    setupScrollEffects();
    injectStyles();
});

// --- 1. Load Menu from Database ---
function loadMenuFromDB() {
    fetch('../api/get_products.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const menuGrid = document.getElementById('menuGrid');
                menuGrid.innerHTML = ''; 

                data.products.forEach(product => {
                    // Note: We use product.category for filtering
                    const productHTML = `
                        <div class="menu-item" data-category="${product.category}" data-id="${product.product_id}">
                            <div class="menu-item-image">
                                <img src="${product.image_url}" alt="${product.name}" onerror="this.src='assets/cup.png'">
                                <div class="menu-overlay">
                                    <button class="add-to-cart" onclick="addToCartDB(${product.product_id}, '${product.name}', ${product.price})">Add to Cart</button>
                                </div>
                            </div>
                            <div class="menu-item-info">
                                <h3>${product.name}</h3>
                                <p>${product.description}</p>
                                <span class="price">$${product.price}</span>
                            </div>
                        </div>
                    `;
                    menuGrid.innerHTML += productHTML;
                });
            }
        })
        .catch(err => console.error("Error loading menu:", err));
}

// --- 2. Add to Cart (With ID) ---
function addToCartDB(id, name, price) {
    const priceNum = parseFloat(price);
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Push ID so backend knows the product
        cart.push({ id: id, name: name, price: priceNum, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${name} added to cart!`);
}

// --- 3. Place Order (Backend Connection) ---
function placeOrder() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userEmail = sessionStorage.getItem('userEmail');

    if (isLoggedIn !== 'true' || !userEmail) {
        showNotification('Please login to place an order', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderItems = [...cart]; 

    // Send to PHP
    fetch('../api/place_order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: userEmail,
            items: orderItems,
            total: total.toFixed(2)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const displayCode = "ORD-" + data.id; 
            
            // Clear cart
            cart = [];
            saveCart();
            updateCartUI();
            
            // Show receipt
            showOrderConfirmation(displayCode, orderItems, total);
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Order failed. Please try again.', 'error');
    });
}

// --- Utility Functions ---

function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userName = sessionStorage.getItem('userName');
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');

    if (isLoggedIn === 'true') {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            if (userName) {
                if (profileName) profileName.textContent = userName;
                if (profileAvatar) profileAvatar.textContent = userName.charAt(0).toUpperCase();
            }
        }
    }
}

function setupEventListeners() {
    // Profile Dropdown
    const profileTrigger = document.getElementById('profileTrigger');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) profileDropdown.classList.remove('active');
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                window.location.reload();
            }
        });
    }

    // Hamburger Menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const spans = hamburger.querySelectorAll('span');
            if(navMenu.classList.contains('active')){
                spans[0].style.transform = 'rotate(45deg) translateY(10px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translateY(-10px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Category Filter Logic
    const categoryButtons = document.querySelectorAll('.category-btn');
    // Using event delegation or checking DOM since items are dynamic
    // We attach click listener to the parent container of items if needed, 
    // but filtering hides/shows elements based on class/attribute.
    // Since items are dynamic, we just check the DOM when button is clicked.
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const category = button.getAttribute('data-category');
            const menuItems = document.querySelectorAll('.menu-item'); // Re-query DOM
            
            menuItems.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = '';
                    item.style.animation = 'fadeInUp 0.5s ease';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Cart Toggles
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');

    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
        });
        const closeActions = () => {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.getElementById('checkoutModal').classList.remove('active');
            document.getElementById('confirmationModal').classList.remove('active');
            document.getElementById('ordersModal').classList.remove('active');
        };
        if (closeCart) closeCart.addEventListener('click', closeActions);
        if (cartOverlay) cartOverlay.addEventListener('click', closeActions);
    }

    // Checkout Buttons
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckoutClick);

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) placeOrderBtn.addEventListener('click', placeOrder);

    const closeCheckout = document.getElementById('closeCheckout');
    if (closeCheckout) closeCheckout.addEventListener('click', () => {
        document.getElementById('checkoutModal').classList.remove('active');
    });

    const closeConfirmation = document.getElementById('closeConfirmation');
    if (closeConfirmation) closeConfirmation.addEventListener('click', () => {
        document.getElementById('confirmationModal').classList.remove('active');
        if(cartOverlay) cartOverlay.classList.remove('active');
    });
    
    // Smooth Scroll
    function scrollToMenu() { document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); }
    function scrollToContact() { document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }); }
    window.scrollToMenu = scrollToMenu;
    window.scrollToContact = scrollToContact;
}

function loadCart() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            updateCartUI();
        }
    } catch (e) { cart = []; }
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartCount || !cartItems || !cartTotal) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '$0.00';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">$${item.price}</p>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="window.updateQuantity('${item.id}', -1)">-</button>
                <span class="qty">${item.quantity}</span>
                <button class="qty-btn" onclick="window.updateQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="remove-btn" onclick="window.removeFromCart('${item.id}')">×</button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

window.updateQuantity = function(itemId, change) {
    // Note: itemId might be string or int, convert to compare
    const item = cart.find(cartItem => cartItem.id == itemId); 
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            window.removeFromCart(itemId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
};

window.removeFromCart = function(itemId) {
    cart = cart.filter(item => item.id != itemId);
    saveCart();
    updateCartUI();
};

function handleCheckoutClick() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        showNotification('Please login to place an order', 'error');
        return;
    }
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const cartSidebar = document.getElementById('cartSidebar');

    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = `$${total.toFixed(2)}`;
    
    if(cartSidebar) cartSidebar.classList.remove('active');
    checkoutModal.classList.add('active');
}

function showOrderConfirmation(orderCode, items, total) {
    const checkoutModal = document.getElementById('checkoutModal');
    const confirmationModal = document.getElementById('confirmationModal');
    const orderCodeEl = document.getElementById('orderCode');
    const orderSummaryEl = document.getElementById('orderSummary');

    if(checkoutModal) checkoutModal.classList.remove('active');
    
    if (confirmationModal) {
        orderCodeEl.textContent = orderCode;
        if (orderSummaryEl && items) {
             const totalVal = typeof total === 'number' ? total.toFixed(2) : total;
             orderSummaryEl.innerHTML = `
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left; border: 1px solid #eee;">
                    <h4 style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 10px; font-size: 0.95rem;">Order Summary</h4>
                    ${items.map(item => `
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; color: #555;">
                            <span>${item.name} <span style="font-size:0.8em; color:#999;">x${item.quantity}</span></span>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div style="border-top: 2px solid #ddd; margin-top: 10px; padding-top: 8px; display: flex; justify-content: space-between; font-weight: bold; color: #2c2420;">
                        <span>Total Paid:</span>
                        <span>$${totalVal}</span>
                    </div>
                </div>
            `;
        }
        confirmationModal.classList.add('active');
    }
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    const icon = type === 'success' ? '✓' : '✕';
    notif.innerHTML = `<span style="font-weight:bold; font-size:1.2em;">${icon}</span> <span>${message}</span>`;
    
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function setupScrollEffects() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset <= 0) navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            else navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
        });
    }
}

function injectStyles() {
    if (!document.getElementById('dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.textContent = `
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }
}