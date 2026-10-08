# Funcionalidades do Kanban

Tudo o que o aplicativo faz, em duas partes: o que já vem em todo quadro e os 120 power-ups que você liga quando quiser.

## O que já vem em todo quadro

### Quadros
- Quantos quadros quiser, cada um com nome, ícone, descrição e fundo (12 degradês).
- 18 modelos prontos: Kanban simples, Projeto, Sprint (Scrum), Funil de vendas, Atendimento, Prazos e processos, Recrutamento, Calendário editorial, Estudos, Semana, Compras e aprovações, Bugs, Roteiro do produto, OKR, Retrospectiva, Integração de pessoas, GTD pessoal e Viagem.
- Favoritar, duplicar (com ou sem os cartões), arquivar, restaurar e excluir quadros.
- Salvar qualquer quadro como modelo, com listas, etiquetas, campos, regras e power-ups.
- Exportar e importar um quadro em arquivo `.kanban.json`.
- Tela inicial com todos os quadros, os prazos dos próximos sete dias e os modelos.

### Listas
- Criar, renomear, reordenar arrastando, recolher e arquivar.
- Limite de cartões (WIP) por lista: a lista fica vermelha quando estoura.
- Lista de conclusão: soltar um cartão ali o conclui; tirar de lá o reabre.
- Cor por lista.
- Ordenar por prazo, prioridade, título ou data de criação.
- Mover ou arquivar todos os cartões de uma vez.

### Cartões
- Arrastar e soltar com o mouse e com o dedo (segure um instante no celular), com rolagem automática nas bordas.
- Título, descrição em Markdown (títulos, negrito, itálico, listas, citações, código, links e caixinhas de marcar que funcionam com um clique).
- Etiquetas coloridas por quadro, membros com avatar, prazo com hora e aviso de vencido.
- Vários checklists por cartão, com barra de progresso.
- Comentários em Markdown.
- Concluir com um clique na bolinha do cartão.
- Mover para outra lista ou outro quadro, copiar, arquivar e excluir (lixeira de 30 dias, com desfazer).
- Histórico interno de cada cartão e tempo acumulado em cada etapa, usados pelos relatórios.

### Encontrar
- Filtro do quadro por texto, etiqueta, membro, prazo (vencidos, hoje, 7 ou 30 dias, sem prazo) e situação; vale para todas as vistas.
- Busca em todos os quadros de uma vez.
- Link direto: o endereço do navegador sempre aponta para o quadro e o cartão abertos.

### Aparência
- Tema claro, escuro ou automático.
- Barra lateral recolhível; no celular, as listas ocupam a tela e deslizam de lado.
- Instalável como aplicativo (PWA) e funciona sem internet.

### Dados e sincronização
- Os dados ficam no aparelho; nada é enviado a servidor nenhum.
- Sincronização por pasta do Google Drive para computador (no `.exe`) e por conta Google (em todos), mesclando registro a registro.
- Cópia de segurança completa em `.json`, para exportar e importar.

## Os 120 power-ups

Abra **⚡ Power-ups** no topo do quadro para ligar, desligar e ajustar. Os que têm ⚙ possuem ajustes próprios.

### 🪟 Vistas (17)

1. **▦ Tabela**: Planilha no estilo Notion: uma linha por cartão, colunas ordenáveis, agrupamento, edição direta e totais. Mostra também os campos personalizados.
2. **☰ Lista**: Tudo em uma lista corrida, agrupada pelas etapas do quadro, com caixinha de concluir e adição rápida.
3. **📅 Calendário**: O mês inteiro com os cartões no dia do prazo. Arraste um cartão para outro dia para mudar o prazo; clique no dia para criar.
4. **🗓️ Semana**: Sete colunas, uma por dia. Arraste os cartões entre os dias para planejar a semana.
5. **📆 Agenda**: Os prazos em ordem: vencidos, hoje, amanhã, esta semana, depois. Bom para a revisão do dia.
6. **📊 Cronograma (Gantt)**: Barras do início ao prazo de cada cartão, em seis semanas. Use com o power-up “Data de início” para ver a duração.
7. **📈 Painel**: Indicadores e gráficos do quadro: cartões por lista, etiqueta e membro, prazos dos próximos dias e criados × concluídos.
8. **🖼️ Galeria**: Os cartões como uma grade de fichas com capa, no estilo da galeria do Notion.
9. **🏊 Raias**: O quadro cortado em faixas horizontais por membro, etiqueta ou prioridade. Arrastar muda a etapa e a raia de uma vez.
10. **🧮 Matriz de Eisenhower**: Urgente × importante em quatro quadrantes. Importante é prioridade alta ou crítica; urgente é prazo em até dois dias. Arrastar ajusta os dois.
11. **⚖️ Carga da equipe** ⚙: Uma coluna por pessoa com o que está em aberto, e a carga em cartões e pontos. Arraste para redistribuir o trabalho.
12. **🏷️ Quadro por etiqueta**: As mesmas tarefas, com uma coluna por etiqueta. Soltar um cartão em outra coluna troca a etiqueta principal.
13. **⏳ Quadro por prazo**: Colunas de vencidos, hoje, amanhã, esta semana, próxima semana, depois e sem prazo. Arrastar reagenda.
14. **🔻 Funil**: Quantos cartões há em cada etapa e a taxa de passagem de uma para a outra. Com o power-up “Valor”, soma o dinheiro de cada fase.
15. **📰 Atividade do quadro**: Um feed com tudo o que aconteceu: criações, movimentos, conclusões e mudanças de prazo, do mais recente ao mais antigo.
16. **🎞️ Apresentação**: Um cartão por vez, em tela grande, com descrição e checklist. Para reuniões e revisões: avance com as setas.
17. **🖨️ Folha para imprimir**: O quadro como um documento limpo, lista por lista, pronto para imprimir ou salvar em PDF pelo navegador.

### 🃏 Cartão turbinado (18)

18. **🚩 Prioridade**: Quatro níveis (baixa, média, alta e crítica) com faixa colorida na borda do cartão, selo e coluna própria na tabela.
19. **🖼️ Capas**: Capa no topo do cartão: cor, degradê, emoji gigante, imagem da internet ou uma foto enviada do aparelho.
20. **🧩 Campos personalizados** ⚙: Crie os seus campos como no Notion e no Pipefy: texto, número, moeda, data, lista de opções e caixa de marcar. Aparecem na ficha, na tabela e, se quiser, na frente do cartão.
21. **#️⃣ Numeração**: Cada cartão ganha um número sequencial do quadro (#1, #2, #3…), visível na frente, na ficha, na tabela e na busca.
22. **◆ Pontos de esforço**: Estime o tamanho de cada cartão em pontos. O total aparece no topo de cada lista e alimenta o burndown, a carga da equipe e o placar.
23. **💰 Valor em dinheiro**: Um valor em reais por cartão, com a soma no topo de cada lista. Transforma o quadro em funil de vendas, orçamento ou controle de compras.
24. **▶️ Data de início**: Além do prazo, o cartão ganha a data em que o trabalho começa. Mostra a duração e desenha a barra inteira no cronograma.
25. **🔒 Dependências**: Diga de quais cartões este depende. Enquanto houver pendência, ele mostra um cadeado e não pode ser concluído; a ficha lista também quem ele bloqueia.
26. **🔗 Cartões relacionados**: Ligue cartões que têm a ver um com o outro. O vínculo aparece nos dois lados e abre com um clique.
27. **📎 Anexos**: Guarde links e imagens no cartão. As imagens são reduzidas para caber na sincronização e podem virar a capa com um clique.
28. **📍 Local**: Um endereço no cartão, com atalho para abrir no mapa. Para visitas, audiências, entregas e viagens.
29. **👍 Votação** ⚙: Vote nos cartões para decidir o que vem primeiro. O total aparece na frente e a lista pode se ordenar sozinha pelos mais votados.
30. **⭐ Adesivos**: Cole emojis no canto do cartão para sinalizar de longe: estrela, fogo, dúvida, comemoração.
31. **🪜 Subcartões**: Cartões dentro de cartões: quebre uma entrega em partes que andam sozinhas pelo quadro, com o progresso somado no cartão-pai.
32. **📶 Barra de progresso**: Uma barra na frente do cartão, calculada pelos checklists e subcartões ou ajustada à mão de 0 a 100%.
33. **👤 Contato**: Nome, empresa, telefone e e-mail da pessoa ligada ao cartão, com botões para ligar, escrever e chamar no WhatsApp.
34. **🌐 Links rápidos**: Encontra os endereços escritos no título e na descrição e põe um botão na frente do cartão para abrir sem entrar na ficha.
35. **🧾 Checklists avançados**: Cada item do checklist pode ter prazo e responsável, e virar um cartão de verdade quando crescer. O cartão avisa quando há item vencido.

### ⏱️ Tempo e foco (13)

36. **⏱️ Cronômetro**: Marque o tempo gasto em cada cartão com um clique. O total fica na frente, dá para lançar minutos à mão, e há um relatório de horas por cartão e por pessoa.
37. **🍅 Pomodoro** ⚙: Ciclos de foco e pausa ligados a um cartão. O relógio fica no topo do quadro, avisa quando termina e conta quantos pomodoros cada cartão levou.
38. **🍂 Cartões envelhecem** ⚙: Cartões parados vão desbotando com o passar dos dias, como papel antigo. O que ficou esquecido salta aos olhos.
39. **⏳ Tempo na etapa**: Mostra há quanto tempo o cartão está na lista atual e, na ficha, quanto ficou em cada etapa por onde passou.
40. **⏰ SLA por etapa** ⚙: Defina o tempo máximo que um cartão pode ficar em cada lista, como no Pipefy. O cartão mostra quanto falta e fica vermelho quando estoura; a lista conta os estouros.
41. **🚦 Semáforo de prazos** ⚙: Uma faixa no topo do cartão: verde quando o prazo está longe, amarela quando se aproxima e vermelha quando venceu.
42. **⌛ Contagem regressiva**: Em vez da data, o cartão diz quanto falta: “faltam 3d 4h”, “vence em 50min” ou “atrasado há 2d”.
43. **🎯 Modo foco**: Um cartão só, em tela cheia, com relógio e checklist. Ao concluir, o próximo da lista entra sozinho.
44. **☀️ Meu dia**: Escolha de manhã o que entra no dia. Um botão no topo reúne os cartões marcados e os que vencem hoje, de todos os quadros.
45. **🏆 Meta diária e sequência** ⚙: Defina quantos cartões quer concluir por dia. O topo do quadro mostra o placar de hoje e há quantos dias seguidos a meta é batida.
46. **💤 Adiar (soneca)**: Tire um cartão da frente até uma data. Ele some do quadro e volta sozinho no dia marcado.
47. **🔁 Cartões recorrentes**: Tarefas que se repetem a cada tantos dias, dias úteis, semanas, meses ou anos. Ao concluir, a próxima nasce sozinha com o novo prazo e os checklists zerados.
48. **🔔 Lembretes** ⚙: Avisos antes do prazo: na hora, minutos, horas ou dias antes. Aparecem no app e, se você permitir, como notificação do sistema.

### 🌊 Fluxo e limites (10)

49. **🚧 Limites de WIP** ⚙: O coração do método Kanban: cada lista aceita um número máximo de cartões. A lista fica vermelha ao estourar e, se quiser, o quadro recusa o cartão a mais.
50. **➡️ Fluxo sequencial** ⚙: Os cartões só andam de uma etapa para a vizinha, sem pular fases. Opcionalmente, também não voltam.
51. **🙋 WIP por pessoa** ⚙: Limita quantos cartões cada membro pode ter em andamento ao mesmo tempo. Ninguém começa a quinta tarefa sem terminar alguma.
52. **🧹 Arquivar concluídos** ⚙: Cartões concluídos há mais de alguns dias saem do quadro sozinhos e vão para o arquivo, de onde podem voltar.
53. **↕️ Ordenação automática** ⚙: As listas se mantêm sempre em ordem: por prazo, prioridade, título, data de criação, tempo na lista, pontos ou valor.
54. **🚨 Classes de serviço**: Como no Kanban de verdade: expresso (fura a fila e vai para o topo), data fixa, padrão e intangível. A lista se organiza conforme a classe.
55. **⛔ Impedimentos** ⚙: Marque o cartão como bloqueado e diga o motivo. Ele ganha listras vermelhas, e o quadro pode proibir que avance enquanto o impedimento existir.
56. **📜 Políticas da lista** ⚙: Escreva as regras de cada etapa: o que precisa estar pronto para entrar e para sair (a “definição de pronto”). Um botão no topo da lista mostra o combinado.
57. **🐌 Alerta de cartão parado** ⚙: Aponta os cartões que estão há dias demais na mesma etapa em andamento, antes que virem um problema.
58. **🏁 Concluir move o cartão**: Marcar a bolinha de concluído leva o cartão direto para a lista de conclusão; reabrir devolve para a primeira lista.

### 🧪 Processos (11)

59. **📥 Formulário de entrada** ⚙: Um botão no topo abre um formulário padronizado para criar pedidos: título, descrição, prazo e os campos personalizados do quadro. Todo cartão nasce completo e na lista certa.
60. **❗ Campos obrigatórios por etapa** ⚙: Defina o que o cartão precisa ter para entrar em cada lista: descrição, prazo, responsável, checklists completos ou qualquer campo personalizado. Sem isso, ele não passa.
61. **🧷 Checklist automático da etapa** ⚙: Cada lista pode ter o seu roteiro. Quando o cartão entra na etapa, o checklist daquela fase é acrescentado sozinho.
62. **✅ Aprovação** ⚙: Botões de aprovar e recusar na ficha. Registra quem decidiu, quando e por quê, e manda o cartão para a lista certa em cada caso.
63. **📣 Escalonamento de atrasos** ⚙: Quando um prazo vence, o cartão sobe um nível de prioridade e recebe uma etiqueta de atraso, sem ninguém precisar lembrar.
64. **🧑‍🔧 Responsável por etapa** ⚙: Cada lista pode ter um dono. Ao entrar na etapa, o cartão é atribuído automaticamente a essa pessoa.
65. **📆 Prazo por etapa** ⚙: Ao entrar em uma lista, o cartão recebe um prazo novo: hoje mais os dias combinados para aquela fase.
66. **📝 Motivo de saída** ⚙: Ao mover um cartão para listas como “Perdido”, “Recusado” ou “Cancelado”, o app pergunta o motivo e guarda a resposta. Depois dá para ver o que mais derruba os pedidos.
67. **🧭 Trilha de etapas na ficha**: Dentro do cartão, uma trilha mostra todas as fases do processo, onde o cartão está e quanto tempo ficou em cada uma. Um clique leva para outra etapa.
68. **🎫 Número de protocolo** ⚙: Todo cartão novo recebe um protocolo no formato PREFIXO-ANO-0001, para citar em e-mails e atendimentos. Aparece na frente e entra na busca.
69. **📨 E-mail modelo** ⚙: Um e-mail pronto para avisar o solicitante, com o assunto e o texto preenchidos a partir do cartão: {titulo}, {lista}, {prazo}, {protocolo}, {contato}.

### 🤖 Automação (14)

70. **🤖 Regras de automação** ⚙: Monte regras “quando acontecer isto, faça aquilo”: ao criar, entrar ou sair de uma lista, concluir, completar o checklist, vencer o prazo ou comentar, execute até três ações em sequência.
71. **🔘 Botões de cartão** ⚙: Crie os seus botões na ficha do cartão. Um clique executa várias ações de uma vez: “Começar” move, atribui a você e põe prazo; “Devolver” volta a etapa e comenta.
72. **🎛️ Botões de quadro** ⚙: Botões no topo do quadro que agem em vários cartões de uma vez: arquivar tudo o que está em “Feito”, mover a lista inteira, zerar prazos, atribuir em massa.
73. **📅 Cartões agendados** ⚙: O quadro cria cartões sozinho: todo dia, nos dias úteis, em um dia da semana ou do mês. Para rotinas, relatórios e fechamentos que não podem ser esquecidos.
74. **⚡ Captura rápida**: Escreva tudo em uma linha ao criar o cartão: “Pagar boleto sexta às 14h #urgente @ana !!!”. O app entende o prazo, a hora, a etiqueta, o membro e a prioridade.
75. **📋 Colar vira cartões**: Cole uma lista de várias linhas no campo de novo cartão e cada linha vira um cartão, já sem os marcadores (-, •, 1.) do texto original.
76. **📑 Modelos de cartão**: Guarde um cartão como modelo, com descrição, checklists, etiquetas e campos, e crie cópias quando precisar. Ideal para tarefas que se repetem com o mesmo roteiro.
77. **☑️ Seleção múltipla**: Ctrl+clique (ou Shift+clique) seleciona vários cartões. Uma barra aparece para mover, etiquetar, atribuir, definir prazo, concluir ou arquivar todos de uma vez; arrastar um leva o grupo.
78. **🗓️ Prazo automático** ⚙: Todo cartão novo sem prazo ganha um: hoje mais alguns dias, contando só os dias úteis se você preferir.
79. **🏷️ Etiquetas por palavra-chave** ⚙: Ensine o quadro a etiquetar sozinho: se o título tiver “boleto”, etiqueta Financeiro; se tiver “erro”, etiqueta Bug.
80. **🎠 Rodízio de responsáveis** ⚙: Distribui os cartões novos entre as pessoas escolhidas, um para cada, em fila. Ninguém fica sobrecarregado e nada fica sem dono.
81. **🔓 Desbloqueio em cadeia** ⚙: Quando um cartão é concluído, os que dependiam dele são avisados; os que ficaram livres podem ir sozinhos para a lista de “prontos para começar”.
82. **🧽 Faxina do quadro**: Ferramentas de arrumação: arquivar tudo o que está concluído, achar cartões duplicados, remover etiquetas que ninguém usa e esvaziar listas arquivadas.
83. **📡 Webhook de saída** ⚙: Avisa outros sistemas (Zapier, Make, n8n, Google Apps Script, Slack) quando um cartão é criado, movido ou concluído, enviando os dados em JSON para o endereço que você indicar.

### 📈 Relatórios e métricas (10)

84. **🌊 Fluxo cumulativo (CFD)**: O gráfico clássico do Kanban: quantos cartões havia em cada etapa, dia após dia. Faixas que engordam mostram onde o trabalho está acumulando.
85. **📉 Burndown** ⚙: Quanto trabalho ainda falta, dia a dia, contra a linha ideal até a data final. Conta cartões ou pontos de esforço.
86. **⏲️ Lead time e cycle time**: Quanto tempo um cartão leva da criação à entrega (lead) e do início do trabalho à entrega (cycle): média, mediana, percentil 85 e a distribuição.
87. **🚿 Vazão semanal**: Quantos cartões foram concluídos por semana nas últimas doze semanas, com a média. A base para qualquer previsão.
88. **🔮 Previsão (Monte Carlo)**: Quando o que está em aberto fica pronto? Simula milhares de futuros com base na sua vazão real e responde com probabilidades, não com chutes.
89. **🎚️ Gráfico de controle**: Cada entrega vira um ponto: quando terminou e quanto demorou. A linha da média e o limite superior separam o normal do que merece uma conversa.
90. **🗞️ Relatório semanal**: Um resumo pronto da semana: o que foi concluído, o que está em andamento, o que venceu e o que vem aí. Copie em Markdown e cole no e-mail ou no grupo.
91. **🟩 Mapa de calor**: Um quadradinho por dia, mais verde quanto mais cartões você concluiu, nos últimos seis meses. Constância à vista.
92. **🍾 Detector de gargalo**: Mede quanto tempo os cartões ficam, em média, em cada etapa e aponta a mais lenta. É ali que vale a pena agir primeiro.
93. **🥇 Placar da equipe**: Por pessoa: o que entregou nos últimos 30 dias, o que tem em aberto, o que está vencido e os pontos entregues.

### 👥 Equipe e reuniões (9)

94. **😀 Reações nos comentários**: Responda a um comentário com um emoji em vez de escrever “ok”. Um clique põe, outro tira.
95. **👁️ Observar cartões**: Siga os cartões que importam. Um sino no topo junta o que aconteceu com eles: mudanças de etapa, conclusões, comentários e prazos chegando.
96. **🕰️ Histórico do cartão**: Na ficha, a linha do tempo do cartão: quando foi criado, por onde passou, quem assumiu, quando mudou o prazo e quando foi concluído.
97. **🗳️ Enquete no cartão**: Uma pergunta com opções dentro do cartão. Cada pessoa vota e as barras mostram o resultado na hora.
98. **📝 Notas do quadro**: Uma página de anotações para o quadro inteiro, com Markdown: objetivos, combinados, links úteis, ata da última reunião. No estilo de uma página do Notion.
99. **🧍 Reunião diária** ⚙: Conduz a daily em tela cheia: uma pessoa por vez, com o que concluiu desde ontem, o que tem em andamento, os bloqueios e um relógio para ninguém se alongar.
100. **🃏 Planning poker**: Estime em grupo sem um influenciar o outro: cada pessoa escolhe a sua carta em segredo, todas viram juntas e o resultado vai para os pontos do cartão.
101. **🎲 Sorteador**: Na dúvida sobre o que fazer ou quem assume? Sorteie um cartão em aberto ou uma pessoa da equipe.
102. **📤 Compartilhar cartão**: Mande o conteúdo do cartão para qualquer aplicativo do celular ou copie como texto ou Markdown, com descrição e checklists.

### 🔁 Importar, exportar e integrar (9)

103. **🧾 Planilha (CSV)**: Exporte o quadro para abrir no Excel ou no Google Planilhas, com todos os campos, e importe cartões de uma planilha: título, lista, descrição, prazo e etiquetas.
104. **🟦 Importar do Trello**: Traga um quadro inteiro do Trello: listas, cartões, descrições, etiquetas com as cores, prazos, checklists, links anexados e comentários. No Trello: menu › Imprimir, exportar e compartilhar › Exportar como JSON.
105. **🗓️ Exportar para a agenda (.ics)**: Gera um arquivo de calendário com todos os prazos em aberto, para importar no Google Agenda, no Outlook ou no calendário do celular.
106. **⬇️ Exportar em Markdown**: O quadro inteiro como um documento de texto: uma seção por lista, uma caixinha por cartão, com prazos, etiquetas e checklists. Cola direto no Notion, no Obsidian ou no GitHub.
107. **🛟 Cópias diárias do quadro**: Uma vez por dia o Kanban guarda uma cópia do quadro neste aparelho e mantém as três últimas. Se algo der errado, restaure o quadro como estava naquele dia.
108. **✉️ Enviar por e-mail**: Abre o seu programa de e-mail com o cartão pronto no corpo da mensagem: título, etapa, prazo, descrição e checklists.
109. **🔗 Link direto do cartão**: Copia um endereço que abre o Kanban já no cartão. Cole em e-mails, documentos e em outros cartões para pular direto ao ponto.
110. **📆 Pôr no Google Agenda**: Um botão na ficha abre o Google Agenda com o evento preenchido: título, data, hora e descrição do cartão. Não precisa conectar nada.
111. **📄 Importar de texto**: Cole um texto ou Markdown e ele vira quadro: linhas com # viram listas, linhas com - viram cartões e os itens recuados viram checklist. Ótimo para atas e planos escritos às pressas.

### 🎨 Aparência e conforto (9)

112. **🌄 Fundos personalizados**: Doze degradês, qualquer cor sólida, uma imagem da internet ou uma foto sua como fundo do quadro.
113. **↔️ Densidade** ⚙: Compacto para ver mais cartões na tela, ou amplo para ler de longe e tocar com o dedo.
114. **📐 Largura e grade das listas** ⚙: Listas estreitas ou largas, e a opção de quebrar as listas em várias linhas em vez de rolar para o lado: o quadro inteiro numa tela só.
115. **👓 Modo para daltônicos**: As etiquetas ganham texturas (listras, pontos, traços) além da cor, para serem distinguidas sem depender do tom.
116. **🎉 Confete ao concluir** ⚙: Uma chuva de confete e um som de vitória a cada cartão concluído. Porque terminar merece festa.
117. **🔤 Etiquetas com nome**: Na frente dos cartões, as etiquetas mostram o nome escrito em vez de só a tirinha de cor.
118. **🧘 Modo zen**: Esconde menus, abas e botões e deixa só o quadro. Um botão discreto traz tudo de volta.
119. **⌨️ Atalhos e paleta de comandos**: Use o quadro sem o mouse: N cria, F filtra, 1 a 9 trocam de vista, Ctrl+K abre a paleta que leva a qualquer quadro, cartão ou ferramenta. Aperte ? para ver todos.
120. **🎤 Ditado por voz**: Toque no microfone e fale a tarefa: o cartão é criado na primeira lista. Com a captura rápida ligada, “amanhã” e “sexta” viram o prazo.
