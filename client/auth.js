// Authentication System

// Utility Functions
const showError = (elementId, message) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('active');
    }
};

const hideError = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.classList.remove('active');
    }
};

const showMessage = (elementId, message) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
};

const hideMessage = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
};

// Email Validation
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Password Validation
const validatePassword = (password) => {
    return password.length >= 8;
};

// Password Strength Calculator
const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
};

// Toggle Password Visibility
const setupPasswordToggle = (toggleBtnId, inputId) => {
    const toggleBtn = document.getElementById(toggleBtnId);
    const input = document.getElementById(inputId);
    
    if (toggleBtn && input) {
        toggleBtn.addEventListener('click', () => {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
        });
    }
};

// Local Storage Functions
const saveUser = (userData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
};

const getUser = () => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};

const removeUser = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('rememberMe');
};

const isLoggedIn = () => {
    return localStorage.getItem('isLoggedIn') === 'true';
};

// Check if user is already logged in
const checkAuthStatus = () => {
    if (isLoggedIn() && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }
};

// Login Form Handler
const initLoginForm = () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    setupPasswordToggle('togglePassword', 'password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        hideError('emailError');
        hideError('passwordError');
        hideMessage('loginError');
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        let isValid = true;
        
        // Validate email
        if (!email) {
            showError('emailError', 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('emailError', 'Please enter a valid email');
            isValid = false;
        }
        
        // Validate password
        if (!password) {
            showError('passwordError', 'Password is required');
            isValid = false;
        }
        
        if (!isValid) return;
        
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.classList.add('loading');
        
        // Simulate API call
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            loginBtn.classList.remove('loading');
            
            if (user) {
                const userData = {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    loginTime: new Date().toISOString()
                };
                
                saveUser(userData);
                
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
                
                // Redirect to home page
                window.location.href = 'index.html';
            } else {
                showMessage('loginError', 'Invalid email or password. Please try again.');
            }
        }, 1500);
    });
};

// Signup Form Handler
const initSignupForm = () => {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    setupPasswordToggle('toggleSignupPassword', 'signupPassword');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    const passwordInput = document.getElementById('signupPassword');
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthBar = document.getElementById('strengthBarFill');
    const strengthText = document.getElementById('strengthText');

    // Password strength indicator
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        
        if (password.length > 0) {
            strengthIndicator.classList.add('active');
            const strength = calculatePasswordStrength(password);
            
            strengthBar.className = 'strength-bar-fill ' + strength;
            strengthText.className = 'strength-text ' + strength;
            
            if (strength === 'weak') {
                strengthText.textContent = 'Weak password';
            } else if (strength === 'medium') {
                strengthText.textContent = 'Medium password';
            } else {
                strengthText.textContent = 'Strong password';
            }
        } else {
            strengthIndicator.classList.remove('active');
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide all errors
        ['firstNameError', 'lastNameError', 'signupEmailError', 'signupPasswordError', 'confirmPasswordError', 'termsError'].forEach(hideError);
        hideMessage('signupError');
        hideMessage('signupSuccess');
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;
        
        let isValid = true;
        
        // Validate first name
        if (!firstName) {
            showError('firstNameError', 'First name is required');
            isValid = false;
        }
        
        // Validate last name
        if (!lastName) {
            showError('lastNameError', 'Last name is required');
            isValid = false;
        }
        
        // Validate email
        if (!email) {
            showError('signupEmailError', 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('signupEmailError', 'Please enter a valid email');
            isValid = false;
        }
        
        // Validate password
        if (!password) {
            showError('signupPasswordError', 'Password is required');
            isValid = false;
        } else if (!validatePassword(password)) {
            showError('signupPasswordError', 'Password must be at least 8 characters');
            isValid = false;
        }
        
        // Validate confirm password
        if (!confirmPassword) {
            showError('confirmPasswordError', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        }
        
        // Validate terms
        if (!terms) {
            showError('termsError', 'You must accept the terms and conditions');
            isValid = false;
        }
        
        if (!isValid) return;
        
        const signupBtn = document.getElementById('signupBtn');
        signupBtn.classList.add('loading');
        
        // Simulate API call
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if email already exists
            if (users.some(u => u.email === email)) {
                signupBtn.classList.remove('loading');
                showMessage('signupError', 'An account with this email already exists.');
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now(),
                firstName,
                lastName,
                email,
                password,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            signupBtn.classList.remove('loading');
            
            showMessage('signupSuccess', 'Account created successfully! Redirecting to login...');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }, 1500);
    });
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    initLoginForm();
    initSignupForm();
});

// Export logout function for use in main app
window.logout = () => {
    removeUser();
    window.location.href = 'login.html';
};

// Export check auth function
window.checkAuth = () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
};

// Export get current user function
window.getCurrentUser = getUser;