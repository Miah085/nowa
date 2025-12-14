// Get elements
const form = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');
const togglePasswordBtn = document.getElementById('togglePassword');
const errorElement = document.getElementById('loginError');

// --- 1. Toggle Password Visibility ---
if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');

        if (type === 'text') {
            passwordInput.classList.add('password-visible');
        } else {
            passwordInput.classList.remove('password-visible');
        }
    });
}

// --- Helper: Clear error when user types ---
function clearError() {
    errorElement.style.display = 'none';
    errorElement.textContent = '';
}

emailInput.addEventListener('input', clearError);
passwordInput.addEventListener('input', clearError);

// --- 2. Login Form Submission ---
form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Clear previous errors
    clearError();

    const email = emailInput.value;
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
                if (data.role === 'admin') {
                    window.location.href = '../Admin/admin-dashboard.html';
                } else if (data.role === 'staff' || data.role === 'employee') {
                    window.location.href = '../Employee/employee-dashboard.html';
                } else {
                    window.location.href = '../Landingpage/landing.html';
                }
            } else {
                // --- UPDATED: Show inline error instead of alert ---
                errorElement.textContent = data.message || "Invalid email or password";
                errorElement.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Show generic network error
            errorElement.textContent = "Unable to connect to server. Please try again.";
            errorElement.style.display = 'block';
        });
});