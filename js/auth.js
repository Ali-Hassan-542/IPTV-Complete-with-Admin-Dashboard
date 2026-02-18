// StreamZone Authentication Utilities
// Session and validation management

const SessionManager = {
    USER_KEY: 'streamzone_user',
    SESSION_KEY: 'streamzone_session',
    
    // Login user and create session
    login: function(userData) {
        const session = {
            user: userData,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    },
    
    // Logout user and clear session
    logout: function() {
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.SESSION_KEY);
    },
    
    // Check if user is logged in and session is valid
    isLoggedIn: function() {
        const session = this.getSession();
        if (!session) return false;
        
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        
        if (now > expiresAt) {
            this.logout();
            return false;
        }
        return true;
    },
    
    // Get current user data
    getUser: function() {
        const userData = localStorage.getItem(this.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },
    
    // Get current session
    getSession: function() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }
};

// Validation functions
const Validator = {
    // Email validation
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Password strength validation (min 8 chars, 1 uppercase, 1 number)
    validatePassword: function(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        return { valid: true, message: 'Password is strong' };
    },
    
    // Check if passwords match
    passwordsMatch: function(password, confirmPassword) {
        return password === confirmPassword;
    },
    
    // Display error message
    showError: function(element, message) {
        this.clearError(element);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        element.parentElement.appendChild(errorDiv);
        element.classList.add('input-error');
    },
    
    // Clear error for specific element
    clearError: function(element) {
        const parent = element.parentElement;
        const existingError = parent.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        element.classList.remove('input-error');
    },
    
    // Clear all errors
    clearAllErrors: function() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    },
    
    // Show success message
    showSuccess: function(element, message) {
        this.clearError(element);
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        element.parentElement.appendChild(successDiv);
        element.classList.add('input-success');
    }
};

// Update navbar based on authentication state
function updateNavbar() {
    const isLoggedIn = SessionManager.isLoggedIn();
    const loginLink = document.querySelector('a[href="signin.html"]');
    const signupButton = document.querySelector('a[href="signup.html"]');
    
    if (isLoggedIn && loginLink && signupButton) {
        const user = SessionManager.getUser();
        
        // Replace login link with dashboard
        loginLink.innerHTML = '<i class="fas fa-tachometer-alt"></i> Dashboard';
        loginLink.href = 'admin_dashboard.html';
        loginLink.classList.add('btn-dashboard');
        
        // Replace signup with logout
        signupButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        signupButton.href = '#';
        signupButton.classList.add('btn-logout');
        signupButton.onclick = function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                SessionManager.logout();
                window.location.href = 'index.html';
            }
        };
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
});
