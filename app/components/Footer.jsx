import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.9fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
                📦
              </div>
              <div>
                <p className="text-lg font-semibold">Inventario</p>
                <p className="text-sm text-slate-400">Control inteligente para tu negocio</p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-7 text-slate-400">
              Lleva tu gestión de inventario con claridad, reportes automáticos y acceso rápido desde cualquier dispositivo.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Enlaces</p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <Link href="/" className="transition hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/solucion" className="transition hover:text-white">
                  Solución
                </Link>
              </li>
              <li>
                <Link href="#demo" className="transition hover:text-white">
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Contacto</p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>hola@inventario.com</li>
              <li>+52 55 1234 5678</li>
              <li>Monterrey, México</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          © {currentYear} Inventario SaaS. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
