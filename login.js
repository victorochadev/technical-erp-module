// Login apenas de demonstração: protótipo sem back-end de autenticação real,
// então a credencial fica no próprio JS e o "acesso liberado" é guardado no
// sessionStorage (expira ao fechar a aba/navegador, exigindo login em todo
// novo acesso) — suficiente para afastar visitantes casuais do link público,
// não é segurança de verdade (qualquer um com o devtools aberto contorna isso).
const USUARIO_VALIDO = 'victor.rocha'
const SENHA_VALIDA = 'vic102030'

function init() {
  if (sessionStorage.getItem('at-auth') === 'ok') {
    window.location.replace('atendimentos.html')
    return
  }

  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault()
    const usuario = document.getElementById('input-usuario').value.trim()
    const senha = document.getElementById('input-senha').value

    if (usuario === USUARIO_VALIDO && senha === SENHA_VALIDA) {
      sessionStorage.setItem('at-auth', 'ok')
      window.location.href = 'atendimentos.html'
    } else {
      document.getElementById('login-error').textContent = 'Usuário ou senha inválidos.'
    }
  })
}

document.addEventListener('DOMContentLoaded', init)
