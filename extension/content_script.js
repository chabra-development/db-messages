// ============================================================
// content_script.js — Injeção de tags no Blip Desk
// Roda em: chabra.desk.blip.ai
// ============================================================
//
// Cada item da lista de atendimentos é um <article class="chat-list-item">
// com id no formato "{blipTicketId}-chat-list-item".
// Extraímos o blipTicketId e consultamos /api/tags/ticket?blipId={id}
// no backend, que resolve o contato e retorna suas tags.
// ============================================================

// Seletor do item de atendimento na lista lateral
const ATTENDANCE_ITEM = "article.chat-list-item"

// Onde injetar os badges (segunda <section> do article — área de info do ticket)
const INJECTION_TARGET = "section.ticket-info"

// ------------------------------------------------------------
// Cache local para evitar requisições redundantes
// ------------------------------------------------------------

const tagCache = new Map() // blipTicketId → { tags, timestamp }
const CACHE_TTL = 60_000   // 60 segundos

function getCached(blipTicketId) {
  const entry = tagCache.get(blipTicketId)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    tagCache.delete(blipTicketId)
    return null
  }
  return entry.tags
}

function setCache(blipTicketId, tags) {
  tagCache.set(blipTicketId, { tags, timestamp: Date.now() })
}

// ------------------------------------------------------------
// Comunicação com o background
// ------------------------------------------------------------

function sendMessage(type, payload = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, resolve)
  })
}

// ------------------------------------------------------------
// Extrai o blipTicketId do atributo id do article
// id pattern: "{uuid}-chat-list-item"
// ------------------------------------------------------------

function extractBlipTicketId(item) {
  const id = item.id || ""
  const suffix = "-chat-list-item"
  if (!id.endsWith(suffix)) return null
  return id.slice(0, id.length - suffix.length)
}

// ------------------------------------------------------------
// Renderização dos badges de tags
// ------------------------------------------------------------

const INJECTED_ATTR = "data-chabra-tags-injected"

function renderTags(targetEl, tags, blipTicketId) {
  const existing = targetEl.querySelector(".chabra-tags-container")
  if (existing) existing.remove()

  if (!tags.length) return

  const container = document.createElement("div")
  container.className = "chabra-tags-container"
  container.setAttribute("data-blip-ticket-id", blipTicketId)
  container.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px 8px 6px;
  `

  for (const tag of tags) {
    const badge = document.createElement("span")
    badge.className = "chabra-tag-badge"
    badge.textContent = tag.name
    badge.title = tag.name
    badge.style.cssText = `
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.6;
      color: #ffffff;
      background-color: ${tag.color ?? "#6366f1"};
      white-space: nowrap;
      max-width: 96px;
      overflow: hidden;
      text-overflow: ellipsis;
    `
    container.appendChild(badge)
  }

  targetEl.setAttribute(INJECTED_ATTR, "true")
  targetEl.appendChild(container)
}

// ------------------------------------------------------------
// Processamento de um item da lista
// ------------------------------------------------------------

async function processAttendanceItem(item) {
  if (!(item instanceof HTMLElement)) return
  if (item.getAttribute(INJECTED_ATTR) === "true") return

  const blipTicketId = extractBlipTicketId(item)
  if (!blipTicketId) return

  // Alvo de injeção: section.ticket-info dentro do article, ou o próprio article
  const target = item.querySelector(INJECTION_TARGET) ?? item

  // Verifica cache
  const cached = getCached(blipTicketId)
  if (cached) {
    renderTags(target, cached, blipTicketId)
    return
  }

  const response = await sendMessage("GET_TICKET_TAGS", { blipTicketId })

  if (!response?.success) return

  setCache(blipTicketId, response.tags)
  renderTags(target, response.tags, blipTicketId)
}

// ------------------------------------------------------------
// MutationObserver — detecta novos elementos no DOM
// ------------------------------------------------------------

let observer = null

function startObserver() {
  if (observer) return

  // Processa itens já presentes
  document.querySelectorAll(ATTENDANCE_ITEM).forEach(processAttendanceItem)

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue

        if (node.matches?.(ATTENDANCE_ITEM)) {
          processAttendanceItem(node)
        }

        node.querySelectorAll?.(ATTENDANCE_ITEM)?.forEach(processAttendanceItem)
      }
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
  console.info("[Chabra Tags] Observer iniciado.")
}

function stopObserver() {
  observer?.disconnect()
  observer = null
  document.querySelectorAll(".chabra-tags-container").forEach((el) => el.remove())
  document.querySelectorAll(`[${INJECTED_ATTR}]`).forEach((el) => {
    el.removeAttribute(INJECTED_ATTR)
  })
}

// ------------------------------------------------------------
// Inicialização — aguarda autenticação confirmada
// ------------------------------------------------------------

async function init() {
  const session = await sendMessage("GET_SESSION")

  if (!session?.isAuthenticated) {
    console.info("[Chabra Tags] Usuário não autenticado. Tags não serão exibidas.")
    return
  }

  startObserver()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}

// Reage a login/logout no popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "AUTH_CHANGED") {
    if (message.payload?.isAuthenticated) {
      startObserver()
    } else {
      stopObserver()
    }
  }
})
