document.addEventListener("DOMContentLoaded", function () {
  // Check authentication and ensure user is SuperUser
  if (!authManager.requireAuth()) {
    return;
  }

  const userData = authManager.getUserData();
  
  // Ensure only SuperUser can access this page
  if (userData.role !== "SuperUser") {
    // Redirect other users to shared layout
    authManager.redirectToApp();
    return;
  }

  // Display the user's name
  const userNameElement = document.getElementById("userName");
  userNameElement.textContent = userData.name || "User";

  // Note: Logout functionality is handled by dashboards.js

  // Initialize charts (keeping for potential future use)
  // initCharts();
});

// Navigation function for dashboard cards
function navigateToSection(section) {
  switch (section) {
    case "users":
      // Navigate to user management page
      window.location.href = "user-Management/userList.html";
      break;
    case "cars":
      // Navigate to cars management page
      window.location.href = "car-Managment/carList.html";
      break;
    case "drivers":
      // Navigate to drivers management page
      window.location.href = "driver-Managment/driverList.html";
      break;
    case "applications":
      // Navigate to applications management page
      window.location.href = "orderList.html";
      break;
    case "consumables":
      // Navigate to consumables management page
      window.location.href = "disposalList.html";
      break;
    case "spareParts":
      // Navigate to spare parts management page
      window.location.href = "sparePartsList.html";
      break;
    case "reports":
      // Navigate to reports management page
      window.location.href = "dash-Boards/reports.html";
      break;
    default:
      // Default to home dashboard
      window.location.href = "dash-Boards/index.html";
  }
}

// Chart initialization and data handling functions (keeping for potential future use)
const colors = ["#007bff", "#ff9800", "#4caf50", "#f44336"];
const labels = [
  "الأسطول النشط",
  "الأسطول الخامل",
  "الأسطول الموقوف",
  "الأسطول المهجور",
];

async function fetchData() {
  // Simulated API response; replace with actual fetch call
  return {
    chart1: [1256, 23, 3, 1],
    chart2: [1256, 23, 3, 1], // Adjust if different data is expected
  };
}

function formatNumber(num) {
  return num.toString().padStart(4, "0");
}

function createChart(ctx, data) {
  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 4,
        },
      ],
    },
    options: {
      cutout: "60%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          cornerRadius: 6,
          displayColors: false,
        },
      },
      animation: {
        animateScale: true,
        animateRotate: true,
      },
    },
  });
}

function populateLegend(legendEl, data) {
  legendEl.innerHTML = data
    .map(
      (value, i) => `
        <li>
            <span style="background-color: ${colors[i]}"></span>
            <strong>${labels[i]}</strong>
            <span style="margin-right: 8px; color: #666;">${formatNumber(
              value
            )}</span>
        </li>
    `
    )
    .join("");
}

function populateTable(tableEl, data) {
  const tbody = tableEl.querySelector("tbody");
  tbody.innerHTML = data
    .map(
      (value, i) => `
        <tr>
            <td><strong>${formatNumber(value)}</strong></td>
            <td>${labels[i]}</td>
            <td><span style="background-color: ${
              colors[i]
            }; width: 16px; height: 16px; display: inline-block; border-radius: 4px;"></span></td>
        </tr>
    `
    )
    .join("");
}

async function initCharts() {
  const data = await fetchData();
  const ctx1 = document.getElementById("chart1").getContext("2d");
  const ctx2 = document.getElementById("chart2").getContext("2d");
  createChart(ctx1, data.chart1);
  createChart(ctx2, data.chart2);
  populateLegend(document.getElementById("legend1"), data.chart1);
  populateLegend(document.getElementById("legend2"), data.chart2);
  populateTable(document.getElementById("table1"), data.chart1);
  populateTable(document.getElementById("table2"), data.chart2);
}

// Function to update card statistics (can be called from API)
function updateCardStats(data) {
  // Update Users Info
  if (data.users) {
    document.getElementById("totalUsers").textContent =
      data.users.total || "125";
    if (document.getElementById("activeUsers")) {
      document.getElementById("activeUsers").textContent =
        data.users.active || "98";
    }
  }

  // Update Cars Info
  if (data.cars) {
    document.getElementById("totalCars").textContent =
      data.cars.total || "1283";
    if (document.getElementById("activeCars")) {
      document.getElementById("activeCars").textContent =
        data.cars.active || "1256";
    }
  }

  // Update Drivers Info
  if (data.drivers) {
    document.getElementById("totalDrivers").textContent =
      data.drivers.total || "156";
    if (document.getElementById("activeDrivers")) {
      document.getElementById("activeDrivers").textContent =
        data.drivers.active || "134";
    }
  }
}
