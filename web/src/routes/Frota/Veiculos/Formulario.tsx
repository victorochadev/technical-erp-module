import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from '../../../components/Sidebar'
import { Header } from '../../../components/Header'
import { useToast } from '../../../components/Toast'
import { atualizarVeiculo, buscarVeiculo, criarVeiculo } from '../../../api'
import type { Veiculo } from '../../../types'
import { IconVeiculos } from './icon'

const VAZIO: Partial<Veiculo> = {
  placa: '', marca: '', modelo: '', ano: '', categoria: '', combustivel: '',
  kmAtual: 0, manutencaoKmPrevista: null, manutencaoDataPrevista: '', manutencaoDescricao: '',
}

export function VeiculosFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [dados, setDados] = useState<Partial<Veiculo>>(VAZIO)
  const editando = Boolean(id)

  useEffect(() => {
    document.title = editando ? 'Editar Veículo — Cadastro' : 'Novo Veículo — Cadastro'
  }, [editando])

  useEffect(() => {
    if (!id) return
    buscarVeiculo(id)
      .then(setDados)
      .catch(() => showToast('Veículo não encontrado'))
  }, [id])

  function set<K extends keyof Veiculo>(campo: K, valor: Veiculo[K]) {
    setDados(atual => ({ ...atual, [campo]: valor }))
  }

  async function salvar() {
    if (!dados.placa?.trim() || !dados.modelo?.trim()) {
      showToast('Informe ao menos a placa e o modelo antes de salvar.')
      return
    }
    try {
      const veiculo = id ? await atualizarVeiculo(id, dados) : await criarVeiculo(dados)
      showToast(`Veículo "${veiculo.placa}" salvo.`)
      setTimeout(() => navigate('/frota/veiculos'), 1200)
    } catch {
      showToast('Não foi possível salvar o veículo.')
    }
  }

  return (
    <>
      <Sidebar active="veiculos" />
      <Header
        icon={<IconVeiculos />}
        title={editando ? 'Editar Veículo' : 'Novo Veículo'}
        breadcrumb={editando ? 'Home / Cadastro / Veículos / Editar' : 'Home / Cadastro / Veículos / Novo'}
      />
      <main className="main main--form">
        <div className="card form-grid">
          <div className="field-block">
            <label className="field-label">Placa</label>
            <input className="field-input" value={dados.placa || ''} onChange={e => set('placa', e.target.value.toUpperCase())} placeholder="ABC1D23" />
          </div>
          <div className="field-block">
            <label className="field-label">Marca</label>
            <input className="field-input" value={dados.marca || ''} onChange={e => set('marca', e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Modelo</label>
            <input className="field-input" value={dados.modelo || ''} onChange={e => set('modelo', e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Ano</label>
            <input className="field-input" value={dados.ano || ''} onChange={e => set('ano', e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Categoria</label>
            <input className="field-input" value={dados.categoria || ''} onChange={e => set('categoria', e.target.value)} placeholder="Ex: Utilitário, Passeio, Moto" />
          </div>
          <div className="field-block">
            <label className="field-label">Combustível</label>
            <input className="field-input" value={dados.combustivel || ''} onChange={e => set('combustivel', e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Km Atual</label>
            <input
              type="number"
              className="field-input"
              value={dados.kmAtual ?? 0}
              onChange={e => set('kmAtual', Number(e.target.value))}
            />
          </div>
          <div className="field-block">
            <label className="field-label">Manutenção Prevista (Km)</label>
            <input
              type="number"
              className="field-input"
              value={dados.manutencaoKmPrevista ?? ''}
              onChange={e => set('manutencaoKmPrevista', e.target.value ? Number(e.target.value) : null)}
              placeholder="Deixe vazio se não houver"
            />
          </div>
          <div className="field-block">
            <label className="field-label">Manutenção Prevista (Data)</label>
            <input
              type="date"
              className="field-input"
              value={dados.manutencaoDataPrevista || ''}
              onChange={e => set('manutencaoDataPrevista', e.target.value)}
            />
          </div>
          <div className="field-block field-block--wide">
            <label className="field-label">Descrição da Manutenção</label>
            <input
              className="field-input"
              value={dados.manutencaoDescricao || ''}
              onChange={e => set('manutencaoDescricao', e.target.value)}
              placeholder="Ex: Troca de óleo e filtros"
            />
          </div>
        </div>

        <div className="form-footer">
          <button className="btn btn--primary btn--lg" onClick={salvar}>
            {editando ? 'Salvar Alterações' : 'Salvar Veículo'}
          </button>
        </div>
      </main>

      <ToastContainer />
    </>
  )
}
