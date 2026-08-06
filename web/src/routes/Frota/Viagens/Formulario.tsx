import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from '../../../components/Sidebar'
import { Header } from '../../../components/Header'
import { useToast } from '../../../components/Toast'
import {
  atualizarFrotaViagem, buscarAtendimentos, buscarFrotaViagem, criarFrotaViagem,
  listarTecnicos, listarVeiculos,
} from '../../../api'
import type { AtendimentoResumo, FrotaViagem, Veiculo } from '../../../types'
import { IconViagens } from './icon'

function agoraDatetimeLocal() {
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset())
  return agora.toISOString().slice(0, 16)
}

export function ViagensFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const editando = Boolean(id)

  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [tecnicos, setTecnicos] = useState<string[]>([])
  const [veiculoId, setVeiculoId] = useState('')
  const [tecnico, setTecnico] = useState('')
  const [finalidade, setFinalidade] = useState('')
  const [kmSaida, setKmSaida] = useState<number | ''>('')
  const [dataSaida, setDataSaida] = useState(agoraDatetimeLocal())
  const [kmChegada, setKmChegada] = useState<number | ''>('')
  const [dataChegada, setDataChegada] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [buscaAtendimento, setBuscaAtendimento] = useState('')
  const [resultadosAtendimento, setResultadosAtendimento] = useState<AtendimentoResumo[]>([])
  const [atendimentoId, setAtendimentoId] = useState<number | null>(null)
  const [dropdownAberto, setDropdownAberto] = useState(false)

  useEffect(() => {
    document.title = editando ? 'Registrar Chegada — Viagens de Frota' : 'Registrar Saída — Viagens de Frota'
  }, [editando])

  useEffect(() => {
    listarVeiculos().then(setVeiculos)
    listarTecnicos().then(setTecnicos)
  }, [])

  useEffect(() => {
    if (!id) return
    buscarFrotaViagem(id)
      .then((v: FrotaViagem) => {
        setVeiculoId(String(v.veiculoId))
        setTecnico(v.tecnico)
        setFinalidade(v.finalidade)
        setKmSaida(v.kmSaida)
        setDataSaida(v.dataSaida.slice(0, 16))
        setKmChegada(v.kmChegada ?? '')
        setDataChegada(v.dataChegada ? v.dataChegada.slice(0, 16) : agoraDatetimeLocal())
        setObservacoes(v.observacoes)
        setAtendimentoId(v.atendimentoId)
        if (v.atendimentoNumero) setBuscaAtendimento(`Nº ${v.atendimentoNumero}`)
      })
      .catch(() => showToast('Viagem não encontrada'))
  }, [id])

  useEffect(() => {
    const termo = buscaAtendimento.trim()
    if (!termo || (atendimentoId && buscaAtendimento.startsWith('Nº'))) {
      setResultadosAtendimento([])
      return
    }
    const timeout = setTimeout(() => {
      buscarAtendimentos(termo).then(res => {
        setResultadosAtendimento(res)
        setDropdownAberto(true)
      })
    }, 250)
    return () => clearTimeout(timeout)
  }, [buscaAtendimento])

  function selecionarAtendimento(a: AtendimentoResumo) {
    setAtendimentoId(a.id)
    setBuscaAtendimento(`Nº ${a.numero} — ${a.cliente}`)
    setDropdownAberto(false)
  }

  async function salvar() {
    if (!veiculoId) {
      showToast('Selecione o veículo antes de salvar.')
      return
    }
    if (kmSaida === '' || Number(kmSaida) < 0) {
      showToast('Informe o km de saída.')
      return
    }
    const payload = {
      veiculoId: Number(veiculoId),
      tecnico,
      atendimentoId,
      finalidade,
      kmSaida: Number(kmSaida),
      dataSaida: new Date(dataSaida).toISOString(),
      kmChegada: kmChegada === '' ? null : Number(kmChegada),
      dataChegada: dataChegada ? new Date(dataChegada).toISOString() : null,
      observacoes,
    }
    try {
      await (id ? atualizarFrotaViagem(id, payload) : criarFrotaViagem(payload))
      showToast('Viagem salva.')
      setTimeout(() => navigate('/frota/viagens'), 1200)
    } catch {
      showToast('Não foi possível salvar a viagem.')
    }
  }

  return (
    <>
      <Sidebar active="viagens-frota" />
      <Header
        icon={<IconViagens />}
        title={editando ? 'Editar Viagem' : 'Registrar Saída'}
        breadcrumb={editando ? 'Home / Cadastro / Viagens de Frota / Editar' : 'Home / Cadastro / Viagens de Frota / Novo'}
      />
      <main className="main main--form">
        <div className="card form-grid">
          <div className="field-block">
            <label className="field-label">Veículo</label>
            <select className="field-input" value={veiculoId} onChange={e => setVeiculoId(e.target.value)}>
              <option value="">Selecione...</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>
              ))}
            </select>
          </div>
          <div className="field-block">
            <label className="field-label">Técnico</label>
            <select className="field-input" value={tecnico} onChange={e => setTecnico(e.target.value)}>
              <option value="">Selecione...</option>
              {tecnicos.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field-block field-block--wide autocomplete">
            <label className="field-label">Atendimento Vinculado (opcional)</label>
            <div className="autocomplete-input-wrap">
              <input
                className="field-input"
                value={buscaAtendimento}
                onChange={e => {
                  setBuscaAtendimento(e.target.value)
                  if (!e.target.value.trim()) setAtendimentoId(null)
                }}
                onFocus={() => resultadosAtendimento.length > 0 && setDropdownAberto(true)}
                placeholder="Digite o número do atendimento..."
              />
              <div className={`autocomplete-dropdown${dropdownAberto && resultadosAtendimento.length > 0 ? ' autocomplete-dropdown--open' : ''}`}>
                {resultadosAtendimento.map(a => (
                  <div key={a.id} className="autocomplete-item" onClick={() => selecionarAtendimento(a)}>
                    <div className="autocomplete-item__title">Nº {a.numero} — {a.cliente}</div>
                    <div className="autocomplete-item__sub">{a.defeito}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="field-block field-block--wide">
            <label className="field-label">Finalidade</label>
            <input className="field-input" value={finalidade} onChange={e => setFinalidade(e.target.value)} placeholder="Ex: Visita técnica ao cliente" />
          </div>
          <div className="field-block">
            <label className="field-label">Km de Saída</label>
            <input type="number" className="field-input" value={kmSaida} onChange={e => setKmSaida(e.target.value ? Number(e.target.value) : '')} />
          </div>
          <div className="field-block">
            <label className="field-label">Data/Hora de Saída</label>
            <input type="datetime-local" className="field-input" value={dataSaida} onChange={e => setDataSaida(e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Km de Chegada</label>
            <input
              type="number"
              className="field-input"
              value={kmChegada}
              onChange={e => setKmChegada(e.target.value ? Number(e.target.value) : '')}
              placeholder="Preencha ao registrar a chegada"
            />
          </div>
          <div className="field-block">
            <label className="field-label">Data/Hora de Chegada</label>
            <input type="datetime-local" className="field-input" value={dataChegada} onChange={e => setDataChegada(e.target.value)} />
          </div>
          <div className="field-block field-block--wide">
            <label className="field-label">Observações</label>
            <input className="field-input" value={observacoes} onChange={e => setObservacoes(e.target.value)} />
          </div>
        </div>

        <div className="form-footer">
          <button className="btn btn--primary btn--lg" onClick={salvar}>
            {editando ? 'Salvar Alterações' : 'Registrar Saída'}
          </button>
        </div>
      </main>

      <ToastContainer />
    </>
  )
}
