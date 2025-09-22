function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  const burger = document.getElementById("hamburger");
  const isActive = menu.style.display === "flex";
  menu.style.display = isActive ? "none" : "flex";
  burger.classList.toggle("active", !isActive);
}

// Auto close if click outside
document.addEventListener("click", function (e) {
  const menu = document.getElementById("dropdownMenu");
  const burger = document.getElementById("hamburger");
  if (!menu.contains(e.target) && !burger.contains(e.target)) {
    menu.style.display = "none";
    burger.classList.remove("active");
  }
});

// ✅ Tutup menu setelah klik link
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#dropdownMenu a").forEach(link => {
    link.addEventListener("click", () => {
      const menu = document.getElementById("dropdownMenu");
      const burger = document.getElementById("hamburger");
      menu.style.display = "none";
      burger.classList.remove("active");
    });
  });
});

// Notification toggle
function toggleNotif() {
  const panel = document.getElementById("notifPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

// Logout modal
function openLogoutModal() {
  document.getElementById("logoutModal").style.display = "flex";
}
function closeLogoutModal() {
  document.getElementById("logoutModal").style.display = "none";
}
function logout() {
  window.location.href = "../index.html";
}

// Charts
document.addEventListener("DOMContentLoaded", () => {
  const vehicleCtx = document.getElementById("vehicleChart").getContext("2d");
  new Chart(vehicleCtx, {
    type: "doughnut",
    data: {
      labels: ["Aktif", "Maintenance", "Idle"],
      datasets: [{
        data: [12, 3, 5],
        backgroundColor: ["#009B4D", "#FFCC00", "#ccc"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  const incomeCtx = document.getElementById("incomeChart").getContext("2d");
  new Chart(incomeCtx, {
    type: "line",
    data: {
      labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
      datasets: [{
        label: "Rp",
        data: [2, 4, 3, 5, 6, 7, 8],
        borderColor: "#009B4D",
        backgroundColor: "rgba(0,155,77,0.2)",
        tension: 0.4,
        fill: true
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
});
