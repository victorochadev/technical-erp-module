import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Espelha o padrão do protótipo em HTML/JS: o menu flutua fora da tabela
// (portal pro <body>, position: fixed) porque .table-wrapper tem
// overflow-x: auto, que por regra do CSS também clipa overflow-y — um menu
// aninhado dentro dela seria cortado. Ver README/histórico do vanilla JS.
export function RowActionsMenu({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return

    function fechar(e: MouseEvent) {
      if (toggleRef.current?.contains(e.target as Node)) return
      if (menuRef.current?.contains(e.target as Node)) return
      setAberto(false)
    }
    function fecharPorScrollOuResize() {
      setAberto(false)
    }

    document.addEventListener('click', fechar)
    window.addEventListener('scroll', fecharPorScrollOuResize, true)
    window.addEventListener('resize', fecharPorScrollOuResize)
    return () => {
      document.removeEventListener('click', fechar)
      window.removeEventListener('scroll', fecharPorScrollOuResize, true)
      window.removeEventListener('resize', fecharPorScrollOuResize)
    }
  }, [aberto])

  useEffect(() => {
    if (!aberto || !toggleRef.current || !menuRef.current) return
    const rectToggle = toggleRef.current.getBoundingClientRect()
    const rectMenu = menuRef.current.getBoundingClientRect()
    setPos({ top: rectToggle.bottom + 4, left: Math.max(8, rectToggle.right - rectMenu.width) })
  }, [aberto])

  function alternar() {
    if (aberto) { setAberto(false); return }
    const rect = toggleRef.current!.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.right })
    setAberto(true)
  }

  return (
    <div className="row-actions">
      <button ref={toggleRef} className="row-actions__toggle" aria-label="Ações" onClick={alternar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {aberto &&
        createPortal(
          <div
            ref={menuRef}
            className="row-actions__menu row-actions__menu--open"
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            onClick={() => setAberto(false)}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  )
}
