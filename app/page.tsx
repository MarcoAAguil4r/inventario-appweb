import Navbar from './components/Navbar';
import Hero from './components/Hero'; 
import Solucion from './components/Solucion'; 
import CtaForm from './components/CtaForm';
import Footer from './components/Footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* 1. Navegación (Karla) */}
      <Navbar />

      {/* 2. Problema y Promesa (Arturo) */}
      <Hero />

      {/* 3. Beneficios y Características (Luis) */}
      <Solucion />

      {/* 4. Formulario Funcional (Tú) */}
      <CtaForm />

      {/* 5. Pie de página (Karla) */}
      <Footer />
    </main>
  );
}