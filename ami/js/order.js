const supabaseUrl = "https://yxppbwrfggbgoyaiigjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cHBid3JmZ2diZ295YWlpZ2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDk2NTEsImV4cCI6MjA3Mzg4NTY1MX0.DBRShZgj4wjMBdS6uqz0-bWtI-oaExNv_lJes4yHP_M";
const supabase = supabaseJs.createClient(supabaseUrl, supabaseKey);

const customerSelect = document.getElementById("customerSelect");
const origin = document.getElementById("origin");
const destination = document.getElementById("destination");
const typeUnit = document.getElementById("typeUnit");
const price = document.getElementById("price");
const uangJalan = document.getElementById("uangJalan");
const vehicleSelect = document.getElementById("vehicleSelect");
const driverName = document.getElementById("driverName");

// Fetch customers
async function loadCustomers() {
  let { data, error } = await supabase.from("customers").select("*").order("nama");
  if (error) return console.error(error);
  data.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.nama;
    option.dataset.origin = c.origin;
    option.dataset.destination = c.destination;
    option.dataset.type_unit = c.type_unit;
    option.dataset.price = c.price;
    option.dataset.uang_jalan = c.uang_jalan;
    customerSelect.appendChild(option);
  });
}
loadCustomers();

// Update cascading fields
customerSelect.addEventListener("change", () => {
  const selected = customerSelect.selectedOptions[0];
  origin.value = selected.dataset.origin;
  destination.value = selected.dataset.destination;
  typeUnit.value = selected.dataset.type_unit;
  price.value = selected.dataset.price;
  uangJalan.value = selected.dataset.uang_jalan;
  loadVehicles(selected.dataset.type_unit);
});

// Load vehicles sesuai type_unit
async function loadVehicles(unitType) {
  vehicleSelect.innerHTML = "<option value=''>-- Pilih Nopol --</option>";
  let { data, error } = await supabase.from("profiles").select("*").eq("role","unit").eq("type_unit", unitType);
  if (error) return console.error(error);
  data.forEach(v => {
    const option = document.createElement("option");
    option.value = v.id;
    option.textContent = v.nopol;
    option.dataset.nama = v.nama;
    option.dataset.type_unit = v.type_unit;
    vehicleSelect.appendChild(option);
  });
}

// Update driver name saat pilih kendaraan
vehicleSelect.addEventListener("change", () => {
  const selected = vehicleSelect.selectedOptions[0];
  driverName.value = selected.dataset.nama || "";
});

// Form submit
document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { data, error } = await supabase.from("orders").insert([{
    customer_id: customerSelect.value,
    spv_id: supabase.auth.user().id,
    unit_id: vehicleSelect.value,
    nopol: vehicleSelect.selectedOptions[0].textContent,
    nama_driver: driverName.value,
    type_unit: typeUnit.value,
    price: price.value,
    uang_jalan: uangJalan.value,
    status: "assignment"
  }]);
  if (error) return alert("Gagal assign order: " + error.message);
  alert("Order berhasil diassign!");
  resetForm();
});

// Reset form
function resetForm() {
  document.getElementById("orderForm").reset();
  origin.value = "";
  destination.value = "";
  typeUnit.value = "";
  price.value = "";
  uangJalan.value = "";
  driverName.value = "";
  vehicleSelect.innerHTML = "<option value=''>-- Pilih Nopol --</option>";
}

// Navbar toggle
function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  const burger = document.getElementById("hamburger");
  const isActive = menu.style.display === "flex";
  menu.style.display = isActive ? "none" : "flex";
  burger.classList.toggle("active", !isActive);
}

// Logout
function logout() { window.location.href = "../index.html"; }
