// Authentication Module
// Handles login, registration, and session management

// Check if user is logged in
function checkAuth() {
    const session = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    if (!session) return null;
    try { return JSON.parse(session); } catch (error) {
        localStorage.removeItem('userSession'); sessionStorage.removeItem('userSession'); return null;
    }
}

// Require authentication
function requireAuth(requiredRole = null) {
    const user = checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    
    // Check account status
    if (user.accountStatus !== 'Active') {
        alert('Your account has been deactivated. Please contact administrator.');
        logout();
        return null;
    }
    
    // Check role if required
    if (requiredRole) {
        if (Array.isArray(requiredRole)) {
            if (!requiredRole.includes(user.role)) {
                alert('You do not have permission to access this page.');
                window.location.href = 'index.html';
                return null;
            }
        } else {
            if (user.role !== requiredRole) {
                alert('You do not have permission to access this page.');
                window.location.href = 'index.html';
                return null;
            }
        }
    }
    
    return user;
}

// Logout function
function logout() {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    window.location.href = 'login.html';
}

// Handle login form
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }
    
    try {
        // Find user by email
        const users = await window.DB.getAllRecords('Users');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            showMessage('Invalid email or password', 'error');
            return;
        }
        
        if (user.accountStatus !== 'Active') {
            if (user.accountStatus === 'Pending') {
                showMessage('Your account is pending approval by administrator', 'error');
            } else {
                showMessage('Your account has been deactivated', 'error');
            }
            return;
        }
        
        // Verify password
        const isValid = await window.DB.verifyPassword(password, user.passwordHash, user.passwordSalt);
        
        if (!isValid) {
            showMessage('Invalid email or password', 'error');
            return;
        }
        
        // Create session
        const sessionData = {
            userId: user.userId,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus
        };
        
        if (rememberMe) {
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(sessionData));
        }
        
        showMessage('Login successful!', 'success');
        setTimeout(() => {
            if (user.role === 'Customer') {
                window.location.href = 'customer-dashboard.html';
            } else if (user.role === 'Cashier') {
                window.location.href = 'cashier-dashboard.html';
            } else if (user.role === 'Administrator') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'admin.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('An error occurred during login', 'error');
    }
}

// Handle registration form
async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role') ? document.getElementById('role').value : 'Customer';
    
    // Validation
    if (!fullName || !username || !email || !contactNumber || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 8) {
        showMessage('Password must be at least 8 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        const users = await window.DB.getAllRecords('Users');
        
        // Check if username exists
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            showMessage('Username already exists', 'error');
            return;
        }
        
        // Check if email exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            showMessage('Email already registered', 'error');
            return;
        }
        
        // Security: Never allow admin creation, cashier needs approval
        let userRole = 'Customer';
        let accountStatus = 'Active';
        
        if (role === 'Cashier') {
            userRole = 'Cashier';
            accountStatus = 'Pending'; // Requires admin approval
        } else if (role === 'Customer') {
            userRole = 'Customer';
            accountStatus = 'Active';
        }
        
        // Hash password
        const hashedPassword = await window.DB.hashPassword(password);
        
        // Create user
        const newUser = {
            userId: window.DB.generateId('USR'),
            fullName: fullName,
            username: username,
            email: email,
            contactNumber: contactNumber,
            passwordHash: hashedPassword.hash,
            passwordSalt: hashedPassword.salt,
            role: userRole,
            accountStatus: accountStatus,
            dateRegistered: new Date().toISOString()
        };
        
        await window.DB.addRecord('Users', newUser);
        
        if (userRole === 'Cashier' && accountStatus === 'Pending') {
            showMessage('Cashier registration submitted! Awaiting administrator approval.', 'success');
        } else {
            showMessage('Account created successfully! Redirecting to login...', 'success');
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2500);
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('An error occurred during registration', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = 'message ' + type;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = window.event ? window.event.target : null;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '👁️';
    } else {
        input.type = 'password';
        button.textContent = '👁️‍🗨️';
    }
}

// Export functions
window.Auth = {
    checkAuth,
    requireAuth,
    logout,
    handleLogin,
    handleRegister,
    showMessage,
    togglePassword
};
