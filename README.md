# 🌿 ESG 360 — Auditoría Ambiental

Aplicación web progresiva (PWA) para la gestión integral de auditorías ambientales: planificación de inspecciones, registro de hallazgos con planes de acción correctivos (CAPA), evaluación de riesgos según la norma **UNE 150008**, cálculo de huella de carbono por alcances y trazabilidad verificable mediante cadena de hashes SHA-256.

Funciona **sin conexión** una vez instalada y guarda todos los datos localmente en el navegador.

---

## ✨ Características

- **Panel de control** con indicadores clave y gráficas interactivas.
- **Inspecciones** planificadas, en curso y cerradas, con checklist por requisitos.
- **Hallazgos y CAPA**: cierre con evidencia obligatoria y priorización automática según UNE 150008.
- **Matriz de riesgo** con probabilidad, severidad y nivel de significancia.
- **Huella de carbono** por alcances (1, 2 y 3).
- **Trazabilidad SHA-256**: cada registro se encadena al anterior, de modo que cualquier alteración resulta detectable.
- **Exportación a CSV** para su tratamiento en Excel.
- **Modo offline** e instalación como aplicación de escritorio o móvil.
- **Roles y sesión** (auditor externo, auditor interno, administrador).

---

## 🧱 Tecnologías

- HTML5, CSS3 y JavaScript moderno (vanilla, sin frameworks).
- [Chart.js](https://www.chartjs.org/) para las gráficas.
- Web Crypto API para el cálculo de hashes SHA-256.
- Service Worker + Web App Manifest para el comportamiento PWA.
- `localStorage` como almacén de datos local.

---

## 📁 Estructura del proyecto

```
auditoria-medioambiental/
├── index.html              # Estructura de la aplicación
├── app.js                  # Lógica, vistas y estado
├── data.js                 # Datos semilla y catálogos
├── styles.css              # Estilos
├── manifest.webmanifest    # Manifiesto PWA
├── sw.js                   # Service Worker (caché offline)
├── generate-icons.html     # Utilidad para generar los iconos PNG
└── icons/
    ├── icon.svg
    ├── icon-192.png
    └── icon-512.png
```

---

## 🚀 Puesta en marcha en local

No abras `index.html` haciendo doble clic: el manifiesto y el Service Worker necesitan un servidor HTTP.

Desde la carpeta del proyecto:

```bash
python -m http.server 8080
```

O, si usas Node:

```bash
npx serve .
```

Después abre:

```
http://localhost:8080/
```

---

## 🌐 Despliegue en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. Ve a **Settings → Pages**.
3. En *Source*, selecciona la rama `main` y la carpeta `/ (root)`.
4. Guarda y espera un minuto.

La app quedará publicada en:

```
https://<tu-usuario>.github.io/<nombre-del-repositorio>/
```

---

## 📲 Instalación como PWA

Con la app abierta en Chrome o Edge, pulsa el botón **Instalar** de la barra de direcciones. También puedes instalarla desde el menú del navegador (*Instalar aplicación*).

En móvil, usa *Añadir a pantalla de inicio*.

---

## 🔄 Actualizar la versión de caché

Cada vez que modifiques `index.html`, `app.js`, `styles.css` o `data.js`, sube el número de versión en `sw.js`:

```js
const CACHE = 'esg360-v2';   // antes: esg360-v1
```

Si no lo haces, los usuarios seguirán viendo la versión antigua hasta que el navegador decida actualizarla.

---

## 💾 Almacenamiento de datos

Todos los datos se guardan en el navegador (`localStorage`). Esto implica que:

- Son **privados**: no salen de tu equipo.
- Son **locales**: si borras los datos del navegador, se pierden.
- Conviene **exportar a CSV** periódicamente como copia de seguridad.

---

## 🎨 Generar los iconos

Abre `generate-icons.html` en el navegador. La página dibuja las vistas previas de 192 y 512 píxeles y permite descargarlas como PNG. Colócalas en la carpeta `icons/`.

---

## 📄 Licencia

MIT — consulta el archivo `LICENSE` para más detalles.

---

Hecho con 🌿 por [Miguel Ángel](https://github.com/mlayunta).
