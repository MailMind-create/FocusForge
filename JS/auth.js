document.addEventListener("DOMContentLoaded", async () => {

  // ======================
  // SUPABASE SETUP
  // ======================

  const SUPABASE_URL = "https://eztflaqhcamoftvosegx.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dGZsYXFoY2Ftb2Z0dm9zZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzUzNDAsImV4cCI6MjA5MzQxMTM0MH0.beBy1rIxqy0Y70IkB8-tZCs9RlZcMFn4bPaYL_Rqw14";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  // ======================
  // AUTO REDIRECT IF LOGGED IN
  // ======================

  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    window.location.href = "app.html";
    return;
  }

  // ======================
  // ELEMENTS
  // ======================

  const form = document.getElementById("authForm");
  const toggle = document.getElementById("toggleAuth");

  const title = document.getElementById("formTitle");
  const subtitle = document.getElementById("formSubtitle");
  const button = document.querySelector(".auth-btn");

  if (!form || !toggle) {
    console.error("Missing DOM elements");
    return;
  }

  let isLogin = true;

  // ======================
  // TOGGLE
  // ======================

  toggle.addEventListener("click", () => {
    isLogin = !isLogin;

    if (isLogin) {
      title.textContent = "Welcome back";
      subtitle.textContent = "Login to continue your focus journey";
      button.textContent = "Login";
      toggle.textContent = "Sign up";
    } else {
      title.textContent = "Create account";
      subtitle.textContent = "Start building your discipline";
      button.textContent = "Sign up";
      toggle.textContent = "Login";
    }
  });

  // ======================
  // SUBMIT
  // ======================

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // LOGIN
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert(error.message);
        return;
      }

      window.location.href = "app.html";
    }

    // SIGNUP
    else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        alert(error.message);
        return;
      }

      const user = data.user;

      if (user) {
        await supabase.from("profiles").insert([
          {
            id: user.id,
            email: user.email,
            sessions: 0,
            streak: 0,
            xp: 0,
            last_date: null
          }
        ]);
      }

      alert("Account created! You can now login.");
    }
  });

});