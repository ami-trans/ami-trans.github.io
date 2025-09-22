const supabaseUrl = "https://yxppbwrfggbgoyaiigjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cHBid3JmZ2diZ295YWlpZ2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDk2NTEsImV4cCI6MjA3Mzg4NTY1MX0.DBRShZgj4wjMBdS6uqz0-bWtI-oaExNv_lJes4yHP_M";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentPeriod = "daily";

// 🔹 Filter period buttons
function setPeriod(period){
  currentPeriod = period;
  updateDashboard();
}

// 🔹 Navbar / Menu
function toggleMenu(){
  const menu = document.getElementById("dropdownMenu");
  const burger = document.getElementById("hamburger");
  const isActive = menu.style.display==="flex";
  menu.style.display=isActive?"none":"flex";
  burger.classList.toggle("active",!isActive);
}
function openLogoutModal(){ document.getElementById("logoutModal").style.display="flex"; }
function closeLogoutModal(){ document.getElementById("logoutModal").style.display="none"; }
function logout(){ window.location.href="../index.html"; }

// 🔹 Dashboard update
async function updateDashboard(){
  const now = new Date();
  let startDate;
  switch(currentPeriod){
    case "daily": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case "weekly": startDate = new Date(now.setDate(now.getDate()-7)); break;
    case "monthly": startDate = new Date(now.setMonth(now.getMonth()-1)); break;
  }

  // Fetch Orders
  const { data: orders, error } = await supabase.from("orders").select("*").gte("created_at", startDate.toISOString());
  if(error) return console.error(error);

  // Revenue Real-Time
  const revenue = orders.filter(o=>o.status_transfer==="Sudah").reduce((a,b)=>a+(b.uang_jalan||0),0);
  document.getElementById("revenueTotal").textContent = new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR"}).format(revenue);
  renderRevenueChart(orders);

  // Order Completion Rate
  const completed = orders.filter(o=>o.status==="Selesai").length;
  const rate = orders.length>0?Math.round((completed/orders.length)*100):0;
  document.getElementById("completionPercent").textContent = rate+"%";
  renderCompletionChart(rate);

  // Average Time
  const finishedOrders = orders.filter(o=>o.mulai_muat_at && o.selesai_bongkar_at);
  let avgHour = 0;
  if(finishedOrders.length>0){
    avgHour = finishedOrders.reduce((sum,o)=>sum+(new Date(o.selesai_bongkar_at)-new Date(o.mulai_muat_at))/(1000*3600),0)/finishedOrders.length;
  }
  document.getElementById("avgTimeText").textContent = avgHour.toFixed(1)+" jam";
  document.getElementById("avgTimeBar").style.width = Math.min(avgHour/5*100,100)+"%";

  // Pending / Delay
  const pending = orders.filter(o=>o.status!=="Selesai" && o.mulai_muat_at && (new Date()-new Date(o.mulai_muat_at))/(1000*3600)>2);
  const pendingTbody = document.querySelector("#pendingTable tbody");
  pendingTbody.innerHTML = "";
  pending.forEach(o=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${o.nama}</td><td>${o.driver}</td><td>${((new Date()-new Date(o.mulai_muat_at))/(1000*3600)).toFixed(1)}</td>`;
    pendingTbody.appendChild(tr);
  });

  // Revenue Per Customer
  const customerMap = {};
  orders.forEach(o=>{
    if(!customerMap[o.nama]) customerMap[o.nama]=0;
    customerMap[o.nama]+=o.uang_jalan||0;
  });
  renderCustomerRevenueChart(customerMap);

  // Fleet Utilization
  const { data: units } = await supabase.from("profiles").select("*").eq("role","unit");
  const typeCounts = {};
  const typeActive = {};
  units.forEach(u=>{
    if(!typeCounts[u.type_unit]) typeCounts[u.type_unit]=0;
    typeCounts[u.type_unit]++;
    const isActive = orders.some(o=>o.nopol===u.nopol && o.status!=="Selesai");
    if(!typeActive[u.type_unit]) typeActive[u.type_unit]=0;
    if(isActive) typeActive[u.type_unit]++;
  });
  renderFleetUsageChart(typeCounts,typeActive);

  // Top Routes
  const routeMap = {};
  orders.forEach(o=>{
    const key=`${o.origin} → ${o.destination}`;
    if(!routeMap[key]) routeMap[key]=0;
    routeMap[key]++;
  });
  const sortedRoutes = Object.entries(routeMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topRouteTbody = document.querySelector("#topRouteTable tbody");
  topRouteTbody.innerHTML="";
  sortedRoutes.forEach(([route,count])=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${route}</td><td>${count}</td>`;
    topRouteTbody.appendChild(tr);
  });

  // Dokumen Tracking
  const docComplete = orders.filter(o=>o.surat_jalan_foto).length;
  document.getElementById("docStatus").textContent=`${docComplete} / ${orders.length} lengkap`;

  // Status Armada
  const statusCounts = {Standby:0, "Sedang Muat":0, "Sedang Bongkar":0};
  orders.forEach(o=>{
    switch(o.status){
      case "Standby": statusCounts.Standby++; break;
      case "Sedang Muat": statusCounts["Sedang Muat"]++; break;
      case "Sedang Bongkar": statusCounts["Sedang Bongkar"]++; break;
    }
  });
  document.getElementById("standbyCount").textContent=statusCounts.Standby;
  document.getElementById("loadingCount").textContent=statusCounts["Sedang Muat"];
  document.getElementById("unloadCount").textContent=statusCounts["Sedang Bongkar"];
}

// 🔹 Charts rendering
let revenueChart, completionChart, customerRevenueChart, fleetUsageChart;
function renderRevenueChart(orders){
  const ctx=document.getElementById("revenueChart").getContext("2d");
  if(revenueChart) revenueChart.destroy();
  const labels=orders.map(o=>new Date(o.created_at).toLocaleTimeString());
  const data=orders.map(o=>o.uang_jalan||0);
  revenueChart=new Chart(ctx,{
    type:"line",
    data:{labels, datasets:[{label:"Rp",data,borderColor:"#009B4D",backgroundColor:"rgba(0,155,77,0.2)",fill:true,tension:0.4}]},
    options:{responsive:true,plugins:{legend:{display:false}}}
  });
}
function renderCompletionChart(rate){
  const ctx=document.getElementById("completionChart").getContext("2d");
  if(completionChart) completionChart.destroy();
  completionChart=new Chart(ctx,{
    type:"doughnut",
    data:{labels:["Selesai","Belum"],datasets:[{data:[rate,100-rate],backgroundColor:["#009B4D","#ccc"]}]},
    options:{responsive:true,plugins:{legend:{position:"bottom"}}}
  });
}
function renderCustomerRevenueChart(map){
  const ctx=document.getElementById("customerRevenueChart").getContext("2d");
  if(customerRevenueChart) customerRevenueChart.destroy();
  const labels=Object.keys(map), data=Object.values(map);
  customerRevenueChart=new Chart(ctx,{
    type:"bar",
    data:{labels,data,datasets:[{label:"Rp",data,backgroundColor:"rgba(0,155,77,0.6)",borderRadius:4}]},
    options:{responsive:true,plugins:{legend:{display:false}}}
  });
}
function renderFleetUsageChart(totalMap,activeMap){
  const ctx=document.getElementById("fleetUsageChart").getContext("2d");
  if(fleetUsageChart) fleetUsageChart.destroy();
  const labels=Object.keys(totalMap);
  const data=labels.map(l=>activeMap[l]||0);
  const background=data.map((v,i)=>["#009B4D","#FFCC00","#FF8000"][i%3]);
  fleetUsageChart=new Chart(ctx,{
    type:"doughnut",
    data:{labels,datasets:[{data,backgroundColor:background}]},
    options:{responsive:true,plugins:{legend:{position:"bottom"}}}
  });
}

// 🔹 Auto refresh every 15 detik
setInterval(updateDashboard,15000);
updateDashboard();
