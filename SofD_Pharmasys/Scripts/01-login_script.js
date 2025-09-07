<!-- Papa Parse CDN for CSV parsing -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>

    <script>
        class LoginManager {
            constructor() {
                this.loginForm = document.getElementById('loginForm');
                this.usernameInput = document.getElementById('username');
                this.passwordInput = document.getElementById('password');
                this.loginButton = document.getElementById('loginButton');
                this.errorMessage = document.getElementById('errorMessage');
                this.successMessage = document.getElementById('successMessage');
                this.csvFileInput = document.getElementById('csvFile');
                this.csvUpload = document.getElementById('csvUpload');
                this.downloadSampleLink = document.getElementById('downloadSample');
                this.userCount = document.getElementById('userCount');
                this.statusIndicator = document.getElementById('statusIndicator');
                this.statusText = document.getElementById('statusText');
                this.demoInfo = document.getElementById('demoInfo');
                this.demoCredentials = document.getElementById('demoCredentials');
                
                this.validUsers = [];
                this.systemReady = false;
                
                this.init();
            }

            init() {
                this.addEventListeners();
                this.generateSampleCSV();
                this.updateSystemStatus();
            }

            addEventListeners() {
                // File upload
                this.csvFileInput.addEventListener('change', (e) => {
                    this.handleFileSelect(e);
                });

                // Download sample
                this.downloadSampleLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.downloadSampleCSV();
                });

                // Form submission
                this.loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (this.systemReady) {
                        this.handleLogin();
                    }
                });

                // Handle enter key in inputs
                [this.usernameInput, this.passwordInput].forEach(input => {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && this.systemReady) {
                            this.handleLogin();
                        }
                    });
                });

                // Clear messages when user starts typing
                [this.usernameInput, this.passwordInput].forEach(input => {
                    input.addEventListener('input', () => {
                        this.hideMessages();
                    });
                });

                // Handle sign up links
                document.querySelectorAll('#signupLink, #signupLinkBottom').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.handleSignUp();
                    });
                });
            }

            handleFileSelect(event) {
                const file = event.target.files[0];
                if (!file) return;

                if (!file.name.toLowerCase().endsWith('.csv')) {
                    this.showError('Please select a valid CSV file.');
                    return;
                }

                this.hideMessages();
                this.setSystemStatus('loading', 'Loading user credentials...');

                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: false,
                    complete: (results) => {
                        this.processCsvData(results.data);
                    },
                    error: (error) => {
                        this.showError(`Error parsing CSV: ${error.message}`);
                        this.setSystemStatus('error', 'Failed to load credentials');
                    }
                });
            }

            processCsvData(data) {
                try {
                    // Validate required columns
                    const requiredColumns = ['username', 'password', 'role', 'fullName', 'email'];

                    if (data.length === 0) {
                        throw new Error('CSV file is empty');
                    }

                    const headers = Object.keys(data[0]);
                    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
                    
                    if (missingColumns.length > 0) {
                        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
                    }

                    // Process and validate user data
                    this.validUsers = data.map((row, index) => {
                        return this.processUserRow(row, index);
                    }).filter(user => user !== null);

                    if (this.validUsers.length === 0) {
                        throw new Error('No valid user records found in CSV');
                    }

                    this.loadUsersSuccess();

                } catch (error) {
                    this.showError(error.message);
                    this.setSystemStatus('error', 'Failed to load credentials');
                }
            }

            processUserRow(row, index) {
                try {
                    const user = {};

                    // Validate and process each field
                    user.username = (row.username || '').toString().trim();
                    user.password = (row.password || '').toString().trim();
                    user.role = (row.role || '').toString().trim();
                    user.fullName = (row.fullName || '').toString().trim();
                    user.email = (row.email || '').toString().trim();
                    user.active = (row.active || 'true').toString().toLowerCase() === 'true';
                    user.lastLogin = row.lastLogin ? new Date(row.lastLogin) : null;

                    // Basic validation
                    if (!user.username || user.username.length < 3) {
                        throw new Error(`Invalid username on row ${index + 2}`);
                    }
                    if (!user.password || user.password.length < 6) {
                        throw new Error(`Invalid password on row ${index + 2}`);
                    }
                    if (!user.role) {
                        throw new Error(`Missing role on row ${index + 2}`);
                    }

                    return user;

                } catch (error) {
                    console.warn(`Row ${index + 2} error: ${error.message}`);
                    return null;
                }
            }

            loadUsersSuccess() {
                this.csvUpload.classList.add('loaded');
                this.userCount.textContent = `${this.validUsers.length} user(s) loaded successfully`;
                this.setSystemStatus('ready', `System ready - ${this.validUsers.length} users loaded`);
                
                // Show demo credentials
                this.showDemoCredentials();
                
                // Enable form inputs
                this.enableForm();
                
                this.showSuccess(`Successfully loaded ${this.validUsers.length} user accounts!`);
            }

            showDemoCredentials() {
                // Show first few users as examples (without passwords for security)
                const examples = this.validUsers.slice(0, 3).map(user => 
                    `${user.username} (${user.role})`
                ).join(' | ');
                
                this.demoCredentials.textContent = examples + (this.validUsers.length > 3 ? ' | ...' : '');
                this.demoInfo.style.display = 'block';
            }

            enableForm() {
                this.systemReady = true;
                this.usernameInput.disabled = false;
                this.passwordInput.disabled = false;
                this.loginButton.disabled = false;
            }

            setSystemStatus(status, message) {
                this.statusText.textContent = message;
                this.statusIndicator.className = 'status-indicator';
                
                if (status === 'ready') {
                    this.statusIndicator.classList.add('ready');
                }
            }

            async handleLogin() {
                if (!this.systemReady) {
                    this.showError('Please load user credentials first.');
                    return;
                }

                const username = this.usernameInput.value.trim();
                const password = this.passwordInput.value;

                // Basic validation
                if (!username || !password) {
                    this.showError('Please fill in all fields.');
                    return;
                }

                this.setLoading(true);
                this.hideMessages();

                try {
                    // Simulate API call delay
                    await this.delay(1500);

                    // Check credentials against loaded users
                    const user = this.validUsers.find(u => 
                        u.username === username && 
                        u.password === password && 
                        u.active
                    );

                    if (user) {
                        // Update last login (in real app, this would be saved back to server)
                        user.lastLogin = new Date();
                        
                        this.showSuccess(`Welcome back, ${user.fullName}!`);
                        
                        // Store user session
                        const userSession = {
                            username: user.username,
                            fullName: user.fullName,
                            role: user.role,
                            email: user.email,
                            loginTime: new Date().toISOString()
                        };
                        
                        setTimeout(() => {
                            this.redirectToDashboard(userSession);
                        }, 1500);
                    } else {
                        // Check if user exists but is inactive
                        const inactiveUser = this.validUsers.find(u => 
                            u.username === username && u.password === password && !u.active
                        );
                        
                        if (inactiveUser) {
                            this.showError('Account is inactive. Please contact administrator.');
                        } else {
                            this.showError('Invalid username or password. Please try again.');
                        }
                    }
                } catch (error) {
                    this.showError('Login failed. Please try again.');
                } finally {
                    this.setLoading(false);
                }
            }

            handleSignUp() {
                alert('Sign Up functionality would redirect to a registration page.\n\nFor this demo, please load a CSV file with user credentials.');
            }

            redirectToDashboard(userSession) {
                const message = `Login successful!\n\nUser: ${userSession.fullName}\nUsername: ${userSession.username}\nRole: ${userSession.role}\nEmail: ${userSession.email}\n\nYou would now be redirected to the Drug Inventory Management dashboard.`;
                
                if (confirm(message + '\n\nClick OK to see a demo dashboard simulation.')) {
                    window.userSession = userSession;
                    this.simulateDashboardRedirect();
                }
            }

            simulateDashboardRedirect() {
                document.body.innerHTML = `
                    <div style="
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        font-family: 'Segoe UI', sans-serif;
                        text-align: center;
                    ">
                        <div style="max-width: 600px; padding: 40px;">
                            <h1 style="font-size: 2.5rem; margin-bottom: 20px;">🎉 Login Successful!</h1>
                            <p style="font-size: 1.2rem; margin-bottom: 30px;">
                                Welcome to the Drug Inventory Management System
                            </p>
                            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 30px; text-align: left;">
                                <p><strong>Name:</strong> ${window.userSession.fullName}</p>
                                <p><strong>Username:</strong> ${window.userSession.username}</p>
                                <p><strong>Role:</strong> ${window.userSession.role}</p>
                                <p><strong>Email:</strong> ${window.userSession.email}</p>
                                <p><strong>Login Time:</strong> ${new Date(window.userSession.loginTime).toLocaleString()}</p>
                            </div>
                            <button onclick="location.reload()" style="
                                background: #00d4aa;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 6px;
                                font-size: 16px;
                                cursor: pointer;
                                font-weight: 600;
                            ">
                                Back to Login
                            </button>
                        </div>
                    </div>
                `;
            }

            setLoading(isLoading) {
                this.loginButton.classList.toggle('loading', isLoading);
                this.loginButton.disabled = isLoading;
                
                const buttonText = this.loginButton.querySelector('.button-text');
                buttonText.textContent = isLoading ? 'Logging In...' : 'Log In';
            }

            showError(message) {
                this.errorMessage.textContent = message;
                this.errorMessage.style.display = 'block';
                this.successMessage.style.display = 'none';
            }

            showSuccess(message) {
                this.successMessage.textContent = message;
                this.successMessage.style.display = 'block';
                this.errorMessage.style.display = 'none';
            }

            hideMessages() {
                this.errorMessage.style.display = 'none';
                this.successMessage.style.display = 'none';
            }

            delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            generateSampleCSV() {
                this.sampleCsvData = `username,password,role,fullName,email,active,lastLogin
admin,admin123,Administrator,System Administrator,admin@pharmasys.com,true,2024-09-01
pharmacist,pharma2024,Pharmacist,Dr. Maria Santos,maria.santos@pharmasys.com,true,2024-08-28
manager,manager2024,Manager,John Rodriguez,john.rodriguez@pharmasys.com,true,2024-08-30
cashier,cashier123,Cashier,Ana Garcia,ana.garcia@pharmasys.com,true,2024-09-02
inventory,inventory2024,Inventory Clerk,Carlos Mendez,carlos.mendez@pharmasys.com,true,2024-08-25
supervisor,super2024,Supervisor,Lisa Chen,lisa.chen@pharmasys.com,true,2024-09-03
technician,tech2024,Pharmacy Technician,Miguel Torres,miguel.torres@pharmasys.com,false,2024-07-15`;
            }

            downloadSampleCSV() {
                const blob = new Blob([this.sampleCsvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'pharmasys_users_sample.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            updateSystemStatus() {
                if (this.validUsers.length === 0) {
                    this.setSystemStatus('error', 'System not ready - Please load user credentials');
                }
            }
        }

        // Initialize the login manager when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            new LoginManager();
        });
    </script>