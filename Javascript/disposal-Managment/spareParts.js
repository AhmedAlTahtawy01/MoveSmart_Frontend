// Prevent multiple script executions and variable redeclaration
if (!window.sparePartsScriptLoaded) {
  window.sparePartsScriptLoaded = true;
  
  console.log('🚀 Loading spare parts script for the first time');
  
  // Global variables - prevent redeclaration errors
  window.sparePartsData = window.sparePartsData || [];
  window.filteredPartsData = window.filteredPartsData || [];
  window.editingPartIndexData = window.editingPartIndexData || null;
  window.sparePartsToken = window.sparePartsToken || null;
  window.sparePartsUserRole = window.sparePartsUserRole || null;
  window.sparePartsInitialized = window.sparePartsInitialized || false;

  // Use local variables to avoid redeclaration
  var spareParts = window.sparePartsData;
  var filteredParts = window.filteredPartsData;
  var editingPartIndex = window.editingPartIndexData;
  var token = window.sparePartsToken;
  var userRole = window.sparePartsUserRole;
  var isInitialized = window.sparePartsInitialized;

  // Initialize page
  function initializePage() {
    console.log('🔄 Initializing spare parts page...');
    
    // Prevent multiple initializations
    if (window.sparePartsInitialized) {
      console.log('🔄 Page already initialized, refreshing data...');
      refreshParts();
      return;
    }
    
    window.sparePartsToken = localStorage.getItem('token');
    window.sparePartsUserRole = localStorage.getItem('userRole');
    token = window.sparePartsToken;
    userRole = window.sparePartsUserRole;
    
    console.log('🔍 Token check:', token ? `Token found (${token.substring(0, 20)}...)` : 'No token found');
    console.log('👤 User role:', userRole);
    
    if (!token) {
      console.error('❌ No authentication token found');
      alert('جلسة المستخدم منتهية الصلاحية. يرجى تسجيل الدخول مرة أخرى.');
      window.location.href = '../login.html';
      return;
    }
    
    window.sparePartsInitialized = true;
    isInitialized = true;
    setupPageTitle();
    setupSearchListener();
    fetchSpareParts();
  }

  // Force initialization (called by shared layout if needed)
  function forceInitialize() {
    console.log('🔄 Force initializing spare parts page...');
    window.sparePartsInitialized = false;
    isInitialized = false;
    initializePage();
  }

  // Setup page title navigation
  function setupPageTitle() {
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle && !pageTitle.hasAttribute('data-spare-parts-listener')) {
      pageTitle.style.cursor = 'pointer';
      pageTitle.addEventListener('click', function() {
        if (userRole) {
          window.location.href = `../dash-Boards/${userRole.toLowerCase()}Dashboard.html`;
        }
      });
      pageTitle.setAttribute('data-spare-parts-listener', 'true');
    }
  }

  // Setup search functionality
  function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && !searchInput.hasAttribute('data-spare-parts-listener')) {
      searchInput.addEventListener('input', function() {
        const keyword = this.value.toLowerCase();
        filterParts(keyword);
      });
      searchInput.setAttribute('data-spare-parts-listener', 'true');
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

  // Fetch spare parts from API
  async function fetchSpareParts() {
    try {
      // Ensure we have a fresh token
      token = localStorage.getItem('token');
      window.sparePartsToken = token;
      
      if (!token) {
        console.error('❌ No token available for API call');
        showError('جلسة المستخدم منتهية الصلاحية. يرجى تسجيل الدخول مرة أخرى.');
        return;
      }
      
      showListLoading(true);
      
      console.log('🔄 Fetching spare parts...');
      console.log('🌐 API URL:', 'https://movesmartapi.runasp.net/api/SparePart');
      console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const response = await fetch('https://movesmartapi.runasp.net/api/SparePart', {
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
        throw new Error(`HTTP ${response.status}: ${errorText || 'فشل في جلب بيانات قطع الغيار'}`);
      }
      
      const data = await response.json();
      console.log('✅ Spare parts data received:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        window.sparePartsData = data;
        spareParts = data;
      } else if (data.$values && Array.isArray(data.$values)) {
        window.sparePartsData = data.$values;
        spareParts = data.$values;
      } else {
        window.sparePartsData = [];
        spareParts = [];
      }
      
      console.log(`📦 Processed ${spareParts.length} spare parts`);
      
      window.filteredPartsData = [...spareParts];
      filteredParts = [...spareParts];
      renderPartsList();
      updateTotalCount();
      
    } catch (error) {
      console.error('💥 Error fetching spare parts:', error);
      
      // Handle network errors
      if (error.message.includes('Failed to fetch')) {
        showError('فشل في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
      } else {
        showError('فشل في تحميل قطع الغيار: ' + error.message);
      }
    } finally {
      showListLoading(false);
    }
  }

  // Show/hide loading state for parts list
  function showListLoading(show) {
    const loadingElement = document.getElementById('partsListLoading');
    const listElement = document.getElementById('partsList');
    const noDataElement = document.getElementById('noPartsMessage');
    
    if (show) {
      if (loadingElement) loadingElement.classList.remove('hidden');
      if (listElement) listElement.classList.add('hidden');
      if (noDataElement) noDataElement.classList.add('hidden');
    } else {
      if (loadingElement) loadingElement.classList.add('hidden');
    }
  }

  // Render parts list
  function renderPartsList() {
    const listElement = document.getElementById('partsList');
    const noDataElement = document.getElementById('noPartsMessage');
    
    if (!listElement || !noDataElement) return;
    
    // Update references
    spareParts = window.sparePartsData;
    filteredParts = window.filteredPartsData;
    
    if (filteredParts.length === 0) {
      listElement.classList.add('hidden');
      noDataElement.classList.remove('hidden');
      return;
    }
    
    listElement.classList.remove('hidden');
    noDataElement.classList.add('hidden');
    
    listElement.innerHTML = '';
    
    filteredParts.forEach((part, index) => {
      const originalIndex = spareParts.indexOf(part);
      const li = document.createElement('li');
      
      li.innerHTML = `
        <input type="checkbox" onchange="togglePartCard(${originalIndex}, this.checked)" />
        <span class="part-name">${part.partName || part.name || 'قطعة غير محددة'}</span>
      `;
      
      listElement.appendChild(li);
    });
  }

  // Toggle part card display
  function togglePartCard(partIndex, isChecked) {
    const cardsContainer = document.getElementById('cardsContainer');
    const cardId = `part-card-${partIndex}`;
    const existingCard = document.getElementById(cardId);
    
    // Update references
    spareParts = window.sparePartsData;
    
    if (isChecked && !existingCard) {
      // Show card
      const part = spareParts[partIndex];
      const cardElement = createPartCard(part, partIndex);
      
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
      const remainingCards = cardsContainer.querySelectorAll('.part-card');
      if (remainingCards.length === 0) {
        showEmptyState();
      }
    }
  }

  // Create part card element
  function createPartCard(part, partIndex) {
    const card = document.createElement('div');
    card.className = 'part-card';
    card.id = `part-card-${partIndex}`;
    
    const quantityStatus = getQuantityStatus(part.quantity);
    const statusClass = quantityStatus.class;
    const statusText = quantityStatus.text;
    
    card.innerHTML = `
      <div class="card-header">
        <h3>${part.partName || part.name || 'قطعة غير محددة'}</h3>
      </div>
      
      <div class="card-details">
        <div class="detail-item">
          <span class="detail-label">الكمية المتاحة</span>
          <span class="detail-value">
            ${part.quantity || 0}
            <span class="quantity-status ${statusClass}">${statusText}</span>
          </span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">العمر الافتراضي</span>
          <span class="detail-value">${part.validityLength || 0} يوم</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">معرف القطعة</span>
          <span class="detail-value">#${part.sparePartId || part.id || 'غير محدد'}</span>
        </div>
      </div>
      
      <div class="card-actions">
        <button class="btn-primary" onclick="editPart(${partIndex})">
          <span class="icon">✏️</span>
          <span>تعديل</span>
        </button>
        <button class="btn-danger" onclick="deletePart(${partIndex})">
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
          <p>اختر قطعة من القائمة لعرض التفاصيل</p>
        </div>
      `;
    }
  }

  // Filter parts based on search
  function filterParts(keyword) {
    // Update references
    spareParts = window.sparePartsData;
    
    if (!keyword.trim()) {
      window.filteredPartsData = [...spareParts];
      filteredParts = [...spareParts];
    } else {
      window.filteredPartsData = spareParts.filter(part => 
        (part.partName || part.name || '').toLowerCase().includes(keyword)
      );
      filteredParts = window.filteredPartsData;
    }
    
    renderPartsList();
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
    const checkboxes = document.querySelectorAll('#partsList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
  }

  // Update total count
  function updateTotalCount() {
    const totalElement = document.getElementById('totalCount');
    if (totalElement) {
      totalElement.textContent = window.filteredPartsData.length;
    }
  }

  // Open add part popup
  function openAddPartPopup() {
    window.editingPartIndexData = null;
    editingPartIndex = null;
    clearForm();
    
    const popup = document.getElementById('addPartPopup');
    const title = document.getElementById('popupTitle');
    const submitText = document.getElementById('submitText');
    
    if (title) title.textContent = 'إضافة قطعة غيار جديدة';
    if (submitText) submitText.textContent = 'حفظ';
    if (popup) popup.classList.remove('hidden');
  }

  // Close add part popup
  function closeAddPartPopup() {
    const popup = document.getElementById('addPartPopup');
    if (popup) popup.classList.add('hidden');
    window.editingPartIndexData = null;
    editingPartIndex = null;
    clearForm();
  }

  // Clear form
  function clearForm() {
    const form = document.getElementById('partForm');
    if (form) {
      form.reset();
    }
  }

  // Edit part
  function editPart(partIndex) {
    window.editingPartIndexData = partIndex;
    editingPartIndex = partIndex;
    const part = window.sparePartsData[partIndex];
    
    // Fill form with part data
    const partNameInput = document.getElementById('partName');
    const quantityInput = document.getElementById('quantity');
    const validityInput = document.getElementById('validityLength');
    
    if (partNameInput) partNameInput.value = part.partName || part.name || '';
    if (quantityInput) quantityInput.value = part.quantity || 0;
    if (validityInput) validityInput.value = part.validityLength || 0;
    
    // Update popup title
    const title = document.getElementById('popupTitle');
    const submitText = document.getElementById('submitText');
    
    if (title) title.textContent = 'تعديل قطعة الغيار';
    if (submitText) submitText.textContent = 'حفظ التعديل';
    
    // Show popup
    const popup = document.getElementById('addPartPopup');
    if (popup) popup.classList.remove('hidden');
  }

  // Submit part (add or update)
  async function submitPart(event) {
    event.preventDefault();
    
    const partName = document.getElementById('partName').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const validityLength = parseInt(document.getElementById('validityLength').value);
    
    if (!partName || isNaN(quantity) || isNaN(validityLength)) {
      alert('يرجى ملء جميع الحقول بشكل صحيح');
      return;
    }
    
    const partData = {
      partName: partName,
      quantity: quantity,
      validityLength: validityLength
    };
    
    showLoadingOverlay(true);
    
    try {
      if (window.editingPartIndexData !== null) {
        // Update existing part
        const part = window.sparePartsData[window.editingPartIndexData];
        partData.sparePartId = part.sparePartId || part.id;
        await updatePart(partData);
      } else {
        // Add new part
        await addPart(partData);
      }
      
      closeAddPartPopup();
      await fetchSpareParts();
      
    } catch (error) {
      console.error('Error submitting part:', error);
      alert('حدث خطأ: ' + error.message);
    } finally {
      showLoadingOverlay(false);
    }
  }

  // Add new part
  async function addPart(partData) {
    console.log('➕ Adding new part:', partData);
    
    // Ensure we have a fresh token
    token = localStorage.getItem('token');
    window.sparePartsToken = token;
    
    const response = await fetch('https://movesmartapi.runasp.net/api/SparePart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(partData)
    });
    
    if (!checkTokenValidity(response)) {
      return;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Add part error:', errorText);
      throw new Error(errorText || 'فشل في إضافة القطعة');
    }
    
    alert('تم إضافة القطعة بنجاح');
  }

  // Update existing part
  async function updatePart(partData) {
    console.log('✏️ Updating part:', partData);
    
    // Ensure we have a fresh token
    token = localStorage.getItem('token');
    window.sparePartsToken = token;
    
    const response = await fetch('https://movesmartapi.runasp.net/api/SparePart', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(partData)
    });
    
    if (!checkTokenValidity(response)) {
      return;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update part error:', errorText);
      throw new Error(errorText || 'فشل في تحديث القطعة');
    }
    
    alert('تم تحديث القطعة بنجاح');
  }

  // Delete part
  async function deletePart(partIndex) {
    const part = window.sparePartsData[partIndex];
    const partName = part.partName || part.name || 'القطعة';
    
    if (!confirm(`هل أنت متأكد من حذف ${partName}؟`)) {
      return;
    }
    
    showLoadingOverlay(true);
    
    try {
      const partId = part.sparePartId || part.id;
      console.log('🗑️ Deleting part:', partId);
      
      // Ensure we have a fresh token
      token = localStorage.getItem('token');
      window.sparePartsToken = token;
      
      const response = await fetch(`https://movesmartapi.runasp.net/api/SparePart/${partId}`, {
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
        console.error('❌ Delete part error:', errorText);
        throw new Error(errorText || 'فشل في حذف القطعة');
      }
      
      alert('تم حذف القطعة بنجاح');
      await fetchSpareParts();
      
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('حدث خطأ: ' + error.message);
    } finally {
      showLoadingOverlay(false);
    }
  }

  // Refresh parts
  function refreshParts() {
    console.log('🔄 Refreshing parts data...');
    
    // Ensure we're properly initialized
    if (!window.sparePartsInitialized) {
      console.log('📋 Not initialized, initializing first...');
      initializePage();
      return;
    }
    
    clearAllCards();
    fetchSpareParts();
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
    const listElement = document.getElementById('partsList');
    const noDataElement = document.getElementById('noPartsMessage');
    
    if (listElement) listElement.classList.add('hidden');
    if (noDataElement) {
      noDataElement.innerHTML = `
        <span class="icon">⚠️</span>
        <p>${message}</p>
        <button class="btn-primary" onclick="refreshParts()">إعادة المحاولة</button>
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
  if (!window.sparePartsListenerAdded) {
    document.addEventListener('DOMContentLoaded', function() {
      initializePage();
    });
    window.sparePartsListenerAdded = true;
  }

  // Also initialize immediately if DOM is already ready (for dynamic loading)
  if (document.readyState === 'loading') {
    if (!window.sparePartsListenerAdded) {
      document.addEventListener('DOMContentLoaded', initializePage);
      window.sparePartsListenerAdded = true;
    }
  } else {
    // DOM is already ready, initialize immediately
    setTimeout(initializePage, 100);
  }

  // Export functions to global scope for HTML onclick handlers
  window.openAddPartPopup = openAddPartPopup;
  window.closeAddPartPopup = closeAddPartPopup;
  window.submitPart = submitPart;
  window.editPart = editPart;
  window.deletePart = deletePart;
  window.refreshParts = refreshParts;
  window.togglePartCard = togglePartCard;
  window.checkTokenAndRedirect = checkTokenAndRedirect;
  window.forceInitialize = forceInitialize;

} else {
  console.log('🚫 Spare parts script already loaded, skipping execution');
  
  // Still expose the force initialize function for dynamic loading
  if (typeof window.forceInitialize !== 'function') {
    window.forceInitialize = function() {
      console.log('🔄 Force initializing spare parts page (from cached script)...');
      window.sparePartsInitialized = false;
      if (typeof initializePage === 'function') {
        initializePage();
      }
    };
  }
}
