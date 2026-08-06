import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from '../../components/Sidebar'
import { Header } from '../../components/Header'
import { useToast } from '../../components/Toast'
import { atualizarGrupoProduto, buscarGrupoProduto, criarGrupoProduto } from '../../api'
import { IconGruposProduto } from './icon'

export function GruposProdutoFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [nome, setNome] = useState('')
  const editando = Boolean(id)

  useEffect(() => {
    document.title = editando ? 'Editar Grupo de Produtos — Cadastro' : 'Novo Grupo de Produtos — Cadastro'
  }, [editando])

  useEffect(() => {
    if (!id) return
    buscarGrupoProduto(id)
      .then(g => setNome(g.nome))
      .catch(() => showToast('Grupo não encontrado'))
  }, [id])

  async function salvar() {
    const nomeTrim = nome.trim()
    if (!nomeTrim) {
      showToast('Informe o nome do grupo antes de salvar.')
      return
    }
    try {
      const grupo = id ? await atualizarGrupoProduto(id, nomeTrim) : await criarGrupoProduto(nomeTrim)
      showToast(`Grupo "${grupo.nome}" salvo.`)
      setTimeout(() => navigate('/grupos-produto'), 1200)
    } catch {
      showToast('Não foi possível salvar o grupo.')
    }
  }

  return (
    <>
      <Sidebar active="grupos-produto" />
      <Header
        icon={<IconGruposProduto />}
        title={editando ? 'Editar Grupo de Produtos' : 'Novo Grupo de Produtos'}
        breadcrumb={editando ? 'Home / Cadastro / Grupos de Produtos / Editar' : 'Home / Cadastro / Grupos de Produtos / Novo'}
      />
      <main className="main main--form">
        <div className="card form-grid">
          <div className="field-block field-block--wide">
            <label className="field-label">Nome do Grupo</label>
            <input
              type="text"
              className="field-input"
              placeholder="Ex: 13.5 – PEÇAS"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
          </div>
        </div>

        <div className="form-footer">
          <button className="btn btn--primary btn--lg" onClick={salvar}>
            {editando ? 'Salvar Alterações' : 'Salvar Grupo'}
          </button>
        </div>
      </main>

      <ToastContainer />
    </>
  )
}
