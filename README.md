# anima-pipeline-demo

Un solo script, sin LLM, sin credenciales, sin red después del `npm install`:
demuestra que los tres paquetes de ANIMA encastran en un pipeline real de
punta a punta, y que el resultado es reproducible byte a byte por cualquiera.

    core (trayectoria psicodinámica) → trace (verificación) → eval (auditoría de texto)

## Correr esto (< 30 segundos, sin configuración)

    npm install
    node demo.js paranoia demo-2026-07-09

Medido en un entorno limpio: **~0.7s** instalación + corrida incluidas
(3 paquetes, sin dependencias pesadas). Con una conexión típica, contá
unos pocos segundos por la descarga — igual muy por debajo de 30s.

Sin argumentos usa `paranoia` / `demo-2026-07-09` por defecto. Los 7
arquetipos disponibles:

    node demo.js histeria demo-2026-07-09
    node demo.js obsesion demo-2026-07-09
    node demo.js fobia demo-2026-07-09
    node demo.js melancolia demo-2026-07-09
    node demo.js esquizofrenia demo-2026-07-09
    node demo.js perversion demo-2026-07-09

## Qué hace, paso a paso

1. **`anima-core`** genera una trayectoria psicodinámica de 8 turnos a
   partir de un arquetipo + seed + secuencia de señales fija.
2. **`anima-trace`** graba esa corrida con hashes de integridad, y la
   re-ejecuta desde cero para confirmar que reproduce exactamente la misma
   trayectoria (byte a byte) — la prueba de que no hay estado oculto ni
   azar sin sembrar.
3. **`render.js`** traduce el vector de estado a texto mediante un banco
   de templates fijo (ver advertencia abajo — esto NO es la capa de
   lenguaje real de ANIMA).
4. **`anima-eval`** audita ese texto **a ciegas** — no ve el arquetipo real,
   solo el texto renderizado — y reporta su propia lectura léxica de la
   estructura dominante.
5. El script compara la lectura de eval contra el arquetipo real de core,
   guarda la traza en `output/`, y te da el comando exacto para
   verificarla vos mismo con el CLI publicado (`npx anima-verify`).

## ⚠️ Qué NO prueba esto

- **`render.js` es un placeholder, no la Capa 4 real.** ANIMA todavía no
  tiene una capa de acoplamiento LLM implementada (ver notas de
  arquitectura del proyecto). El renderizador acá es un banco fijo de
  frases por arquetipo, elegido a propósito para activar el léxico de
  `eval` — es una pieza de ingeniería para que el pipeline sea
  demostrable hoy, no evidencia de que ANIMA genere diálogo clínico
  realista.
- **Los dos "ρ" (rho) que ves en la salida no son la misma magnitud.**
  El de `core` es rigidez de defensa fantasmática, calculado por las
  ecuaciones del motor. El de `eval` es polaridad epistémica léxica,
  calculada sobre el texto renderizado. Comparten nombre por herencia
  conceptual, no por método — no se deben tratar como la misma medición.
- **El acuerdo core↔eval no es validación clínica.** Es un chequeo de
  consistencia interna entre dos capas construidas por separado. La
  evidencia empírica real sigue siendo el estudio ciego con los 5
  psicólogos (pendiente).

## Hallazgo honesto: cobertura de ejes

`eval` tiene 4 ejes estructurales (paranoid / melancholic / obsessive /
hysteric). `core` tiene 7 arquetipos clínicos. Corriendo los 7:

| archetype (core) | dominant_structure (eval, a ciegas) | acuerdo |
|---|---|---|
| paranoia | paranoid | ✓ |
| histeria | hysteric | ✓ |
| obsesion | obsessive | ✓ |
| melancolia | melancholic | ✓ |
| esquizofrenia | paranoid | ✓ (mapeo esperado) |
| fobia | paranoid | — sin eje propio; el léxico de evitación fóbica se lee como paranoide por solaparse en negación/certeza |
| perversion | *(ninguno)* | — sin eje propio; correctamente no reclama estructura |

5 de 5 arquetipos con eje mapeado coinciden. `fobia` y `perversion` no
tienen eje en `eval` — eso no es un fallo del pipeline, es una brecha de
cobertura real y documentada del lexicón de 4 ejes frente a las 7
estructuras clínicas de `core`.

## Verificación independiente

La traza queda en `output/run-<archetype>-<seed>.json`. Cualquiera puede
confirmarla sin este repo, con el CLI publicado:

    npx anima-verify output/run-paranoia-demo-2026-07-09.json

Y para ver la propiedad de seguridad en acción (detección de manipulación),
alterá cualquier valor de `trajectory` en el JSON guardado y volvé a correr
el comando — reporta divergencia exacta por turno.

## Archivos

    demo.js     — el pipeline (core → trace → eval), punto de entrada
    render.js   — banco de templates determinístico (placeholder de Capa 4)
    output/     — trazas generadas, se crea al correr demo.js
