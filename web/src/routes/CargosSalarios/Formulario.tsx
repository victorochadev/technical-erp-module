import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from '../../components/Sidebar'
import { Header } from '../../components/Header'
import { useToast } from '../../components/Toast'
import { atualizarCargoSalario, buscarCargoSalario, criarCargoSalario } from '../../api'
import { IconCargosSalarios } from './icon'

export function CargosSalariosFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [nome, setNome] = useState('')
  const [salarioBase, setSalarioBase] = useState<number | ''>('')
  const editando = Boolean(id)

  useEffect(() => {
    document.title = editando ? 'Editar Cargo — Cadastro' : 'Novo Cargo — Cadastro'
  }, [editando])

  useEffect(() => {
    if (!id) return
    buscarCargoSalario(id)
      .then(c => {
        setNome(c.nome)
        setSalarioBase(c.salarioBase)
      })
      .catch(() => showToast('Cargo não encontrado'))
  }, [id])

  async function salvar() {
    const nomeTrim = nome.trim()
    if (!nomeTrim) {
      showToast('Informe o nome do cargo antes de salvar.')
      return
    }
    const dados = { nome: nomeTrim, salarioBase: Number(salarioBase) || 0 }
    try {
      const cargo = id ? await atualizarCargoSalario(id, dados) : await criarCargoSalario(dados)
      showToast(`Cargo "${cargo.nome}" salvo.`)
      setTimeout(() => navigate('/cargos-salarios'), 1200)
    } catch {
      showToast('Não foi possível salvar o cargo.')
    }
  }

  return (
    <>
      <Sidebar active="cargos-salarios" />
      <Header
        icon={<IconCargosSalarios />}
        title={editando ? 'Editar Cargo' : 'Novo Cargo'}
        breadcrumb={editando ? 'Home / Cadastro / Cargos e Salários / Editar' : 'Home / Cadastro / Cargos e Salários / Novo'}
      />
      <main className="main main--form">
        <div className="card form-grid">
          <div className="field-block field-block--wide">
            <label className="field-label">Nome do Cargo</label>
            <input
              type="text"
              className="field-input"
              placeholder="Ex: Técnico de Instalação"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
          </div>
          <div className="field-block">
            <label className="field-label">Salário Base</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="field-input"
              placeholder="0,00"
              value={salarioBase}
              onChange={e => setSalarioBase(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </div>

        <div className="form-footer">
          <button className="btn btn--primary btn--lg" onClick={salvar}>
            {editando ? 'Salvar Alterações' : 'Salvar Cargo'}
          </button>
        </div>
      </main>

      <ToastContainer />
    </>
  )
}
