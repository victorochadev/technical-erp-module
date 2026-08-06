import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

function alternarTema() {
  const atual = document.documentElement.getAttribute('data-theme')
  const proximo = atual === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', proximo)
  localStorage.setItem('at-theme', proximo)
}

interface HeaderProps {
  icon: ReactElement
  title: string
  breadcrumb: string
}

export function Header({ icon, title, breadcrumb }: HeaderProps) {
  const iconComClasse = isValidElement(icon) ? cloneElement(icon, { className: 'header-icon' } as object) : icon

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          {iconComClasse}
          <div className="header-title-group">
            <h1 className="header-title">{title}</h1>
            <p className="header-subtitle">{breadcrumb}</p>
          </div>
        </div>
        <div className="header-meta">
          <button className="theme-toggle" aria-label="Alternar tema" onClick={alternarTema}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
