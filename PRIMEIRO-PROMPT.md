# Cole isto na primeira sessão do Claude Code

Abra o Claude Code dentro da pasta onde estão `index.html`, `manifest.json`, `icone.svg` e `CLAUDE.md`. Depois cole o texto abaixo.

---

Leia o CLAUDE.md desta pasta antes de qualquer coisa. Ele tem o contexto do projeto, o modelo de dados e as regras de negócio.

Não sou programador. Explique o que você for fazer em português simples e não me peça para editar código.

O painel já está pronto e funcionando. Preciso de três coisas, nesta ordem:

**1. Colocar no ar**

Quero um endereço fixo na internet, gratuito, para uso pessoal. Me mostre as opções que você consegue executar daqui e recomende uma, considerando que:

- vou instalar como aplicativo no meu celular Android
- não quero pagar nada
- quero um endereço estável, que não mude quando você publicar uma versão nova
- não quero depender de mim para republicar toda vez

Depois de escolhermos, faça o deploy e me passe o endereço. Se precisar que eu crie uma conta em algum serviço ou autorize alguma coisa, me diga exatamente o que clicar.

**2. Versionar**

Coloque a pasta num repositório Git para eu não perder o histórico e poder voltar atrás se uma mudança quebrar alguma coisa. Se o deploy puder sair direto do repositório a cada alteração, melhor ainda.

**3. Funcionar offline**

Hoje o painel precisa de internet na primeira abertura porque carrega React e Babel de um CDN. Quero que abra sem internet. Faça nesta ordem, testando entre uma etapa e outra:

- baixe React, ReactDOM e Babel para a pasta e passe a carregá-los localmente
- se der, pré-compile o JSX para dispensar o Babel no navegador e acelerar a abertura
- adicione um service worker que guarde tudo em cache
- gere os ícones PNG de 192 e 512 pixels e inclua no manifest.json junto com o SVG

Cuidado nesta parte: os dados ficam no localStorage do navegador, na chave `dialetica:painel`. Se qualquer alteração puder afetar isso, me avise antes para eu fazer backup pela aba Backup do painel.

Quando terminar cada etapa, me diga o que mudou na prática e o que eu preciso fazer no celular.
