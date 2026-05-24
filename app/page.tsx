import Navbar from './components/Navbar';
import Hero from './components/Hero';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-6">
        <Hero />
      </main>
    </div>
  );
}
