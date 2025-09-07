
let loginDatabase = [];

// Initialize the login system
document.addEventListener('DOMContentLoaded', function() {
    // Load CSV data
    loadCSVData();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Function to load CSV data
function loadCSVData() {

    fetch('../Database/LoginData.csv')
        .then(response => response.text())
        .then(csvText => parseCSVData(csvText))
        .catch(error => {
            console.error('Error loading CSV file:', error);
            showError('Unable to load login data. Please try again later.');
        });
    
}

function parseCSVData(csvText) {
    
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        loginDatabase = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const user = {};
            headers.forEach((header, index) => {
                user[header] = values[index] || '';
            });
            loginDatabase.push(user);
        }
        console.log('Login database loaded:', loginDatabase.length, 'users');
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Clear prev messages
    clearMessages();
    
    // Validate input
    if (!username || !password) {
        showError('Please enter both username and password.');
        return;
    }
    
    // Show loading
    setLoadingState(true);
    
    // Simulate slight delay
    setTimeout(() => {
        authenticateUser(username, password);
        setLoadingState(false);
    }, 500);
}

// Authenticate user against CSV data
function authenticateUser(username, password) {
    // Find user in database
    const user = loginDatabase.find(u => 
        u.Username && u.Username.toLowerCase() === username.toLowerCase() &&
        u.Password === password
    );
    
    if (!user) {
        showError('Invalid username or password. Don\'t have an account? <a href="sign_up.html" style="color: #364C6A;">Sign Up</a> instead.');
        return;
    }
    
    // Check if user is active
    if (user.Status && user.Status.toLowerCase() !== 'active') {
        showError('Your account is inactive. Please contact support.');
        return;
    }
    
    // Success - redirect based on role
    const role = user.role ? user.role.toLowerCase() : '';
    
    showSuccess(`Welcome, ${user.FirstName || user.Username}!`);
    
    // Redirect after short delay
    setTimeout(() => {
        switch (role) {
            case 'admin':
                window.location.href = 'admin.html';
                break;
            case 'employee':
                window.location.href = 'employee.html';
                break;
            case 'customer':
                window.location.href = 'lookup.html';
                break;
            default:
                showError('Invalid user role. Please contact support.');
        }
    }, 1000);
}

// Utility functions for UI feedback
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.innerHTML = message;
        errorDiv.style.display = 'block';
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.innerHTML = message;
        successDiv.style.display = 'block';
    }
}

function clearMessages() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.innerHTML = '';
    }
    
    if (successDiv) {
        successDiv.style.display = 'none';
        successDiv.innerHTML = '';
    }
}

function setLoadingState(isLoading) {
    const button = document.getElementById('loginButton');
    const buttonText = document.querySelector('.button-text');
    const loading = document.querySelector('.loading');
    
    if (button && buttonText) {
        if (isLoading) {
            button.disabled = true;
            buttonText.textContent = 'Logging in...';
            if (loading) loading.style.display = 'inline-block';
        } else {
            button.disabled = false;
            buttonText.textContent = 'Log In';
            if (loading) loading.style.display = 'none';
        }
    }
}
