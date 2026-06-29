# Central Técnica Leite — Solicitação de Agenda

Versão visual atualizada para GitHub Pages.

## Como atualizar no GitHub

1. Acesse o repositório `central-tecnica-leite` no GitHub.
2. Clique em `Add file > Upload files`.
3. Envie os arquivos desta pasta para a raiz do repositório.
4. Substitua os arquivos existentes quando solicitado.
5. Faça o commit com a mensagem: `Atualização visual da Central Técnica Leite`.
6. Aguarde 1 a 3 minutos para o GitHub Pages atualizar.

## Atualização mais segura

Se você já configurou o Google Apps Script no arquivo `config.js`, não substitua esse arquivo. Substitua apenas:

- `index.html`
- `styles.css`
- `app.js`, se quiser manter a mesma versão funcional do pacote
- `assets/logo-alta-com-frase.jpg`, se necessário

## Integração com Google Sheets

O arquivo `config.js` deve receber a URL do Web App do Apps Script:

```js
window.CTL_CONFIG = {
  GAS_ENDPOINT: "COLE_AQUI_A_URL_DO_APPS_SCRIPT"
};
```

Enquanto `GAS_ENDPOINT` estiver vazio, o formulário funciona em modo demonstração local.
