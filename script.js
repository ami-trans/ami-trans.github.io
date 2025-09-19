const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errorMsg.textContent = "Login gagal: " + error.message;
    return;
  }

  // ambil role dari tabel profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    errorMsg.textContent = "Tidak dapat menemukan role user.";
    return;
  }

  // redirect sesuai role
  switch (profile.role) {
    case "spv":
      window.location.href = "dashboard.html";
      break;
    case "kasir":
      window.location.href = "kasir.html";
      break;
    case "unit":
      window.location.href = "unit.html";
      break;
    default:
      errorMsg.textContent = "Role tidak dikenali.";
  }
});
