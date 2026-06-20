import { Outlet, Link } from 'react-router-dom'
import Brand from '../components/Brand'

/** Layout centrado para login / recuperación de contraseña. */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-app">
      <header className="h-[68px] flex items-center px-4 sm:px-8 border-b border-line bg-card">
        <Brand />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] bg-card border border-line rounded-card shadow-card p-7 sm:p-8 animate-viewin">
          <Outlet />
        </div>
      </main>
      <footer className="px-4 sm:px-8 py-5 text-center">
        <Link to="/" className="text-[12.5px] text-muted hover:text-ink transition-colors">
          ← Volver al portal público
        </Link>
      </footer>
    </div>
  )
}
