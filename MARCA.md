# SALOBRE · Guía de marca para contenido (Instagram y TikTok)

## Qué vendemos
- Una sola camiseta: **Dream Bigger**. Blanca, 100 % algodón de 240 g/m², punto liso, corte boxy, cuello redondo y doble costura en cuello y hombros.
- Delante lleva una **rosa de los vientos azul (la estrella)**. Detrás pone «DREAM BIGGER» con una estrella pequeña.
- Se diseña y se imprime en DTF en Palma, bajo pedido. Tallas XS–XXL.
- Tienda: salobree.myshopify.com. El precio es el que marque Shopify; compruébalo siempre antes de escribirlo.

## Mensaje
- La estrella es una rosa de los vientos: marca el rumbo. Dream Bigger: apuntar más alto, ir a por lo tuyo, no perder el norte.
- Lemas de la web: «Sueña en grande. Sigue tu estrella.» y «Una estrella para no perder el norte».
- Público: de 18 a 35 años con objetivos (estudiantes, deportistas, emprendedores, creativos).

## Prohibido
- Playa, calas, mar, sal, verano de playa o «vibes» mediterráneas. Luis es mallorquín y lo ha pedido expresamente. Palma solo aparece como el lugar donde se diseña y se imprime.
- Inventar cifras, opiniones de clientes, envíos, descuentos o escasez falsa («últimas unidades»).
- Usar la imagen de personas famosas o marcas ajenas.
- Música con derechos dentro del vídeo: el MP4 sale sin audio y Luis añade un sonido en tendencia desde la app.

## Estética
- Limpia y premium: fondo crudo #F1EEE8, tinta #141413, azul estrella #2E62B0, blanco.
- Tipografía: Archivo extendida (fuentes/archivo-xw-black.ttf para titulares y ganchos, archivo-xw-semi para frases, archivo-w-med para textos pequeños). Todo en mayúsculas, con aire.
- Movimientos lentos (zoom 1,00 → 1,12), fundidos cortos y una idea por pantalla. Máximo 7 palabras por pantalla en los ganchos.
- Zona segura vertical: nada importante en el 13 % de arriba ni en el 22 % de abajo (ahí van la interfaz y el pie de foto).
- Cierre con el logo principal (logos/SALOBRE-logo-principal-negro.png) y la web.

## Fases
1. **Fase 1 · Marca premium** (del 18 de noviembre al 7 de diciembre de 2026, o hasta tener 15 publicaciones). Objetivo: que el perfil parezca una marca seria. Piezas: reel-película de marca, estrella en detalle, significado de la rosa de los vientos, carruseles tipográficos, la camiseta en producto, el proceso de impresión. Mismo estilo siempre: la cuadrícula del perfil tiene que verse coherente.
2. **Fase 2 · Ganchos para vender** (a partir del 8 de diciembre de 2026). Reels y TikToks de 7-15 s con gancho en el primer segundo, pensados para parar el scroll y llevar a la tienda. Llamada a la acción: «Link en la bio» o «salobree.myshopify.com».

## Banco de ganchos (fase 2, para variar, no copiar tal cual)
- «Si no sabes hacia dónde vas, cualquier camino vale.»
- «Esta estrella lleva siglos marcando el norte.»
- «Llévalo puesto antes de conseguirlo.»
- «POV: decides que este año va en serio.»
- «Una camiseta. Un recordatorio. Dream Bigger.»
- «3 cosas que no sabías de la rosa de los vientos.»
- «¿Qué significa la estrella de esta camiseta?»
- «Hecha a mano en Palma, pedido a pedido.» (proceso de impresión)
- «Regálale a alguien un recordatorio de que puede más.» (Navidad)
- «Propósito 2027: soñar más grande.» (Año nuevo)

## Pilares de contenido
1. La estrella y su significado (rumbo, norte, objetivos).
2. Dream Bigger como actitud: estudiar, entrenar, emprender, crear.
3. Producto en detalle: tejido, costuras, estampado, tallas.
4. Proceso: diseño e impresión DTF en Palma, preparar un pedido.
5. Personas reales con la camiseta (cuando haya fotos o vídeos de Luis y clientes).

## Herramientas del kit
- `herramientas/reel.py guion.json salida.mp4`: reel vertical 1080x1920 (ver ejemplo-reel.json).
- `herramientas/post.py diapositivas.json carpeta/`: carrusel o post 1080x1350 (ver ejemplo-carrusel.json).
- Fotos en `fotos/`, logos en `logos/`, fuentes en `fuentes/`.
- Requiere Python 3 con Pillow y ffmpeg.
