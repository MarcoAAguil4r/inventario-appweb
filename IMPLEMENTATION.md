# 🏢 Inventario SaaS - Landing Page

Una moderna landing page para un SaaS de control de inventario. Construida con **Next.js 16**, **React 19** y **Tailwind CSS**.

## 🚀 Características

✅ **Navbar responsive** - Navegación superior con menú mobile  
✅ **Hero section** - Sección principal con propuesta de valor  
✅ **Dashboard preview** - Visualización de métricas clave  
✅ **Sección "Cómo funciona"** - Explicación de 3 pasos  
✅ **Footer completo** - Enlaces, redes sociales y copyright  
✅ **Diseño minimalista** - Interfaz limpia y profesional  
✅ **SEO optimizado** - Meta tags y open graph  

## 📁 Estructura del Proyecto

```
inventario-appweb/
├── app/
│   ├── components/
│   │   ├── Navbar.jsx          # Navegación responsiva
│   │   ├── Hero.jsx            # Sección principal
│   │   ├── HowItWorks.jsx       # Sección de pasos
│   │   └── Footer.jsx          # Pie de página
│   ├── globals.css             # Estilos globales
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Página de inicio
├── public/                      # Archivos estáticos
├── package.json
├── tailwind.config.mjs
├── tsconfig.json
└── next.config.ts
```

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

3. **Abrir en el navegador:**
```
http://localhost:3000
```

## 🎨 Paleta de Colores

- **Primario:** Azul `#2563EB` (blue-600)
- **Fondo:** Blanco `#FFFFFF`
- **Texto:** Gris oscuro `#111827` (gray-900)
- **Bordes:** Gris claro `#E5E7EB` (gray-200)

## 📱 Responsividad

La landing page es completamente responsive:
- ✅ Mobile (< 640px)
- ✅ Tablet (640px - 1024px)
- ✅ Desktop (> 1024px)

El navbar se adapta automáticamente con un menú hamburguesa en mobile.

## 🔧 Componentes

### Navbar
- Logo/Marca
- Navegación principal (Inicio, Solución, Demo)
- Botón "Entrar"
- Menú hamburguesa responsivo

### Hero
- Título principal persuasivo
- Descripción del problema
- Dos botones CTA (Prueba Gratis, Ver Demo)
- 3 características destacadas
- Dashboard preview interactivo

### HowItWorks
- 3 pasos claros y visuales
- Iconos emoji por cada paso
- CTA final

### Footer
- Logo y descripción
- Enlaces de producto
- Redes sociales
- Links legales
- Copyright

## 📦 Dependencias Principales

- `next@16.2.6` - Framework React
- `react@19.2.4` - Librería de UI
- `tailwindcss@4` - Framework de CSS
- `typescript@5` - Tipado estático

## 🚀 Build y Deploy

Para producción:
```bash
npm run build
npm start
```

Listo para deployar en **Vercel**, **Netlify** o cualquier servidor Node.js.

## 📝 Notas de Desarrollo

- Todos los componentes utilizan estilos de Tailwind CSS
- Responsive design mobile-first
- Componentes funcionales con React Hooks
- TypeScript configurado para type safety

## 🤝 Contacto

Para dudas o sugerencias sobre la landing page, revisa la sección de contacto en el footer.

---

**© 2026 Inventario SaaS** - Todos los derechos reservados.
