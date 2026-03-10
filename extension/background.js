// ============================================================
// background.js — Service Worker da extensão Chabra Tags
// Responsável por todas as chamadas à API do backend Next.js
// ============================================================

const BACKEND_URL = "https://db-messages.vercel.app"

// ------------------------------------------------------------
// Helpers de autenticação
// ------------------------------------------------------------

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get("session_token", ({ session_token }) => {
      resolve(session_token ?? null)
    })
  })
}

async function authHeaders() {
  const token = await getToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ------------------------------------------------------------
// Handlers das mensagens vindas do content_script / popup
// ------------------------------------------------------------

async function handleSignIn({ email, password }) {
  const res = await fetch(`${BACKEND_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { success: false, error: err.message ?? "Credenciais inválidas" }
  }

  const data = await res.json()
  const token = data.token ?? data.session?.token ?? null

  if (token) {
    await chrome.storage.local.set({ session_token: token, user: data.user })
  }

  return { success: true, user: data.user }
}

async function handleSignOut() {
  await chrome.storage.local.remove(["session_token", "user"])
  return { success: true }
}

async function handleGetSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["session_token", "user"], ({ session_token, user }) => {
      resolve({ isAuthenticated: !!session_token, user: user ?? null })
    })
  })
}

// Busca as tags de um contato pelo identity do Blip
async function handleGetContactTags({ identity }) {
  const res = await fetch(
    `${BACKEND_URL}/api/tags/contact?identity=${encodeURIComponent(identity)}`,
    { headers: await authHeaders() }
  )

  if (res.status === 401) return { success: false, error: "unauthorized" }
  if (!res.ok) return { success: false, error: "Erro ao buscar tags" }

  const tags = await res.json()
  return { success: true, tags }
}

// Busca as tags de um contato pelo blip_id do ticket (UUID do article no DOM)
async function handleGetTicketTags({ blipTicketId }) {
  const res = await fetch(
    `${BACKEND_URL}/api/tags/ticket?blipId=${encodeURIComponent(blipTicketId)}`,
    { headers: await authHeaders() }
  )

  if (res.status === 401) return { success: false, error: "unauthorized" }
  if (!res.ok) return { success: false, error: "Erro ao buscar tags do ticket" }

  const tags = await res.json()
  return { success: true, tags }
}

// Busca todas as tags disponíveis no sistema
async function handleGetAllTags() {
  const res = await fetch(`${BACKEND_URL}/api/tags`, {
    headers: await authHeaders(),
  })

  if (res.status === 401) return { success: false, error: "unauthorized" }
  if (!res.ok) return { success: false, error: "Erro ao buscar tags" }

  const tags = await res.json()
  return { success: true, tags }
}

// Cria uma nova tag global
async function handleCreateTag({ name, color }) {
  const res = await fetch(`${BACKEND_URL}/api/tags`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ name, color }),
  })

  if (res.status === 401) return { success: false, error: "unauthorized" }
  const data = await res.json()
  if (!res.ok) return { success: false, error: data.error ?? "Erro ao criar tag" }

  return { success: true, tag: data }
}

// Associa uma tag a um contato
async function handleAssignTag({ contactIdentity, tagId }) {
  const res = await fetch(`${BACKEND_URL}/api/tags/contact`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ contactIdentity, tagId }),
  })

  if (res.status === 401) return { success: false, error: "unauthorized" }
  const data = await res.json()
  if (!res.ok) return { success: false, error: data.error ?? "Erro ao associar tag" }

  return { success: true, tag: data }
}

// Remove a associação de uma tag com um contato
async function handleUnassignTag({ contactIdentity, tagId }) {
  const res = await fetch(`${BACKEND_URL}/api/tags/contact`, {
    method: "DELETE",
    headers: await authHeaders(),
    body: JSON.stringify({ contactIdentity, tagId }),
  })

  if (res.status === 401) return { success: false, error: "unauthorized" }
  if (!res.ok) return { success: false, error: "Erro ao remover tag" }

  return { success: true }
}

// ------------------------------------------------------------
// Listener central de mensagens
// ------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, payload } = message

  const handlers = {
    SIGN_IN: () => handleSignIn(payload),
    SIGN_OUT: () => handleSignOut(),
    GET_SESSION: () => handleGetSession(),
    GET_CONTACT_TAGS: () => handleGetContactTags(payload),
    GET_TICKET_TAGS: () => handleGetTicketTags(payload),
    GET_ALL_TAGS: () => handleGetAllTags(),
    CREATE_TAG: () => handleCreateTag(payload),
    ASSIGN_TAG: () => handleAssignTag(payload),
    UNASSIGN_TAG: () => handleUnassignTag(payload),
  }

  const handler = handlers[type]
  if (!handler) {
    sendResponse({ success: false, error: `Tipo desconhecido: ${type}` })
    return false
  }

  handler().then(sendResponse).catch((err) => {
    sendResponse({ success: false, error: err.message })
  })

  return true // mantém o canal aberto para resposta assíncrona
})
