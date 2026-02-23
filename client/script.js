// Frontend JavaScript for KODBANK App
// Handles login, dashboard interactions, and API calls

// Check if we're on login page or dashboard
const isLoginPage = window.location.pathname === '/' || window.location.pathname.includes('login.html');
const isDashboardPage = window.location.pathname.includes('dashboard.html');

// Login functionality
if (isLoginPage) {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            showMessage('Please enter your email', 'error');
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                showMessage(`Welcome ${data.customer_name}! Redirecting...`, 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                showMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Network error. Please try again.', 'error');
        }
    });
}

// Dashboard functionality
if (isDashboardPage) {
    // Check balance function
    window.checkBalance = async function() {
        const messageDiv = document.getElementById('message');
        const balanceAmount = document.getElementById('balanceAmount');
        const welcomeText = document.getElementById('welcomeText');

        try {
            const response = await fetch('/check-balance', {
                method: 'GET',
                credentials: 'include'  // Include cookies
            });

            const data = await response.json();

            if (data.success) {
                balanceAmount.textContent = `₹${data.balance.toFixed(2)}`;
                welcomeText.textContent = `Welcome, ${data.customer_name}!`;
                showMessage('Balance updated successfully', 'success');
            } else {
                if (response.status === 401) {
                    showMessage('Session expired. Please login again.', 'error');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else {
                    showMessage(data.message || 'Failed to fetch balance', 'error');
                }
            }
        } catch (error) {
            console.error('Check balance error:', error);
            showMessage('Network error. Please try again.', 'error');
        }
    };

    // Toggle transfer form
    window.toggleTransfer = function() {
        const transferSection = document.getElementById('transferSection');
        transferSection.classList.toggle('show');
    };

    // Transfer money function
    const transferForm = document.getElementById('transferForm');
    transferForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const receiverId = parseInt(document.getElementById('receiverId').value);
        const amount = parseFloat(document.getElementById('amount').value);

        if (!receiverId || !amount || amount <= 0) {
            showMessage('Please enter valid receiver ID and amount', 'error');
            return;
        }

        try {
            const response = await fetch('/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',  // Include cookies
                body: JSON.stringify({
                    receiver_id: receiverId,
                    amount: amount
                })
            });

            const data = await response.json();

            if (data.success) {
                showMessage(
                    `Transfer successful! ₹${data.transfer_amount} transferred to ${data.receiver_name}. New balance: ₹${data.new_balance.toFixed(2)}`,
                    'success'
                );
                // Update balance display
                document.getElementById('balanceAmount').textContent = `₹${data.new_balance.toFixed(2)}`;
                // Reset form
                transferForm.reset();
                // Hide transfer section
                document.getElementById('transferSection').classList.remove('show');
            } else {
                if (response.status === 401) {
                    showMessage('Session expired. Please login again.', 'error');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else {
                    showMessage(data.message || 'Transfer failed', 'error');
                }
            }
        } catch (error) {
            console.error('Transfer error:', error);
            showMessage('Network error. Please try again.', 'error');
        }
    });

    // Logout function
    window.logout = function() {
        // Clear cookie by setting it to expire
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login.html';
    };

    // Auto-check balance on page load
    window.addEventListener('load', () => {
        checkBalance();
    });
}

// Utility function to show messages
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 5000);
}
