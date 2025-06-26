// Car Details Page JavaScript
// Vehicle details management with API integration

// Use var declarations to avoid redeclaration errors
var currentVehicleData = null;
var isVehicleBus = false;
var currentVehicleId = null;
var currentVehicleType = null;

// Make functions globally available
window.switchTab = switchTab;
window.saveVehicleData = saveVehicleData;
window.deleteVehicle = deleteVehicle;
window.goBackToVehiclesList = goBackToVehiclesList;

// Vehicle type mappings
var carStatus = {
    1: "متاحة",
    2: "مشغولة",
    3: "قيد الصيانة",
};

var fuelType = {
    0: "بنزين",
    1: "ديزل",
};

var carType = {
    0: "سيدان",
    1: "واحد كبينة",
    2: "ثنائي كبينة",
    3: "شاحنة نقل",
    4: "ميكروباص",
    5: "ميني باص",
    6: "أتوبيس",
    7: "اسعاف",
};

// Initialize immediately without addEventListener to avoid shared layout filtering
(function initCarDetails() {
    const token = localStorage.getItem("token");
    
    if (!token) {
        console.error("No authentication token found");
        return;
    }

    // Extract vehicle info from URL parameters or localStorage
    const params = getVehicleParams();
    if (params) {
        currentVehicleId = params.id;
        currentVehicleType = params.type;
        isVehicleBus = params.type === 'bus';
        loadVehicleData();
    } else {
        console.error("No vehicle information found");
        goBackToVehiclesList();
    }
})();

function getVehicleParams() {
    // Try to get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const type = urlParams.get("type");
    
    if (id && type) {
        return { id, type };
    }
    
    // Try to get from localStorage as fallback
    const savedParams = localStorage.getItem("selectedVehicle");
    if (savedParams) {
        try {
            return JSON.parse(savedParams);
        } catch (e) {
            console.error("Error parsing saved vehicle params:", e);
        }
    }
    
    return null;
}

// Load vehicle data from API
async function loadVehicleData() {
    const token = localStorage.getItem("token");
    
    try {
        let apiUrl;
        if (isVehicleBus) {
            apiUrl = `https://movesmartapi.runasp.net/api/Buses/ByID/${currentVehicleId}`;
        } else {
            apiUrl = `https://movesmartapi.runasp.net/api/Vehicles/${currentVehicleId}`;
        }

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Vehicle data loaded:", data);
        
        currentVehicleData = data;
        populateVehicleData(data);
        
    } catch (error) {
        console.error("Error loading vehicle data:", error);
        alert("حدث خطأ في تحميل بيانات المركبة");
    }
}

function populateVehicleData(data) {
    let vehicleInfo;
    
    if (isVehicleBus) {
        vehicleInfo = data.vehicle;
        // Show bus-specific fields
        document.getElementById("bus-capacity-group").style.display = "block";
        document.getElementById("bus-available-space-group").style.display = "block";
        document.getElementById("busCapacity").value = data.capacity || "";
        document.getElementById("busAvailableSpace").value = data.availableSpace || "";
    } else {
        vehicleInfo = data;
        // Hide bus-specific fields
        document.getElementById("bus-capacity-group").style.display = "none";
        document.getElementById("bus-available-space-group").style.display = "none";
    }

    // Update header information
    document.getElementById("car-number").innerText = `رقم المركبة: ${vehicleInfo.plateNumbers || 'غير محدد'}`;
    document.getElementById("car-make").innerText = `الماركة: ${vehicleInfo.brandName || 'غير محدد'}`;
    document.getElementById("car-model").innerText = `الموديل: ${vehicleInfo.modelName || 'غير محدد'}`;
    document.getElementById("car-type").innerText = `نوع المركبة: ${carType[vehicleInfo.vehicleType] || "غير معروف"}`;
    document.getElementById("total-km").innerText = vehicleInfo.totalKilometersMoved || "0";

    // Populate form fields
    document.getElementById("carNumber").value = vehicleInfo.plateNumbers || "";
    document.getElementById("carBrand").value = vehicleInfo.brandName || "";
    document.getElementById("carModel").value = vehicleInfo.modelName || "";
    
    // Handle select fields explicitly with string conversion
    const carTypeSelect = document.getElementById("carType");
    const fuelTypeSelect = document.getElementById("fuelType");
    const carConditionSelect = document.getElementById("carCondition");
    
    // Set vehicle type (convert to string)
    if (vehicleInfo.vehicleType !== undefined && vehicleInfo.vehicleType !== null) {
        carTypeSelect.value = vehicleInfo.vehicleType.toString();
        console.log("Setting carType to:", vehicleInfo.vehicleType.toString());
    }
    
    // Set fuel type (convert to string)
    if (vehicleInfo.fuelType !== undefined && vehicleInfo.fuelType !== null) {
        fuelTypeSelect.value = vehicleInfo.fuelType.toString();
        console.log("Setting fuelType to:", vehicleInfo.fuelType.toString());
    }
    
    // Set car condition (convert to string)
    if (vehicleInfo.status !== undefined && vehicleInfo.status !== null) {
        carConditionSelect.value = vehicleInfo.status.toString();
        console.log("Setting carCondition to:", vehicleInfo.status.toString());
    }
    
    document.getElementById("carFunction").value = vehicleInfo.associatedTask || "";
    document.getElementById("hospital").value = vehicleInfo.associatedHospital || "";
    document.getElementById("fuelConsumption").value = vehicleInfo.fuelConsumptionRate || "";
    document.getElementById("oilConsumption").value = vehicleInfo.oilConsumptionRate || "";
}

// Tab switching functionality
function switchTab(tabElement, tabId) {
    // Remove active class from all tabs
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(tab => tab.classList.remove("active"));
    
    // Add active class to clicked tab
    tabElement.classList.add("active");
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(content => content.style.display = "none");
    
    // Show selected tab content
    document.getElementById(tabId).style.display = "block";
    
    // Show/hide save button based on tab
    const saveBtn = document.querySelector(".save-btn");
    if (saveBtn) {
        saveBtn.style.display = tabId === "car-info" ? "block" : "none";
    }
}

// Validation functions
function showError(id, message) {
    const errorElement = document.getElementById(`error-${id}`);
    if (errorElement) {
        errorElement.innerText = message || "";
    }
}

function validate() {
    const carBrand = document.getElementById("carBrand").value.trim();
    const carModel = document.getElementById("carModel").value.trim();
    const carNumber = document.getElementById("carNumber").value.trim();
    const hospital = document.getElementById("hospital").value.trim();
    const carFunction = document.getElementById("carFunction").value.trim();

    let isValid = true;

    // Clear previous errors
    const fields = ["carBrand", "carModel", "carNumber", "hospital", "carFunction"];
    fields.forEach(field => showError(field, ""));

    // Validate brand name
    if (carBrand.length < 2) {
        isValid = false;
        showError("carBrand", "العلامة التجارية يجب أن تكون حرفين على الأقل.");
    }

    // Validate model name
    if (!carModel) {
        isValid = false;
        showError("carModel", "الموديل لا يمكن أن يكون فارغًا.");
    }

    // Validate plate number (3 letters + 4 numbers)
    const plateRegex = /^[أ-يA-Za-z]{3}\d{4}$/;
    if (!plateRegex.test(carNumber)) {
        isValid = false;
        showError("carNumber", "رقم اللوحة يجب أن يتكون من 3 حروف و4 أرقام.");
    }

    // Validate hospital
    if (!hospital) {
        isValid = false;
        showError("hospital", "يرجى إدخال اسم المستشفى.");
    }

    // Validate function
    if (!carFunction) {
        isValid = false;
        showError("carFunction", "يرجى إدخال المهمة المرتبطة.");
    }

    // Additional validation for buses
    if (isVehicleBus) {
        const capacity = parseInt(document.getElementById("busCapacity").value);
        const availableSpace = parseInt(document.getElementById("busAvailableSpace").value);

        if (isNaN(capacity) || capacity <= 0) {
            isValid = false;
            showError("busCapacity", "السعة يجب أن تكون رقمًا موجبًا.");
        }

        if (isNaN(availableSpace) || availableSpace < 0) {
            isValid = false;
            showError("busAvailableSpace", "المقاعد المتاحة يجب ألا تكون سالبة.");
        }

        if (!isNaN(capacity) && !isNaN(availableSpace) && availableSpace > capacity) {
            isValid = false;
            showError("busAvailableSpace", "المقاعد المتاحة لا يمكن أن تكون أكثر من السعة الكلية.");
        }
    }

    return isValid;
}

// Save vehicle data
async function saveVehicleData() {
    if (!validate()) {
        return;
    }

    const token = localStorage.getItem("token");
    
    try {
        if (isVehicleBus) {
            await saveBusData(token);
        } else {
            await saveVehicleDataAPI(token);
        }
        
        alert("تم حفظ التعديلات بنجاح ✅");
        await loadVehicleData(); // Reload data to show updates
        
    } catch (error) {
        console.error("Error saving vehicle data:", error);
        alert("حدث خطأ أثناء حفظ البيانات");
    }
}

async function saveVehicleDataAPI(token) {
    const vehicleData = {
        vehicleID: parseInt(currentVehicleId),
        brandName: document.getElementById("carBrand").value,
        modelName: document.getElementById("carModel").value,
        plateNumbers: document.getElementById("carNumber").value,
        vehicleType: parseInt(document.getElementById("carType").value),
        associatedHospital: document.getElementById("hospital").value,
        associatedTask: document.getElementById("carFunction").value,
        status: parseInt(document.getElementById("carCondition").value),
        totalKilometersMoved: currentVehicleData.totalKilometersMoved || 0,
        fuelType: parseInt(document.getElementById("fuelType").value),
        fuelConsumptionRate: parseFloat(document.getElementById("fuelConsumption").value) || 0,
        oilConsumptionRate: parseFloat(document.getElementById("oilConsumption").value) || 0,
    };

    const response = await fetch("https://movesmartapi.runasp.net/api/Vehicles", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update vehicle");
    }

    return response.json();
}

async function saveBusData(token) {
    const vehicleData = {
        vehicleID: parseInt(currentVehicleId),
        brandName: document.getElementById("carBrand").value,
        modelName: document.getElementById("carModel").value,
        plateNumbers: document.getElementById("carNumber").value,
        vehicleType: parseInt(document.getElementById("carType").value),
        associatedHospital: document.getElementById("hospital").value,
        associatedTask: document.getElementById("carFunction").value,
        status: parseInt(document.getElementById("carCondition").value),
        totalKilometersMoved: currentVehicleData.vehicle.totalKilometersMoved || 0,
        fuelType: parseInt(document.getElementById("fuelType").value),
        fuelConsumptionRate: parseFloat(document.getElementById("fuelConsumption").value) || 0,
        oilConsumptionRate: parseFloat(document.getElementById("oilConsumption").value) || 0,
    };

    const busData = {
        busID: currentVehicleData.busID,
        capacity: parseInt(document.getElementById("busCapacity").value),
        availableSpace: parseInt(document.getElementById("busAvailableSpace").value),
        vehicle: vehicleData,
    };

    const response = await fetch("https://movesmartapi.runasp.net/api/Buses", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(busData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update bus");
    }

    return response.json();
}

// Delete vehicle
async function deleteVehicle() {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذه المركبة؟")) {
        return;
    }

    const token = localStorage.getItem("token");
    
    try {
        let apiUrl;
        if (isVehicleBus) {
            apiUrl = `https://movesmartapi.runasp.net/api/Buses/ByID/${currentVehicleId}`;
        } else {
            apiUrl = `https://movesmartapi.runasp.net/api/Vehicles/ByID/${currentVehicleId}`;
        }

        const response = await fetch(apiUrl, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (response.ok) {
            alert("تم حذف المركبة بنجاح");
            goBackToVehiclesList();
        } else {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to delete vehicle");
        }
        
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        alert("حدث خطأ أثناء حذف المركبة: " + error.message);
    }
}

// Go back to vehicles list
function goBackToVehiclesList() {
    // Clear saved vehicle params
    localStorage.removeItem("selectedVehicle");
    
    // Navigate back to vehicles list through shared layout
    if (window.changeContent) {
        window.changeContent('vehicles');
    } else {
        // Fallback: reload page to vehicles list
        window.location.href = '_sharedLayout.html';
    }
}
