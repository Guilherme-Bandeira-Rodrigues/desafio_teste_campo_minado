const { test } = require("node:test");
const assert = require("node:assert/strict");
const { CampoMinado } = require("../src/campo");
const minas = Array.from({ length: 40 }, (_, i) => [
  Math.floor(i / 18),
  i % 18,
]);

test("primeiro clique no canto mantém o entorno seguro", () => {
  const jogo = new CampoMinado({ rng: () => 0 });
  jogo.revelar(0, 0);
  for (const p of [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ])
    assert.equal(jogo.minas.has(p.join(",")), false);
  assert.equal(jogo.minas.size, 40);
});
test("não sorteia minas ao tentar abrir uma bandeira", () => {
  const jogo = new CampoMinado();
  jogo.bandeira(0, 0);
  assert.equal(jogo.revelar(0, 0), 0);
  assert.equal(jogo.minas, null);
});
test("célula revelada não pode ser marcada nem contada duas vezes", () => {
  const jogo = new CampoMinado({ minas });
  jogo.revelar(2, 4);
  assert.equal(jogo.bandeira(2, 4), false);
  assert.equal(jogo.revelar(2, 4), 0);
});
test("bandeiras continuam visíveis ao perder", () => {
  const jogo = new CampoMinado({ minas });
  jogo.bandeira(0, 1);
  jogo.revelar(0, 0);
  assert.equal(jogo.visao()[0][0], "*");
  assert.equal(jogo.visao()[0][1], "F");
  assert.throws(() => jogo.bandeira(1, 1));
});
test("rejeita valores aleatórios fora do intervalo", () => {
  assert.throws(
    () => new CampoMinado({ rng: () => 1 }).revelar(0, 0),
    RangeError,
  );
});
