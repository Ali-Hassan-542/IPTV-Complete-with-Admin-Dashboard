/**
 * Admin Authentication Module
 * Handles signup, login, logout, and session management for admin dashboard
 */

// Storage keys
const STORAGE_KEYS = {
    ADMINS: 'adminCredentials',
    SESSION: 'adminSession'
};

// Hash password using SHA-256 (with fallback for non-secure contexts)
async function hashPassword(password) {
    // Check if crypto.subtle is available (secure context only - HTTPS or localhost)
    if (window.crypto && window.crypto.subtle) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (e) {
            console.warn('Crypto API failed, falling back to simple hash');
        }
    }

    // Fallback for file:// protocol or non-secure contexts
    // Note: This is NOT cryptographically secure, but allows local demo usage
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get all admins from storage
function getAdmins() {
    const adminsJson = localStorage.getItem(STORAGE_KEYS.ADMINS);
    return adminsJson ? JSON.parse(adminsJson) : [];
}

// Save admins to storage
function saveAdmins(admins) {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
}

// Get current session
function getSession() {
    const sessionJson = localStorage.getItem(STORAGE_KEYS.SESSION);
    return sessionJson ? JSON.parse(sessionJson) : null;
}

// Save session to storage
function saveSession(session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

// Clear session
function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Sign up a new admin
 * @param {string} fullName - Admin's full name
 * @param {string} email - Admin's email
 * @param {string} password - Admin's password
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function signup(fullName, email, password) {
    try {
        // Validate inputs
        if (!fullName || !email || !password) {
            return { success: false, message: 'All fields are required' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, message: 'Invalid email format' };
        }

        // Validate password strength (min 6 characters)
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        // Check if email already exists
        const admins = getAdmins();
        if (admins.some(admin => admin.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create new admin
        const newAdmin = {
            id: generateId(),
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()
        };

        // Save to storage
        admins.push(newAdmin);
        saveAdmins(admins);

        return { success: true, message: 'Account created successfully!' };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, message: 'An error occurred during signup' };
    }
}

/**
 * Log in an admin
 * @param {string} email - Admin's email
 * @param {string} password - Admin's password
 * @returns {Promise<{success: boolean, message: string, admin?: object}>}
 */
async function login(email, password) {
    try {
        // Validate inputs
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }

        // Get admins
        const admins = getAdmins();

        // Find admin by email
        const admin = admins.find(a => a.email === email.toLowerCase().trim());
        if (!admin) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Hash provided password and compare
        const passwordHash = await hashPassword(password);
        if (passwordHash !== admin.passwordHash) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Create session
        const session = {
            sessionToken: generateId(),
            adminId: admin.id,
            loginTime: new Date().toISOString()
        };
        saveSession(session);

        return {
            success: true,
            message: 'Login successful!',
            admin: {
                id: admin.id,
                fullName: admin.fullName,
                email: admin.email
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'An error occurred during login' };
    }
}

/**
 * Log out the current admin
 */
function logout() {
    clearSession();
    window.location.href = 'admin_login.html';
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
    const session = getSession();
    return session !== null && session.sessionToken && session.adminId;
}

/**
 * Get current admin details
 * @returns {object|null}
 */
function getCurrentAdmin() {
    const session = getSession();
    if (!session) return null;

    const admins = getAdmins();
    const admin = admins.find(a => a.id === session.adminId);

    if (!admin) return null;

    return {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        createdAt: admin.createdAt
    };
}

/**
 * Require authentication - redirect to login if not authenticated
 * Call this at the top of every protected page
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'admin_login.html';
        return false;
    }
    return true;
}

/**
 * Update admin profile in header
 */
function updateAdminProfile() {
    const admin = getCurrentAdmin();
    if (!admin) return;

    // Try to find and update the admin name in the header
    const adminNameElements = document.querySelectorAll('.user-info div:first-child');
    adminNameElements.forEach(el => {
        if (el.textContent === 'Admin User') {
            el.textContent = admin.fullName;
        }
    });
}

// Auto-update profile when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAdminProfile);
} else {
    updateAdminProfile();
}
