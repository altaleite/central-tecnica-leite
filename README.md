# Central Técnica Leite — lógica de solicitante por lista

Arquivos principais:
- `index.html`
- `styles.css`
- `config.js`
- `data.js`
- `app.js`
- `assets/logo-alta-branca.png`
- `apps-script/Code.gs`

## O que mudou
- Tipo de solicitante: Distrital, Regional ou Técnico.
- Solicitante vira lista dinâmica:
  - Distrital: lista de distritais.
  - Regional: lista de Nome Regional do cadastro Alta.
  - Técnico: lista de técnicos, sem Priscila.
- E-mail de retorno aparece somente se o tipo escolhido for Regional.
- Distrital vinculado:
  - automático para Distrital;
  - automático para Regional, via cadastro Nome Regional x Distrital;
  - seleção obrigatória para Técnico.
- Apps Script preparado para enviar retorno ao solicitante, com cópia para técnico demandado e distrital vinculado.

## Como subir no GitHub
Suba todos os arquivos da raiz deste pacote para a raiz do repositório do GitHub Pages.

## Como atualizar o Apps Script
Abra o Apps Script da planilha, apague todo o conteúdo do arquivo `Código.gs`, cole o conteúdo de `apps-script/Code.gs`, salve e execute `organizarPlanilha`.

Depois vá em:
Implantar > Gerenciar implantações > lápis > Nova versão > Implantar.
