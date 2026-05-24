export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Contenido izquierdo */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              ¿Pierdes ventas por no controlar tu inventario?
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Controla tu stock en tiempo real, registra entradas y salidas y obtén reportes automáticos sin hojas de cálculo ni registros manuales.
            </p>

            {/* Botones CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg">
                Prueba Gratis
              </button>
              <button className="px-8 py-3 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition">
                Ver Demo
              </button>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <span className="text-gray-700">+230 productos</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <span className="text-gray-700">Reportes automáticos</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <span className="text-gray-700">Alertas de stock bajo</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview - Lado derecho */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
            <div className="space-y-6">
              {/* Stats */}
              <div className="border-b border-gray-200 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Inventario Total</p>
                    <p className="text-3xl font-bold text-blue-600">235</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Productos bajos</p>
                    <p className="text-3xl font-bold text-red-600">12</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Ventas hoy</p>
                <p className="text-3xl font-bold text-green-600">$2,430</p>
              </div>

              {/* Simple Chart */}
              <div className="pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Movimiento de Stock</p>
                <div className="flex items-end gap-2 h-24">
                  <div className="flex-1 bg-blue-400 rounded-t h-12"></div>
                  <div className="flex-1 bg-blue-400 rounded-t h-16"></div>
                  <div className="flex-1 bg-blue-400 rounded-t h-20"></div>
                  <div className="flex-1 bg-blue-400 rounded-t h-14"></div>
                  <div className="flex-1 bg-blue-400 rounded-t h-24"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mié</span>
                  <span>Jue</span>
                  <span>Vie</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
