import { useCallback, useState } from 'react'

interface ToastItem {
  id: number
  message: string
  visivel: boolean
}

let proximoId = 1

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string) => {
    const id = proximoId++
    setToasts(atual => [...atual, { id, message, visivel: false }])
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setToasts(atual => atual.map(t => (t.id === id ? { ...t, visivel: true } : t)))
    }))
    setTimeout(() => {
      setToasts(atual => atual.map(t => (t.id === id ? { ...t, visivel: false } : t)))
      setTimeout(() => setToasts(atual => atual.filter(t => t.id !== id)), 300)
    }, 3500)
  }, [])

  function ToastContainer() {
    return (
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-simple${t.visivel ? ' toast-simple--show' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    )
  }

  return { showToast, ToastContainer }
}
