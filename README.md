# inventario-appweb

Una moderna landing page profesional para un SaaS de control de inventario. Construida con **Next.js 16**, **React 19** y **Tailwind CSS 4** con un diseño minimalista y completamente responsive.

## Notas de la rama feature/seccion_Hero

- Se implementó la sección Hero: título, descripción, CTA e imagen. Ver `app/components/Hero.tsx`.

# 🏢 Inventario SaaS - Landing Page

Una moderna landing page profesional para un SaaS de control de inventario. Construida con **Next.js 16**, **React 19** y **Tailwind CSS 4** con un diseño minimalista y completamente responsive.

## 📸 Vista General

La landing page incluye:
- ✅ Navbar responsivo con menú hamburguesa
- ✅ Hero section con propuesta de valor
- ✅ Dashboard preview con métricas clave
- ✅ Sección "Cómo funciona" con 3 pasos
- ✅ Footer con enlaces y redes sociales
- ✅ Diseño minimalista y profesional
- ✅ Totalmente optimizado para SEO

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar en desarrollo
```bash
npm run dev
```

Luego abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 3. Build para producción
```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
inventario-appweb/
├── app/
│   ├── components/
│   │   ├── Navbar.jsx              # Navegación responsiva
│   │   ├── Hero.jsx                # Sección principal con CTA
│   │   ├── HowItWorks.jsx           # Pasos del producto
│   │   └── Footer.jsx              # Pie de página
│   ├── globals.css                 # Estilos globales
│   ├── layout.tsx                  # Layout principal
│   └── page.tsx                    # Página de inicio
├── public/                         # Archivos estáticos
├── package.json
├── tailwind.config.mjs
└── tsconfig.json
```

## 🎨 Componentes Principales

### Navbar
- Logo: `📦 Inventario`
- Navegación: Inicio, Solución, Demo
- CTA: Botón "Entrar"
- Menú hamburguesa en mobile

### Hero
- Título principal persuasivo
- 2 botones CTA (Prueba Gratis, Ver Demo)
- 3 características destacadas
- Dashboard preview con métricas

### How It Works
- 3 pasos visuales claros
- Descripción de cada paso
- CTA final

### Footer
- Logo y descripción
- Secciones: Producto, Redes, Legal
- Copyright dinámico

## 📱 Responsividad

100% responsive para:
- Mobile (< 640px)
- Tablet (640-1024px)
- Desktop (> 1024px)

## 🛠️ Tecnologías

- **Next.js** 16.2.6 - Framework React moderno
- **React** 19.2.4 - Librería UI
- **Tailwind CSS** 4 - Framework de CSS utility-first
- **TypeScript** 5 - Tipado estático
- **ESLint** 9 - Linting

## 🚢 Deployment

### Vercel (Recomendado)
```bash
git push
# Automáticamente deploya
```

### Servidor personalizado
```bash
npm run build
npm start
```

## 📚 Documentación

- [DESARROLLO.md](DESARROLLO.md) - Documentación técnica detallada
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Guía de implementación

## 📝 Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build
npm start        # Producción
npm run lint     # Linting
```

---

© 2026 Inventario SaaS - Hecho con Next.js y Tailwind CSS
