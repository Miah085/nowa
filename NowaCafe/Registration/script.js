// Get elements
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const form = document.getElementById('registrationForm');
const minCharRequirement = document.getElementById('minChar');
const alphaNumRequirement = document.getElementById('alphaNum');
const matchMessage = document.getElementById('passwordMatchMessage');

// Toggle Icons
const togglePasswordBtn = document.getElementById('togglePassword');
const toggleConfirmBtn = document.getElementById('toggleConfirmPassword');

// --- 1. Toggle Password Visibility Logic ---
function setupToggle(button, inputField) {
    button.addEventListener('click', function() {
        // Toggle the type attribute
        const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
        inputField.setAttribute('type', type);
        
        // Toggle the eye icon
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
        
        // Handle custom styling if needed
        if (type === 'text') {
            inputField.classList.add('password-visible');
        } else {
            inputField.classList.remove('password-visible');
        }
    });
}

setupToggle(togglePasswordBtn, passwordInput);
setupToggle(toggleConfirmBtn, confirmPasswordInput);

// --- 2. Real-time Password Validation ---
function validatePassword() {
    const password = passwordInput.value;
    
    // Check minimum 8 characters
    if (password.length >= 8) {
        minCharRequirement.classList.add('valid');
    } else {
        minCharRequirement.classList.remove('valid');
    }
    
    // Check alphabetic and numeric characters
    const hasAlpha = /[a-zA-Z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    
    if (hasAlpha && hasNumeric) {
        alphaNumRequirement.classList.add('valid');
    } else {
        alphaNumRequirement.classList.remove('valid');
    }

    // Check match if confirm password has value
    if (confirmPasswordInput.value.length > 0) {
        checkMatch();
    }
}

// --- 3. Check Match Function ---
function checkMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword === "") {
        matchMessage.textContent = "";
        matchMessage.className = "match-message";
        return;
    }

    if (password === confirmPassword) {
        matchMessage.textContent = "✓ Passwords match";
        matchMessage.className = "match-message match-success";
    } else {
        matchMessage.textContent = "✕ Passwords do not match";
        matchMessage.className = "match-message match-error";
    }
}

// Add event listeners
passwordInput.addEventListener('input', validatePassword);
passwordInput.addEventListener('input', checkMatch); // Check match when main password changes too
confirmPasswordInput.addEventListener('input', checkMatch);

// ... existing toggle code ...

// --- 4. Form Submission ---
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // ... get values ...
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error'); // REPLACED alert
        return;
    }

    if (password.length < 8) {
        showNotification('Password does not meet requirements', 'error'); // REPLACED alert
        return;
    }

    // Send to PHP Backend
    fetch('../api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: username, 
            email: email, 
            password: password 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Registration Successful! Redirecting...', 'success'); // REPLACED alert
            
            // Wait 1.5 seconds so they can see the message before leaving
            setTimeout(() => {
                window.location.href = '../Login/login.html';
            }, 1500);
        } else {
            showNotification(data.message, 'error'); // REPLACED alert
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Something went wrong. Please try again.', 'error');
    });
});

// --- 5. Custom Notification Function ---
function showNotification(message, type) {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create element
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = type === 'success' ? `✓ ${message}` : `✕ ${message}`;
    
    document.body.appendChild(notif);

    // Trigger animation
    setTimeout(() => notif.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}