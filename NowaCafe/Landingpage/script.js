// Cart State
let cart = [];

// Initialize App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize System
    checkLoginStatus();
    loadCart();
    setupEventListeners();
    setupScrollEffects();
    
    // 2. Inject CSS for animations
    injectStyles();
});

// --- Initialization Functions ---

function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userEmail = sessionStorage.getItem('userEmail');
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');

    // Safe check for elements before manipulating them
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');

    if (isLoggedIn === 'true' && userRole === 'customer') {
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
            if (!profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                // Optional: Decide if you want to clear the cart on logout
                // localStorage.removeItem('cart'); 
                window.location.reload();
            }
        });
    }

    // View Profile
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('Profile feature coming soon!');
        });
    }

    // My Orders
    const myOrdersBtn = document.getElementById('myOrdersBtn');
    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showMyOrders();
        });
    }

    // Hamburger Menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            animateHamburger(hamburger, navMenu.classList.contains('active'));
        });

        // Close menu when clicking links
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                animateHamburger(hamburger, false);
            });
        });
    }

    // Category Filtering
    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const category = button.getAttribute('data-category');
            
            menuItems.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.classList.remove('hidden');
                    item.style.animation = 'fadeInUp 0.5s ease';
                    item.style.display = ''; // Reset display
                } else {
                    item.classList.add('hidden');
                    setTimeout(() => {
                        if(item.classList.contains('hidden')) item.style.display = 'none';
                    }, 500); // Wait for animation if css handles it
                }
            });
        });
    });

    // Add to Cart Buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const menuItem = button.closest('.menu-item');
            if (menuItem) {
                const itemName = menuItem.getAttribute('data-name');
                const itemPrice = parseFloat(menuItem.getAttribute('data-price'));
                addToCart({ name: itemName, price: itemPrice });
            }
        });
    });

    // Cart Sidebar Toggles
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');

    if (cartBtn && cartSidebar && cartOverlay) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeActions = () => {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Also close other modals if open
            const checkoutModal = document.getElementById('checkoutModal');
            const ordersModal = document.getElementById('ordersModal');
            const confirmationModal = document.getElementById('confirmationModal');
            if(checkoutModal) checkoutModal.classList.remove('active');
            if(ordersModal) ordersModal.classList.remove('active');
            if(confirmationModal) confirmationModal.classList.remove('active');
        };

        if (closeCart) closeCart.addEventListener('click', closeActions);
        cartOverlay.addEventListener('click', closeActions);
    }

    // Checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    const closeCheckout = document.getElementById('closeCheckout');
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckoutClick);
    }
    if (closeCheckout) {
        closeCheckout.addEventListener('click', () => {
            const checkoutModal = document.getElementById('checkoutModal');
            if(checkoutModal) checkoutModal.classList.remove('active');
            // Keep overlay if needed or remove it. Usually remove:
            if(cartOverlay) cartOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Place Order
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', placeOrder);
    }

    // Close Confirmation
    const closeConfirmation = document.getElementById('closeConfirmation');
    if (closeConfirmation) {
        closeConfirmation.addEventListener('click', () => {
            document.getElementById('confirmationModal').classList.remove('active');
            if(cartOverlay) cartOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Close Orders Modal
    const closeOrders = document.getElementById('closeOrders');
    if (closeOrders) {
        closeOrders.addEventListener('click', () => {
            document.getElementById('ordersModal').classList.remove('active');
            if(cartOverlay) cartOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = contactForm.querySelector('input[type="text"]');
            const name = input ? input.value : 'Guest';
            showNotification(`Thank you, ${name}! We'll get back to you soon.`);
            contactForm.reset();
        });
    }

    // Smooth Scroll Buttons
    const orderNowBtn = document.getElementById('orderNowBtn');
    if (orderNowBtn) {
        orderNowBtn.addEventListener('click', () => {
            const menuSection = document.getElementById('menu');
            if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    setupIntersectionObserver();
}

function setupScrollEffects() {
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll <= 0) {
                navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
            }
            lastScroll = currentScroll;
        });
    }
}

// --- Logic Functions ---

function animateHamburger(hamburger, isActive) {
    const spans = hamburger.querySelectorAll('span');
    if (spans.length < 3) return;
    
    if (isActive) {
        spans[0].style.transform = 'rotate(45deg) translateY(10px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-10px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
}

function loadCart() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            updateCartUI();
        }
    } catch (e) {
        console.error("Error loading cart:", e);
        cart = [];
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.name === item.name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${item.name} added to cart!`);
}

function removeFromCart(itemName) {
    cart = cart.filter(item => item.name !== itemName);
    saveCart();
    updateCartUI();
}

// Exposed to global scope for onclick events in HTML strings
window.updateQuantity = function(itemName, change) {
    const item = cart.find(cartItem => cartItem.name === itemName);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemName);
        } else {
            saveCart();
            updateCartUI();
        }
    }
};

window.removeFromCart = function(itemName) { // Expose for the remove button
    cart = cart.filter(item => item.name !== itemName);
    saveCart();
    updateCartUI();
};

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartCount || !cartItems || !cartTotal) return;

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Update cart items
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
                <button class="qty-btn" onclick="window.updateQuantity('${item.name}', -1)">-</button>
                <span class="qty">${item.quantity}</span>
                <button class="qty-btn" onclick="window.updateQuantity('${item.name}', 1)">+</button>
            </div>
            <button class="remove-btn" onclick="window.removeFromCart('${item.name}')">×</button>
        </div>
    `).join('');
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function handleCheckoutClick() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn !== 'true') {
        showNotification('Please login to place an order', 'error');
        setTimeout(() => {
            // Check if login page exists first
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    showCheckoutModal();
}

function showCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');

    if (!checkoutModal || !checkoutItems || !checkoutTotal) return;

    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = `$${total.toFixed(2)}`;
    
    checkoutModal.classList.add('active');
    if(cartSidebar) cartSidebar.classList.remove('active');
    if(cartOverlay) cartOverlay.classList.add('active');
}

function placeOrder() {
    const orderCode = generateOrderCode();
    const userEmail = sessionStorage.getItem('userEmail');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
        orderCode: orderCode,
        customer: userEmail,
        items: cart,
        total: total.toFixed(2),
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    // Save order
    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
    } catch(e) {
        orders = [];
    }
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    
    showOrderConfirmation(orderCode);
}

function generateOrderCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

function showOrderConfirmation(orderCode) {
    const checkoutModal = document.getElementById('checkoutModal');
    const confirmationModal = document.getElementById('confirmationModal');
    const orderCodeEl = document.getElementById('orderCode');

    if(checkoutModal) checkoutModal.classList.remove('active');
    
    if (confirmationModal && orderCodeEl) {
        orderCodeEl.textContent = orderCode;
        confirmationModal.classList.add('active');
    }
}

function showMyOrders() {
    const userEmail = sessionStorage.getItem('userEmail');
    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
    } catch(e) {
        orders = [];
    }

    const userOrders = orders.filter(order => order.customer === userEmail);
    const ordersList = document.getElementById('ordersList');
    const ordersModal = document.getElementById('ordersModal');
    const cartOverlay = document.getElementById('cartOverlay');

    if (!ordersList || !ordersModal) return;

    if (userOrders.length === 0) {
        ordersList.innerHTML = '<p class="no-orders">No orders yet</p>';
    } else {
        ordersList.innerHTML = userOrders.reverse().map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-code-badge">${order.orderCode}</div>
                    <span class="order-status status-${order.status}">${order.status}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item-row">
                            <span>${item.name} x ${item.quantity}</span>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <strong>Total: $${order.total}</strong>
                </div>
                <div class="order-date">
                    ${new Date(order.timestamp).toLocaleString()}
                </div>
            </div>
        `).join('');
    }
    
    ordersModal.classList.add('active');
    if(cartOverlay) cartOverlay.classList.add('active');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: ${type === 'success' ? '#4caf50' : '#ef4444'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function injectStyles() {
    if (!document.getElementById('dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 1s ease';
                entry.target.style.opacity = '1';
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.section-header, .about-content, .menu-item, .gallery-item, .contact-content');
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}