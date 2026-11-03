# Grifo

Caderno de estudos com IA. Você pede um tópico, a IA escreve o resumo e ele entra na matéria como uma nota editável, com grifos, links entre notas e mapa do caderno. Em volta das notas ficam o cronômetro, as revisões em 1, 7 e 30 dias, o aproveitamento em questões e a contagem para a prova.

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:3210. Precisa de Node 18.18 ou mais novo.

## Ligar a IA

A IA roda na [NVIDIA NIM](https://build.nvidia.com). Crie um arquivo `.env.local` na raiz com a sua chave e reinicie o servidor:

```
NVIDIA_API_KEY=sua-chave
```

Para trocar de modelo, acrescente `NVIDIA_MODEL=` com um id do catálogo. Sem a chave, todo o resto funciona e a tela de resumo avisa que a IA não está ligada. A chave fica só no servidor (`src/app/api/ia/route.ts`) e nunca vai para o navegador.

## Login e dados

O Grifo é um projeto de TCC e roda localmente. Contas, sessão e notas ficam no `localStorage` do navegador, sem banco de dados externo: cada navegador tem o seu caderno, e limpar os dados do site apaga tudo. A senha é guardada como hash SHA-256 com sal, e as páginas do painel são protegidas no próprio navegador.

As únicas informações que saem da máquina são os pedidos à IA: tópico, material colado e texto da nota vão para a NVIDIA NIM pela rota `/api/ia`, que roda no servidor local e guarda a chave.
