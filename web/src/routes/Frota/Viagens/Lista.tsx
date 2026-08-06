import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../../../components/Sidebar'
import { Header } from '../../../components/Header'
import { RowActionsMenu } from '../../../components/RowActionsMenu'
import { listarFrotaViagens } from '../../../api'
import type { FrotaViagem } from '../../../types'
import { IconViagens } from './icon'

function formatarData(iso: string | null) {
  if (!iso) return '—'
  const data = new Date(iso)
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function ViagensLista() {
  const [viagens, setViagens] = useState<FrotaViagem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    document.title = 'Viagens de Frota — Cadastro'
  }, [])

  useEffect(() => {
    listarFrotaViagens()
      .then(setViagens)
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return viagens
    return viagens.filter(v => `${v.veiculoPlaca} ${v.veiculoModelo} ${v.tecnico} ${v.finalidade}`.toLowerCase().includes(termo))
  }, [viagens, busca])

  return (
    <>
      <Sidebar active="viagens-frota" />
      <Header icon={<IconViagens />} title="Viagens de Frota" breadcrumb="Home / Cadastro / Viagens de Frota" />
      <main className="main">
        <section className="section">
          <div className="list-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por veículo, técnico ou finalidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <Link className="btn-fab" to="/frota/viagens/novo" title="Registrar saída" aria-label="Registrar saída">
              +
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Técnico</th>
                  <th>Atendimento</th>
                  <th>Saída</th>
                  <th>Chegada</th>
                  <th>Km Rodado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={7} className="table-empty-cell">Carregando...</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty-cell">Nenhuma viagem encontrada</td></tr>
                ) : (
                  filtrados.map(v => (
                    <tr key={v.id}>
                      <td>{v.veiculoPlaca} — {v.veiculoModelo}</td>
                      <td>{v.tecnico || '—'}</td>
                      <td>{v.atendimentoNumero ? `Nº ${v.atendimentoNumero}` : '—'}</td>
                      <td>{formatarData(v.dataSaida)}</td>
                      <td>
                        {v.dataChegada ? formatarData(v.dataChegada) : <span className="chip chip--emandamento">Em rota</span>}
                      </td>
                      <td>{v.kmRodado !== null ? `${v.kmRodado.toLocaleString('pt-BR')} km` : '—'}</td>
                      <td>
                        <RowActionsMenu>
                          <Link className="row-actions__item" to={`/frota/viagens/${v.id}/editar`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                            </svg>
                            {v.dataChegada ? 'Editar' : 'Registrar chegada'}
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
              {filtrados.length} {filtrados.length === 1 ? 'viagem' : 'viagens'}
            </span>
          </div>
        </section>
      </main>
    </>
  )
}
