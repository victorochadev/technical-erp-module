const state = { conversas: [], conversaAtivaId: null, mensagens: [] }

async function fetchJson(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function iniciais(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function formatHora(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function renderConversas() {
  const container = document.getElementById('helpdesk-conversas')
  if (state.conversas.length === 0) {
    container.innerHTML = '<div class="helpdesk-empty">Nenhuma conversa ainda.</div>'
    return
  }
  container.innerHTML = state.conversas.map(c => `
    <div class="helpdesk-conversa${c.id === state.conversaAtivaId ? ' helpdesk-conversa--ativa' : ''}" data-id="${c.id}">
      <div class="helpdesk-conversa__avatar">${iniciais(c.clienteNome)}</div>
      <div class="helpdesk-conversa__info">
        <div class="helpdesk-conversa__nome">${c.clienteNome}</div>
        <div class="helpdesk-conversa__preview">${c.ultimaMensagem || 'Sem mensagens'}</div>
      </div>
    </div>
  `).join('')

  container.querySelectorAll('.helpdesk-conversa').forEach(el => {
    el.addEventListener('click', () => abrirConversa(Number(el.dataset.id)))
  })
}

function renderThread() {
  const conversa = state.conversas.find(c => c.id === state.conversaAtivaId)
  const container = document.getElementById('helpdesk-thread')
  const layout = document.getElementById('helpdesk-layout')

  if (!conversa) {
    layout.classList.remove('helpdesk-layout--conversa-aberta')
    container.className = 'helpdesk-thread helpdesk-thread--vazio'
    container.innerHTML = 'Selecione uma conversa para ver as mensagens.'
    return
  }

  layout.classList.add('helpdesk-layout--conversa-aberta')
  container.className = 'helpdesk-thread'
  container.innerHTML = `
    <div class="helpdesk-thread__header">
      <button class="helpdesk-thread__voltar" id="helpdesk-voltar" aria-label="Voltar">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="helpdesk-thread__header-info">
        <div class="helpdesk-thread__nome">${conversa.clienteNome}</div>
        <div class="helpdesk-thread__telefone">${conversa.telefone}</div>
      </div>
    </div>
    <div class="helpdesk-thread__mensagens" id="helpdesk-mensagens"></div>
    <div class="helpdesk-thread__composer">
      <textarea id="helpdesk-input" placeholder="Digite uma mensagem..."></textarea>
      <button id="helpdesk-enviar">Enviar</button>
    </div>
  `

  renderMensagens()

  document.getElementById('helpdesk-voltar').addEventListener('click', () => {
    state.conversaAtivaId = null
    renderThread()
  })
  document.getElementById('helpdesk-enviar').addEventListener('click', enviarMensagem)
  document.getElementById('helpdesk-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() }
  })
}

function renderMensagens() {
  const container = document.getElementById('helpdesk-mensagens')
  if (!container) return
  container.innerHTML = state.mensagens.map(m => `
    <div class="helpdesk-msg helpdesk-msg--${m.autor}">
      ${m.texto}
      <span class="helpdesk-msg__hora">${formatHora(m.criadaEm)}</span>
    </div>
  `).join('')
  container.scrollTop = container.scrollHeight
}

async function abrirConversa(id) {
  state.conversaAtivaId = id
  state.mensagens = await fetchJson(`/api/helpdesk/conversas/${id}/mensagens`)
  renderConversas()
  renderThread()
}

async function enviarMensagem() {
  const input = document.getElementById('helpdesk-input')
  const texto = input.value.trim()
  if (!texto || !state.conversaAtivaId) return

  const botao = document.getElementById('helpdesk-enviar')
  botao.disabled = true
  try {
    await fetchJson(`/api/helpdesk/conversas/${state.conversaAtivaId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    })
    input.value = ''
    state.mensagens = await fetchJson(`/api/helpdesk/conversas/${state.conversaAtivaId}/mensagens`)
    renderMensagens()
    state.conversas = await fetchJson('/api/helpdesk/conversas')
    renderConversas()
  } finally {
    botao.disabled = false
  }
}

function setupTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('at-theme', next)
  })
}

async function init() {
  setupTheme()
  state.conversas = await fetchJson('/api/helpdesk/conversas')
  renderConversas()
  renderThread()
}

document.addEventListener('DOMContentLoaded', init)
