// Car List Page JavaScript
// Vehicle Management with API integration

// Use var declarations and window properties to avoid redeclaration errors
var allCars = []; // All vehicles (vehicles and buses)
var userRole = null;
var eventHandlersSetup = false; // Track if event handlers are already set up

// Make sure global functions are available
window.loadCars = loadCars;
window.searchCars = searchCars;
window.filterCars = filterCars;
window.toggleAddType = toggleAddType;
window.submitVehicle = submitVehicle;
window.openPop = openPop;
window.closePop = closePop;
window.refreshData = refreshData;

// Roles allowed to view all vehicles
var allowedRoles = [
    "SuperUser",
    "HospitalManager", 
    "GeneralManager",
    "GeneralSupervisor",
    "AdminstrativeSupervisor",
    "PatrolsSupervisor",
    "WorkshopSupervisor",
];

// Initialize immediately without addEventListener to avoid shared layout filtering
(function initCarList() {
    const token = localStorage.getItem("token");
    userRole = localStorage.getItem("userRole");

    if (!token) {
        console.error("No authentication token found");
        return;
    }

    // Load cars immediately
    loadCars();
})();

// Load vehicles and buses from API
async function loadCars() {
    const token = localStorage.getItem("token");
    
    try {
        // Fetch vehicles
        let vehicles = [];
        try {
            const vRes = await fetch("https://movesmartapi.runasp.net/api/Vehicles/All", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (vRes.ok) {
                const vData = await vRes.json();
                vehicles = Array.isArray(vData.$values) ? vData.$values : [];
            }
        } catch (e) {
            console.error("Error fetching vehicles:", e);
            vehicles = [];
        }

        // Fetch buses
        let buses = [];
        try {
            const bRes = await fetch("https://movesmartapi.runasp.net/api/Buses/All", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (bRes.ok) {
                const bData = await bRes.json();
                buses = Array.isArray(bData.$values) ? bData.$values : [];
            }
        } catch (e) {
            console.error("Error fetching buses:", e);
            buses = [];
        }

        // Map and combine data
        const busesMapped = buses.map((bus) => ({
            ...bus.vehicle,
            isBus: true,
            busID: bus.busID,
            capacity: bus.capacity,
            availableSpace: bus.availableSpace,
        }));
        
        const vehiclesMapped = vehicles.map((v) => ({
            ...v,
            isBus: false,
        }));

        // PatrolsSupervisor only sees buses
        if (userRole === "PatrolsSupervisor") {
            allCars = busesMapped;
            const typeFilter = document.getElementById("type-filter");
            if (typeFilter) {
                typeFilter.value = "bus";
                typeFilter.disabled = true;
            }
        } else {
            allCars = [...vehiclesMapped, ...busesMapped];
            const typeFilter = document.getElementById("type-filter");
            if (typeFilter) {
                typeFilter.value = "all";
                typeFilter.disabled = false;
            }
        }

        displayCars(allCars);
        setupEventHandlers();
    } catch (error) {
        console.error("Error loading data:", error);
        displayError("حدث خطأ في تحميل البيانات");
    }
}

function setupEventHandlers() {
    // Only set up event handlers once
    if (eventHandlersSetup) return;

    // Setup modal close handlers without addEventListener
    const modal = document.getElementById('add-pop');
    if (modal && !modal.hasAttribute('data-handlers-added')) {
        modal.onclick = function(e) {
            if (e.target === modal) {
                closePop();
            }
        };
        modal.setAttribute('data-handlers-added', 'true');
    }

    // Setup keyboard handlers without addEventListener - use global variable instead of document attribute
    document.onkeydown = function(e) {
        const modal = document.getElementById('add-pop');
        if (modal && !modal.classList.contains('hidden') && e.key === 'Escape') {
            closePop();
        }
    };
    
    eventHandlersSetup = true;
}

// Search functionality
function searchCars() {
    const searchTerm = document.getElementById("search").value.toLowerCase();
    filterCars(searchTerm);
}

// Filter cars by status, type, and search term
function filterCars(searchTerm = "") {
    const statusVal = document.getElementById("filter-select").value;
    const typeVal = document.getElementById("type-filter").value;

    // Define vehicle types for search
    const carType = {
        0: "سيدان",
        1: "واحد كبينة",
        2: "ثنائي كبينة",
        3: "شاحنة نقل",
        4: "ميكروباص",
        5: "ميني باص",
        6: "أتوبيس",
        7: "اسعاف",
    };

    let filtered = allCars;

    // Filter by type
    if (typeVal === "vehicle") filtered = filtered.filter((c) => !c.isBus);
    else if (typeVal === "bus") filtered = filtered.filter((c) => c.isBus);

    // Filter by status
    if (statusVal !== "all")
        filtered = filtered.filter((c) => String(c.status) === statusVal);

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter((car) =>
            (car.vehicleID && String(car.vehicleID).includes(searchTerm)) ||
            (car.brandName && car.brandName.toLowerCase().includes(searchTerm)) ||
            (car.modelName && car.modelName.toLowerCase().includes(searchTerm)) ||
            (car.vehicleType !== undefined && String(car.vehicleType).includes(searchTerm)) ||
            (car.vehicleType !== undefined && carType[car.vehicleType] && carType[car.vehicleType].toLowerCase().includes(searchTerm)) ||
            (car.associatedHospital && car.associatedHospital.toLowerCase().includes(searchTerm)) ||
            (car.status !== undefined && String(car.status).includes(searchTerm)) ||
            (car.plateNumbers && car.plateNumbers.toLowerCase().includes(searchTerm))
        );
    }

    displayCars(filtered);
}

// Display cars in grid format
function displayCars(filteredList) {
    const carStatus = {
        1: "متاحة",
        2: "مشغولة", 
        3: "قيد الصيانة",
    };
    
    const carType = {
        0: "سيدان",
        1: "واحد كبينة",
        2: "ثنائي كبينة",
        3: "شاحنة نقل",
        4: "ميكروباص",
        5: "ميني باص",
        6: "أتوبيس",
        7: "اسعاف",
    };
    
    const container = document.getElementById("cars-container");
    container.innerHTML = "";

    if (filteredList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>لا توجد مركبات تطابق معايير البحث</p>
            </div>
        `;
        document.getElementById("total-count").innerText = "0";
        return;
    }

    filteredList.forEach((car) => {
        const carCard = document.createElement("div");
        carCard.classList.add("card");
        carCard.style.cursor = "pointer";

        // Navigation to detail page
        const carLink = `carDetails.html?id=${car.vehicleID}&type=${car.isBus ? "bus" : "vehicle"}`;
        carCard.onclick = () => {
            console.log("Navigate to:", carLink);
            
            // Save vehicle params for the details page
            localStorage.setItem("selectedVehicle", JSON.stringify({
                id: car.vehicleID,
                type: car.isBus ? "bus" : "vehicle"
            }));
            
            // Navigate to details page through shared layout
            if (window.sharedLayout) {
                window.sharedLayout.loadPageContent('car-Managment/carDetails.html');
            } else {
                console.error("Shared layout not available");
            }
        };

        if (car.isBus) {
            carCard.innerHTML = `
                <p><strong>${car.plateNumbers || 'غير محدد'}</strong></p>
                <p>${car.brandName || 'غير محدد'}</p>
                <p>${car.modelName || 'غير محدد'}</p>
                <p>${carType[car.vehicleType] || "غير معروف"}</p>
                <p>${car.associatedHospital || 'غير محدد'}</p>
                <p class="status ${car.status === 1 ? "active" : car.status === 3 ? "maintenance" : "inactive"}">
                    ${carStatus[car.status] || "غير معروف"}
                </p>
            `;
        } else {
            carCard.innerHTML = `
                <p><strong>${car.plateNumbers || 'غير محدد'}</strong></p>
                <p>${car.brandName || 'غير محدد'}</p>
                <p>${car.modelName || 'غير محدد'}</p>
                <p>${carType[car.vehicleType] || "غير معروف"}</p>
                <p>${car.associatedHospital || 'غير محدد'}</p>
                <p class="status ${car.status === 1 ? "active" : car.status === 3 ? "maintenance" : "inactive"}">
                    ${carStatus[car.status] || "غير معروف"}
                </p>
            `;
        }

        container.appendChild(carCard);
    });

    document.getElementById("total-count").innerText = filteredList.length;
}

// Display error message
function displayError(message) {
    const container = document.getElementById("cars-container");
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #dc3545;">
            <p>${message}</p>
            <button onclick="refreshData()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                إعادة المحاولة
            </button>
        </div>
    `;
}

// Toggle add type (vehicle/bus) in modal
function toggleAddType() {
    const type = document.getElementById("add-type-select").value;
    document.getElementById("vehicle-fields").style.display = "block";
    document.getElementById("bus-fields").style.display = type === "bus" ? "block" : "none";
}

// Submit new vehicle or bus
function submitVehicle() {
    const type = document.getElementById("add-type-select").value;
    if (!validate(type)) return;

    const token = localStorage.getItem("token");

    if (type === "vehicle") {
        const carData = {
            vehicleID: 0,
            brandName: document.getElementById("car-brand").value,
            modelName: document.getElementById("car-model").value,
            plateNumbers: document.getElementById("car-plate").value,
            vehicleType: parseInt(document.getElementById("car-type").value),
            associatedHospital: document.getElementById("car-hospital").value,
            associatedTask: document.getElementById("car-task").value,
            status: parseInt(document.getElementById("car-status").value),
            totalKilometersMoved: parseInt(document.getElementById("car-kilometers").value) || 0,
            fuelType: parseInt(document.getElementById("fuel-type").value),
            fuelConsumptionRate: parseFloat(document.getElementById("fuel-consumption").value) || 0,
            oilConsumptionRate: parseFloat(document.getElementById("oil-consumption").value) || 0,
        };

        fetch("https://movesmartapi.runasp.net/api/Vehicles", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(carData),
        })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Failed to add vehicle");
        })
        .then((data) => {
            console.log("Vehicle added successfully:", data);
            closePop();
            refreshData();
        })
        .catch((error) => {
            console.error("Error adding vehicle:", error);
            alert("حدث خطأ أثناء إضافة المركبة");
        });

    } else if (type === "bus") {
        const vehicleData = {
            vehicleID: 0,
            brandName: document.getElementById("car-brand").value,
            modelName: document.getElementById("car-model").value,
            plateNumbers: document.getElementById("car-plate").value,
            vehicleType: parseInt(document.getElementById("car-type").value),
            associatedHospital: document.getElementById("car-hospital").value,
            associatedTask: document.getElementById("car-task").value,
            status: parseInt(document.getElementById("car-status").value),
            totalKilometersMoved: parseInt(document.getElementById("car-kilometers").value) || 0,
            fuelType: parseInt(document.getElementById("fuel-type").value),
            fuelConsumptionRate: parseFloat(document.getElementById("fuel-consumption").value) || 0,
            oilConsumptionRate: parseFloat(document.getElementById("oil-consumption").value) || 0,
        };

        const busData = {
            busID: 0,
            capacity: parseInt(document.getElementById("bus-capacity").value),
            availableSpace: parseInt(document.getElementById("bus-available-space").value),
            vehicle: vehicleData,
        };

        fetch("https://movesmartapi.runasp.net/api/Buses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(busData),
        })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Failed to add bus");
        })
        .then((data) => {
            console.log("Bus added successfully:", data);
            closePop();
            refreshData();
        })
        .catch((error) => {
            console.error("Error adding bus:", error);
            alert("حدث خطأ أثناء إضافة الباص");
        });
    }
}

// Validation helper functions
function showError(id, message) {
    const errorElement = document.getElementById(`error-${id}`);
    if (errorElement) {
        errorElement.innerText = message || "";
    }
}

function validate(type = "vehicle") {
    const carBrand = document.getElementById("car-brand").value.trim();
    const carModel = document.getElementById("car-model").value.trim();
    const carPlate = document.getElementById("car-plate").value.trim();
    const hospital = document.getElementById("car-hospital").value.trim();
    const task = document.getElementById("car-task").value.trim();

    // Clear all errors
    const clearAllErrors = () => {
        showError("car-brand", "");
        showError("car-model", "");
        showError("car-plate", "");
        showError("car-hospital", "");
        showError("car-task", "");
        showError("bus-capacity", "");
        showError("bus-available-space", "");
    };

    clearAllErrors();
    let isValid = true;

    // Validate brand name
    if (carBrand.length < 2) {
        isValid = false;
        showError("car-brand", "العلامة التجارية يجب أن تكون حرفين على الأقل.");
    }

    // Validate model name
    if (!carModel) {
        isValid = false;
        showError("car-model", "الموديل لا يمكن أن يكون فارغًا.");
    }

    // Validate plate number (3 letters + 4 numbers)
    const plateRegex = /^[أ-يA-Za-z]{3}\d{4}$/;
    if (!plateRegex.test(carPlate)) {
        isValid = false;
        showError("car-plate", "رقم اللوحة يجب أن يتكون من 3 حروف و4 أرقام.");
    }

    // Validate hospital
    if (!hospital) {
        isValid = false;
        showError("car-hospital", "يرجى تحديد المستشفى.");
    }

    // Validate task
    if (!task) {
        isValid = false;
        showError("car-task", "يرجى تحديد المهمة المرتبطة.");
    }

    // Additional validation for buses
    if (type === "bus") {
        const capacity = parseInt(document.getElementById("bus-capacity").value);
        const availableSpace = parseInt(document.getElementById("bus-available-space").value);

        if (isNaN(capacity) || capacity <= 0) {
            isValid = false;
            showError("bus-capacity", "السعة يجب أن تكون رقمًا موجبًا.");
        }

        if (isNaN(availableSpace) || availableSpace < 0) {
            isValid = false;
            showError("bus-available-space", "المقاعد المتاحة يجب ألا تكون سالبة.");
        }

        if (!isNaN(capacity) && !isNaN(availableSpace) && availableSpace > capacity) {
            isValid = false;
            showError("bus-available-space", "المقاعد المتاحة لا يمكن أن تكون أكثر من السعة الكلية.");
        }
    }

    return isValid;
}

// Modal functions
function openPop() {
    document.getElementById("add-pop").classList.remove("hidden");
    document.getElementById("add-type-select").value = "vehicle";
    toggleAddType();
    clearForm();
}

function closePop() {
    document.getElementById("add-pop").classList.add("hidden");
    clearForm();
}

function clearForm() {
    // Clear all form fields
    const inputs = document.querySelectorAll('#add-pop input, #add-pop select');
    inputs.forEach(input => {
        if (input.type === 'number') {
            input.value = '';
        } else {
            input.value = '';
        }
    });
    
    // Clear all error messages
    const errors = document.querySelectorAll('.error');
    errors.forEach(error => error.innerText = '');
    
    // Reset to default type
    document.getElementById("add-type-select").value = "vehicle";
    toggleAddType();
}

// Refresh data
function refreshData() {
    console.log("Refreshing vehicle data...");
    loadCars();
}
