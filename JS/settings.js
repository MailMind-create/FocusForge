document.addEventListener("DOMContentLoaded", () => {

// ======================
// SUPABASE
// ======================

const SUPABASE_URL = "https://eztflaqhcamoftvosegx.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dGZsYXFoY2Ftb2Z0dm9zZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzUzNDAsImV4cCI6MjA5MzQxMTM0MH0.beBy1rIxqy0Y70IkB8-tZCs9RlZcMFn4bPaYL_Rqw14";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ======================
// ELEMENTS
// ======================

const usernameInput =
  document.getElementById("usernameInput");

const saveBtn =
  document.getElementById("saveBtn");

const statusText =
  document.getElementById("statusText");

// ======================
// STATE
// ======================

let currentUser = null;

// ======================
// INIT
// ======================

async function init() {

  const { data: { session } } =
    await supabase.auth.getSession();

  if (!session) {
    window.location.href = "auth.html";
    return;
  }

  currentUser = session.user;

  await loadProfile();
}

// ======================
// LOAD PROFILE
// ======================

async function loadProfile() {

  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (data?.username) {
    usernameInput.value = data.username;
  }
}

// ======================
// SAVE USERNAME
// ======================

saveBtn.addEventListener("click", async () => {

  const username =
    usernameInput.value.trim();

  // VALIDATION

  if (!username) {

    statusText.textContent =
      "Enter a username.";

    return;
  }

  if (username.length < 3) {

    statusText.textContent =
      "Username too short.";

    return;
  }

  // CHECK IF USERNAME EXISTS

  const { data: existingUser } =
    await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

  if (
    existingUser &&
    existingUser.id !== currentUser.id
  ) {

    statusText.textContent =
      "Username already taken.";

    return;
  }

  // SAVE USERNAME

  const { error } = await supabase
    .from("profiles")
    .update({
      username: username
    })
    .eq("id", currentUser.id);

  if (error) {

    console.error(error);

    statusText.textContent =
      "Something went wrong.";

    return;
  }

  statusText.textContent =
    "✅ Username saved.";
});

// ======================
// START
// ======================

init();

});