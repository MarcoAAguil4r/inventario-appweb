'use client';

import { useRef, useState } from 'react';
import { submitLead } from '@/app/actions/submitLead';

export default function CtaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const action = async (formData: FormData) => {
    setStatus('loading');
    
    const result = await submitLead(formData);

    if (result?.error) {
      setStatus('error');
      setMessage(result.error);
    } else if (result?.success) {
      setStatus('success');
      setMessage('¡Gracias! Nos pondremos en contacto pronto.');
      formRef.current?.reset();
    }
  };

  return (
    <section id="contacto" className="relative w-full bg-slate-100 py-32">
      <div id="demo" className="absolute -top-24" />
      <div className="pointer-events-none absolute left-0 top-10 hidden h-44 w-44 rounded-full bg-sky-100/60 blur-3xl md:block" />
      <div className="mx-auto relative flex max-w-7xl flex-col items-center px-6 sm:px-8 lg:px-12">
        
        <div className="max-w-3xl text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-slate-500">Reserva tu lugar</p>
          <h2 className="mb-4 text-3xl font-bold text-slate-950 sm:text-4xl leading-tight">
            Empieza a optimizar tu tiempo hoy.
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-slate-600">
            Déjanos tus datos y un asesor te acompañará para activar tu demo sin compromiso.
          </p>
        </div>

        <form 
          ref={formRef} 
          action={action} 
          className="w-full max-w-xl flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-900/5"
        >
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="negocio" className="text-sm font-semibold text-slate-700">
              Nombre del negocio
            </label>
            <input 
              type="text" 
              id="negocio"
              name="negocio"
              required
              placeholder="Ej. Abarrotes San Juan" 
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-4 outline-none transition-colors focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10" 
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>
            <input 
              type="email" 
              id="email"
              name="email"
              required
              placeholder="contacto@miempresa.com" 
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 outline-none transition-colors focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10" 
            />
          </div>

          {status === 'error' && <p className="text-sm font-medium text-red-500">{message}</p>}
          {status === 'success' && <p className="text-sm font-medium text-emerald-600">{message}</p>}

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="mt-4 w-full rounded-full bg-slate-950 py-4 text-base font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {status === 'loading' ? 'Enviando...' : 'Agendar Demostración'}
          </button>
        </form>
      </div>
    </section>
  );
}