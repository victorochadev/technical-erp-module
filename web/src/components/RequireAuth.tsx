import { useEffect, useState, type ReactNode } from 'react'

// O index.html já faz esse check inline (antes do React montar), pra evitar
// flash de conteúdo. Este componente é uma segunda camada, útil quando a
// flag muda durante a navegação client-side (sem reload de página).
export function RequireAuth({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState<boolean | null>(null)

  useEffect(() => {
    const ok = sessionStorage.getItem('at-auth') === 'ok' || localStorage.getItem('at-auth') === 'ok'
    if (!ok) {
      window.location.replace('/login.html')
      return
    }
    setAutenticado(true)
  }, [])

  if (!autenticado) return null
  return <>{children}</>
}
