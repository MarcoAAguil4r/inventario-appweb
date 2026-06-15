import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 border border-zinc-800 shadow-lg">
        <svg className="w-12 h-12 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12v9" />
        </svg>
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-50 mb-4 tracking-tight">
        Almacén <span className="text-sky-500">Vacío</span>
      </h1>
      <p className="text-lg text-zinc-400 mb-10 max-w-md">
        Error 404. La página que estás buscando no existe, fue movida o está fuera de servicio.
      </p>
      <Link href="/" className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-full transition-colors duration-300 shadow-lg shadow-sky-500/25">
        Regresar al inicio
      </Link>
    </main>
  );
}