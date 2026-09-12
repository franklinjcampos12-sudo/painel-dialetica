// Ferramenta de manutenção: pré-compila o JSX de index.html para JS puro,
// usando o Babel vendorizado em vendor/babel.min.js (sem instalar nada).
// Rode com: node build.js
// Depois de qualquer edição no JSX dentro de index.html, rode este script de novo.

const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "index.html");
const html = fs.readFileSync(arquivo, "utf8");

const marcaAbertura = '<script type="text/babel" data-presets="react">';
const marcaFechamento = "</script>";

const inicio = html.indexOf(marcaAbertura);
if (inicio === -1) throw new Error("Não encontrei o bloco <script type=\"text/babel\">. Já foi pré-compilado?");
const inicioCodigo = inicio + marcaAbertura.length;
const fimCodigo = html.indexOf(marcaFechamento, inicioCodigo);
if (fimCodigo === -1) throw new Error("Não encontrei o </script> de fechamento do bloco JSX.");

const jsx = html.slice(inicioCodigo, fimCodigo);

const Babel = require("./vendor/babel.min.js");
const resultado = Babel.transform(jsx, { presets: ["react"], comments: false }).code;

const novoBloco = "<script>\n" + resultado + "\n</script>";
const novoHtml = html.slice(0, inicio) + novoBloco + html.slice(fimCodigo + marcaFechamento.length);

fs.writeFileSync(arquivo, novoHtml, "utf8");
console.log("index.html atualizado: JSX compilado para JS puro (" + jsx.length + " -> " + resultado.length + " caracteres).");
