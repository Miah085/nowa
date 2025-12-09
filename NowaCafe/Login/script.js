// Get elements
const form = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');

// --- 1. Toggle Password Visibility ---
if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function() {
        // Toggle the type attribute
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle the eye icon
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
        
        // Handle padding
        if (type === 'text') {
            passwordInput.classList.add('password-visible');
        } else {
            passwordInput.classList.remove('password-visible');
        }
    });
}

// --- 2. Login Form Submission ---
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = passwordInput.value;

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