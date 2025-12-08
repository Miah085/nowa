// Get form element
const form = document.getElementById('loginForm');

// Simulated user database (replace with actual database later)
const defaultUsers = [
    // Admin accounts
    { email: 'admin@cafenowa.com', password: 'admin123', role: 'admin' },
    
    // Employee accounts
    { email: 'employee@cafenowa.com', password: 'employee123', role: 'employee' },
    { email: 'barista@cafenowa.com', password: 'barista123', role: 'employee' },
    
    // Customer accounts
    { email: 'customer@cafenowa.com', password: 'customer123', role: 'customer' },
    { email: 'john@example.com', password: 'john123', role: 'customer' }
];

// Form submission handler
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('../api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Save session data
            sessionStorage.setItem('userEmail', data.email);
            sessionStorage.setItem('userName', data.username);
            sessionStorage.setItem('userRole', data.role);
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // Redirect based on role
            if(data.role === 'admin') {
                window.location.href = '../Admin/admin-dashboard.html';
            } else if (data.role === 'staff' || data.role === 'employee') {
                window.location.href = '../Employee/employee-dashboard.html';
            } else {
                window.location.href = '../Landingpage/landing.html';
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});