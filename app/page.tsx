import CtaForm from './components/CtaForm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 pt-10">
      {/* Aquí estamos montando exclusivamente tu componente para probar su lógica */}
      <CtaForm />
    </main>
  );
}