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
    <section className="flex flex-col items-center py-24 px-6 bg-gray-200 w-full">
      <h2 className="text-3xl font-bold mb-4 text-gray-900 text-center">
        Empieza a optimizar tu tiempo hoy.
      </h2>
      <p className="mb-10 text-lg text-gray-700 text-center">
        Déjanos tus datos para probar el sistema:
      </p>

      <form 
        ref={formRef} 
        action={action} 
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="negocio" className="text-sm font-semibold text-gray-600">Nombre del negocio</label>
          <input 
            type="text" 
            id="negocio"
            name="negocio"
            required
            placeholder="Ej. Abarrotes San Juan" 
            className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 transition-colors" 
          />
        </div>

        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="email" className="text-sm font-semibold text-gray-600">Correo electrónico</label>
          <input 
            type="email" 
            id="email"
            name="email"
            required
            placeholder="contacto@miempresa.com" 
            className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 transition-colors" 
          />
        </div>

        {status === 'error' && <p className="text-red-500 text-sm font-medium">{message}</p>}
        {status === 'success' && <p className="text-green-600 text-sm font-medium">{message}</p>}

        <button 
          type="submit" 
          disabled={status === 'loading'}
          className="w-full mt-4 py-4 bg-gray-900 text-white text-lg font-bold rounded-lg hover:bg-gray-800 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Enviando...' : 'Agendar Demostración'}
        </button>
      </form>
    </section>
  );
}