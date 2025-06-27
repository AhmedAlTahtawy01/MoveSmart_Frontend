// Applications Order List - Main Navigation Page
// Handle variable redeclaration issue by using window properties
window.orderListUserRole = window.orderListUserRole || localStorage.getItem("userRole");
window.orderListToken = window.orderListToken || localStorage.getItem("token");

// Use local variables to avoid const redeclaration
var userRole = window.orderListUserRole;
var token = window.orderListToken;

// Check authentication
if (!token) {
  window.location.href = "../login.html";
}

// Define role permissions for each application
var rolePermissions = {
  SuperUser: [
    "jobOrder",
    "purchaseOrder", 
    "withdrawOrder",
    "maintenanceRequests",
    "actualMaintenance",
    "missionOrder",
    "missionNoteOrder"
  ],
  AdministrativeSupervisor: [
    "jobOrder",
    "purchaseOrder",
    "withdrawOrder", 
    "maintenanceRequests",
    "actualMaintenance"
  ],
  HospitalManager: [
    "jobOrder",
    "missionOrder",
    "missionNoteOrder"
  ],
  GeneralManager: [
    "jobOrder",
    "purchaseOrder",
    "withdrawOrder",
    "maintenanceRequests", 
    "actualMaintenance",
    "missionOrder"
  ],
  GeneralSupervisor: [
    "jobOrder",
    "purchaseOrder",
    "withdrawOrder",
    "maintenanceRequests",
    "actualMaintenance", 
    "missionOrder"
  ],
  PatrolsSupervisor: [
    "jobOrder",
    "missionOrder"
  ],
  WorkshopSupervisor: [
    "jobOrder",
    "maintenanceRequests",
    "actualMaintenance",
    "purchaseOrder",
    "withdrawOrder"
  ],
};

// Application navigation mapping
var applicationRoutes = {
  purchaseOrder: { type: "modal", modalId: "purchaseOrderModal" },
  withdrawOrder: "../application-Managment/withdrawOrder.html", 
  maintenanceRequests: "../application-Managment/maintenanceRequests.html",
  actualMaintenance: "../application-Managment/actualMaintenance.html",
  missionOrder: "../application-Managment/missionOrder.html",
  jobOrder: "../application-Managment/jobOrder.html",
  missionNoteOrder: "../application-Managment/missionNoteOrder.html"
};

// Initialize application cards based on user role
function initializeApplicationCards() {
  var applicationCards = document.querySelectorAll(".application-card");
  var userPermissions = rolePermissions[userRole] || [];

  applicationCards.forEach(function(card) {
    var cardId = card.id;
    
    if (!userPermissions.includes(cardId)) {
      // Disable card for unauthorized users
      card.classList.add("disabled");
      var badge = card.querySelector(".card-badge");
      badge.textContent = "غير مسموح";
      badge.classList.add("restricted");
      
      // Add click handler for access denied
      card.onclick = function(e) {
        e.preventDefault();
        showAccessDeniedMessage(card.querySelector(".card-title").textContent);
      };
    } else {
      // Enable card for authorized users
      var badge = card.querySelector(".card-badge");
      
      // Check if application is implemented
      if (applicationRoutes[cardId]) {
        badge.textContent = "متاح";
        badge.classList.remove("coming-soon", "restricted");
        
        // Add navigation click handler
        card.onclick = function() {
          navigateToApplication(cardId);
        };
      } else {
        badge.textContent = "قريباً";
        badge.classList.add("coming-soon");
        
        // Add coming soon click handler
        card.onclick = function() {
          showComingSoonMessage(card.querySelector(".card-title").textContent);
        };
      }
    }
  });
}

// Navigate to specific application
function navigateToApplication(applicationId) {
  var route = applicationRoutes[applicationId];
  if (route) {
    if (typeof route === 'object' && route.type === 'modal') {
      // Show modal for modal type applications
      showApplicationModal(route.modalId);
      if (applicationId === 'purchaseOrder') {
        initializePurchaseOrderModal();
        loadPurchaseOrders();
      }
    } else {
      // Navigate to page for regular applications
      localStorage.setItem("previousPage", "orderList");
      window.location.href = route;
    }
  } else {
    showComingSoonMessage("هذا التطبيق");
  }
}

// Show application modal
function showApplicationModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    // Add click outside to close
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideApplicationModal(modalId);
      }
    });
  }
}

// Hide application modal
function hideApplicationModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Close purchase order modal
function closePurchaseOrderModal() {
  hideApplicationModal('purchaseOrderModal');
}

// Show access denied message
function showAccessDeniedMessage(applicationName) {
  alert("عذراً، غير مسموح لك بالوصول إلى " + applicationName + ". تحتاج صلاحيات أعلى للوصول لهذه الخدمة.");
}

// Show coming soon message
function showComingSoonMessage(applicationName) {
  alert(applicationName + " قيد التطوير حالياً. سيتم إتاحة هذه الخدمة قريباً.");
}

// Refresh applications
function refreshApplications() {
  // Show loading state
  var applicationsGrid = document.querySelector(".applications-grid");
  if (applicationsGrid) {
    var originalContent = applicationsGrid.innerHTML;
    
    applicationsGrid.innerHTML = '<div class="loading-message">جاري التحديث...</div>';
    
    // Simulate refresh delay
    setTimeout(function() {
      applicationsGrid.innerHTML = originalContent;
      initializeApplicationCards();
    }, 1000);
  }
}

// Check user permissions for debugging
function checkUserPermissions() {
  console.log("User Role:", userRole);
  console.log("User Permissions:", rolePermissions[userRole] || []);
}

// Purchase Order Modal Functionality
var spareParts = [];
var consumables = [];
var purchaseOrders = [];
var editingOrderId = null;

// Initialize purchase order modal
function initializePurchaseOrderModal() {
  loadSparePartsAndConsumables();
  updatePurchaseOrderButtonVisibility();
}

// Load spare parts and consumables
function loadSparePartsAndConsumables() {
  Promise.all([
    fetch('https://movesmartapi.runasp.net/api/SparePart', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }),
    fetch('https://movesmartapi.runasp.net/api/VehicleConsumable', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
  ]).then(function(responses) {
    return Promise.all([
      responses[0].ok ? responses[0].json() : [],
      responses[1].ok ? responses[1].json() : []
    ]);
  }).then(function(data) {
    spareParts = data[0];
    consumables = data[1];
    populateDropdowns();
  }).catch(function(error) {
    console.error('Error loading data:', error);
  });
}

// Populate dropdowns
function populateDropdowns() {
  var sparePartSelect = document.getElementById('sparePartSelect');
  var consumableSelect = document.getElementById('consumableSelect');
  
  if (sparePartSelect) {
    sparePartSelect.innerHTML = '<option value="">اختر قطعة الغيار</option>';
    spareParts.forEach(function(part) {
      sparePartSelect.innerHTML += '<option value="' + part.id + '">' + part.name + '</option>';
    });
  }
  
  if (consumableSelect) {
    consumableSelect.innerHTML = '<option value="">اختر المستهلك</option>';
    consumables.forEach(function(consumable) {
      consumableSelect.innerHTML += '<option value="' + consumable.id + '">' + consumable.name + '</option>';
    });
  }
}

// Toggle purchase type
function togglePurchaseType() {
  var type = document.getElementById('purchaseOrderType').value;
  var sparePartsGroup = document.getElementById('sparePartsGroup');
  var consumableGroup = document.getElementById('consumableGroup');
  
  if (type === 'spare') {
    sparePartsGroup.style.display = 'block';
    consumableGroup.style.display = 'none';
  } else if (type === 'consumable') {
    sparePartsGroup.style.display = 'none';
    consumableGroup.style.display = 'block';
  } else {
    sparePartsGroup.style.display = 'none';
    consumableGroup.style.display = 'none';
  }
}

// Load purchase orders
function loadPurchaseOrders() {
  showPurchaseOrdersLoading();
  
  Promise.all([
    fetchPurchaseOrders('SparePartPurchaseOrderService'),
    fetchPurchaseOrders('ConsumablePurchaseOrderService')
  ]).then(function(orders) {
    purchaseOrders = orders[0].concat(orders[1]);
    displayPurchaseOrders();
  }).catch(function(error) {
    console.error('Error loading purchase orders:', error);
    showPurchaseOrdersError('فشل في تحميل طلبات الشراء');
  });
}

// Fetch purchase orders
function fetchPurchaseOrders(endpoint) {
  return fetch('https://movesmartapi.runasp.net/api/' + endpoint, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }).then(function(response) {
    if (response.ok) {
      return response.json();
    }
    return [];
  }).catch(function(error) {
    console.error('Error fetching ' + endpoint + ':', error);
    return [];
  });
}

// Display purchase orders
function displayPurchaseOrders() {
  var container = document.getElementById('purchaseOrdersContainer');
  if (!container) return;
  
  if (purchaseOrders.length === 0) {
    container.innerHTML = '<div class="loading-indicator"><p>لا توجد طلبات شراء متاحة</p></div>';
    return;
  }
  
  container.innerHTML = purchaseOrders.map(function(order) {
    return createOrderCard(order);
  }).join('');
}

// Create order card
function createOrderCard(order) {
  var canEdit = userRole === 'WorkshopSupervisor' && order.status === 'Pending';
  var canApprove = (userRole === 'GeneralSupervisor' && order.status === 'Pending') ||
                   (userRole === 'GeneralManager' && order.status === 'FirstApproved');
  var canReject = canApprove;
  
  var statusClass = order.status === 'Accepted' ? 'accepted' : 
                   order.status === 'Rejected' ? 'rejected' : 'pending';
  
  var statusText = order.status === 'Accepted' ? 'مقبول' :
                  order.status === 'Rejected' ? 'مرفوض' :
                  order.status === 'FirstApproved' ? 'موافقة أولى' : 'معلق';
  
  var itemName = (order.sparePart && order.sparePart.name) || 
                 (order.vehicleConsumable && order.vehicleConsumable.name) || 'غير محدد';
  var orderType = order.sparePart ? 'قطع غيار' : 'مستهلكات';
  
  var actionsHtml = '';
  if (canEdit) {
    actionsHtml += '<button class="btn btn-primary" onclick="editPurchaseOrder(' + order.id + ')"><span>✏️</span> تعديل</button>';
    actionsHtml += '<button class="btn btn-danger" onclick="deletePurchaseOrder(' + order.id + ')"><span>🗑️</span> حذف</button>';
  }
  if (canApprove) {
    actionsHtml += '<button class="btn btn-success" onclick="approvePurchaseOrder(' + order.id + ')"><span>✅</span> موافقة</button>';
  }
  if (canReject) {
    actionsHtml += '<button class="btn btn-danger" onclick="rejectPurchaseOrder(' + order.id + ')"><span>❌</span> رفض</button>';
  }
  
  return '<div class="order-card">' +
    '<div class="order-header">' +
      '<div class="order-info">' +
        '<h3>' + orderType + ' - ' + itemName + '</h3>' +
        '<p>رقم الطلب: ' + order.id + '</p>' +
      '</div>' +
      '<div class="order-status">' +
        '<span class="status-badge ' + statusClass + '">' + statusText + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="order-details">' +
      '<div class="detail-item"><span class="detail-label">النوع</span><span class="detail-value">' + orderType + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">الصنف</span><span class="detail-value">' + itemName + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">الكمية</span><span class="detail-value">' + order.requiredQuantity + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">تاريخ الطلب</span><span class="detail-value">' + formatDate(order.createdAt) + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">الوصف</span><span class="detail-value">' + (order.description || 'لا يوجد') + '</span></div>' +
    '</div>' +
    '<div class="order-actions">' + actionsHtml + '</div>' +
  '</div>';
}

// Format date
function formatDate(dateString) {
  var date = new Date(dateString);
  return date.toLocaleDateString('ar-EG');
}

// Update button visibility
function updatePurchaseOrderButtonVisibility() {
  var addBtn = document.getElementById('addPurchaseOrderBtn');
  if (addBtn) {
    if (userRole === 'WorkshopSupervisor') {
      addBtn.style.display = 'flex';
    } else {
      addBtn.style.display = 'none';
    }
  }
}

// Open add purchase order form
function openAddPurchaseOrderForm() {
  editingOrderId = null;
  var form = document.getElementById('purchaseOrderForm');
  if (form) {
    form.reset();
    var formHeader = document.querySelector('#addPurchaseOrderPopup .form-header h2');
    if (formHeader) {
      formHeader.textContent = 'طلب شراء جديد';
    }
    togglePurchaseType();
  }
  showApplicationModal('addPurchaseOrderPopup');
}

// Close add purchase order form
function closeAddPurchaseOrderForm() {
  hideApplicationModal('addPurchaseOrderPopup');
  editingOrderId = null;
}

// Submit purchase order
function submitPurchaseOrder(event) {
  event.preventDefault();
  
  var type = document.getElementById('purchaseOrderType').value;
  var itemId = type === 'spare' ? 
    document.getElementById('sparePartSelect').value :
    document.getElementById('consumableSelect').value;
  var quantity = parseInt(document.getElementById('requiredQuantity').value);
  var description = document.getElementById('purchaseOrderDescription').value;
  
  if (!type || !itemId || !quantity || !description) {
    alert('يرجى ملء جميع الحقول المطلوبة');
    return;
  }
  
  var data = {
    requiredQuantity: quantity,
    description: description
  };
  
  if (type === 'spare') {
    data.sparePartId = parseInt(itemId);
  } else {
    data.vehicleConsumableId = parseInt(itemId);
  }
  
  var endpoint = type === 'spare' ? 
    'SparePartPurchaseOrderService' : 
    'ConsumablePurchaseOrderService';
  
  showLoadingOverlay();
  
  var url = editingOrderId ? 
    'https://movesmartapi.runasp.net/api/' + endpoint + '/' + editingOrderId :
    'https://movesmartapi.runasp.net/api/' + endpoint;
  
  var method = editingOrderId ? 'PUT' : 'POST';
  
  fetch(url, {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(function(response) {
    if (response.ok) {
      closeAddPurchaseOrderForm();
      loadPurchaseOrders();
      alert(editingOrderId ? 'تم تحديث الطلب بنجاح' : 'تم إنشاء الطلب بنجاح');
    } else {
      return response.text().then(function(errorText) {
        throw new Error(errorText || 'فشل في حفظ الطلب');
      });
    }
  }).catch(function(error) {
    console.error('Error submitting purchase order:', error);
    alert('حدث خطأ: ' + error.message);
  }).finally(function() {
    hideLoadingOverlay();
  });
}

// Edit purchase order
function editPurchaseOrder(orderId) {
  var order = purchaseOrders.find(function(o) { return o.id === orderId; });
  if (!order) return;
  
  editingOrderId = orderId;
  
  var typeSelect = document.getElementById('purchaseOrderType');
  var quantityInput = document.getElementById('requiredQuantity');
  var descriptionInput = document.getElementById('purchaseOrderDescription');
  
  if (order.sparePart) {
    typeSelect.value = 'spare';
    togglePurchaseType();
    document.getElementById('sparePartSelect').value = order.sparePartId;
  } else {
    typeSelect.value = 'consumable';
    togglePurchaseType();
    document.getElementById('consumableSelect').value = order.vehicleConsumableId;
  }
  
  quantityInput.value = order.requiredQuantity;
  descriptionInput.value = order.description;
  
  var formHeader = document.querySelector('#addPurchaseOrderPopup .form-header h2');
  if (formHeader) {
    formHeader.textContent = 'تعديل طلب الشراء';
  }
  showApplicationModal('addPurchaseOrderPopup');
}

// Delete purchase order
function deletePurchaseOrder(orderId) {
  if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
  
  var order = purchaseOrders.find(function(o) { return o.id === orderId; });
  if (!order) return;
  
  var endpoint = order.sparePart ? 
    'SparePartPurchaseOrderService' : 
    'ConsumablePurchaseOrderService';
  
  showLoadingOverlay();
  
  fetch('https://movesmartapi.runasp.net/api/' + endpoint + '/' + orderId, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }).then(function(response) {
    if (response.ok) {
      loadPurchaseOrders();
      alert('تم حذف الطلب بنجاح');
    } else {
      throw new Error('فشل في حذف الطلب');
    }
  }).catch(function(error) {
    console.error('Error deleting purchase order:', error);
    alert('حدث خطأ: ' + error.message);
  }).finally(function() {
    hideLoadingOverlay();
  });
}

// Approve purchase order
function approvePurchaseOrder(orderId) {
  updateOrderStatus(orderId, 'approve');
}

// Reject purchase order
function rejectPurchaseOrder(orderId) {
  var reason = prompt('يرجى إدخال سبب الرفض:');
  if (!reason) return;
  
  updateOrderStatus(orderId, 'reject', reason);
}

// Update order status
function updateOrderStatus(orderId, action, reason) {
  var order = purchaseOrders.find(function(o) { return o.id === orderId; });
  if (!order) return;
  
  var endpoint = order.sparePart ? 
    'SparePartPurchaseOrderService' : 
    'ConsumablePurchaseOrderService';
  
  showLoadingOverlay();
  
  fetch('https://movesmartapi.runasp.net/api/' + endpoint + '/' + action + '/' + orderId, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: reason ? JSON.stringify({ reason: reason }) : null
  }).then(function(response) {
    if (response.ok) {
      loadPurchaseOrders();
      var message = action === 'approve' ? 'تم قبول الطلب بنجاح' : 'تم رفض الطلب بنجاح';
      alert(message);
    } else {
      throw new Error('فشل في ' + (action === 'approve' ? 'قبول' : 'رفض') + ' الطلب');
    }
  }).catch(function(error) {
    console.error('Error ' + action + 'ing purchase order:', error);
    alert('حدث خطأ: ' + error.message);
  }).finally(function() {
    hideLoadingOverlay();
  });
}

// Refresh purchase orders
function refreshPurchaseOrders() {
  loadPurchaseOrders();
}

// Loading states
function showPurchaseOrdersLoading() {
  var container = document.getElementById('purchaseOrdersContainer');
  if (container) {
    container.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>جاري تحميل طلبات الشراء...</p></div>';
  }
}

function showPurchaseOrdersError(message) {
  var container = document.getElementById('purchaseOrdersContainer');
  if (container) {
    container.innerHTML = '<div class="error-message"><p>' + message + '</p><button onclick="loadPurchaseOrders()" class="btn btn-primary">إعادة المحاولة</button></div>';
  }
}

function showLoadingOverlay() {
  var overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function hideLoadingOverlay() {
  var overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// Initialize when page loads - prevent multiple initializations
if (!window.orderListInitialized) {
  window.orderListInitialized = true;
  
  // Use setTimeout to ensure DOM is ready when loaded dynamically
  setTimeout(function() {
    console.log("Initializing Applications Order List Page");
    console.log("User Role:", userRole);
    
    if (document.querySelector(".application-card")) {
      initializeApplicationCards();
      checkUserPermissions();
    }
  }, 100);
}

// Export functions for external use
window.ApplicationsOrderList = window.ApplicationsOrderList || {
  initializeApplicationCards: initializeApplicationCards,
  navigateToApplication: navigateToApplication,
  refreshApplications: refreshApplications,
  checkUserPermissions: checkUserPermissions
}; 