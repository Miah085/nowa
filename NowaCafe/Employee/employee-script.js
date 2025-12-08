window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    // const userEmail = sessionStorage.getItem('userEmail'); // Old way
    const userName = sessionStorage.getItem('userName');      // New way

    if (!isLoggedIn || userRole !== 'employee') { //
        alert('Access denied. Employee privileges required.');
        window.location.href = '../login/login.html';
        return;
    }

    // Display user NAME instead of email
    document.getElementById('userName').textContent = userName;
});

// Sidebar navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Hide all sections
        contentSections.forEach(section => section.classList.remove('active'));
        
        // Show selected section
        const sectionId = item.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
        
        // Update page title
        const sectionName = item.textContent.trim();
        pageTitle.textContent = sectionName;
    });
});

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '../login/login.html';
    }
});

// Accept Order buttons
document.querySelectorAll('.btn-accept').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const orderCard = e.target.closest('.order-card');
        orderCard.classList.remove('pending');
        orderCard.classList.add('processing');
        
        const statusSpan = orderCard.querySelector('.order-status');
        statusSpan.textContent = 'Processing';
        
        // Replace buttons with complete button
        const actionsDiv = orderCard.querySelector('.order-actions');
        actionsDiv.innerHTML = '<button class="btn-complete">Mark Complete</button>';
        
        // Add event listener to new complete button
        const completeBtn = actionsDiv.querySelector('.btn-complete');
        completeBtn.addEventListener('click', completeOrder);
        
        showNotification('Order accepted and now processing!');
    });
});

// Reject Order buttons
document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (confirm('Are you sure you want to reject this order?')) {
            const orderCard = e.target.closest('.order-card');
            orderCard.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                orderCard.remove();
            }, 500);
            showNotification('Order rejected');
        }
    });
});

// Complete Order buttons
document.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', completeOrder);
});

function completeOrder(e) {
    const orderCard = e.target.closest('.order-card');
    orderCard.style.animation = 'fadeOut 0.5s ease';
    setTimeout(() => {
        orderCard.remove();
    }, 500);
    showNotification('Order completed successfully!');
}

// Update Password button
const profileSection = document.getElementById('profile');
if (profileSection) {
    const updateBtn = profileSection.querySelector('.btn-primary');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            const passwordInput = profileSection.querySelector('input[type="password"]');
            if (passwordInput.value) {
                showNotification('Password updated successfully!');
                passwordInput.value = '';
            } else {
                alert('Please enter a new password');
            }
        });
    }
}

// Notification function
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: #4caf50;
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

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.8);
        }
    }
`;
document.head.appendChild(style);