// Prevent multiple script executions and variable redeclaration
if (!window.disposalListScriptLoaded) {
  window.disposalListScriptLoaded = true;
  
  console.log('🚀 Loading disposal list script for the first time');
  
  // Global variables - prevent redeclaration errors
  window.consumablesData = window.consumablesData || [];
  window.filteredConsumablesData = window.filteredConsumablesData || [];
  window.editingConsumableIndexData = window.editingConsumableIndexData || null;
  window.disposalListToken = window.disposalListToken || null;
  window.disposalListUserRole = window.disposalListUserRole || null;
  window.disposalListInitialized = window.disposalListInitialized || false;

  // Use local variables to avoid redeclaration
  var consumables = window.consumablesData;
  var filteredConsumables = window.filteredConsumablesData;
  var editingConsumableIndex = window.editingConsumableIndexData;
  var token = window.disposalListToken;
  var userRole = window.disposalListUserRole;
  var isInitialized = window.disposalListInitialized;

  // Initialize page
  function initializePage() {
    console.log('🔄 Initializing disposal list page...');
    
    // Prevent multiple initializations
    if (window.disposalListInitialized) {
      console.log('🔄 Page already initialized, refreshing data...');
      refreshConsumables();
      return;
    }
    
    window.disposalListToken = localStorage.getItem('token');
    window.disposalListUserRole = localStorage.getItem('userRole');
    token = window.disposalListToken;
    userRole = window.disposalListUserRole;
    
    console.log('🔍 Token check:', token ? `Token found (${token.substring(0, 20)}...)` : 'No token found');
    console.log('👤 User role:', userRole);
    
    if (!token) {
      console.error('❌ No authentication token found');
      alert('جلسة المستخدم منتهية الصلاحية. يرجى تسجيل الدخول مرة أخرى.');
      window.location.href = '../login.html';
      return;
    }
    
    window.disposalListInitialized = true;
    isInitialized = true;
    setupPageTitle();
    setupSearchListener();
    fetchConsumables();
  }

  // Force initialization (called by shared layout if needed)
  function forceInitialize() {
    console.log('🔄 Force initializing disposal list page...');
    window.disposalListInitialized = false;
    isInitialized = false;
    initializePage();
  }

  // Setup page title navigation
  function setupPageTitle() {
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle && !pageTitle.hasAttribute('data-disposal-list-listener')) {
      pageTitle.style.cursor = 'pointer';
      pageTitle.addEventListener('click', function() {
        if (userRole) {
          window.location.href = `../dash-Boards/${userRole.toLowerCase()}Dashboard.html`;
        }
      });
      pageTitle.setAttribute('data-disposal-list-listener', 'true');
    }
  }

  // Setup search functionality
  function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && !searchInput.hasAttribute('data-disposal-list-listener')) {
      searchInput.addEventListener('input', function() {
        const keyword = this.value.toLowerCase();
        filterConsumables(keyword);
      });
      searchInput.setAttribute('data-disposal-list-listener', 'true');
    }
  }

  // Check if token is expired or invalid
  function checkTokenValidity(response) {
    if (response.status === 401) {
      console.error('🔐 Token expired or invalid');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      alert('انتهت صلاحية جلسة المستخدم. يرجى تسجيل الدخول مرة أخرى.');
      window.location.href = '../login.html';
      return false;
    }
    return true;
  }

  // Fetch consumables from API
  async function fetchConsumables() {
    try {
      // Ensure we have a fresh token
      token = localStorage.getItem('token');
      window.disposalListToken = token;
      
      if (!token) {
        console.error('❌ No token available for API call');
        showError('جلسة المستخدم منتهية الصلاحية. يرجى تسجيل الدخول مرة أخرى.');
        return;
      }
      
      showListLoading(true);
      
      console.log('🔄 Fetching consumables...');
      console.log('🌐 API URL:', 'https://movesmartapi.runasp.net/api/VehicleConsumable');
      console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const response = await fetch('https://movesmartapi.runasp.net/api/VehicleConsumable', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check for authentication errors
      if (!checkTokenValidity(response)) {
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'فشل في جلب بيانات المواد الاستهلاكية'}`);
      }
      
      const data = await response.json();
      console.log('✅ Consumables data received:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        window.consumablesData = data;
        consumables = data;
      } else if (data.$values && Array.isArray(data.$values)) {
        window.consumablesData = data.$values;
        consumables = data.$values;
      } else {
        window.consumablesData = [];
        consumables = [];
      }
      
      console.log(`📦 Processed ${consumables.length} consumables`);
      
      window.filteredConsumablesData = [...consumables];
      filteredConsumables = [...consumables];
      renderConsumablesList();
      updateTotalCount();
      
    } catch (error) {
      console.error('💥 Error fetching consumables:', error);
      
      // Handle network errors
      if (error.message.includes('Failed to fetch')) {
        showError('فشل في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
      } else {
        showError('فشل في تحميل المواد الاستهلاكية: ' + error.message);
      }
    } finally {
      showListLoading(false);
    }
  }

  // Show/hide loading state for consumables list
  function showListLoading(show) {
    const loadingElement = document.getElementById('consumablesListLoading');
    const listElement = document.getElementById('consumablesList');
    const noDataElement = document.getElementById('noConsumablesMessage');
    
    if (show) {
      if (loadingElement) loadingElement.classList.remove('hidden');
      if (listElement) listElement.classList.add('hidden');
      if (noDataElement) noDataElement.classList.add('hidden');
    } else {
      if (loadingElement) loadingElement.classList.add('hidden');
    }
  }

  // Render consumables list
  function renderConsumablesList() {
    const listElement = document.getElementById('consumablesList');
    const noDataElement = document.getElementById('noConsumablesMessage');
    
    if (!listElement || !noDataElement) return;
    
    // Update references
    consumables = window.consumablesData;
    filteredConsumables = window.filteredConsumablesData;
    
    if (filteredConsumables.length === 0) {
      listElement.classList.add('hidden');
      noDataElement.classList.remove('hidden');
      return;
    }
    
    listElement.classList.remove('hidden');
    noDataElement.classList.add('hidden');
    
    listElement.innerHTML = '';
    
    filteredConsumables.forEach((consumable, index) => {
      const originalIndex = consumables.indexOf(consumable);
      const li = document.createElement('li');
      
      li.innerHTML = `
        <input type="checkbox" onchange="toggleConsumableCard(${originalIndex}, this.checked)" />
        <span class="consumable-name">${consumable.consumableName || 'مادة غير محددة'}</span>
      `;
      
      listElement.appendChild(li);
    });
  }

  // Toggle consumable card display
  function toggleConsumableCard(consumableIndex, isChecked) {
    const cardsContainer = document.getElementById('cardsContainer');
    const cardId = `consumable-card-${consumableIndex}`;
    const existingCard = document.getElementById(cardId);
    
    // Update references
    consumables = window.consumablesData;
    
    if (isChecked && !existingCard) {
      // Show card
      const consumable = consumables[consumableIndex];
      const cardElement = createConsumableCard(consumable, consumableIndex);
      
      // Remove empty state if it exists
      const emptyState = cardsContainer.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }
      
      cardsContainer.appendChild(cardElement);
    } else if (!isChecked && existingCard) {
      // Hide card
      existingCard.remove();
      
      // Show empty state if no cards remaining
      const remainingCards = cardsContainer.querySelectorAll('.consumable-card');
      if (remainingCards.length === 0) {
        showEmptyState();
      }
    }
  }

  // Create consumable card element
  function createConsumableCard(consumable, consumableIndex) {
    const card = document.createElement('div');
    card.className = 'consumable-card';
    card.id = `consumable-card-${consumableIndex}`;
    
    const quantityStatus = getQuantityStatus(consumable.quantity);
    const statusClass = quantityStatus.class;
    const statusText = quantityStatus.text;
    
    card.innerHTML = `
      <div class="card-header">
        <h3>${consumable.consumableName || 'مادة غير محددة'}</h3>
      </div>
      
      <div class="card-details">
        <div class="detail-item">
          <span class="detail-label">الكمية المتاحة</span>
          <span class="detail-value">
            ${consumable.quantity || 0}
            <span class="quantity-status ${statusClass}">${statusText}</span>
          </span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">العمر الافتراضي</span>
          <span class="detail-value">${consumable.validityLength || 0} يوم</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">معرف المادة</span>
          <span class="detail-value">#${consumable.consumableId || 'غير محدد'}</span>
        </div>
      </div>
      
      <div class="card-actions">
        <button class="btn-primary" onclick="editConsumable(${consumableIndex})">
          <span class="icon">✏️</span>
          <span>تعديل</span>
        </button>
        <button class="btn-danger" onclick="deleteConsumable(${consumableIndex})">
          <span class="icon">🗑️</span>
          <span>حذف</span>
        </button>
      </div>
    `;
    
    return card;
  }

  // Get quantity status
  function getQuantityStatus(quantity) {
    if (quantity === 0) {
      return { class: 'empty', text: 'نفدت' };
    } else if (quantity <= 5) {
      return { class: 'low', text: 'منخفض' };
    } else {
      return { class: 'good', text: 'متوفر' };
    }
  }

  // Show empty state
  function showEmptyState() {
    const cardsContainer = document.getElementById('cardsContainer');
    if (cardsContainer && !cardsContainer.querySelector('.empty-state')) {
      cardsContainer.innerHTML = `
        <div class="empty-state">
          <span class="icon">👆</span>
          <p>اختر مادة من القائمة لعرض التفاصيل</p>
        </div>
      `;
    }
  }

  // Filter consumables based on search
  function filterConsumables(keyword) {
    // Update references
    consumables = window.consumablesData;
    
    if (!keyword.trim()) {
      window.filteredConsumablesData = [...consumables];
      filteredConsumables = [...consumables];
    } else {
      window.filteredConsumablesData = consumables.filter(consumable => 
        (consumable.consumableName || '').toLowerCase().includes(keyword)
      );
      filteredConsumables = window.filteredConsumablesData;
    }
    
    renderConsumablesList();
    updateTotalCount();
    clearAllCards();
  }

  // Clear all displayed cards
  function clearAllCards() {
    const cardsContainer = document.getElementById('cardsContainer');
    if (cardsContainer) {
      cardsContainer.innerHTML = '';
      showEmptyState();
    }
    
    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('#consumablesList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
  }

  // Update total count
  function updateTotalCount() {
    const totalElement = document.getElementById('totalCount');
    if (totalElement) {
      totalElement.textContent = window.filteredConsumablesData.length;
    }
  }

  // Open add consumable popup
  function openAddConsumablePopup() {
    window.editingConsumableIndexData = null;
    editingConsumableIndex = null;
    clearForm();
    
    const popup = document.getElementById('addConsumablePopup');
    const title = document.getElementById('popupTitle');
    const submitText = document.getElementById('submitText');
    
    if (title) title.textContent = 'إضافة مادة استهلاكية جديدة';
    if (submitText) submitText.textContent = 'حفظ';
    if (popup) popup.classList.remove('hidden');
  }

  // Close add consumable popup
  function closeAddConsumablePopup() {
    const popup = document.getElementById('addConsumablePopup');
    if (popup) popup.classList.add('hidden');
    window.editingConsumableIndexData = null;
    editingConsumableIndex = null;
    clearForm();
  }

  // Clear form
  function clearForm() {
    const form = document.getElementById('consumableForm');
    if (form) {
      form.reset();
    }
  }

  // Edit consumable
  function editConsumable(consumableIndex) {
    window.editingConsumableIndexData = consumableIndex;
    editingConsumableIndex = consumableIndex;
    const consumable = window.consumablesData[consumableIndex];
    
    // Fill form with consumable data
    const consumableNameInput = document.getElementById('consumableName');
    const quantityInput = document.getElementById('quantity');
    const validityInput = document.getElementById('validityLength');
    
    if (consumableNameInput) consumableNameInput.value = consumable.consumableName || '';
    if (quantityInput) quantityInput.value = consumable.quantity || 0;
    if (validityInput) validityInput.value = consumable.validityLength || 0;
    
    // Update popup title
    const title = document.getElementById('popupTitle');
    const submitText = document.getElementById('submitText');
    
    if (title) title.textContent = 'تعديل المادة الاستهلاكية';
    if (submitText) submitText.textContent = 'حفظ التعديل';
    
    // Show popup
    const popup = document.getElementById('addConsumablePopup');
    if (popup) popup.classList.remove('hidden');
  }

  // Submit consumable (add or update)
  async function submitConsumable(event) {
    event.preventDefault();
    
    const consumableName = document.getElementById('consumableName').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const validityLength = parseInt(document.getElementById('validityLength').value);
    
    if (!consumableName || isNaN(quantity) || isNaN(validityLength)) {
      alert('يرجى ملء جميع الحقول بشكل صحيح');
      return;
    }
    
    const consumableData = {
      consumableName: consumableName,
      quantity: quantity,
      validityLength: validityLength
    };
    
    showLoadingOverlay(true);
    
    try {
      if (window.editingConsumableIndexData !== null) {
        // Update existing consumable
        const consumable = window.consumablesData[window.editingConsumableIndexData];
        consumableData.consumableId = consumable.consumableId;
        await updateConsumable(consumableData);
      } else {
        // Add new consumable
        consumableData.consumableId = 0; // Set to 0 for new items
        await addConsumable(consumableData);
      }
      
      closeAddConsumablePopup();
      await fetchConsumables();
      
    } catch (error) {
      console.error('Error submitting consumable:', error);
      alert('حدث خطأ: ' + error.message);
    } finally {
      showLoadingOverlay(false);
    }
  }

  // Add new consumable
  async function addConsumable(consumableData) {
    console.log('➕ Adding new consumable:', consumableData);
    
    // Ensure we have a fresh token
    token = localStorage.getItem('token');
    window.disposalListToken = token;
    
    const response = await fetch('https://movesmartapi.runasp.net/api/VehicleConsumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(consumableData)
    });
    
    if (!checkTokenValidity(response)) {
      return;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Add consumable error:', errorText);
      throw new Error(errorText || 'فشل في إضافة المادة الاستهلاكية');
    }
    
    alert('تم إضافة المادة الاستهلاكية بنجاح');
  }

  // Update existing consumable
  async function updateConsumable(consumableData) {
    console.log('✏️ Updating consumable:', consumableData);
    
    // Ensure we have a fresh token
    token = localStorage.getItem('token');
    window.disposalListToken = token;
    
    const response = await fetch('https://movesmartapi.runasp.net/api/VehicleConsumable', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(consumableData)
    });
    
    if (!checkTokenValidity(response)) {
      return;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update consumable error:', errorText);
      throw new Error(errorText || 'فشل في تحديث المادة الاستهلاكية');
    }
    
    alert('تم تحديث المادة الاستهلاكية بنجاح');
  }

  // Delete consumable
  async function deleteConsumable(consumableIndex) {
    const consumable = window.consumablesData[consumableIndex];
    const consumableName = consumable.consumableName || 'المادة الاستهلاكية';
    
    if (!confirm(`هل أنت متأكد من حذف ${consumableName}؟`)) {
      return;
    }
    
    showLoadingOverlay(true);
    
    try {
      const consumableId = consumable.consumableId;
      console.log('🗑️ Deleting consumable:', consumableId);
      
      // Ensure we have a fresh token
      token = localStorage.getItem('token');
      window.disposalListToken = token;
      
      const response = await fetch(`https://movesmartapi.runasp.net/api/VehicleConsumable/${consumableId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!checkTokenValidity(response)) {
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Delete consumable error:', errorText);
        throw new Error(errorText || 'فشل في حذف المادة الاستهلاكية');
      }
      
      alert('تم حذف المادة الاستهلاكية بنجاح');
      await fetchConsumables();
      
    } catch (error) {
      console.error('Error deleting consumable:', error);
      alert('حدث خطأ: ' + error.message);
    } finally {
      showLoadingOverlay(false);
    }
  }

  // Refresh consumables
  function refreshConsumables() {
    console.log('🔄 Refreshing consumables data...');
    
    // Ensure we're properly initialized
    if (!window.disposalListInitialized) {
      console.log('📋 Not initialized, initializing first...');
      initializePage();
      return;
    }
    
    clearAllCards();
    fetchConsumables();
  }

  // Show/hide loading overlay
  function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      if (show) {
        overlay.classList.remove('hidden');
      } else {
        overlay.classList.add('hidden');
      }
    }
  }

  // Show error message
  function showError(message) {
    const listElement = document.getElementById('consumablesList');
    const noDataElement = document.getElementById('noConsumablesMessage');
    
    if (listElement) listElement.classList.add('hidden');
    if (noDataElement) {
      noDataElement.innerHTML = `
        <span class="icon">⚠️</span>
        <p>${message}</p>
        <button class="btn-primary" onclick="refreshConsumables()">إعادة المحاولة</button>
        <button class="btn-secondary" onclick="checkTokenAndRedirect()" style="margin-top: 10px;">تسجيل الدخول</button>
      `;
      noDataElement.classList.remove('hidden');
    }
  }

  // Check token and redirect to login if needed
  function checkTokenAndRedirect() {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      window.location.href = '../login.html';
    } else {
      alert('التوكن موجود. يرجى التحقق من الاتصال بالإنترنت أو صلاحية التوكن.');
    }
  }

  // Initialize when page loads - handle both direct and dynamic loading
  if (!window.disposalListListenerAdded) {
    document.addEventListener('DOMContentLoaded', function() {
      initializePage();
    });
    window.disposalListListenerAdded = true;
  }

  // Also initialize immediately if DOM is already ready (for dynamic loading)
  if (document.readyState === 'loading') {
    if (!window.disposalListListenerAdded) {
      document.addEventListener('DOMContentLoaded', initializePage);
      window.disposalListListenerAdded = true;
    }
  } else {
    // DOM is already ready, initialize immediately
    setTimeout(initializePage, 100);
  }

  // Export functions to global scope for HTML onclick handlers
  window.openAddConsumablePopup = openAddConsumablePopup;
  window.closeAddConsumablePopup = closeAddConsumablePopup;
  window.submitConsumable = submitConsumable;
  window.editConsumable = editConsumable;
  window.deleteConsumable = deleteConsumable;
  window.refreshConsumables = refreshConsumables;
  window.toggleConsumableCard = toggleConsumableCard;
  window.checkTokenAndRedirect = checkTokenAndRedirect;
  window.forceInitialize = forceInitialize;

} else {
  console.log('🚫 Disposal list script already loaded, skipping execution');
  
  // Still expose the force initialize function for dynamic loading
  if (typeof window.forceInitialize !== 'function') {
    window.forceInitialize = function() {
      console.log('🔄 Force initializing disposal list page (from cached script)...');
      window.disposalListInitialized = false;
      if (typeof initializePage === 'function') {
        initializePage();
      }
    };
  }
}
