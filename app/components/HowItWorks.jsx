export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Agrega productos',
      description: 'Registra todos tus productos con nombre, precio y cantidad inicial',
      icon: '➕'
    },
    {
      number: '2',
      title: 'Controla entradas y salidas',
      description: 'Registra compras, ventas y ajustes de inventario en tiempo real',
      icon: '↔️'
    },
    {
      number: '3',
      title: 'Analiza reportes',
      description: 'Obtén reportes detallados y gráficos de tu inventario automáticamente',
      icon: '📊'
    }
  ];

  return (
    <section id="como-funciona" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
          ¿Cómo funciona?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Circle con número */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {step.icon}
                </div>
              </div>

              {/* Contenido */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>

              {/* Línea conectora */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-0 w-16 h-1 bg-blue-200 transform translate-x-1/2 -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Final */}
        <div className="mt-16 text-center">
          <p className="text-xl text-gray-600 mb-6">
            Comienza a controlar tu inventario hoy mismo
          </p>
          <button className="px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg">
            Prueba Gratis - Sin tarjeta de crédito
          </button>
        </div>
      </div>
    </section>
  );
}
