import { Link } from 'react-router-dom'

// Rótulo do item atualmente ativo. Só os módulos já migrados para React
// podem vir daqui — os demais continuam levando para as páginas estáticas
// de sempre. Conforme mais módulos forem migrados, adicione o novo id aqui
// e troque o <a href="..."> correspondente por <Link to="...">, seguindo o
// mesmo padrão do item de Grupos de Produtos.
type ItemAtivo = 'grupos-produto' | 'veiculos' | 'viagens-frota'

export function Sidebar({ active }: { active: ItemAtivo }) {
  const cadastroAtivo = active === 'grupos-produto' || active === 'veiculos' || active === 'viagens-frota'

  return (
    <nav className="sidebar" aria-label="Módulos do ERP">
      <div className="sidebar__avatar" title="Victor Rocha">VR</div>
      <div className="sidebar__divider" />

      <div className="sidebar__item">
        <a href="/clientes.html" className={`sidebar__link${cadastroAtivo ? ' sidebar__link--active' : ''}`} title="Cadastro">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10.5" r="2" /><path d="M5 17c.5-2 2-3 3.5-3s3 1 3.5 3" /><line x1="14" y1="9" x2="19" y2="9" /><line x1="14" y1="12" x2="19" y2="12" /><line x1="14" y1="15" x2="17" y2="15" /></svg>
        </a>
        <div className="sidebar__flyout">
          <div className="sidebar__flyout-header">Cadastro</div>
          <a href="/clientes.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10.5" r="2" /><path d="M5 17c.5-2 2-3 3.5-3s3 1 3.5 3" /><line x1="14" y1="9" x2="19" y2="9" /><line x1="14" y1="12" x2="19" y2="12" /><line x1="14" y1="15" x2="17" y2="15" /></svg>
            Clientes
          </a>
          <a href="/tecnicos-terceirizados.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="3" y1="13" x2="21" y2="13" /></svg>
            Técnicos Terceirizados
          </a>
          <a href="/produtos.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20.5 7.3 12 3 3.5 7.3 12 11.6l8.5-4.3z" /><path d="M3.5 7.3v9.4L12 21l8.5-4.3V7.3" /><path d="M12 11.6V21" /></svg>
            Produtos
          </a>
          <Link to="/grupos-produto" className={`sidebar__flyout-item${active === 'grupos-produto' ? ' sidebar__flyout-item--active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.17L4 3a1 1 0 0 0-1 1l.17 5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83z" /><circle cx="7" cy="7" r="1.2" /></svg>
            Grupos de Produtos
          </Link>
          <a href="/wms.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /><line x1="2" y1="12" x2="22" y2="12" /></svg>
            WMS
          </a>
          <a href="/funcionarios.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="7" r="3" /><path d="M2 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M17 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.85" /></svg>
            Funcionários
          </a>
          <a href="/cargos-salarios.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 6v12" /><path d="M15.5 9.5c0-1.5-1.5-2.5-3.5-2.5s-3.5 1-3.5 2.5c0 1.5 1.5 2 3.5 2.5s3.5 1 3.5 2.5-1.5 2.5-3.5 2.5-3.5-1-3.5-2.5" /></svg>
            Cargos e Salários
          </a>
          <Link to="/frota/veiculos" className={`sidebar__flyout-item${active === 'veiculos' ? ' sidebar__flyout-item--active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 17h1a2 2 0 0 0 4 0h8a2 2 0 0 0 4 0h1v-5l-2-4h-4l-2-3H7L4 9H3z" /><path d="M14 8v4" /><circle cx="7.5" cy="17" r="1.8" /><circle cx="16.5" cy="17" r="1.8" /></svg>
            Veículos
          </Link>
          <Link to="/frota/viagens" className={`sidebar__flyout-item${active === 'viagens-frota' ? ' sidebar__flyout-item--active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 20c2-6 4-9 8-9s6 3 8 9" /><circle cx="6" cy="6" r="2.4" /><circle cx="18" cy="6" r="2.4" /><path d="M8 6h8" /></svg>
            Viagens de Frota
          </Link>
        </div>
      </div>
      <div className="sidebar__item">
        <a href="/requisicoes.html" className="sidebar__link" title="Vendas">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" /></svg>
        </a>
        <div className="sidebar__flyout">
          <div className="sidebar__flyout-header">Vendas</div>
          <a href="/requisicoes.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Requisições
          </a>
        </div>
      </div>
      <div className="sidebar__item">
        <a href="/atendimentos.html" className="sidebar__link" title="Área Técnica">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
        </a>
        <div className="sidebar__flyout">
          <div className="sidebar__flyout-header">Área Técnica</div>
          <a href="/atendimentos.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Atendimentos
          </a>
          <a href="/instalacoes.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><line x1="2" y1="13" x2="22" y2="13" /></svg>
            Instalações
          </a>
          <a href="#" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 11l1.4-4.2A2 2 0 0 1 8.3 5.5h7.4a2 2 0 0 1 1.9 1.3L19 11" /><rect x="3" y="11" width="18" height="6" rx="2" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></svg>
            Visitas / Amostra
          </a>
          <a href="/laboratorio.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 3h6" /><path d="M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3" /></svg>
            Laboratório
          </a>
          <a href="/wiki.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="16" y2="16" /></svg>
            JET-IA
          </a>
          <a href="/helpdesk.html" className="sidebar__flyout-item" target="_blank" rel="opener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            HelpDesk
          </a>
          <a href="/index.html" className="sidebar__flyout-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
            Dashboard
          </a>
        </div>
      </div>
    </nav>
  )
}
