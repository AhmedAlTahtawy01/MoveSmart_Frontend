// Shared Layout JavaScript for Dashboard System

class SharedLayoutManager {
    constructor() {
        this.currentContent = 'home';
        this.userRole = null;
        this.userName = null;
        this.sidebarOverlay = null;
        
        this.init();
    }

    init() {
        // Check authentication and get user data
        if (!authManager.requireAuth()) {
            return;
        }

        const userData = authManager.getUserData();
        this.userRole = userData.role;
        this.userName = userData.name;

        // Redirect SuperUser to their own dashboard
        if (this.userRole === 'SuperUser') {
            window.location.href = 'superUserDashboard.html';
            return;
        }

        // Initialize layout
        this.setupUserInfo();
        this.setupRoleBasedMenu();
        this.setupEventListeners();
        this.setupMobileMenu();
        this.loadDefaultContent();
    }

    setupUserInfo() {
        // Update user name in topbar
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.userName) {
            userNameElement.textContent = this.userName;
        }

        // Update welcome message based on role
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            const roleMessages = {
                'GeneralManager': 'مرحبًا بك في لوحة تحكم المدير العام',
                'AdministrativeSupervisor': 'مرحبًا بك في لوحة تحكم المشرف الإداري',
                'GeneralSupervisor': 'مرحبًا بك في لوحة تحكم المشرف العام',
                'HospitalManager': 'مرحبًا بك في لوحة تحكم مدير المستشفى',
                'WorkshopSupervisor': 'مرحبًا بك في لوحة تحكم مشرف الورشة',
                'PatrolsSupervisor': 'مرحبًا بك في لوحة تحكم مشرف الدوريات'
            };
            
            welcomeMessage.textContent = roleMessages[this.userRole] || 'مرحبًا بك في نظام Move Smart';
        }
    }

    setupRoleBasedMenu() {
        const menuItems = document.querySelectorAll('.menu-item[data-roles]');
        
        menuItems.forEach(item => {
            const allowedRoles = item.getAttribute('data-roles').split(',');
            if (!allowedRoles.includes(this.userRole)) {
                item.style.display = 'none';
            }
        });
    }

    setupEventListeners() {
        // Logout button - prevent duplicate listeners
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton && !logoutButton.hasAttribute('data-listener-added')) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                    authManager.logout();
                }
            });
            logoutButton.setAttribute('data-listener-added', 'true');
        }

        // Search functionality
        const searchInput = document.querySelector('.search-container input');
        if (searchInput && !searchInput.hasAttribute('data-listener-added')) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
            searchInput.setAttribute('data-listener-added', 'true');
        }

        // Notification button
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn && !notificationBtn.hasAttribute('data-listener-added')) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
            notificationBtn.setAttribute('data-listener-added', 'true');
        }
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle && sidebar) {
            // Create overlay
            this.sidebarOverlay = document.createElement('div');
            this.sidebarOverlay.className = 'sidebar-overlay';
            document.body.appendChild(this.sidebarOverlay);

            // Menu toggle click
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });

            // Overlay click to close
            this.sidebarOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });

            // Close menu when window resizes to desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    this.closeMobileMenu();
                }
            });
        }
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && this.sidebarOverlay) {
            sidebar.classList.toggle('show');
            this.sidebarOverlay.classList.toggle('show');
        }
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && this.sidebarOverlay) {
            sidebar.classList.remove('show');
            this.sidebarOverlay.classList.remove('show');
        }
    }

    loadDefaultContent() {
        // Load role-specific dashboard content
        this.loadDashboardCards();
    }

    loadDashboardCards() {
        const dashboardGrid = document.getElementById('dashboard-grid');
        if (!dashboardGrid) return;

        // Define role-specific dashboard cards - removed reports
        const roleCards = {
            'GeneralManager': ['drivers', 'cars', 'orders', 'consumables', 'spareParts'],
            'AdministrativeSupervisor': ['drivers', 'cars', 'orders'],
            'GeneralSupervisor': ['drivers', 'cars', 'orders'],
            'HospitalManager': ['drivers', 'cars', 'orders', 'consumables', 'spareParts'],
            'WorkshopSupervisor': ['cars', 'orders', 'consumables', 'spareParts'],
            'PatrolsSupervisor': ['drivers', 'cars', 'orders']
        };

        const cards = roleCards[this.userRole] || ['drivers', 'cars', 'orders'];
        dashboardGrid.innerHTML = this.generateDashboardCards(cards);
    }

    async loadPageContent(pagePath) {
        const loadingIndicator = document.getElementById('loading-indicator');
        const dynamicContent = document.getElementById('dynamic-content');
        
        try {
            // Show loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            // Fetch the page content
            const response = await fetch(pagePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Extract content from the body tag (remove html, head, body tags)
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const bodyContent = doc.body.innerHTML;
            
            // Update dynamic content
            if (dynamicContent) {
                dynamicContent.innerHTML = bodyContent;
            }
            
            // Load page-specific CSS and JS based on page path
            await this.loadPageResources(pagePath);
            
            // Execute any scripts in the loaded content
            this.executeScripts(dynamicContent);
            
        } catch (error) {
            console.error('Error loading page content:', error);
            if (dynamicContent) {
                dynamicContent.innerHTML = `
                    <div class="error-message">
                        <h2>خطأ في التحميل</h2>
                        <p>عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.</p>
                        <button onclick="changeContent('home')" class="retry-btn">العودة للصفحة الرئيسية</button>
                    </div>
                `;
            }
        } finally {
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    async loadPageResources(pagePath) {
        // Define resource mappings for each page
        // Using absolute paths from server root to avoid relative path resolution issues
        const pageResources = {
            'car-Managment/carList.html': {
                cssPath: '/Final_Frontend/Assets/Styles/car-Managment/carList.css',
                jsPath: '/Final_Frontend/Javascript/car-Managment/carList.js'
            },
            'car-Managment/carDetails.html': {
                cssPath: '/Final_Frontend/Assets/Styles/car-Managment/carDetails.css',
                jsPath: '/Final_Frontend/Javascript/car-Managment/carDetails.js'
            },
            'chartsPage.html': {
                jsPath: '/Final_Frontend/Javascript/chartsPage.js'
            },
            'driver-Managment/driverList.html': {
                cssPath: '/Final_Frontend/Assets/Styles/driver-Managment/driverList.css',
                jsPath: '/Final_Frontend/Javascript/driver-Managment/driverList.js'
            },
            'driver-Managment/driverDetails.html': {
                cssPath: '/Final_Frontend/Assets/Styles/driver-Managment/driverDetails.css',
                jsPath: '/Final_Frontend/Javascript/driver-Managment/driverDetails.js'
            },
            'order-Managment/orderList.html': {
                cssPath: '/Final_Frontend/Assets/Styles/order-Managment/orderList.css',
                jsPath: '/Final_Frontend/Javascript/order-Managment/orderList.js'
            },
            'disposal-Managment/disposalList.html': {
                cssPath: '/Final_Frontend/Assets/Styles/disposal-Managment/disposalList.css',
                jsPath: '/Final_Frontend/Javascript/disposal-Managment/disposalList.js'
            },
            'disposal-Managment/spareParts.html': {
                cssPath: '/Final_Frontend/Assets/Styles/disposal-Managment/spareParts.css',
                jsPath: '/Final_Frontend/Javascript/disposal-Managment/spareParts.js'
            }
        };

        const resources = pageResources[pagePath];
        if (!resources) return;

        // 🔥 COMPLETE CSS CLEANUP - Remove ALL page-specific CSS to prevent conflicts
        const allPageCSSIds = [
            'css-car-Managment-carList-html',
            'css-car-Managment-carDetails-html',
            'css-driver-Managment-driverList-html',
            'css-driver-Managment-driverDetails-html',
            'css-order-Managment-orderList-html',
            'css-disposal-Managment-disposalList-html',
            'css-disposal-Managment-spareParts-html'
        ];
        
        allPageCSSIds.forEach(cssId => {
            const existingCSS = document.querySelector(`#${cssId}`);
            if (existingCSS) {
                existingCSS.remove();
                console.log(`🧹 Cleaned up CSS: ${cssId}`);
            }
        });

        // Load CSS file if specified
        if (resources.cssPath) {
            const cssId = `css-${pagePath.replace(/[\/\\]/g, '-')}`;
            
            try {
                const cssResponse = await fetch(resources.cssPath + '?t=' + Date.now());
                if (cssResponse.ok) {
                    const cssText = await cssResponse.text();
                    const style = document.createElement('style');
                    style.id = cssId;
                    style.textContent = cssText;
                    document.head.appendChild(style);
                    console.log(`✅ CSS loaded: ${resources.cssPath}`);
                    
                    // Force style recalculation for all pages
                    setTimeout(() => {
                        const container = document.querySelector('.container');
                        if (container) {
                            container.style.display = 'none';
                            container.offsetHeight; // Trigger reflow
                            container.style.display = '';
                            console.log(`🔧 Styles refreshed for: ${pagePath}`);
                        }
                        
                        // Special fix for carList styling conflicts
                        if (pagePath === 'car-Managment/carList.html') {
                            this.injectCarListStyleFix();
                        }
                    }, 100);
                } else {
                    console.error(`Failed to load CSS: ${resources.cssPath} - Status: ${cssResponse.status}`);
                }
            } catch (error) {
                console.warn(`Could not load CSS: ${resources.cssPath}`, error);
            }
        }

        // Load JS file if specified
        if (resources.jsPath) {
            const scriptId = `script-${pagePath.replace(/[\/\\]/g, '-')}`;
            const existingScript = document.querySelector(`#${scriptId}`);
            
            // ENHANCED CLEANUP: Remove ALL page-specific scripts to prevent conflicts
            const allPageScripts = [
                '#script-car-Managment-carList-html',
                '#script-driver-Managment-driverList-html',
                '#script-driver-Managment-driverDetails-html',
                '#script-order-Managment-orderList-html',
                '#script-disposal-Managment-disposalList-html',
                '#script-disposal-Managment-spareParts-html',
                '#script-chartsPage-html'
            ];
            
            allPageScripts.forEach(scriptSelector => {
                const script = document.querySelector(scriptSelector);
                if (script) {
                    script.remove();
                    console.log(`🧹 Removed script: ${scriptSelector}`);
                }
            });
            
            // Clear ALL potentially conflicting global variables
            const globalVarsToClean = [
                'allCars', 'driverPageCars', 'drivers', 'userRole', 'eventHandlersSetup',
                'loadCars', 'displayCars', 'loadDriver', 'displayDriver',
                'refreshData', 'searchDriver', 'filterDriver', 'openPop', 'closePop',
                'submitDriver', 'addDriver', 'validate', 'showFieldError',
                'currentDriverID', 'driverData', 'initializeDriverDetails', 'setupEventListeners',
                'showTab', 'loadDriverData', 'displayDriverData', 'saveDriverData', 'deleteDriver',
                'loadWorkHistory', 'loadSubstituteDrivers', 'loadDriverVacations', 'saveVacation',
                'deleteVacation', 'clearVacationForm', 'showLoading', 'showError', 'showSuccess',
                'goBackToDriverList'
            ];
            
            globalVarsToClean.forEach(varName => {
                if (window.hasOwnProperty(varName)) {
                    try {
                        // Check if property is configurable before deleting
                        const descriptor = Object.getOwnPropertyDescriptor(window, varName);
                        if (descriptor && descriptor.configurable !== false) {
                            delete window[varName];
                            console.log(`🧹 Cleaned global variable: ${varName}`);
                        } else {
                            // For non-configurable properties, set to undefined
                            window[varName] = undefined;
                            console.log(`🧹 Set to undefined: ${varName} (non-configurable)`);
                        }
                    } catch (error) {
                        // Fallback: just set to undefined if deletion fails
                        try {
                            window[varName] = undefined;
                            console.log(`🧹 Set to undefined: ${varName} (delete failed)`);
                        } catch (e) {
                            console.warn(`⚠️ Could not clean: ${varName}`, e);
                        }
                    }
                }
            });
            
            try {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = resources.jsPath + '?t=' + Date.now();
                script.async = true;
                script.onload = () => {
                    console.log(`✅ Successfully loaded: ${resources.jsPath}`);
                    
                    // Special initialization for driver list
                    if (pagePath === 'driver-Managment/driverList.html') {
                        // Manually trigger driver loading since DOMContentLoaded won't fire
                        setTimeout(() => {
                            const token = localStorage.getItem('token');
                            if (token) {
                                // Use a more specific check to ensure driver list functions are loaded
                                let attempts = 0;
                                const maxAttempts = 10;
                                
                                const initDriverList = () => {
                                    attempts++;
                                    
                                    // Check if driver list functions are available (not car list functions)
                                    if (window.loadDriver && window.loadCars && window.displayDriver) {
                                        console.log('🚗 Initializing driver list data...');
                                        
                                        // Call driver list functions specifically
                                        try {
                                            window.loadCars(); // Driver list version for dropdown
                                            window.loadDriver(); // Load drivers
                                        } catch (error) {
                                            console.error('Error initializing driver list:', error);
                                        }
                                    } else if (attempts < maxAttempts) {
                                        console.log(`⏳ Waiting for driver list functions... (${attempts}/${maxAttempts})`);
                                        setTimeout(initDriverList, 200);
                                    } else {
                                        console.error('❌ Driver list functions not available after maximum attempts');
                                    }
                                };
                                
                                initDriverList();
                            }
                        }, 300); // Increased delay to ensure script is fully loaded
                    }
                    
                    // Special initialization for driver details
                    else if (pagePath === 'driver-Managment/driverDetails.html') {
                        // Manually trigger driver details initialization since DOMContentLoaded won't fire
                        setTimeout(() => {
                            const token = localStorage.getItem('token');
                            if (token) {
                                // Use a more specific check to ensure driver details functions are loaded
                                let attempts = 0;
                                const maxAttempts = 10;
                                
                                const initDriverDetails = () => {
                                    attempts++;
                                    
                                    // Check if driver details functions are available
                                    if (window.initializeDriverDetails && typeof window.initializeDriverDetails === 'function') {
                                        console.log('👤 Initializing driver details page...');
                                        
                                        // Call driver details initialization function
                                        try {
                                            window.initializeDriverDetails();
                                        } catch (error) {
                                            console.error('Error initializing driver details:', error);
                                        }
                                    } else if (attempts < maxAttempts) {
                                        console.log(`⏳ Waiting for driver details functions... (${attempts}/${maxAttempts})`);
                                        setTimeout(initDriverDetails, 200);
                                    } else {
                                        console.error('❌ Driver details functions not available after maximum attempts');
                                    }
                                };
                                
                                initDriverDetails();
                            }
                        }, 300); // Increased delay to ensure script is fully loaded
                    }
                };
                script.onerror = () => {
                    console.error(`❌ Failed to load: ${resources.jsPath}`);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.warn(`Could not load JS: ${resources.jsPath}`, error);
            }
        }

        // For carList specifically, ensure styles are applied immediately
        if (pagePath === 'car-Managment/carList.html') {
            // Force style recalculation
            setTimeout(() => {
                const container = document.querySelector('.container');
                if (container) {
                    container.style.display = 'none';
                    container.offsetHeight; // Trigger reflow
                    container.style.display = '';
                    console.log('🔧 CarList styles refreshed');
                    
                    // Inject additional CSS reset for carList to override any conflicts
                    const carListReset = document.getElementById('carlist-style-reset');
                    if (carListReset) carListReset.remove();
                    
                    const resetStyle = document.createElement('style');
                    resetStyle.id = 'carlist-style-reset';
                    resetStyle.textContent = `
                        /* CarList Style Reset - Override any conflicts */
                        .container {
                            margin: 20px auto !important;
                            background: white !important;
                            padding: 20px !important;
                            border-radius: 10px !important;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1) !important;
                            direction: rtl !important;
                            background-color: #f8f8f8 !important;
                            text-align: right !important;
                            width: auto !important;
                        }
                        
                        .actions {
                            display: flex !important;
                            justify-content: space-between !important;
                            align-items: center !important;
                            gap: 10px !important;
                            margin-top: 20px !important;
                            flex-wrap: wrap !important;
                            position: relative !important;
                            top: 0 !important;
                        }
                        
                        .actions button {
                            background-color: #333 !important;
                            color: white !important;
                            padding: 8px 12px !important;
                            border: none !important;
                            border-radius: 5px !important;
                            cursor: pointer !important;
                            white-space: nowrap !important;
                            width: auto !important;
                            box-shadow: none !important;
                            transition: none !important;
                            transform: none !important;
                        }
                        
                        .actions button:hover {
                            background-color: #555 !important;
                            transform: none !important;
                        }
                        
                        .table-header {
                            background: black !important;
                            padding: 10px !important;
                            margin-top: 8px !important;
                        }
                    `;
                    document.head.appendChild(resetStyle);
                    console.log('🎯 CarList style reset injected');
                }
            }, 100);
        } else {
            // Remove carList reset for other pages
            setTimeout(() => {
                const carListReset = document.getElementById('carlist-style-reset');
                if (carListReset) {
                    carListReset.remove();
                    console.log('🧹 CarList style reset removed');
                }
            }, 50);
        }
    }

    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            // Skip scripts that might interfere with logout or other global handlers
            const scriptContent = script.textContent || '';
            
            // Only skip logout-related scripts, not all scripts with addEventListener
            if (scriptContent.includes('logoutButton') || 
                (scriptContent.includes('logout') && scriptContent.includes('addEventListener'))) {
                console.log('Skipping script that might add duplicate logout event listeners');
                return;
            }

            // Only execute scripts with src (external) or specific safe inline scripts
            if (script.src) {
                // Check if this script is already loaded
                if (!document.querySelector(`script[src="${script.src}"]`)) {
                    const newScript = document.createElement('script');
                    newScript.src = script.src;
                    newScript.async = true;
                    document.head.appendChild(newScript);
                }
            } else if (script.textContent) {
                // Execute inline scripts (needed for driver list and other pages)
                try {
                    eval(script.textContent);
                } catch (error) {
                    console.warn('Error executing inline script:', error);
                }
            }
        });
    }

    generateDashboardCards(cardTypes) {
        const cardTemplates = {
            drivers: `
                <div class="card">
                    <span class="edit-icon">✏️</span>
                    <h2>نظرة عامة على السائقين</h2>
                    <div class="card-content">
                        <canvas id="driverChart"></canvas>
                        <div class="card-details">
                            <table class="card-table">
                                <tr><td>إجمالي السائقين</td><td id="total-drivers">0</td></tr>
                                <tr><td>أمر شغل <span class="dot orange"></span></td><td id="working-drivers">0</td></tr>
                                <tr><td>متاح <span class="dot green"></span></td><td id="available-drivers">0</td></tr>
                                <tr><td>إجازة <span class="dot red"></span></td><td id="onleave-drivers">0</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            `,
            cars: `
                <div class="card">
                    <span class="edit-icon">✏️</span>
                    <h2>نظرة عامة على السيارات</h2>
                    <div class="card-content">
                        <canvas id="carChart"></canvas>
                        <div class="card-details">
                            <table class="card-table">
                                <tr><td>إجمالي السيارات</td><td id="total-cars">0</td></tr>
                                <tr><td>طور الصيانة <span class="dot orange"></span></td><td id="cars-maintenance">0</td></tr>
                                <tr><td>متاح <span class="dot green"></span></td><td id="cars-available">0</td></tr>
                                <tr><td>أمر شغل <span class="dot red"></span></td><td id="cars-working">0</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            `,
            orders: `
                <div class="card">
                    <span class="edit-icon">✏️</span>
                    <h2>الطلبات</h2>
                    <div class="card-content">
                        <canvas id="orderChart"></canvas>
                        <div class="card-details">
                            <table class="card-table">
                                <tr><td>إجمالي الطلبات</td><td id="total-orders">0</td></tr>
                                <tr><td>انتظار <span class="dot orange"></span></td><td id="orders-pending">0</td></tr>
                                <tr><td>موافقة <span class="dot green"></span></td><td id="orders-approved">0</td></tr>
                                <tr><td>مرفوض <span class="dot red"></span></td><td id="orders-rejected">0</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            `,
            consumables: `
                <div class="card">
                    <span class="edit-icon">✏️</span>
                    <h2>المستهلكات</h2>
                    <div class="card-content">
                        <canvas id="consumableChart"></canvas>
                        <div class="card-details">
                            <table class="card-table">
                                <tr><td>إجمالي المستهلكات</td><td id="total-consumables">0</td></tr>
                                <tr><td>متوفر <span class="dot green"></span></td><td id="consumables-available">0</td></tr>
                                <tr><td>مستهلك <span class="dot red"></span></td><td id="consumables-used">0</td></tr>
                                <tr><td>في الطلب <span class="dot orange"></span></td><td id="consumables-inorder">0</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            `,
            spareParts: `
                <div class="card">
                    <span class="edit-icon">✏️</span>
                    <h2>قطع الغيار</h2>
                    <div class="card-content">
                        <canvas id="sparePartChart"></canvas>
                        <div class="card-details">
                            <table class="card-table">
                                <tr><td>إجمالي قطع الغيار</td><td id="total-spareParts">0</td></tr>
                                <tr><td>متوفر <span class="dot green"></span></td><td id="spareParts-available">0</td></tr>
                                <tr><td>مستهلك <span class="dot red"></span></td><td id="spareParts-used">0</td></tr>
                                <tr><td>في الطلب <span class="dot orange"></span></td><td id="spareParts-inorder">0</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            `
        };

        return cardTypes.map(type => cardTemplates[type] || '').join('');
    }

    handleSearch(query) {
        if (query.trim()) {
            dashboardUtils.showNotification(`البحث عن: ${query}`, 'info');
            // Implement search functionality here
        }
    }

    showNotifications() {
        dashboardUtils.showNotification('لا توجد إشعارات جديدة', 'info');
        // Implement notifications functionality here
    }

    // Special method to fix carList styling conflicts
    injectCarListStyleFix() {
        // Remove any existing carList style fix
        const existingFix = document.getElementById('carlist-style-fix');
        if (existingFix) existingFix.remove();
        
        // Inject specific styles to override conflicts
        const styleFix = document.createElement('style');
        styleFix.id = 'carlist-style-fix';
        styleFix.textContent = `
            /* CarList Style Fix - Override any conflicts from other pages */
            .container {
                margin: 20px auto !important;
                background: white !important;
                padding: 20px !important;
                border-radius: 10px !important;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1) !important;
                direction: rtl !important;
                background-color: #f8f8f8 !important;
                text-align: right !important;
                width: auto !important;
            }
            
            .actions {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                gap: 10px !important;
                margin-top: 20px !important;
                flex-wrap: wrap !important;
                position: relative !important;
                top: 0 !important;
            }
            
            .actions button {
                background-color: #333 !important;
                color: white !important;
                padding: 8px 12px !important;
                border: none !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                white-space: nowrap !important;
                width: auto !important;
                box-shadow: none !important;
                transition: none !important;
                transform: none !important;
            }
            
            .actions button:hover {
                background-color: #555 !important;
                transform: none !important;
            }
            
            .actions input {
                flex-grow: 1 !important;
                padding: 8px 12px !important;
                border: 1px solid #ddd !important;
                border-radius: 5px !important;
            }
            
            .actions select {
                padding: 8px !important;
                border: 1px solid #ddd !important;
                border-radius: 5px !important;
                background: white !important;
                cursor: pointer !important;
            }
            
            .table-header {
                background: black !important;
                padding: 10px !important;
                margin-top: 8px !important;
                margin-bottom: 10px !important;
            }
            
            h2 {
                margin-bottom: 10px !important;
                color: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
            }
            
            .total-cars {
                color: gray !important;
                font-size: 14px !important;
            }
        `;
        document.head.appendChild(styleFix);
        console.log('🎯 CarList style fix injected successfully');
    }
}

// Global functions for menu interactions
async function changeContent(contentType) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-content="${contentType}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Close mobile menu if open
    if (window.sharedLayout) {
        window.sharedLayout.closeMobileMenu();
    }

    const defaultContent = document.getElementById('default-content');
    const dynamicContent = document.getElementById('dynamic-content');

    // Handle content change based on type
    switch (contentType) {
        case 'home':
            // Show charts page
            if (defaultContent) defaultContent.style.display = 'none';
            if (dynamicContent) dynamicContent.style.display = 'block';
            await window.sharedLayout.loadPageContent('chartsPage.html');
            break;
        case 'vehicles':
            // Load car list page
            if (defaultContent) defaultContent.style.display = 'none';
            if (dynamicContent) dynamicContent.style.display = 'block';
            await window.sharedLayout.loadPageContent('car-Managment/carList.html');
            break;
        case 'drivers':
            // Load driver list page
            if (defaultContent) defaultContent.style.display = 'none';
            if (dynamicContent) dynamicContent.style.display = 'block';
            await window.sharedLayout.loadPageContent('driver-Managment/driverList.html');
            break;
        case 'applications':
            // Load order list page
            if (defaultContent) defaultContent.style.display = 'none';
            if (dynamicContent) dynamicContent.style.display = 'block';
            await window.sharedLayout.loadPageContent('order-Managment/orderList.html');
            break;
        case 'consumables':
            // Load disposal list page
            if (defaultContent) defaultContent.style.display = 'none';
            if (dynamicContent) dynamicContent.style.display = 'block';
            await window.sharedLayout.loadPageContent('disposal-Managment/disposalList.html');
            break;
        case 'spareParts':
            // Load spare parts page
            if (defaultContent) defaultContent.style.display = 'none';
            if (dynamicContent) dynamicContent.style.display = 'block';
            await window.sharedLayout.loadPageContent('disposal-Managment/spareParts.html');
            break;
        default:
            showDefaultContent();
    }
}

function showDefaultContent() {
    const defaultContent = document.getElementById('default-content');
    const dynamicContent = document.getElementById('dynamic-content');
    
    if (defaultContent && dynamicContent) {
        defaultContent.style.display = 'block';
        dynamicContent.style.display = 'none';
    }
}

function createOrder() {
    dashboardUtils.showNotification('فتح نموذج إنشاء طلب جديد', 'info');
    // Implement create order functionality here
    // This could open a modal or redirect to create order page
}

// Initialize shared layout when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.sharedLayout = new SharedLayoutManager();
});

// CSS for dashboard cards and loading indicator
const additionalStyles = `
<style>
.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.card h2 {
    font-size: 18px;
    margin-bottom: 16px;
    color: #333;
}

.edit-icon {
    float: left;
    cursor: pointer;
    font-size: 16px;
    opacity: 0.6;
    transition: opacity 0.3s ease;
}

.edit-icon:hover {
    opacity: 1;
}

.card-content {
    display: flex;
    gap: 20px;
    align-items: center;
}

.card-details {
    flex: 1;
}

.card-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 8px;
}

.card-table td {
    padding: 4px 8px;
    font-size: 14px;
}

.card-table td:first-child {
    text-align: right;
    color: #666;
}

.card-table td:last-child {
    text-align: left;
    font-weight: bold;
    color: #333;
}

.dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin: 0 4px;
}

.dot.orange { background-color: #ff9800; }
.dot.green { background-color: #4caf50; }
.dot.red { background-color: #f44336; }

canvas {
    max-width: 120px;
    max-height: 120px;
}

.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-message {
    text-align: center;
    padding: 40px;
    color: #666;
}

.error-message h2 {
    color: #dc3545;
    margin-bottom: 16px;
}

.retry-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 16px;
}

.retry-btn:hover {
    background-color: #0056b3;
}

@media (max-width: 768px) {
    .card-content {
        flex-direction: column;
        gap: 12px;
    }
    
    canvas {
        max-width: 100px;
        max-height: 100px;
    }
}
</style>
`;

// Inject additional styles if not already present
if (!document.querySelector('#additional-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'additional-styles';
    styleElement.innerHTML = additionalStyles;
    document.head.appendChild(styleElement);
}
