# Central Técnica Leite — Solicitação de Agenda

Versão inicial de um formulário institucional para substituir a experiência visual do Google Forms e organizar o recebimento de demandas técnicas dos técnicos de leite.

## O que está incluído

- `index.html`: página principal do formulário.
- `styles.css`: identidade visual, layout responsivo e componentes.
- `app.js`: validação, geração de ID, prioridade estimada e envio.
- `config.js`: local para configurar o endpoint do Google Apps Script.
- `assets/logo-alta-com-frase.jpg`: logo enviada pelo usuário.
- `apps-script/Code.gs`: backend para gravar respostas em Google Sheets e enviar e-mails.
- `modelos/colunas-planilha.csv`: cabeçalho sugerido para a planilha de gestão.

## Fluxo operacional proposto

1. Distrital ou Regional acessa a Central Técnica Leite.
2. Preenche a solicitação de agenda técnica.
3. A demanda recebe um ID automático.
4. A solicitação é registrada em uma Google Sheet.
5. O solicitante recebe um e-mail de confirmação.
6. A equipe técnica recebe um e-mail de triagem.
7. A equipe avalia prioridade, agenda do técnico demandado e retorna com aprovação, ajuste de data ou negativa justificada.

## Como publicar no GitHub Pages

1. Crie um repositório, por exemplo: `central-tecnica-leite`.
2. Envie todos os arquivos desta pasta para o repositório.
3. No GitHub, acesse **Settings > Pages**.
4. Em **Build and deployment**, selecione a branch principal e a pasta `/root`.
5. Salve e aguarde a publicação.

## Como integrar com Google Sheets

1. Crie uma Google Sheet.
2. Vá em **Extensões > Apps Script**.
3. Cole o conteúdo de `apps-script/Code.gs`.
4. Ajuste o e-mail em `TRIAGEM_EMAIL`.
5. Execute `setupSheet()` uma vez para criar os cabeçalhos.
6. Publique como **Web App**.
7. Copie a URL terminada em `/exec`.
8. Cole essa URL em `config.js`, no campo `GAS_ENDPOINT`.

Exemplo:

```js
window.CTL_CONFIG = {
  GAS_ENDPOINT: "https://script.google.com/macros/s/SEU_ID/exec"
};
```

## Observações importantes

- Enquanto o endpoint estiver vazio, o envio funciona em modo demonstração local no navegador.
- Não coloque dados sensíveis de clientes diretamente no repositório público.
- O GitHub Pages deve hospedar apenas o formulário. Os dados devem ser armazenados no Google Sheets ou em outro backend protegido.
- A prioridade calculada é apenas uma estimativa inicial. A decisão final deve continuar sendo da equipe técnica.
