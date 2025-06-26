// Driver Details Management JavaScript
// Use var to avoid redeclaration issues with shared layout
var currentDriverID = null;
var driverData = null;

// Note: DOMContentLoaded is handled by shared layout calling initializeDriverDetails()

function initializeDriverDetails() {
  // Get driver ID from localStorage (set by driver list page)
  const selectedDriver = localStorage.getItem("selectedDriver");
  if (selectedDriver) {
    try {
      const driverInfo = JSON.parse(selectedDriver);
      currentDriverID = driverInfo.id;
      console.log('Loading driver details for ID:', currentDriverID);
    } catch (error) {
      console.error('Error parsing selected driver data:', error);
      showError('خطأ في تحميل بيانات السائق');
      return;
    }
  } else {
    console.error('No driver selected');
    showError('لم يتم تحديد سائق');
    return;
  }

  // Set up event listeners
  setupEventListeners();
  
  // Load driver data
  loadDriverData();
  
  // Load substitute drivers for vacation modal
  loadSubstituteDrivers();
  
  // Set default tab
  showTab('driver-info');
}

function setupEventListeners() {
  // Save button
  const saveButton = document.getElementById("save-btn");
  if (saveButton) {
    saveButton.addEventListener("click", saveDriverData);
  }

  // Delete button
  const deleteButton = document.getElementById("delete-btn");
  if (deleteButton) {
    deleteButton.addEventListener("click", deleteDriver);
  }

  // Tab buttons
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabName = this.dataset.tab;
      showTab(tabName);
      
      // Update active tab
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Add vacation button
  const addVacationButton = document.getElementById("add-vacation-btn");
  if (addVacationButton) {
    addVacationButton.addEventListener("click", function () {
      document.getElementById("leave-modal").style.display = "flex";
    });
  }

  // Modal close
  const closeModal = document.getElementById("close-modal");
  if (closeModal) {
    closeModal.addEventListener("click", function () {
      document.getElementById("leave-modal").style.display = "none";
      clearVacationForm();
    });
  }

  // Save vacation button
  const saveLeaveButton = document.getElementById("save-leave-btn");
  if (saveLeaveButton) {
    saveLeaveButton.addEventListener("click", saveVacation);
  }

  // Close modal when clicking outside
  const modal = document.getElementById("leave-modal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.style.display = "none";
        clearVacationForm();
      }
    });
  }
}

function showTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((content) => (content.style.display = "none"));
  
  // Show selected tab
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.style.display = "block";
  }

  // Show/hide buttons based on active tab
  const saveBtn = document.getElementById("save-btn");
  const addVacationBtn = document.getElementById("add-vacation-btn");
  
  if (saveBtn) {
    saveBtn.style.display = tabName === "driver-info" ? "block" : "none";
  }
  
  if (addVacationBtn) {
    addVacationBtn.style.display = tabName === "vacation-record" ? "block" : "none";
  }

  // Load specific tab data
  if (tabName === "work-history") {
    loadWorkHistory();
  } else if (tabName === "vacation-record") {
    loadDriverVacations();
  }
}

async function loadDriverData() {
  if (!currentDriverID) {
    showError('معرف السائق غير متوفر');
    return;
  }

  try {
    showLoading(true);
    const token = localStorage.getItem("token");
    
    const response = await fetch(
      `https://movesmartapi.runasp.net/api/Drivers/ByID/${currentDriverID}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    driverData = data;
    
    console.log("بيانات السائق:", data);
    displayDriverData(data);
    
  } catch (error) {
    console.error("Error fetching driver data:", error);
    showError('خطأ في تحميل بيانات السائق');
  } finally {
    showLoading(false);
  }
}

function displayDriverData(data) {
  const driverStatusMap = {
    1: "متاح",
    2: "غائب", 
    3: "قيد العمل",
  };

  // Update header information
  document.getElementById("driver-name").innerText = data.name || 'غير متوفر';
  document.getElementById("driver-phone").innerText = `رقم الهاتف: ${data.phone || 'غير متوفر'}`;
  document.getElementById("driver-status").innerText = `الحالة: ${driverStatusMap[data.status] || 'غير محدد'}`;
  document.getElementById("driver-national-id").innerText = `الرقم القومي: ${data.nationalNo || 'غير متوفر'}`;

  // Update form fields
  const nameInput = document.querySelector('input[name="name"]');
  const vehicleIDInput = document.querySelector('input[name="vehicleID"]');
  const phoneInput = document.querySelector('input[name="phone"]');
  const nationalNumInput = document.querySelector('input[name="nationalNum"]');
  const statusSelect = document.querySelector('select[name="status"]');

  if (nameInput) nameInput.value = data.name || "";
  if (vehicleIDInput) vehicleIDInput.value = data.vehicleID || "";
  if (phoneInput) phoneInput.value = data.phone || "";
  if (nationalNumInput) nationalNumInput.value = data.nationalNo || "";
  if (statusSelect) statusSelect.value = data.status || "1";
}

async function saveDriverData() {
  if (!currentDriverID) {
    showError('معرف السائق غير متوفر');
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const updatedDriver = {
      driverID: parseInt(currentDriverID),
      name: document.querySelector('input[name="name"]').value.trim(),
      vehicleID: parseInt(document.querySelector('input[name="vehicleID"]').value) || null,
      phone: document.querySelector('input[name="phone"]').value.trim(),
      nationalNo: document.querySelector('input[name="nationalNum"]').value.trim(),
      status: parseInt(document.querySelector('select[name="status"]').value),
    };

    // Validation
    if (!updatedDriver.name) {
      showError('الاسم مطلوب');
      return;
    }
    
    if (!updatedDriver.phone) {
      showError('رقم الهاتف مطلوب');
      return;
    }
    
    if (!updatedDriver.nationalNo) {
      showError('الرقم القومي مطلوب');
      return;
    }

    const response = await fetch(`https://movesmartapi.runasp.net/api/Drivers`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedDriver),
    });

    if (!response.ok) {
      throw new Error("فشل في تحديث البيانات");
    }

    showSuccess("تم حفظ التعديلات بنجاح!");
    loadDriverData(); // Reload data to reflect changes
    
  } catch (error) {
    console.error("Error saving driver data:", error);
    showError("حدث خطأ أثناء حفظ البيانات");
  }
}

async function deleteDriver() {
  if (!currentDriverID) {
    showError('معرف السائق غير متوفر');
    return;
  }

  if (!confirm("⚠ هل أنت متأكد من حذف بيانات السائق؟ هذا الإجراء لا يمكن التراجع عنه.")) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `https://movesmartapi.runasp.net/api/Drivers/ByID/${currentDriverID}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("فشل في حذف البيانات");
    }

    showSuccess("تم حذف بيانات السائق بنجاح!");
    
    // Navigate back to driver list
    setTimeout(() => {
      goBackToDriverList();
    }, 1500);
    
  } catch (error) {
    console.error("Error deleting driver:", error);
    showError("حدث خطأ أثناء حذف البيانات");
  }
}

async function loadWorkHistory() {
  if (!currentDriverID) return;

  try {
    const token = localStorage.getItem("token");
    const tbody = document.getElementById("work-orders-tbody");
    const noOrdersDiv = document.getElementById("no-work-orders");
    
    // Clear existing content
    tbody.innerHTML = "";
    noOrdersDiv.style.display = "none";

    // This endpoint might not exist in the API, so we'll show a placeholder
    // In a real implementation, you would fetch work orders for the driver
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
          سجل أوامر الشغل غير متوفر حالياً
        </td>
      </tr>
    `;
    
  } catch (error) {
    console.error("Error loading work history:", error);
    const tbody = document.getElementById("work-orders-tbody");
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #dc3545;">
          حدث خطأ في تحميل سجل أوامر الشغل
        </td>
      </tr>
    `;
  }
}

async function loadSubstituteDrivers() {
  try {
    const token = localStorage.getItem("token");
    const select = document.getElementById("substitute-driver");

    const response = await fetch("https://movesmartapi.runasp.net/api/Drivers/All", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load drivers");
    }

    const data = await response.json();
    const drivers = Array.isArray(data.$values) ? data.$values : [];
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">اختر سائق بديل</option>';
    
    drivers.forEach((driver) => {
      // Don't include the current driver as a substitute
      if (driver.driverID !== parseInt(currentDriverID)) {
        const option = document.createElement("option");
        option.value = driver.driverID;
        option.textContent = driver.name;
        select.appendChild(option);
      }
    });
    
  } catch (error) {
    console.error("فشل في تحميل قائمة السائقين:", error);
  }
}

async function loadDriverVacations() {
  if (!currentDriverID) return;

  try {
    const token = localStorage.getItem("token");
    const tbody = document.getElementById("vacation-tbody");
    const vacationContent = document.getElementById("vacation-content");
    
    // Clear existing content
    tbody.innerHTML = "";
    vacationContent.innerHTML = "";

    const response = await fetch(
      `https://movesmartapi.runasp.net/api/Vacations/ForDriver/${currentDriverID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) {
      // No vacations found
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
            لا توجد إجازات مسجلة لهذا السائق
          </td>
        </tr>
      `;
      return;
    }

    if (!response.ok) {
      throw new Error("فشل في تحميل الإجازات");
    }

    const data = await response.json();
    
    if (!data.$values || data.$values.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
            لا توجد إجازات مسجلة لهذا السائق
          </td>
        </tr>
      `;
      return;
    }

    console.log("بيانات الإجازات:", data);
    
    data.$values.forEach((vacation) => {
      const fromDate = vacation.startDate?.split("T")[0];
      const toDate = vacation.endDate?.split("T")[0];
      const days = Math.ceil(
        Math.abs(new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)
      );

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${fromDate}</td>
        <td>${toDate}</td>
        <td>${days} أيام</td>
        <td>
          <button class="delete-vacation-btn" onclick="deleteVacation(${vacation.vacationID})">
            🗑 حذف
          </button>
        </td>
      `;
      
      tbody.appendChild(row);
    });
    
  } catch (error) {
    console.error("فشل في تحميل الإجازات:", error);
    const tbody = document.getElementById("vacation-tbody");
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #dc3545;">
          حدث خطأ في تحميل الإجازات
        </td>
      </tr>
    `;
  }
}

async function saveVacation() {
  const fromDate = document.getElementById("leave-from").value;
  const toDate = document.getElementById("leave-to").value;
  const substituteDriverID = document.getElementById("substitute-driver").value;

  if (!fromDate || !toDate) {
    showError("يرجى إدخال تاريخ بداية ونهاية الإجازة");
    return;
  }

  if (new Date(fromDate) >= new Date(toDate)) {
    showError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const vacationData = {
      vacationOwnerID: parseInt(currentDriverID),
      startDate: fromDate,
      endDate: toDate,
      substituteDriverID: substituteDriverID ? parseInt(substituteDriverID) : null,
    };

    const response = await fetch("https://movesmartapi.runasp.net/api/Vacations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(vacationData),
    });

    if (!response.ok) {
      throw new Error("فشل في إضافة الإجازة");
    }

    showSuccess("تم حفظ الإجازة بنجاح!");
    
    // Close modal and refresh vacations
    document.getElementById("leave-modal").style.display = "none";
    clearVacationForm();
    loadDriverVacations();
    
  } catch (error) {
    console.error("Error saving vacation:", error);
    showError("حدث خطأ أثناء حفظ الإجازة");
  }
}

async function deleteVacation(vacationID) {
  if (!confirm("⚠ هل أنت متأكد من حذف هذه الإجازة؟")) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `https://movesmartapi.runasp.net/api/Vacations/${vacationID}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("فشل في حذف الإجازة");
    }

    showSuccess("تم حذف الإجازة بنجاح!");
    loadDriverVacations(); // Refresh the list
    
  } catch (error) {
    console.error("خطأ أثناء حذف الإجازة:", error);
    showError("حدث خطأ أثناء حذف الإجازة");
  }
}

function clearVacationForm() {
  document.getElementById("leave-from").value = "";
  document.getElementById("leave-to").value = "";
  document.getElementById("substitute-driver").value = "";
}

// Utility functions
function showLoading(show) {
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? "block" : "none";
  }
}

function showError(message) {
  alert(`❌ ${message}`);
}

function showSuccess(message) {
  alert(`✅ ${message}`);
}

// Global function for navigation (used by HTML onclick)
function goBackToDriverList() {
  // Navigate back to driver list through shared layout
  if (window.parent && window.parent.changeContent) {
    window.parent.changeContent('drivers');
  } else if (window.changeContent) {
    window.changeContent('drivers');
  } else {
    // Fallback: use browser back
    window.history.back();
  }
}

// Make functions globally available for onclick handlers
window.initializeDriverDetails = initializeDriverDetails;
window.goBackToDriverList = goBackToDriverList;
window.deleteVacation = deleteVacation;
