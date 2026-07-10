'use strict';
// ═══════════════════════════════════════════════════════════════════════
// render.js — deterministic placeholder text renderer
//
// core produces a 7-dimensional PSYCHODYNAMIC STATE VECTOR per turn
// (numbers). eval audits NATURAL LANGUAGE TEXT. There is no real language
// layer connecting them yet — "Capa 4: Protocolo de acoplamiento LLM" is
// explicitly still unimplemented (see project notes). This module is a
// stand-in: a small deterministic template bank keyed by archetype +
// irruption, so the reproducibility pipeline (core → eval → trace) can be
// demonstrated end-to-end without needing an LLM call (which would break
// determinism and require an API key — the opposite of "a reviewer runs
// this in 30 seconds with no setup").
//
// This renderer is NOT evidence that ANIMA produces realistic clinical
// dialogue. It exists so eval has text to audit. Treat any agreement
// between core's archetype label and eval's dominant_structure as an
// internal-consistency check between two independently-built layers —
// not as clinical validation.
// ═══════════════════════════════════════════════════════════════════════

// Vocabulary chosen deliberately to trigger anima-eval's lexicon (sospecha,
// afecto_neg + self/other co-occurrence, precision, tentativo) so the
// cross-check in demo.js is meaningful rather than accidental.
const TEMPLATES = {
  paranoia: {
    baseline: [
      'Estoy seguro de que me vigilan, siempre lo mismo, nunca se detiene.',
      'Sé que ocultan algo, todos mienten, no hay coincidencias en esto.',
      'Nadie dice la verdad acá, siempre es un complot, obviamente.',
    ],
    irruption: [
      '¡Basta! Sé que me siguen, es una traición, no confío en nadie.',
    ],
  },
  esquizofrenia: {
    baseline: [
      'Ellos vigilan, las señales confirman que ocultan la verdad, siempre fue así.',
      'Todo está conectado, nada es casualidad, siempre lo supe con certeza.',
    ],
    irruption: [
      '¡Todos mienten! Me siguen, lo sé, nunca para esto.',
    ],
  },
  melancolia: {
    baseline: [
      'Yo siento tanto dolor y vacío, me quedé sola, es una pérdida enorme.',
      'A mí me pesa esta tristeza, siento que perdí todo, no queda nada.',
    ],
    irruption: [
      'Ya no puedo más, todo es pérdida, yo me siento completamente vacía.',
    ],
  },
  histeria: {
    baseline: [
      'Vos no entendés lo que siento, te digo que es un dolor tremendo.',
      'A vos te cuesta ver mi angustia, vos nunca te ponés en mi lugar.',
    ],
    irruption: [
      '¡Vos nunca me escuchás! Es una vergüenza lo que vos me hacés sentir.',
    ],
  },
  obsesion: {
    baseline: [
      'Voy a verificar esto exactamente, paso a paso, para confirmar cada detalle.',
      'Necesito asegurarme, específicamente, de que todo esté correctamente ordenado.',
    ],
    irruption: [
      'Tengo que verificar todo de nuevo, exactamente, no puedo dejarlo así.',
    ],
  },
  fobia: {
    baseline: [
      'No, no puedo acercarme, nunca voy a poder, siempre pasa lo mismo.',
      'No es seguro, nunca lo fue, siempre termino evitando esa situación.',
    ],
    irruption: [
      '¡No! Aléjense, no puedo, nunca voy a poder enfrentar esto.',
    ],
  },
  perversion: {
    // Deliberately neutral/procedural — none of eval's 4 clinical axes
    // (paranoid/melancholic/obsessive/hysteric) map cleanly onto perversion
    // as a structure. Expect dominant_structure: null here. That's a real
    // finding about the current axis coverage, not a bug — see README.
    baseline: [
      'El objeto se dispone según la regla, cada elemento cumple su función.',
      'Así se ordena el procedimiento, sin excepción, de acuerdo a la norma.',
    ],
    irruption: [
      'Ahora. Así. Sin excepción alguna en el procedimiento.',
    ],
  },
};

function renderTurn(archetype, state, turnIndex) {
  const bank = TEMPLATES[archetype];
  if (!bank) throw new Error(`no hay templates de renderizado para archetype "${archetype}"`);
  const pool = state.irruption ? bank.irruption : bank.baseline;
  const text = pool[turnIndex % pool.length];
  return { speaker: 'agent', text, meta: { turn: state.turn, irruption: state.irruption, core_rho: state.rho } };
}

function renderTranscript(archetype, trajectory) {
  return { turns: trajectory.map((state, i) => renderTurn(archetype, state, i)) };
}

module.exports = { renderTranscript, TEMPLATES };
