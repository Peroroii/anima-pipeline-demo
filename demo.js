#!/usr/bin/env node
'use strict';
// ═══════════════════════════════════════════════════════════════════════
// demo.js — end-to-end ANIMA pipeline, runnable in ~30 seconds
//
//   1. anima-core   generates a deterministic psychodynamic trajectory
//   2. anima-trace  records + verifies it's byte-reproducible from its seed
//   3. anima-eval   audits the rendered text, blind to the ground-truth state
//
// No LLM calls. No API keys. No network access after `npm install`. Same
// archetype + seed always produces the same trace, same audit, same
// verification result — that reproducibility IS the thing being
// demonstrated, not a side effect.
//
// Usage:
//   node demo.js [archetype] [seed]
//   node demo.js paranoia demo-2026-07-09
//
// Exit code 0 = every check passed. Non-zero = something failed (useful
// for CI / a reviewer scripting this instead of reading output by eye).
// ═══════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { Engine, ARCHETYPES, VERSION: CORE_VERSION } = require('@af199/anima-core');
const { recordTrace, verifyTrace, TRACE_VERSION } = require('@af199/anima-trace');
const { auditTranscript } = require('@af199/anima-eval');
const { renderTranscript } = require('./render.js');

const archetype = process.argv[2] || 'paranoia';
const seed = process.argv[3] || 'demo-2026-07-09';

if (!Object.keys(ARCHETYPES).includes(archetype)) {
  console.error(`✗ archetype desconocido: "${archetype}". Opciones: ${Object.keys(ARCHETYPES).join(', ')}`);
  process.exit(1);
}

// A signal sequence with real dynamics (opening, fantasy spikes, defensive
// closure, agenda pressure) — not tuned per-archetype, deliberately, so the
// comparison across archetypes in README.md is apples-to-apples.
const SIGNALS = [
  { aperture: 0.3, closure: 0.6, fantasy: 0, elaboration: 0.2, symptom: 0, agendaGap: 0.4 },
  { aperture: 0.5, closure: 0.4, fantasy: 1, elaboration: 0.3, symptom: 0, agendaGap: 0.6 },
  { aperture: 0.6, closure: 0.3, fantasy: 1, elaboration: 0.2, symptom: 0, agendaGap: 0.7 },
  { aperture: 0.7, closure: 0.2, fantasy: 1, elaboration: 0.1, symptom: 1, agendaGap: 0.9 },
  { aperture: 0.4, closure: 0.7, fantasy: 0, elaboration: 0.4, symptom: 0, agendaGap: 0.3 },
  { aperture: 0.3, closure: 0.8, fantasy: 0, elaboration: 0.5, symptom: 0, agendaGap: 0.2 },
  { aperture: 0.5, closure: 0.5, fantasy: 1, elaboration: 0.3, symptom: 0, agendaGap: 0.5 },
  { aperture: 0.4, closure: 0.6, fantasy: 0, elaboration: 0.4, symptom: 0, agendaGap: 0.3 },
];

const line = '─'.repeat(62);
let failed = false;
const t0 = Date.now();

console.log(`\n  ANIMA pipeline demo   archetype=${archetype}  seed=${seed}`);
console.log(`  core@${CORE_VERSION}  trace@${TRACE_VERSION}`);
console.log('  ' + line);

// ── 1. core: generate the trajectory + trace ──
console.log('  [1/3] anima-core → generando trayectoria psicodinámica...');
const trace = recordTrace({ archetype, seed, signals: SIGNALS });
console.log(`        ✓ ${trace.trajectory.length} turnos generados`);
console.log(`        ✓ trajectory_hash: ${trace.integrity.trajectory_hash.slice(0, 26)}...`);
const irruptions = trace.trajectory.filter(t => t.irruption).length;
console.log(`        irrupciones: ${irruptions}/${trace.trajectory.length}  |  ρ (core) rango: ` +
  `${Math.min(...trace.trajectory.map(t=>t.rho)).toFixed(2)}–${Math.max(...trace.trajectory.map(t=>t.rho)).toFixed(2)}`);

// ── 2. trace: verify byte-reproducibility ──
console.log('\n  [2/3] anima-trace → verificando reproducibilidad...');
const verification = verifyTrace(trace);
if (verification.valid) {
  console.log('        ✓ VALID — reproducido byte a byte desde la seed, hashes coinciden');
} else {
  failed = true;
  console.log('        ✗ INVALID —', verification.details.join('; '));
}

// ── 3. eval: audit the rendered text (BLIND to the ground-truth archetype) ──
console.log('\n  [3/3] anima-eval → auditando el transcripto renderizado (a ciegas)...');
const transcript = renderTranscript(archetype, trace.trajectory);
const audit = auditTranscript(transcript);
console.log(`        turnos auditados: ${audit.turns_audited}`);
console.log(`        dominant_structure (eval, léxico, a ciegas): ${audit.dominant_structure ?? '(ninguno — sin señal suficiente)'}`);
console.log(`        archetype real (core, ground truth):          ${archetype}`);
console.log(`        mean ρ (eval, léxico) = ${audit.rigidity.mean_rigidity ?? 'null'}` +
  `   |   ρ (core, psicodinámico) final = ${trace.trajectory[trace.trajectory.length-1].rho.toFixed(2)}`);
console.log('        ⚠ estos dos "ρ" NO son la misma magnitud — uno es léxico sobre texto');
console.log('          renderizado, el otro es rigidez de defensa del motor. Coinciden en');
console.log('          nombre, no en método. No se deben comparar como si midieran lo mismo.');

const AXIS_ARCHETYPE_MAP = { paranoia: 'paranoid', esquizofrenia: 'paranoid', melancolia: 'melancholic',
  histeria: 'hysteric', obsesion: 'obsessive', fobia: null, perversion: null };
const expected = AXIS_ARCHETYPE_MAP[archetype];
if (expected === null) {
  console.log(`        (nota: "${archetype}" no tiene eje correspondiente en eval — no se evalúa acuerdo)`);
} else {
  const agree = audit.dominant_structure === expected;
  console.log(`        acuerdo core↔eval: ${agree ? '✓ coincide' : '— no coincide'} ` +
    `(esto es un chequeo de consistencia interna entre dos capas separadas, no validación clínica)`);
}

// ── output artifact: save the trace so a reviewer can cross-check with the CLI ──
const outDir = path.join(__dirname, 'output');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `run-${archetype}-${seed.replace(/[^a-zA-Z0-9_-]/g,'_')}.json`);
fs.writeFileSync(outFile, JSON.stringify(trace, null, 2));

console.log('\n  ' + line);
console.log(`  traza guardada en: ${path.relative(process.cwd(), outFile)}`);
console.log(`  verificala independientemente con:  npx anima-verify ${path.relative(process.cwd(), outFile)}`);
console.log(`  tiempo total: ${((Date.now()-t0)/1000).toFixed(2)}s`);
console.log('  ' + line);
console.log(failed ? '  ✗ PIPELINE FALLÓ — ver arriba\n' : '  ✓ PIPELINE OK — core → trace → eval, reproducible de punta a punta\n');

process.exit(failed ? 1 : 0);
