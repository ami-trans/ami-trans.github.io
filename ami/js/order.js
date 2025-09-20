import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = "https://yxppbwrfggbgoyaiigjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cHBid3JmZ2diZ295YWlpZ2pzIiwicm9sIjoiYW5vbiIsImlhdCI6MTc1ODMwOTY1MSwiZXhwIjoyMDczODg1NjUxfQ.DBRShZgj4wjMBdS6uqz0-bWtI-oaExNv_lJes4yHP_M";
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM elements
const customerSelect = document.getElementById("customerSelect");
const originSelect = document.getElementById("origin");
const destinationSelect = document.getElementById("destination");
const typeUnitSelect = document.getElementById("typeUnit");
const priceInput = document.getElementById("price");
const uangJalanInput = document.getElementById("uangJalan");
const vehicleSelect = document.getElementById("vehicleSelect");
const driverName = document.getElementById("driverName");

// Load customers
async function loadCustomers() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("nama", { ascending: true });
    if (error) throw error;

    customerSelect.innerHTML = "<option value=''>-- Pilih Customer --</option>";
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
  } catch (err) {
    console.error("Gagal load customer:", err.message);
  }
}
loadCustomers();

// Update Origin setelah pilih customer
customerSelect.addEventListener("change", () => {
  const selected = customerSelect.selectedOptions[0];
  if (!selected.value) return resetForm();

  originSelect.innerHTML = `<option value='${selected.dataset.origin}'>${selected.dataset.origin}</option>`;
  destinationSelect.innerHTML = `<option value='${selected.dataset.destination}'>${selected.dataset.destination}</option>`;
  typeUnitSelect.innerHTML = `<option value='${selected.dataset.type_unit}'>${selected.dataset.type_unit}</option>`;
  priceInput.value = selected.dataset.price;
  uangJalanInput.value = selected.dataset.uang_jalan;

  loadVehicles(selected.dataset.type_unit);
});

// Load vehicles sesuai type_unit
async function loadVehicles(unitType) {
  vehicleSelect.innerHTML = "<option value=''>-- Pilih Nopol --</option>";
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role","unit")
      .eq("type_unit", unitType);
    if (error) throw error;

    data.forEach(v => {
      const option = document.createElement("option");
      option.value = v.id;
      option.textContent = v.nopol;
      option.dataset.nama = v.nama;
      vehicleSelect.appendChild(option);
    });
  } catch(err) {
    console.error("Gagal load vehicles:", err.message);
  }
}

// Update driver name saat pilih kendaraan
vehicleSelect.addEventListener("change", () => {
  const selected = vehicleSelect.selectedOptions[0];
  driverName.value = selected?.dataset?.nama || "";
});

// Form submit
document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!customerSelect.value || !vehicleSelect.value) return alert("Pilih customer dan kendaraan");

  try {
    const user = supabase.auth.user();
    const { data, error } = await supabase.from("orders").insert([{
      customer_id: customerSelect.value,
      spv_id: user?.id || null,
      unit_id: vehicleSelect.value,
      nopol: vehicleSelect.selectedOptions[0].textContent,
      nama_driver: driverName.value,
      type_unit: typeUnitSelect.value,
      price: priceInput.value,
      uang_jalan: uangJalanInput.value,
      status: "assignment"
    }]);
    if (error) throw error;

    alert("Order berhasil diassign!");
    resetForm();
  } catch(err) {
    console.error("Gagal assign order:", err.message);
    alert("Gagal assign order: " + err.message);
  }
});

// Reset form
function resetForm() {
  customerSelect.value = "";
  originSelect.innerHTML = "<option value=''>-- Origin --</option>";
  destinationSelect.innerHTML = "<option value=''>-- Destination --</option>";
  typeUnitSelect.innerHTML = "<option value=''>-- Type Unit --</option>";
  priceInput.value = "";
  uangJalanInput.value = "";
  vehicleSelect.innerHTML = "<option value=''>-- Pilih Nopol --</option>";
  driverName.value = "";
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
