"use strict";
class CampoMinado {
  constructor({ minas = null, rng = Math.random } = {}) {
    this.linhas = 14;
    this.colunas = 18;
    this.totalMinas = 40;
    this.rng = rng;
    this.estado = "jogando";
    this.reveladas = 0;
    this.minas = null;
    this.celulas = Array.from({ length: 14 }, () =>
      Array.from({ length: 18 }, () => ({ aberta: false, bandeira: false })),
    );
    if (minas !== null) {
      if (!Array.isArray(minas) || minas.length !== 40)
        throw new Error("São necessárias 40 minas");
      this.minas = new Set(
        minas.map(([l, c]) => {
          this.verificar(l, c);
          return `${l},${c}`;
        }),
      );
      if (this.minas.size !== 40) throw new Error("Minas duplicadas");
    }
  }
  verificar(l, c) {
    if (
      !Number.isInteger(l) ||
      !Number.isInteger(c) ||
      l < 0 ||
      l >= 14 ||
      c < 0 ||
      c >= 18
    )
      throw new RangeError("Coordenada inválida");
  }
  vizinhos(l, c) {
    const out = [];
    for (let a = l - 1; a <= l + 1; a++)
      for (let b = c - 1; b <= c + 1; b++)
        if ((a !== l || b !== c) && a >= 0 && a < 14 && b >= 0 && b < 18)
          out.push([a, b]);
    return out;
  }
  gerar(l, c) {
    const protegidas = new Set(
      [[l, c], ...this.vizinhos(l, c)].map((p) => p.join(",")),
    );
    const opcoes = [];
    for (let a = 0; a < 14; a++)
      for (let b = 0; b < 18; b++)
        if (!protegidas.has(`${a},${b}`)) opcoes.push(`${a},${b}`);
    for (let i = opcoes.length - 1; i > 0; i--) {
      const x = this.rng();
      if (typeof x !== "number" || !(x >= 0 && x < 1))
        throw new RangeError("rng inválido");
      const j = Math.floor(x * (i + 1));
      [opcoes[i], opcoes[j]] = [opcoes[j], opcoes[i]];
    }
    this.minas = new Set(opcoes.slice(0, 40));
  }
  contar(l, c) {
    this.verificar(l, c);
    return this.vizinhos(l, c).filter((p) => this.minas?.has(p.join(",")))
      .length;
  }
  bandeira(l, c) {
    this.verificar(l, c);
    if (this.estado !== "jogando") throw new Error("Jogo encerrado");
    const x = this.celulas[l][c];
    if (x.aberta) return false;
    return (x.bandeira = !x.bandeira);
  }
  revelar(l, c) {
    this.verificar(l, c);
    if (this.estado !== "jogando") throw new Error("Jogo encerrado");
    if (this.celulas[l][c].aberta || this.celulas[l][c].bandeira) return 0;
    if (!this.minas) this.gerar(l, c);
    if (this.minas.has(`${l},${c}`)) {
      this.celulas[l][c].aberta = true;
      this.estado = "derrota";
      return 1;
    }
    let abertas = 0,
      fila = [[l, c]];
    while (fila.length) {
      const [a, b] = fila.pop(),
        x = this.celulas[a][b];
      if (x.aberta || x.bandeira || this.minas.has(`${a},${b}`)) continue;
      x.aberta = true;
      abertas++;
      if (this.contar(a, b) === 0) fila.push(...this.vizinhos(a, b));
    }
    this.reveladas += abertas;
    if (this.reveladas === 212) this.estado = "vitoria";
    return abertas;
  }
  visao() {
    return this.celulas.map((linha, l) =>
      linha.map((x, c) =>
        x.bandeira
          ? "F"
          : this.estado === "derrota" && this.minas.has(`${l},${c}`)
            ? "*"
            : x.aberta
              ? String(this.contar(l, c))
              : "#",
      ),
    );
  }
}
module.exports = { CampoMinado };
