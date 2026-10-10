# Varcun

Sitio en español con React, TypeScript, Tailwind CSS 4 y Vite. El servidor Node/Express recibe cotizaciones y las registra en Supabase autoalojado. Imágenes, categorías y fichas provienen del catálogo PDF 2026 existente. Se conserva el símbolo SVG y la paleta de la página original.

## Desarrollo

Requiere Node 24 y pnpm 11.25.0.

```sh
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm start
```

`pnpm dev` sirve el frontend en el puerto 5173 y reenvía `/api` al servidor en 3000. Para probar el formulario inicia también `node --env-file=.env dist-server/index.js` después de construir. Sin configuración de Supabase el endpoint responde 503 y nunca simula una solicitud recibida.

Los componentes reutilizables viven en `src/components/ui`, siguiendo la estructura de shadcn. `components.json` y el alias `@/` apuntan a esa carpeta y a `src/lib/utils`; los estilos globales están en `src/styles.css`. Esto permite integrar componentes con las rutas de importación esperadas sin mover los estilos del sitio.

Los fondos azules comparten `BrandBackdrop`, basado en `WarpGradient` con la paleta de Varcun: hero, barra superior, Nosotros, bloque del catálogo, footer y recuadro de Tampografía. Su prop `paused` comparte el control de animaciones de la página; respeta movimiento reducido y cada shader se suspende fuera de pantalla o en pestañas inactivas. Limita la resolución del canvas y usa un degradado CSS si WebGL2 no está disponible.

## Navegación

El inicio es una presentación breve. El contenido se organiza en cinco páginas con enlaces reales: `/`, `/catalogo` (categorías, destacados y PDF), `/personalizacion` (técnicas y proceso), `/nosotros` y `/cotizar` (formulario y preguntas frecuentes). El servidor y Vite sirven el frontend al abrir o recargar una ruta directamente.

La navegación usa el historial del navegador, señala la página activa y mueve el foco al encabezado de cada vista. La selección, filtros y borrador del formulario se conservan al cambiar de página dentro de la sesión; una recarga comienza una sesión nueva. Los antiguos enlaces con `#catalogo`, `#servicios`, `#nosotros`, `#contacto`, `#destacados` y `#proceso` llevan a su página correspondiente.

## Supabase

Aplica `supabase/migrations/20261008_varcun_quotes.sql` a la instancia elegida. La migración añade solamente `public.varcun_quote_requests` y el rol sin login `varcun_quote_writer`. RLS impide acceso público a las solicitudes. El rol de la web tiene exclusivamente INSERT; no puede leer, actualizar ni borrar solicitudes ni acceder a tablas de otras aplicaciones. Genera un JWT de ese rol en el servidor y configúralo como `SUPABASE_WRITE_KEY` en Coolify. Configura también `SUPABASE_ANON_KEY` para pasar la autenticación del gateway Kong; el JWT de escritura viaja en Authorization. No uses una clave con prefijo `VITE_`.

Las solicitudes guardan nombre, correo, teléfono opcional, empresa opcional, categoría, cantidad, mensaje, productos y consentimiento. El formulario no envía correos ni mensajes WhatsApp. Las cotizaciones registradas se consultan en Supabase con una cuenta administrativa. El UUID de cada solicitud evita duplicados al reintentar después de un fallo de conexión.

## Coolify

Repositorio: `https://github.com/FroDev-CR/Varcun.git`, rama `main`. Crear un proyecto y una aplicación independientes con build pack Dockerfile, `/Dockerfile`, puerto 3000 y healthcheck `/api/health`. Configurar las variables runtime de `.env.example` en Coolify. `SUPABASE_URL` debe ser la dirección interna del servicio Kong en la red Docker existente. El contenedor usa un usuario sin privilegios, CSP y limitación de solicitudes.

La ruta pública se define en la aplicación de Coolify. `ALLOWED_ORIGINS` debe incluir el origen exacto de la web. Activar `PUBLIC_HTTPS=true` únicamente al publicar con HTTPS. No se incluyen contraseñas ni claves en el repositorio.

Con un proxy HTTPS, el servidor aplica HSTS y la actualización de recursos a HTTPS solo a solicitudes seguras, según `X-Forwarded-Proto`. El acceso HTTP de la LAN continúa funcionando.

La publicación temporal usa un Cloudflare Quick Tunnel exclusivo del backend Varcun, gestionado por el servicio `varcun-public-tunnel.service`; Coolify conserva el despliegue de la aplicación. El túnel asigna la URL `trycloudflare.com`, que puede cambiar al reiniciarse. Tras un reinicio, hay que consultar su nueva URL y actualizar el origen exacto en `ALLOWED_ORIGINS` antes de usar el formulario. No requiere una cuenta ni un dominio propio. El servicio tiene reinicio automático y arranca con el servidor.

## Contenido y diseño

- 13 categorías reales; las fichas enlazan a las páginas correspondientes del PDF de 81 páginas.
- El catálogo principal es `public/catalogo-varcun-2026.pdf`, rediseñado con la identidad Varcun: 81 páginas, 126 fichas y 110 códigos únicos. La ruta anterior redirige al catálogo nuevo.
- Las ocho imágenes principales de categorías se recrearon con fondos navy/aqua y el logo aplicado a los productos; sus archivos terminan en `-varcun.webp`. Se usan también en los diálogos y en Nosotros.
- Selección de productos para cotización, filtros y búsqueda de categorías, diálogos accesibles, preguntas frecuentes y formulario validado.
- Diseño responsive, navegación por teclado, foco visible, `prefers-reduced-motion` y control para pausar animaciones.
- Las técnicas de las fichas no implican plazos, stock, precios ni producción interna garantizados.
- El sitio no publica teléfono, correo, dirección ni horarios de muestra presentes en el HTML original.
- `varcun-con-background-asmr.html` se conserva como referencia original.

No se ha recibido un archivo de logo separado; se conserva exactamente el símbolo SVG de la web original.
