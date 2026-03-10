// ============================================================
// popup.js — Lógica do popup da extensão Chabra Tags
// ============================================================

function sendMessage(type, payload = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, resolve)
  })
}

// ------------------------------------------------------------
// Referências DOM
// ------------------------------------------------------------

const viewLoading       = document.getElementById("view-loading")
const viewLogin         = document.getElementById("view-login")
const viewAuthenticated = document.getElementById("view-authenticated")

const emailInput  = document.getElementById("email")
const passInput   = document.getElementById("password")
const loginError  = document.getElementById("login-error")
const btnLogin    = document.getElementById("btn-login")
const btnLogout   = document.getElementById("btn-logout")
const userNameEl  = document.getElementById("user-name")
const userEmailEl = document.getElementById("user-email")

// ------------------------------------------------------------
// Helpers de UI
// ------------------------------------------------------------

function showView(name) {
  viewLoading.style.display       = name === "loading" ? "flex" : "none"
  viewLogin.style.display         = name === "login"   ? "flex" : "none"
  viewAuthenticated.style.display = name === "auth"    ? "flex" : "none"
}

function showError(msg) {
  loginError.textContent    = msg
  loginError.style.display  = "block"
}

function clearError() {
  loginError.textContent   = ""
  loginError.style.display = "none"
}

// ------------------------------------------------------------
// Inicialização
// ------------------------------------------------------------

async function init() {
  showView("loading")

  const session = await sendMessage("GET_SESSION")

  if (session?.isAuthenticated && session.user) {
    populateAuthView(session.user)
    showView("auth")
  } else {
    showView("login")
    emailInput.focus()
  }
}

function populateAuthView(user) {
  userNameEl.textContent  = user.name  ?? "—"
  userEmailEl.textContent = user.email ?? "—"
}

// ------------------------------------------------------------
// Login
// ------------------------------------------------------------

btnLogin.addEventListener("click", async () => {
  clearError()

  const email    = emailInput.value.trim()
  const password = passInput.value

  if (!email || !password) {
    showError("Preencha e-mail e senha.")
    return
  }

  btnLogin.disabled      = true
  btnLogin.textContent   = "Entrando..."

  const res = await sendMessage("SIGN_IN", { email, password })

  btnLogin.disabled    = false
  btnLogin.textContent = "Entrar"

  if (!res?.success) {
    showError(res?.error ?? "Erro ao entrar. Tente novamente.")
    return
  }

  populateAuthView(res.user)
  showView("auth")

  // Notifica o content_script que o estado de auth mudou
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "AUTH_CHANGED",
      payload: { isAuthenticated: true },
    }).catch(() => {}) // silencia erro se o content_script não estiver ativo
  }
})

// Permite submeter com Enter
passInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnLogin.click()
})

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------

btnLogout.addEventListener("click", async () => {
  await sendMessage("SIGN_OUT")

  emailInput.value = ""
  passInput.value  = ""
  showView("login")
  emailInput.focus()

  // Notifica o content_script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "AUTH_CHANGED",
      payload: { isAuthenticated: false },
    }).catch(() => {})
  }
})

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------

init()
