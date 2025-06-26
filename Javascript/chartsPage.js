// Charts Page JavaScript - Based on old dashboard functionality
document.addEventListener("DOMContentLoaded", async function () {
    console.log("🔄 ChartsPage: DOM loaded, starting initialization...");
    
    const token = localStorage.getItem("token");
    console.log("🔑 Token exists:", !!token);
    
    if (!token) {
        console.error("❌ No authentication token found, redirecting to login");
        window.location.href = "../login.html";
        return;
    }

    // Show loading overlay
    showLoading();

    try {
        console.log("📊 Starting dashboard data load...");
        await loadAllDashboardData();
        hideLoading();
        console.log("✅ Dashboard data loaded successfully");
    } catch (error) {
        console.error("❌ Failed to load dashboard data:", error);
        hideLoading();
        showError("فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.");
    }
});

// API Base URL
const API_BASE_URL = "https://movesmartapi.runasp.net/api";

// Global chart instances to avoid memory leaks
const chartInstances = {};

// Main function to load all dashboard data
async function loadAllDashboardData() {
    const token = localStorage.getItem("token");
    const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    console.log("🌐 API Headers:", headers);

    try {
        console.log("📡 Starting parallel API calls...");
        
        // Load all data in parallel for better performance
        const [driversData, carsData, ordersData, consumablesData, sparePartsData, reportsData] = await Promise.allSettled([
            loadDriversData(headers),
            loadCarsData(headers),
            loadOrdersData(headers),
            loadConsumablesData(headers),
            loadSparePartsData(headers),
            loadReportsData(headers)
        ]);

        console.log("📊 API Results Summary:");
        console.log("- Drivers:", driversData.status, driversData.status === 'fulfilled' ? `${driversData.value?.length || 0} items` : driversData.reason);
        console.log("- Cars:", carsData.status, carsData.status === 'fulfilled' ? `${carsData.value?.length || 0} items` : carsData.reason);
        console.log("- Orders:", ordersData.status, ordersData.status === 'fulfilled' ? `${ordersData.value?.length || 0} items` : ordersData.reason);
        console.log("- Consumables:", consumablesData.status, consumablesData.status === 'fulfilled' ? `${consumablesData.value?.length || 0} items` : consumablesData.reason);
        console.log("- Spare Parts:", sparePartsData.status, sparePartsData.status === 'fulfilled' ? `${sparePartsData.value?.length || 0} items` : sparePartsData.reason);

        // Process each data set and create charts
        processDriversData(driversData);
        processCarsData(carsData);
        processOrdersData(ordersData);
        processConsumablesData(consumablesData);
        processSparePartsData(sparePartsData);
        processReportsData(reportsData);

    } catch (error) {
        console.error("💥 Critical error loading dashboard data:", error);
        throw error;
    }
}

// Load Drivers Data
async function loadDriversData(headers) {
    const url = `${API_BASE_URL}/Drivers/All`;
    console.log("🚗 Fetching drivers from:", url);
    
    try {
        const response = await fetch(url, { headers });
        console.log("🚗 Drivers response status:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("🚗 Raw drivers data:", data);
        
        const result = data.$values || data || [];
        console.log("🚗 Processed drivers data:", result);
        return result;
    } catch (error) {
        console.error("❌ Error loading drivers data:", error);
        return [];
    }
}

// Load Cars Data
async function loadCarsData(headers) {
    const url = `${API_BASE_URL}/Vehicles/All`;
    console.log("🚙 Fetching vehicles from:", url);
    
    try {
        const response = await fetch(url, { headers });
        console.log("🚙 Vehicles response status:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("🚙 Raw vehicles data:", data);
        
        const result = data.$values || data || [];
        console.log("🚙 Processed vehicles data:", result);
        return result;
    } catch (error) {
        console.error("❌ Error loading cars data:", error);
        return [];
    }
}

// Load Orders Data
async function loadOrdersData(headers) {
    const url = `${API_BASE_URL}/Requests`;
    console.log("📋 Fetching orders from:", url);
    
    try {
        const response = await fetch(url, { headers });
        console.log("📋 Orders response status:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("📋 Raw orders data:", data);
        
        const result = data.$values || data || [];
        console.log("📋 Processed orders data:", result);
        return result;
    } catch (error) {
        console.error("❌ Error loading orders data:", error);
        return [];
    }
}

// Load Consumables Data
async function loadConsumablesData(headers) {
    const url = `${API_BASE_URL}/ConsumableReplacement`;
    console.log("🔧 Fetching consumables from:", url);
    
    try {
        const response = await fetch(url, { headers });
        console.log("🔧 Consumables response status:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("🔧 Raw consumables data:", data);
        
        const result = data.$values || data || [];
        console.log("🔧 Processed consumables data:", result);
        return result;
    } catch (error) {
        console.error("❌ Error loading consumables data:", error);
        return [];
    }
}

// Load Spare Parts Data
async function loadSparePartsData(headers) {
    const url = `${API_BASE_URL}/SparePart`;
    console.log("⚙️ Fetching spare parts from:", url);
    
    try {
        const response = await fetch(url, { headers });
        console.log("⚙️ Spare parts response status:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("⚙️ Raw spare parts data:", data);
        
        const result = data.$values || data || [];
        console.log("⚙️ Processed spare parts data:", result);
        return result;
    } catch (error) {
        console.error("❌ Error loading spare parts data:", error);
        return [];
    }
}

// Load Reports Data (mock data for now)
async function loadReportsData(headers) {
    console.log("📈 Loading reports data (mock)");
    // Mock data since reports API might not be available
    return {
        drivers: 15,
        vehicles: 25,
        orders: 40
    };
}

// Process Drivers Data
function processDriversData(driversResult) {
    console.log("👥 Processing drivers data:", driversResult);
    const drivers = driversResult.status === 'fulfilled' ? driversResult.value : [];
    
    const totalDrivers = drivers.length;
    const workingDrivers = drivers.filter(d => d.status === 1).length;
    const availableDrivers = drivers.filter(d => d.status === 0).length;
    const onLeaveDrivers = drivers.filter(d => d.status === 2).length;

    console.log("👥 Drivers stats:", { totalDrivers, workingDrivers, availableDrivers, onLeaveDrivers });

    // Update UI
    updateElement("total-drivers", totalDrivers);
    updateElement("working-drivers", workingDrivers);
    updateElement("available-drivers", availableDrivers);
    updateElement("onleave-drivers", onLeaveDrivers);

    // Create chart
    drawChart("driverChart", [workingDrivers, availableDrivers, onLeaveDrivers], 
              ["أمر شغل", "متاح", "إجازة"], ["#FFA500", "#28a745", "#dc3545"]);
}

// Process Cars Data
function processCarsData(carsResult) {
    console.log("🚗 Processing cars data:", carsResult);
    const cars = carsResult.status === 'fulfilled' ? carsResult.value : [];
    
    const totalCars = cars.length;
    const maintenanceCars = cars.filter(c => c.status === 2).length;
    const availableCars = cars.filter(c => c.status === 0).length;
    const workingCars = cars.filter(c => c.status === 1).length;

    console.log("🚗 Cars stats:", { totalCars, maintenanceCars, availableCars, workingCars });

    // Update UI
    updateElement("total-cars", totalCars);
    updateElement("cars-maintenance", maintenanceCars);
    updateElement("cars-available", availableCars);
    updateElement("cars-working", workingCars);

    // Create chart
    drawChart("carChart", [maintenanceCars, availableCars, workingCars], 
              ["طور الصيانة", "متاح", "أمر شغل"], ["#FFA500", "#28a745", "#dc3545"]);
}

// Process Orders Data
function processOrdersData(ordersResult) {
    console.log("📋 Processing orders data:", ordersResult);
    const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 0).length;
    const approvedOrders = orders.filter(o => o.status === 1).length;
    const rejectedOrders = orders.filter(o => o.status === 2).length;

    console.log("📋 Orders stats:", { totalOrders, pendingOrders, approvedOrders, rejectedOrders });

    // Update UI
    updateElement("total-orders", totalOrders);
    updateElement("orders-pending", pendingOrders);
    updateElement("orders-approved", approvedOrders);
    updateElement("orders-rejected", rejectedOrders);

    // Create chart
    drawChart("orderChart", [pendingOrders, approvedOrders, rejectedOrders], 
              ["انتظار", "موافقة", "مرفوض"], ["#FFA500", "#28a745", "#dc3545"]);
}

// Process Consumables Data
function processConsumablesData(consumablesResult) {
    console.log("🔧 Processing consumables data:", consumablesResult);
    const consumables = consumablesResult.status === 'fulfilled' ? consumablesResult.value : [];
    
    const totalConsumables = consumables.length;
    const availableConsumables = consumables.filter(c => c.status === 0).length;
    const usedConsumables = consumables.filter(c => c.status === 1).length;
    const inOrderConsumables = consumables.filter(c => c.status === 2).length;

    console.log("🔧 Consumables stats:", { totalConsumables, availableConsumables, usedConsumables, inOrderConsumables });

    // Update UI
    updateElement("total-consumables", totalConsumables);
    updateElement("consumables-available", availableConsumables);
    updateElement("consumables-used", usedConsumables);
    updateElement("consumables-inorder", inOrderConsumables);

    // Create chart
    drawChart("consumableChart", [availableConsumables, usedConsumables, inOrderConsumables], 
              ["متوفر", "مستهلك", "في الطلب"], ["#28a745", "#dc3545", "#FFA500"]);
}

// Process Spare Parts Data
function processSparePartsData(sparePartsResult) {
    console.log("⚙️ Processing spare parts data:", sparePartsResult);
    const spareParts = sparePartsResult.status === 'fulfilled' ? sparePartsResult.value : [];
    
    const totalSpare = spareParts.length;
    const availableSpare = spareParts.filter(p => p.status === 0).length;
    const usedSpare = spareParts.filter(p => p.status === 1).length;
    const inOrderSpare = spareParts.filter(p => p.status === 2).length;

    console.log("⚙️ Spare parts stats:", { totalSpare, availableSpare, usedSpare, inOrderSpare });

    // Update UI
    updateElement("total-spareParts", totalSpare);
    updateElement("spareParts-available", availableSpare);
    updateElement("spareParts-used", usedSpare);
    updateElement("spareParts-inorder", inOrderSpare);

    // Create chart
    drawChart("sparePartChart", [availableSpare, usedSpare, inOrderSpare], 
              ["متوفر", "مستهلك", "في الطلب"], ["#28a745", "#dc3545", "#FFA500"]);
}

// Process Reports Data
function processReportsData(reportsResult) {
    console.log("📈 Processing reports data:", reportsResult);
    const reports = reportsResult.status === 'fulfilled' ? reportsResult.value : { drivers: 0, vehicles: 0, orders: 0 };
    
    const reportDrivers = reports.drivers || 0;
    const reportVehicles = reports.vehicles || 0;
    const reportOrders = reports.orders || 0;
    const totalReports = reportDrivers + reportVehicles + reportOrders;

    console.log("📈 Reports stats:", { totalReports, reportDrivers, reportVehicles, reportOrders });

    // Update UI
    updateElement("total-reports", totalReports);
    updateElement("report-drivers", reportDrivers);
    updateElement("report-vehicles", reportVehicles);
    updateElement("report-orders", reportOrders);

    // Create chart
    drawChart("reportChart", [reportDrivers, reportVehicles, reportOrders], 
              ["تقارير السائقين", "تقارير السيارات", "تقارير الطلبات"], ["#FFA500", "#28a745", "#dc3545"]);
}

// Chart drawing function
function drawChart(canvasId, data, labels, colors) {
    console.log(`📊 Drawing chart ${canvasId}:`, { data, labels, colors });
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`❌ Canvas with ID "${canvasId}" not found.`);
        return;
    }

    const ctx = canvas.getContext("2d");
    
    // Destroy existing chart to prevent memory leaks
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        console.log(`🗑️ Destroyed existing chart: ${canvasId}`);
    }

    const hasNonZeroValue = data.some(value => value > 0);
    console.log(`📊 Chart ${canvasId} has data:`, hasNonZeroValue, data);

    let chartData, chartColors, chartLabels;

    if (!hasNonZeroValue) {
        // All values are 0 - show gray chart
        chartData = [1];
        chartColors = ["#ccc"];
        chartLabels = ["لا توجد بيانات"];
        console.log(`📊 Chart ${canvasId}: No data, showing placeholder`);
    } else {
        chartData = data;
        chartColors = colors;
        chartLabels = labels;
        console.log(`📊 Chart ${canvasId}: Displaying real data`);
    }

    try {
        chartInstances[canvasId] = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderWidth: 2,
                    borderColor: "#fff",
                    hoverBorderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend since we have the table
                    },
                    tooltip: {
                        enabled: !hasNonZeroValue ? false : true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                },
                cutout: '50%'
            }
        });
        console.log(`✅ Chart ${canvasId} created successfully`);
    } catch (error) {
        console.error(`❌ Error creating chart ${canvasId}:`, error);
    }
}

// Utility function to update element content
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 2000);
        console.log(`📝 Updated element ${id}: ${value}`);
    } else {
        console.warn(`❌ Element with ID "${id}" not found`);
    }
}

// Loading functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        console.log("⏳ Loading overlay shown");
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        console.log("✅ Loading overlay hidden");
    }
}

// Error handling
function showError(message) {
    console.error("💥 Showing error:", message);
    
    // Add error styling to all cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add('error');
        const content = card.querySelector('.card-content');
        if (content) {
            content.innerHTML = `<p style="text-align: center; color: #dc3545;">${message}</p>`;
        }
    });
}

// Refresh data function
function refreshDashboard() {
    console.log("🔄 Refreshing dashboard...");
    showLoading();
    loadAllDashboardData()
        .then(() => {
            hideLoading();
            console.log("✅ Dashboard data refreshed successfully");
        })
        .catch(error => {
            console.error("❌ Failed to refresh dashboard:", error);
            hideLoading();
            showError("فشل في تحديث البيانات");
        });
}

// Export functions for external use
window.refreshDashboard = refreshDashboard;

// Auto-refresh every 5 minutes
setInterval(() => {
    console.log("⏰ Auto-refreshing dashboard data...");
    refreshDashboard();
}, 5 * 60 * 1000);

// Cleanup function when page is unloaded
window.addEventListener('beforeunload', function() {
    // Destroy all chart instances to prevent memory leaks
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    console.log("🧹 Cleaned up chart instances");
});


