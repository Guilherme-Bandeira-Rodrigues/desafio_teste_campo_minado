const { test } = require("node:test");
const a = require("node:assert/strict");
const { CampoMinado } = require("../src/campo");
const minas = Array.from({ length: 40 }, (_, i) => [
  Math.floor(i / 18),
  i % 18,
]);
test("dimensões e primeiro clique protegem vizinhança", () => {
  const g = new CampoMinado({ rng: () => 0.5 });
  g.revelar(7, 8);
  a.equal(g.visao().length, 14);
  a.equal(g.visao()[0].length, 18);
  a.equal(g.minas.size, 40);
  a.equal(g.contar(7, 8), 0);
  a.equal(g.minas.has("7,8"), false);
});
test("conta minas, bandeiras e derrota", () => {
  const g = new CampoMinado({ minas });
  a.equal(g.contar(2, 4), 4);
  a.equal(g.bandeira(0, 0), true);
  a.equal(g.revelar(0, 0), 0);
  g.bandeira(0, 0);
  g.revelar(0, 0);
  a.equal(g.estado, "derrota");
  a.equal(g.visao()[0][0], "*");
  a.throws(() => g.revelar(3, 3));
});
test("cascata vence ao abrir todas as casas seguras", () => {
  const g = new CampoMinado({ minas });
  g.revelar(13, 17);
  for (let l = 0; l < 14 && g.estado === "jogando"; l++)
    for (let c = 0; c < 18 && g.estado === "jogando"; c++)
      if (!g.minas.has(`${l},${c}`)) g.revelar(l, c);
  a.equal(g.reveladas, 212);
  a.equal(g.estado, "vitoria");
});
test("rejeita coordenadas e minas duplicadas", () => {
  a.throws(() => new CampoMinado({ minas: Array(40).fill([0, 0]) }));
  a.throws(() => new CampoMinado().revelar(14, 0), RangeError);
});
test("bandeiras bloqueiam abertura em cascata e podem ser removidas", () => {
  const g = new CampoMinado({ minas });
  g.bandeira(13, 17);
  g.revelar(13, 16);
  a.equal(g.visao()[13][17], "F");
  a.equal(g.bandeira(13, 17), false);
  g.revelar(13, 17);
  a.equal(g.estado, "vitoria");
});
