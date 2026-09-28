import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './AdminApp'
import StudentApp from './StudentApp'
import './index.css'

const appPath = window.location.pathname.startsWith(import.meta.env.BASE_URL)
  ? window.location.pathname.slice(import.meta.env.BASE_URL.length - 1)
  : window.location.pathname

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {appPath.startsWith('/admin') ? <AdminApp /> : appPath.startsWith('/estudante') ? <StudentApp /> : <App />}
  </React.StrictMode>,
)
