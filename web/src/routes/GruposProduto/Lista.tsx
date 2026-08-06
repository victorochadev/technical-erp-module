import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../../components/Sidebar'
import { Header } from '../../components/Header'
import { RowActionsMenu } from '../../components/RowActionsMenu'
import { listarGruposProduto } from '../../api'
import type { GrupoProduto } from '../../types'
import { IconGruposProduto } from './icon'

export function GruposProdutoLista() {
  const [grupos, setGrupos] = useState<GrupoProduto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    document.title = 'Grupos de Produtos — Cadastro'
  }, [])

  useEffect(() => {
    listarGruposProduto()
      .then(setGrupos)
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return termo ? grupos.filter(g => g.nome.toLowerCase().includes(termo)) : grupos
  }, [grupos, busca])

  return (
    <>
      <Sidebar active="grupos-produto" />
      <Header icon={<IconGruposProduto />} title="Grupos de Produtos" breadcrumb="Home / Cadastro / Grupos de Produtos" />
      <main className="main">
        <section className="section">
          <div className="list-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nome do grupo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <Link className="btn-fab" to="/grupos-produto/novo" title="Novo grupo de produtos" aria-label="Novo grupo de produtos">
              +
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome do Grupo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={3} className="table-empty-cell">Carregando...</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={3} className="table-empty-cell">Nenhum grupo encontrado</td></tr>
                ) : (
                  filtrados.map(g => (
                    <tr key={g.id}>
                      <td>{g.id}</td>
                      <td>{g.nome}</td>
                      <td>
                        <RowActionsMenu>
                          <Link className="row-actions__item" to={`/grupos-produto/${g.id}/editar`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                            </svg>
                            Editar
                          </Link>
                        </RowActionsMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="section-header" style={{ marginTop: 8 }}>
            <span className="section-badge">
              {filtrados.length} grupo{filtrados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </section>
      </main>
    </>
  )
}
