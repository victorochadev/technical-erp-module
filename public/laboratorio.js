const state = {
  colunas: [],
  cards: [],
  addFormAberto: null,
  cardAbertoId: null,
  menuColunaAberto: null,
}

async function fetchJson(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function showToast(message) {
  const container = document.getElementById('toast-container')
  const toast = document.createElement('div')
  toast.className = 'toast-simple'
  toast.textContent = message
  container.appendChild(toast)
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-simple--show')))
  setTimeout(() => {
    toast.classList.remove('toast-simple--show')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

const ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>'
const ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5H4l3-3a8.38 8.38 0 1 1 14-5.5z"/></svg>'
const ICON_CLIP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'
const ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
const ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
const ICON_DOTS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>'

function renderCard(card) {
  const prazoClasse = card.sla === 'urgente' ? 'board-card__prazo--atrasado'
    : card.sla === 'importante' ? 'board-card__prazo--proximo' : ''

  const metaItens = [
    `<span class="board-card__prazo ${prazoClasse}">${ICON_CLOCK}${card.dataChegadaLabel} - ${card.dataVencimentoLabel}</span>`,
  ]
  if (card.comentarios > 0) metaItens.push(`<span class="board-card__meta-item">${ICON_CHAT}${card.comentarios}</span>`)
  if (card.anexos > 0) metaItens.push(`<span class="board-card__meta-item">${ICON_CLIP}${card.anexos}</span>`)

  return `
    <div class="board-card" draggable="true" data-card-id="${card.id}" style="border-left-color:${card.slaCor}">
      <span class="board-card__label-chip" style="background:${card.colunaCor}">${card.colunaNome}</span>
      <div class="board-card__titulo">${card.cliente} <span class="board-card__numero">- ${card.numero}</span></div>
      <div class="board-card__footer">
        <div class="board-card__meta">${metaItens.join('')}</div>
        ${card.tecnico ? `<span class="board-card__avatar" title="${card.tecnico}">${card.tecnicoIniciais}</span>` : ''}
      </div>
    </div>
  `
}

function renderColuna(coluna) {
  const cardsDaColuna = state.cards.filter(c => c.coluna === coluna.id)
  const formAberto = state.addFormAberto === coluna.id

  const addHtml = formAberto ? `
    <div class="board-column__add-form" data-add-form>
      <textarea placeholder="Nome do cliente..." autofocus></textarea>
      <div class="board-column__add-actions">
        <button class="btn-add-confirm" data-action="confirmar-add">Adicionar</button>
        <button class="board-column__add-cancel" data-action="cancelar-add">&times;</button>
      </div>
    </div>
  ` : `
    <button class="board-column__add-btn" data-action="abrir-add">${ICON_PLUS} Adicionar um cartão</button>
  `

  const menuAberto = state.menuColunaAberto === coluna.id

  return `
    <div class="board-column" data-coluna="${coluna.id}">
      <div class="board-column__header">
        <div class="board-column__header-left">
          <span class="board-column__title">${coluna.nome}</span>
          <span class="board-column__count">${cardsDaColuna.length}</span>
        </div>
        <div class="board-column__menu-wrap">
          <button class="board-column__menu-btn" data-action="abrir-menu-coluna">${ICON_DOTS}</button>
          <div class="board-column__menu ${menuAberto ? 'board-column__menu--open' : ''}">
            <button class="board-column__menu-item" data-action="excluir-coluna">Excluir coluna</button>
          </div>
        </div>
      </div>
      <div class="board-column__list" data-lista="${coluna.id}">
        ${cardsDaColuna.map(renderCard).join('')}
      </div>
      <div class="board-column__add">${addHtml}</div>
    </div>
  `
}

function renderBoard() {
  document.getElementById('board').innerHTML = state.colunas.map(renderColuna).join('')
  setupDragAndDrop()
  setupAddCard()
  setupColunas()
}

function campoOuVazio(valor) {
  return valor ? valor : '<span class="vazio"></span>'
}

function renderModal() {
  const modalRoot = document.getElementById('modal-root')
  const card = state.cards.find(c => c.id === state.cardAbertoId)
  if (!card) { modalRoot.innerHTML = ''; return }

  const opcoesColuna = state.colunas.map(col =>
    `<option value="${col.id}" ${col.id === card.coluna ? 'selected' : ''}>${col.nome}</option>`
  ).join('')

  const timelineHtml = card.timeline.map(item => `
    <div class="lab-comentario ${item.tipo === 'sistema' ? 'lab-comentario--sistema' : ''}">
      <span class="lab-comentario__autor">${item.autor}</span> ${item.texto}
      <span class="lab-comentario__data">${item.dataLabel}</span>
    </div>
  `).join('')

  modalRoot.innerHTML = `
    <div class="lab-modal-overlay" id="modal-overlay">
      <div class="lab-modal">
        <div class="lab-modal__header">
          <select class="filter-select" id="modal-coluna-select">${opcoesColuna}</select>
          <button class="lab-modal__close" id="modal-close">${ICON_CLOSE}</button>
        </div>
        <div class="lab-modal__body">
          <div class="lab-modal__main">
            <div class="lab-modal__titulo">${card.cliente} <span class="board-card__numero">- ${card.numero}</span></div>
            <span class="board-card__label-chip" style="background:${card.colunaCor}">${card.colunaNome}</span>
            <div class="lab-modal__sla">
              <span class="lab-modal__sla-dot" style="background:${card.slaCor}"></span>
              SLA: ${card.sla === 'padrao' ? 'Padrão' : card.sla === 'importante' ? 'Importante' : 'Urgente'}
            </div>

            <div class="lab-modal__section-title">Informações do Atendimento</div>
            <dl class="lab-detalhe-grid">
              <div><dt>Equipamento</dt><dd>${card.equipamento} — ${card.modelo}</dd></div>
              <div><dt>WMS</dt><dd>${card.wms}</dd></div>
              ${card.atendimentoOrigem ? `<div class="span-2"><dt>Atendimento de Origem</dt><dd>Suporte Remoto nº ${card.atendimentoOrigem.numero}</dd></div>` : ''}
              <div class="span-2"><dt>Defeito</dt><dd>${card.defeito}</dd></div>
              <div class="span-2"><dt>Requisição de Peças</dt><dd>${card.requisicao ? 'Nº ' + card.requisicao : campoOuVazio()}</dd></div>
              <div class="span-2"><dt>Laudo Técnico</dt><dd>${campoOuVazio(card.laudoTecnico)}</dd></div>
              <div><dt>Data Chegada</dt><dd>${card.dataChegada.split('-').reverse().join('/')}</dd></div>
              <div><dt>Data Manutenção Fin.</dt><dd>${card.dataManutencaoFin ? card.dataManutencaoFin.split('-').reverse().join('/') : campoOuVazio()}</dd></div>
              <div><dt>Data Saída</dt><dd>${card.dataSaida ? card.dataSaida.split('-').reverse().join('/') : campoOuVazio()}</dd></div>
              <div><dt>Drive</dt><dd>${campoOuVazio(card.drive)}</dd></div>
              <div><dt>Técnico</dt><dd>${campoOuVazio(card.tecnico)}</dd></div>
            </dl>
          </div>
          <div class="lab-modal__side">
            <div class="lab-modal__section-title" style="margin-top:0">Comentários e atividade</div>
            <div class="lab-comentarios">
              <div class="lab-comentarios__form">
                <textarea id="modal-comentario-texto" placeholder="Escrever um comentário interno..."></textarea>
                <button class="btn-add-confirm" id="modal-comentario-enviar" style="align-self:flex-start">Comentar</button>
              </div>
              <div class="lab-comentarios__lista">${timelineHtml}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  document.getElementById('modal-close').addEventListener('click', fecharModal)
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') fecharModal()
  })
  document.getElementById('modal-coluna-select').addEventListener('change', async e => {
    await moverCardParaColuna(card.id, e.target.value)
  })
  document.getElementById('modal-comentario-enviar').addEventListener('click', async () => {
    const textarea = document.getElementById('modal-comentario-texto')
    const texto = textarea.value.trim()
    if (!texto) return
    try {
      const atualizado = await fetchJson(`/api/laboratorio/${card.id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      substituirCard(atualizado)
      renderModal()
    } catch (err) {
      showToast('Não foi possível enviar o comentário.')
    }
  })
}

function substituirCard(atualizado) {
  const idx = state.cards.findIndex(c => c.id === atualizado.id)
  if (idx !== -1) state.cards[idx] = atualizado
}

function abrirModal(cardId) {
  state.cardAbertoId = cardId
  renderModal()
  document.addEventListener('keydown', fecharModalNoEsc)
}

function fecharModal() {
  state.cardAbertoId = null
  document.getElementById('modal-root').innerHTML = ''
  document.removeEventListener('keydown', fecharModalNoEsc)
}

function fecharModalNoEsc(e) {
  if (e.key === 'Escape') fecharModal()
}

async function moverCardParaColuna(cardId, novaColuna) {
  const card = state.cards.find(c => c.id === cardId)
  if (!card || card.coluna === novaColuna) return
  const colunaAnterior = card.coluna
  card.coluna = novaColuna
  renderBoard()
  if (state.cardAbertoId === cardId) renderModal()

  try {
    const atualizado = await fetchJson(`/api/laboratorio/${cardId}/mover`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coluna: novaColuna }),
    })
    substituirCard(atualizado)
    renderBoard()
    if (state.cardAbertoId === cardId) renderModal()
  } catch (err) {
    card.coluna = colunaAnterior
    renderBoard()
    if (state.cardAbertoId === cardId) renderModal()
    showToast('Não foi possível mover o cartão.')
  }
}

function setupDragAndDrop() {
  document.querySelectorAll('.board-card').forEach(cardEl => {
    let houveArrasto = false

    cardEl.addEventListener('dragstart', e => {
      houveArrasto = true
      e.dataTransfer.setData('text/plain', cardEl.dataset.cardId)
      requestAnimationFrame(() => cardEl.classList.add('board-card--dragging'))
    })
    cardEl.addEventListener('dragend', () => cardEl.classList.remove('board-card--dragging'))
    cardEl.addEventListener('click', () => {
      if (houveArrasto) { houveArrasto = false; return }
      abrirModal(Number(cardEl.dataset.cardId))
    })
  })

  document.querySelectorAll('.board-column__list').forEach(listEl => {
    listEl.addEventListener('dragover', e => {
      e.preventDefault()
      listEl.classList.add('board-column__list--over')
    })
    listEl.addEventListener('dragleave', () => listEl.classList.remove('board-column__list--over'))
    listEl.addEventListener('drop', async e => {
      e.preventDefault()
      listEl.classList.remove('board-column__list--over')
      const cardId = Number(e.dataTransfer.getData('text/plain'))
      await moverCardParaColuna(cardId, listEl.dataset.lista)
    })
  })
}

function setupAddCard() {
  document.querySelectorAll('[data-action="abrir-add"]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.addFormAberto = btn.closest('.board-column').dataset.coluna
      renderBoard()
      const textarea = document.querySelector('[data-add-form] textarea')
      if (textarea) textarea.focus()
    })
  })

  document.querySelectorAll('[data-action="cancelar-add"]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.addFormAberto = null
      renderBoard()
    })
  })

  document.querySelectorAll('[data-action="confirmar-add"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const colunaId = btn.closest('.board-column').dataset.coluna
      const textarea = document.querySelector('[data-add-form] textarea')
      const cliente = textarea.value.trim()
      if (!cliente) return

      try {
        const novoCard = await fetchJson('/api/laboratorio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cliente, coluna: colunaId }),
        })
        state.cards.push(novoCard)
        state.addFormAberto = null
        renderBoard()
      } catch (err) {
        showToast('Não foi possível adicionar o cartão.')
      }
    })
  })
}

function setupColunas() {
  document.querySelectorAll('[data-action="abrir-menu-coluna"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const colunaId = btn.closest('.board-column').dataset.coluna
      state.menuColunaAberto = state.menuColunaAberto === colunaId ? null : colunaId
      renderBoard()
    })
  })

  document.querySelectorAll('[data-action="excluir-coluna"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation()
      const colunaId = btn.closest('.board-column').dataset.coluna
      try {
        const res = await fetch(`/api/laboratorio/colunas/${colunaId}`, { method: 'DELETE' })
        if (res.status === 204) {
          state.colunas = state.colunas.filter(c => c.id !== colunaId)
          state.menuColunaAberto = null
          renderBoard()
        } else {
          const body = await res.json()
          showToast(body.erro || 'Não foi possível excluir a coluna.')
          state.menuColunaAberto = null
          renderBoard()
        }
      } catch (err) {
        showToast('Não foi possível excluir a coluna.')
      }
    })
  })

  if (!window.__labMenuOutsideClickBound) {
    window.__labMenuOutsideClickBound = true
    document.addEventListener('click', () => {
      if (state.menuColunaAberto) {
        state.menuColunaAberto = null
        renderBoard()
      }
    })
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
  const quadro = await fetchJson('/api/laboratorio')
  state.colunas = quadro.colunas
  state.cards = quadro.cards
  renderBoard()
}

document.addEventListener('DOMContentLoaded', init)
