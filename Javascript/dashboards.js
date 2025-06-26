// Shared dashboard functionality

// Set up logout functionality for all dashboards
document.addEventListener("DOMContentLoaded", function() {
  // Common logout button setup with improved duplicate prevention
  const logoutButtons = document.querySelectorAll("#logoutButton, .logout-button");
  logoutButtons.forEach(button => {
    if (button && !button.hasAttribute('data-listener-added')) {
      button.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
          authManager.logout();
        }
      });
      button.setAttribute('data-listener-added', 'true');
    }
  });
});

// Common utility functions for dashboards
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Format number utility
function formatNumber(num) {
  if (typeof num !== 'number') {
    num = parseInt(num) || 0;
  }
  return num.toLocaleString('ar-EG');
}

// Date formatting utility
function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('ar-EG');
}

// Error handling for API calls
function handleApiError(error, customMessage = null) {
  console.error('API Error:', error);
  const message = customMessage || 'حدث خطأ أثناء تحميل البيانات. حاول مرة أخرى.';
  showNotification(message, 'error');
}

// Loading state utility
function setLoadingState(element, isLoading) {
  if (!element) return;
  
  if (isLoading) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
    
    // Add loading spinner if not exists
    if (!element.querySelector('.loading-spinner')) {
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      spinner.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `;
      
      // Add spinner animation
      if (!document.querySelector('#spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
          @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      element.style.position = 'relative';
      element.appendChild(spinner);
    }
  } else {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    
    // Remove loading spinner
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) {
      spinner.remove();
    }
  }
}

// Export utilities for use in other scripts
window.dashboardUtils = {
  showNotification,
  formatNumber,
  formatDate,
  handleApiError,
  setLoadingState
}; 