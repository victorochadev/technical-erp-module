import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../../components/Sidebar'
import { Header } from '../../components/Header'
import { RowActionsMenu } from '../../components/RowActionsMenu'
import { listarCargosSalarios } from '../../api'
import type { CargoSalario } from '../../types'
import { IconCargosSalarios } from './icon'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CargosSalariosLista() {
  const [cargos, setCargos] = useState<CargoSalario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    document.title = 'Cargos e Salários — Cadastro'
  }, [])

  useEffect(() => {
    listarCargosSalarios()
      .then(setCargos)
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return termo ? cargos.filter(c => c.nome.toLowerCase().includes(termo)) : cargos
  }, [cargos, busca])

  return (
    <>
      <Sidebar active="cargos-salarios" />
      <Header icon={<IconCargosSalarios />} title="Cargos e Salários" breadcrumb="Home / Cadastro / Cargos e Salários" />
      <main className="main">
        <section className="section">
          <div className="list-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nome do cargo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <Link className="btn-fab" to="/cargos-salarios/novo" title="Novo cargo" aria-label="Novo cargo">
              +
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome do Cargo</th>
                  <th>Salário Base</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={4} className="table-empty-cell">Carregando...</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={4} className="table-empty-cell">Nenhum cargo encontrado</td></tr>
                ) : (
                  filtrados.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.nome}</td>
                      <td className="text-muted">{formatarMoeda(c.salarioBase)}</td>
                      <td>
                        <RowActionsMenu>
                          <Link className="row-actions__item" to={`/cargos-salarios/${c.id}/editar`}>
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
              {filtrados.length} cargo{filtrados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </section>
      </main>
    </>
  )
}
