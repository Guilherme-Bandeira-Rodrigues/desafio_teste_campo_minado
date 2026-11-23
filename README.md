# Testes de Software — Campo Minado

## Especificação

Campo Minado em JavaScript, com **18 colunas × 14 linhas e 40 bombas**, conforme o desafio. Coordenadas são `(linha, coluna)`, começando em zero. Como o enunciado não detalha a mecânica, foram adotadas as seguintes regras: o primeiro clique aleatório e seus vizinhos são seguros; casas sem minas vizinhas abrem em cascata; bandeiras impedem abertura; revelar mina causa derrota; abrir as 212 casas seguras causa vitória.

## Executar os testes

Requer Node.js 20 ou superior; sem dependências externas.

```sh
npm test
```

Os testes em JavaScript usam `node:test` e `node:assert/strict`. Verificam dimensões e número de minas, segurança do primeiro clique, contagem de vizinhos, bandeiras, cascata, vitória, derrota, coordenadas inválidas e minas duplicadas. A saída indica cada caso e o processo retorna erro quando uma asserção falha.

## Usar o motor

```js
const { CampoMinado } = require('./src/campo');
const jogo = new CampoMinado();
jogo.revelar(7, 8);
console.log(jogo.visao(), jogo.estado);
```

`revelar(linha, coluna)` retorna o número de casas abertas na jogada; `bandeira(linha, coluna)` alterna uma marcação; `contar` conta minas vizinhas. A visão usa `#` para oculta, `F` para bandeira, `*` para mina revelada e dígitos para casas abertas. Para testes reproduzíveis, o construtor aceita `{ minas }` com 40 coordenadas únicas ou `{ rng }` com uma função aleatória.

## Contrato e organização dos testes

O sorteio padrão acontece no primeiro clique não bloqueado; esse clique e seus vizinhos são livres de minas. Uma lista fixa é usada como fornecida, portanto não garante primeiro clique seguro. A cascata abre regiões de zeros e seus números vizinhos, sem atravessar bandeiras nem abrir minas. Marcar as minas não vence por si só; vitória requer 212 casas seguras abertas. A explosão mostra minas sem bandeira. Depois de vitória ou derrota, revelar e marcar são proibidos.

Os testes em `test/` especificam valores, retornos, erros, visão, bordas e encerramento. A contagem é comparada com um cálculo independente em todas as 252 posições, e cascatas em vários campos são comparadas com uma simulação independente. A fonte aleatória deve retornar números em `[0, 1)`.

## Colaborador

Guilherme-Bandeira-Rodrigues
