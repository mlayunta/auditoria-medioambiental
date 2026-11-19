# ESG 360 · Auditoría Ambiental y ESG

**Autoría y desarrollo: Miguel Ángel Layunta López**

PWA profesional para auditar industrias, constructoras y empresas de servicios, combinando
trabajo de campo sin fricciones con inteligencia normativa y trazabilidad total de los datos ESG.

## Áreas funcionales

1. **Trabajo de campo ágil e inteligente** — modo offline real con sincronización automática,
   captura multimodal (cámara, voz transcrita, QR, GPS con marca de tiempo) y checklists
   dinámicos y condicionales.
2. **Cumplimiento normativo automatizado** — repositorio legal integrado (UE, España, ISO, UNE)
   vinculado a cada punto de inspección y alertas de vencimientos.
3. **Gestión de hallazgos y CAPA** — flujos de cierre con evidencia obligatoria y matriz de
   riesgos UNE 150008.
4. **Analítica, IA y métricas ESG** — informes PDF/Excel, asistente de redacción, detección de
   patrones y cálculo de huella de carbono.
5. **Integración y arquitectura abierta** — API REST, conectores ERP/EHS/IoT, roles y registro
   histórico inalterable con hash encadenado SHA-256.

## Instalación local

No requiere build. Sirve la carpeta con cualquier servidor estático:

    python3 -m http.server 8080

Abre `http://localhost:8080`. El Service Worker requiere `https` o `localhost`.

## Publicación en GitHub Pages

1. Crea un repositorio público, por ejemplo `esg360`.
2. Sube todos los archivos a la rama `main`.
3. Ve a **Settings → Pages** y selecciona *Deploy from a branch* → `main` / `/ (root)`.
4. La app quedará en `https://TU-USUARIO.github.io/esg360/`.
5. Abre la URL en el móvil y usa "Añadir a pantalla de inicio" para instalarla.

## Notas de rigor

- El repositorio normativo es una **semilla editable**: verifica los enlaces oficiales antes de
  usarlos en un expediente y corrígelos desde la propia app (botón ✎ en la vista Normativa).
- Los factores de emisión son valores por defecto orientativos. Sustitúyelos por los de tu
  fuente oficial (MITECO, IDAE, DEFRA o la que corresponda) desde **Ajustes**.
- Los datos se almacenan en el dispositivo (localStorage + IndexedDB). No se transmite nada a
  terceros salvo que configures un endpoint de API.

## Licencia

MIT © 2026 Miguel Ángel Layunta López
