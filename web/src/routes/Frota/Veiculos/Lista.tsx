import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../../../components/Sidebar'
import { Header } from '../../../components/Header'
import { RowActionsMenu } from '../../../components/RowActionsMenu'
import { listarVeiculos } from '../../../api'
import type { Veiculo } from '../../../types'
import { IconVeiculos } from './icon'

export function VeiculosLista() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    document.title = 'Veículos — Cadastro'
  }, [])

  useEffect(() => {
    listarVeiculos()
      .then(setVeiculos)
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return veiculos
    return veiculos.filter(v => `${v.placa} ${v.marca} ${v.modelo}`.toLowerCase().includes(termo))
  }, [veiculos, busca])

  return (
    <>
      <Sidebar active="veiculos" />
      <Header icon={<IconVeiculos />} title="Veículos" breadcrumb="Home / Cadastro / Veículos" />
      <main className="main">
        <section className="section">
          <div className="list-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por placa, marca ou modelo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <Link className="btn-fab" to="/frota/veiculos/novo" title="Novo veículo" aria-label="Novo veículo">
              +
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Marca / Modelo</th>
                  <th>Categoria</th>
                  <th>Km Atual</th>
                  <th>Manutenção</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={6} className="table-empty-cell">Carregando...</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={6} className="table-empty-cell">Nenhum veículo encontrado</td></tr>
                ) : (
                  filtrados.map(v => (
                    <tr key={v.id}>
                      <td>{v.placa}</td>
                      <td>{v.marca} {v.modelo}</td>
                      <td>{v.categoria}</td>
                      <td>{v.kmAtual.toLocaleString('pt-BR')} km</td>
                      <td>
                        {v.manutencaoPendente ? (
                          <span className="chip chip--cancelado">Pendente</span>
                        ) : v.manutencaoKmPrevista ? (
                          <span className="chip chip--concluido">Em dia</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <RowActionsMenu>
                          <Link className="row-actions__item" to={`/frota/veiculos/${v.id}/editar`}>
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
              {filtrados.length} veículo{filtrados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </section>
      </main>
    </>
  )
}
