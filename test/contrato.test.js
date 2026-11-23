"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { CampoMinado } = require("../src/campo");
const minas = Array.from({ length: 40 }, (_, i) => [
  Math.floor(i / 18),
  i % 18,
]);
const possui = (l, c) => minas.some(([a, b]) => a === l && b === c);
function jogo() {
  return new CampoMinado({ minas });
}
function rng(seed) {
  return () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
}
for (const valor of [-1, 1, NaN, Infinity, "0", null])
  test(`sorteio rejeita rng inválido: ${String(valor)}`, () => {
    const j = new CampoMinado({ rng: () => valor });
    assert.throws(() => j.revelar(0, 0), RangeError);
    assert.equal(j.minas, null);
  });
test("contrato: 14 linhas por 18 colunas, 40 minas e visão inteiramente oculta", () => {
  const j = jogo();
  assert.equal(j.linhas, 14);
  assert.equal(j.colunas, 18);
  assert.equal(j.totalMinas, 40);
  const v = j.visao();
  assert.equal(v.length, 14);
  assert.ok(v.every((l) => l.length === 18 && l.every((x) => x === "#")));
  assert.equal(j.estado, "jogando");
  assert.equal(j.reveladas, 0);
});
test("contagem em todas as posições considera até oito vizinhos e exclui a própria casa", () => {
  const j = jogo();
  for (let l = 0; l < 14; l++)
    for (let c = 0; c < 18; c++) {
      const esperado = minas.filter(
        ([a, b]) =>
          Math.abs(a - l) <= 1 && Math.abs(b - c) <= 1 && (a !== l || b !== c),
      ).length;
      assert.equal(j.contar(l, c), esperado, `posição ${l},${c}`);
    }
});
for (const [l, c] of [
  [0, 0],
  [0, 17],
  [13, 0],
  [13, 17],
  [0, 9],
  [7, 0],
  [13, 9],
  [7, 17],
  [7, 8],
])
  test(`primeira abertura segura em (${l},${c}) e nas vizinhas`, () => {
    const j = new CampoMinado({ rng: rng(37) });
    j.revelar(l, c);
    assert.equal(j.estado === "derrota", false);
    assert.equal(j.minas.size, 40);
    assert.equal(j.contar(l, c), 0);
    for (let a = Math.max(0, l - 1); a <= Math.min(13, l + 1); a++)
      for (let b = Math.max(0, c - 1); b <= Math.min(17, c + 1); b++)
        assert.equal(j.minas.has(`${a},${b}`), false);
  });
test("mesma fonte aleatória produz mesmo campo e 40 posições únicas", () => {
  const a = new CampoMinado({ rng: rng(123) }),
    b = new CampoMinado({ rng: rng(123) });
  a.revelar(7, 7);
  b.revelar(7, 7);
  assert.deepEqual([...a.minas].sort(), [...b.minas].sort());
  assert.equal(a.minas.size, 40);
});
test("todo primeiro clique do tabuleiro é seguro e tem zero minas vizinhas", () => {
  for (let l = 0; l < 14; l++)
    for (let c = 0; c < 18; c++) {
      const j = new CampoMinado({ rng: rng(19) });
      j.revelar(l, c);
      assert.notEqual(j.estado, "derrota", `${l},${c}`);
      assert.equal(j.contar(l, c), 0, `${l},${c}`);
      assert.equal(j.minas.size, 40);
    }
});
for (const [l, c] of [
  [-1, 0],
  [14, 0],
  [0, -1],
  [0, 18],
  [0.1, 0],
  [0, NaN],
  ["0", 0],
  [null, 0],
]) {
  test(`coordenada inválida (${l},${c}) é rejeitada pelas operações`, () => {
    const j = jogo();
    for (const metodo of ["revelar", "bandeira", "contar"])
      assert.throws(() => j[metodo](l, c), RangeError);
    assert.equal(j.estado, "jogando");
    assert.equal(j.reveladas, 0);
  });
}
test("alternar bandeira impede abertura, não gera minas e retorna estado novo", () => {
  const j = new CampoMinado();
  assert.equal(j.bandeira(0, 0), true);
  assert.equal(j.visao()[0][0], "F");
  assert.equal(j.revelar(0, 0), 0);
  assert.equal(j.minas, null);
  assert.equal(j.bandeira(0, 0), false);
  assert.equal(j.visao()[0][0], "#");
});
test("marcar as quarenta minas não determina vitória", () => {
  const j = jogo();
  for (const p of minas) j.bandeira(...p);
  assert.equal(j.estado, "jogando");
  assert.equal(j.reveladas, 0);
});
test("uma simulação independente de cascata coincide com visão e quantidade revelada", () => {
  for (let seed = 1; seed <= 12; seed++) {
    const aleatorio = rng(seed),
      livres = Array.from({ length: 252 }, (_, i) => i);
    for (let i = livres.length - 1; i > 0; i--) {
      const k = Math.floor(aleatorio() * (i + 1));
      [livres[i], livres[k]] = [livres[k], livres[i]];
    }
    const bomba = new Set(livres.slice(0, 40));
    const coordenadas = [...bomba].map((i) => [Math.floor(i / 18), i % 18]);
    const j = new CampoMinado({ minas: coordenadas });
    const inicio = livres.find((i) => !bomba.has(i));
    const pendentes = [inicio],
      abertas = new Set();
    const vizinhos = (i) => {
      const l = Math.floor(i / 18),
        c = i % 18,
        v = [];
      for (let a = l - 1; a <= l + 1; a++)
        for (let b = c - 1; b <= c + 1; b++)
          if (a >= 0 && a < 14 && b >= 0 && b < 18 && (a !== l || b !== c))
            v.push(a * 18 + b);
      return v;
    };
    const contar = (i) => vizinhos(i).filter((v) => bomba.has(v)).length;
    while (pendentes.length) {
      const i = pendentes.pop();
      if (abertas.has(i) || bomba.has(i)) continue;
      abertas.add(i);
      if (contar(i) === 0) pendentes.push(...vizinhos(i));
    }
    assert.equal(j.revelar(Math.floor(inicio / 18), inicio % 18), abertas.size);
    const visao = j.visao();
    for (let i = 0; i < 252; i++)
      assert.equal(
        visao[Math.floor(i / 18)][i % 18],
        abertas.has(i) ? String(contar(i)) : "#",
      );
  }
});
test("abrir um número revela apenas essa célula e repetição não altera contagem", () => {
  const j = jogo();
  assert.equal(j.contar(2, 4), 4);
  assert.equal(j.revelar(2, 4), 1);
  assert.equal(j.visao()[2][4], "4");
  assert.equal(j.reveladas, 1);
  assert.equal(j.revelar(2, 4), 0);
  assert.equal(j.reveladas, 1);
  assert.equal(j.bandeira(2, 4), false);
});
test("explosão mostra minas sem remover bandeiras e bloqueia alterações", () => {
  const j = jogo();
  j.bandeira(0, 1);
  assert.equal(j.revelar(0, 0), 1);
  assert.equal(j.estado, "derrota");
  assert.equal(j.visao()[0][0], "*");
  assert.equal(j.visao()[0][1], "F");
  assert.equal(j.visao()[0][2], "*");
  assert.throws(() => j.revelar(10, 10));
  assert.throws(() => j.bandeira(10, 10));
});
test("vitória exige abrir todas as 212 casas seguras, sem exigir bandeiras", () => {
  const j = jogo();
  const seguras = [];
  for (let l = 0; l < 14; l++)
    for (let c = 0; c < 18; c++) if (!possui(l, c)) seguras.push([l, c]);
  // Bandeiras impedem a cascata: mantêm uma última casa segura fechada.
  const ultima = seguras.at(-1);
  j.bandeira(...ultima);
  for (const p of seguras.slice(0, -1)) j.revelar(...p);
  assert.equal(j.estado, "jogando");
  assert.equal(j.reveladas, 211);
  j.bandeira(...ultima);
  j.revelar(...ultima);
  assert.equal(j.estado, "vitoria");
  assert.equal(j.reveladas, 212);
  assert.throws(() => j.revelar(0, 0));
  assert.throws(() => j.bandeira(0, 0));
});
test("visão retornada é cópia e não permite alterar o jogo", () => {
  const j = jogo(),
    v = j.visao();
  v[0][0] = "*";
  assert.equal(j.visao()[0][0], "#");
});
for (const [nome, lista] of [
  ["menos de 40", minas.slice(1)],
  ["mais de 40", [...minas, [13, 17]]],
  ["duplicadas", [...minas.slice(0, 39), minas[0]]],
  ["fora do tabuleiro", [...minas.slice(0, 39), [14, 0]]],
])
  test(`construção rejeita minas ${nome}`, () =>
    assert.throws(() => new CampoMinado({ minas: lista })));
