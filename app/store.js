'use strict';
/* Kanban — dados. Quadros guardam listas; listas guardam cartões.
   Tudo fica no aparelho (localStorage) em listas de registros { id, mod }; `mod` decide quem vence na sincronização. */

const KEY = 'kanban-v1';
const byId = (l, id) => l.find(r => r.id === id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };

const S = { set: { gClient: '', gWas: false, tema: 'auto', eu: '', lado: true } };

const CORES = ['#E0483C', '#F08A24', '#E8B81F', '#2FA05A', '#1BA39C', '#2D7DD2', '#5B6CF0', '#8B5CF6', '#D6489A', '#8A6A4F', '#6B7280', '#1F2937'];
const FUNDOS = {
  azul: 'linear-gradient(135deg,#1D5FB8,#3E8EE0)', mar: 'linear-gradient(135deg,#0B7285,#3BC9DB)', mata: 'linear-gradient(135deg,#1E6F43,#57B26B)',
  sol: 'linear-gradient(135deg,#D9730D,#F2B544)', brasa: 'linear-gradient(135deg,#B3261E,#F0704A)', uva: 'linear-gradient(135deg,#5B2A9D,#A06CF0)',
  rosa: 'linear-gradient(135deg,#B02A72,#F286B4)', noite: 'linear-gradient(135deg,#111827,#374151)', grafite: 'linear-gradient(135deg,#3A4150,#6B7280)',
  aurora: 'linear-gradient(135deg,#3B2F8F,#1BA39C 60%,#57B26B)', poente: 'linear-gradient(135deg,#5B2A9D,#D6489A 55%,#F2B544)', areia: 'linear-gradient(135deg,#8A6A4F,#D9B99B)',
};

// Formato de cada registro; o que vem de fora (sincronização, backup) passa por aqui antes de entrar.
const SHAPE = {
  quadros: { nome: 's', icone: 's', desc: 't', fundo: 's', vista: 's', ordem: 'n', fav: 'b', arquivado: 'b', criado: 'n', pups: 'o', d: 'o' },
  listas: { quadro: 's', nome: 's', ordem: 'n', limite: 'n', feito: 'b', fechada: 'b', cor: 's', arquivada: 'b', d: 'o' },
  cartoes: { quadro: 's', lista: 's', pai: 's', titulo: 's', texto: 't', etiquetas: 's', membros: 's', prazo: 'd', hora: 'h', inicio: 'd', feito: 'n', prio: 'n', capa: 's', ordem: 'n', criado: 'n', entrou: 'n', arquivado: 'b', lixo: 'n', num: 'n', d: 'o' },
  etiquetas: { quadro: 's', nome: 's', cor: 'c', ordem: 'n' },
  membros: { nome: 's', cor: 'c', email: 's', ordem: 'n' },
  comentarios: { cartao: 's', autor: 's', texto: 't', criado: 'n', d: 'o' },
  regras: { quadro: 's', nome: 's', tipo: 's', ativa: 'b', ordem: 'n', d: 'o' },
  modelos: { nome: 's', tipo: 's', d: 'o' },
  ajustes: { d: 'o' },
};
function normObj(v) {
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = null; } }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  try { const s = JSON.stringify(v); return s.length > 600000 ? {} : JSON.parse(s); } catch (e) { return {}; }
}
function norm(store, r) {
  const o = { id: String(r.id), mod: Number(r.mod) || 0 };
  for (const [k, t] of Object.entries(SHAPE[store])) {
    const v = r[k];
    o[k] = t === 's' ? String(v == null ? '' : v).slice(0, 600)
      : t === 't' ? String(v == null ? '' : v).slice(0, 40000)
      : t === 'n' ? Number(v) || 0
      : t === 'b' ? !!v
      : t === 'o' ? normObj(v)
      : t === 'c' ? (/^#[0-9a-f]{6}$/i.test(v) ? v : '#6B7280')
      : t === 'h' ? (/^\d{2}:\d{2}$/.test(v) ? v : '')
      : (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
  }
  if (store === 'cartoes') o.prio = Math.max(0, Math.min(4, Math.round(o.prio)));
  if (r.seed) o.seed = true;
  return o;
}

const DB = {
  SYNCED: Object.keys(SHAPE),
  onChange: null,
  _tomb: {},
  tomb: () => DB._tomb,
  cheio: false,

  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    DB.SYNCED.forEach(s => S[s] = (d && Array.isArray(d[s]) ? d[s] : []).filter(r => r && r.id).map(r => norm(s, r)));
    DB._tomb = (d && d.tomb && typeof d.tomb === 'object') ? d.tomb : {};
    try { Object.assign(S.set, JSON.parse(localStorage.getItem(KEY + '-set') || '{}')); } catch (e) {}
    if (!byId(S.ajustes, 'cfg') && !DB._tomb['ajustes:cfg']) S.ajustes.push(norm('ajustes', { id: 'cfg' }));
    if (!d) { Data.montar(EXEMPLO, 'Primeiros passos (exemplo)', true); DB.novo = true; }
    // a lixeira se esvazia sozinha depois de 30 dias
    S.cartoes.filter(c => c.lixo && c.lixo < Date.now() - 30 * 864e5).forEach(c => Data.del('cartoes', c.id, true));
    DB.persist();
  },
  persist() {
    const d = { tomb: DB._tomb };
    DB.SYNCED.forEach(s => d[s] = S[s]);
    try { localStorage.setItem(KEY, JSON.stringify(d)); DB.cheio = false; } catch (e) { DB.cheio = true; }
  },
  saveSet() { try { localStorage.setItem(KEY + '-set', JSON.stringify(S.set)); } catch (e) {} },
  changed() { DB.persist(); if (DB.onChange) DB.onChange(); },
};

const Data = {
  // gravações feitas por você: carimbam a data e, na primeira, adotam o exemplo como dado de verdade
  put(store, rec, quiet) {
    if (!rec.id) rec.id = uid();
    // os objetos internos (d, pups) continuam os mesmos, para quem já os tem em mãos não ficar com uma cópia velha
    const n = norm(store, rec);
    for (const [k, t] of Object.entries(SHAPE[store])) if (t === 'o' && rec[k] && typeof rec[k] === 'object' && !Array.isArray(rec[k])) n[k] = rec[k];
    Object.assign(rec, n);
    rec.mod = Date.now();
    Data.adopt();
    if (!byId(S[store], rec.id)) S[store].push(rec);
    if (!quiet) DB.changed();
    return rec;
  },
  del(store, id, quiet) {
    const i = S[store].findIndex(r => r.id === id);
    if (i < 0) return;
    S[store].splice(i, 1);
    DB._tomb[store + ':' + id] = Date.now();
    if (!quiet) DB.changed();
  },
  adopt() { DB.SYNCED.forEach(s => S[s].forEach(r => { delete r.seed; })); },
  // gravações vindas da sincronização: não mexem em `mod`
  raw(store, rec) { const i = S[store].findIndex(r => r.id === rec.id); if (i < 0) S[store].push(rec); else S[store][i] = rec; },
  rawDel(store, id) { const i = S[store].findIndex(r => r.id === id); if (i >= 0) S[store].splice(i, 1); },

  // monta um quadro inteiro a partir de um modelo: listas, etiquetas, campos, power-ups e cartões
  montar(m, nome, seed) {
    const now = Date.now(), tag = r => { if (seed) r.seed = true; return r; };
    const pups = {}; PADRAO.concat(m.pups || []).forEach(p => pups[p] = true);
    const campos = (m.campos || []).map(c => ({ id: uid(), nome: c[0], tipo: c[1], op: c[2] || [], frente: !!c[3] }));
    const q = tag(norm('quadros', { id: uid(), nome, icone: m.icone || '📋', desc: m.desc || '', fundo: m.fundo || 'azul', vista: 'quadro', ordem: Math.max(0, ...S.quadros.map(x => x.ordem)) + 1, criado: now, pups, d: { campos, seq: 0 }, mod: now }));
    S.quadros.push(q);
    const ets = (m.etiquetas || ETIQ).map((e, i) => { const r = tag(norm('etiquetas', { id: uid(), quadro: q.id, nome: e[0], cor: e[1], ordem: i, mod: now })); S.etiquetas.push(r); return r; });
    const ls = m.listas.map((l, i) => { const r = tag(norm('listas', { id: uid(), quadro: q.id, nome: l[0], feito: !!l[1], limite: l[2] || 0, ordem: i, d: l[3] || {}, mod: now })); S.listas.push(r); return r; });
    (m.cartoes || []).forEach((c, i) => {
      const l = ls[c.l || 0] || ls[0], d = Object.assign({}, c.d);
      if (c.ck) d.ck = [{ id: uid(), nome: 'Checklist', itens: c.ck.map(t => ({ id: uid(), t: t.replace(/^\*/, ''), ok: t[0] === '*' })) }];
      if (c.cf) { d.cf = {}; c.cf.forEach((v, j) => { if (campos[j] && v !== '') d.cf[campos[j].id] = v; }); }
      q.d.seq++;
      S.cartoes.push(tag(norm('cartoes', { id: uid(), quadro: q.id, lista: l.id, titulo: c.t, texto: c.x || '', etiquetas: (c.e || []).map(j => ets[j] && ets[j].id).filter(Boolean).join(','), prio: c.p || 0, capa: c.capa || '',
        prazo: c.dias == null ? '' : ymdMais(c.dias), ordem: i, criado: now, entrou: now, feito: l.feito ? now : 0, num: q.d.seq, d, mod: now })));
    });
    return q;
  },
};
function ymdMais(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

// Power-ups que já vêm ligados em todo quadro novo.
const PADRAO = ['v-tabela', 'v-calendario', 'v-painel', 'prioridade', 'capas', 'wip', 'semaforo', 'captura', 'colar', 'atalhos', 'confete', 'modelos', 'selecao', 'csv', 'numeracao', 'historico'];
const ETIQ = [['Urgente', '#E0483C'], ['Importante', '#F08A24'], ['Ideia', '#E8B81F'], ['Pessoal', '#2FA05A'], ['Trabalho', '#2D7DD2'], ['Estudo', '#8B5CF6']];

// Modelos de quadro. Lista: [nome, conclui?, limite, extras]. Campo: [nome, tipo, opções, mostra na frente?].
const MODELOS = [
  { nome: 'Kanban simples', icone: '📋', fundo: 'azul', desc: 'O clássico: a fazer, fazendo e feito.', listas: [['A fazer'], ['Fazendo', 0, 3], ['Feito', 1]] },
  { nome: 'Projeto', icone: '🏗️', fundo: 'mar', desc: 'Do backlog à entrega, com revisão.', pups: ['v-cronograma', 'inicio', 'dependencias', 'estimativa', 'cfd', 'tempo-fase'],
    listas: [['Backlog'], ['Planejado'], ['Em andamento', 0, 3], ['Em revisão', 0, 2], ['Entregue', 1]] },
  { nome: 'Sprint (Scrum)', icone: '🏃', fundo: 'uva', desc: 'Sprint com pontos, burndown e reunião diária.', pups: ['estimativa', 'burndown', 'vazao', 'daily', 'poker', 'v-raias', 'cfd', 'lead'],
    etiquetas: [['História', '#2D7DD2'], ['Bug', '#E0483C'], ['Tarefa', '#2FA05A'], ['Débito técnico', '#8B5CF6'], ['Spike', '#E8B81F']],
    listas: [['Backlog do produto'], ['Sprint'], ['Em andamento', 0, 4], ['Em teste', 0, 3], ['Pronto', 1]] },
  { nome: 'Funil de vendas', icone: '💰', fundo: 'mata', desc: 'Oportunidades por etapa, com valor e contato.', pups: ['valor', 'contatos', 'campos', 'sla', 'tempo-fase', 'obrigatorios', 'v-funil', 'entrada'],
    etiquetas: [['Quente', '#E0483C'], ['Morno', '#F08A24'], ['Frio', '#2D7DD2'], ['Indicação', '#2FA05A']],
    campos: [['Origem', 'lista', ['Site', 'Indicação', 'Evento', 'Redes sociais'], 1], ['Empresa', 'texto', [], 1], ['Próximo contato', 'data']],
    listas: [['Prospecção'], ['Qualificação'], ['Proposta'], ['Negociação'], ['Fechado', 1], ['Perdido']] },
  { nome: 'Atendimento', icone: '🎧', fundo: 'brasa', desc: 'Chamados com SLA por fase e formulário de entrada.', pups: ['sla', 'entrada', 'campos', 'contatos', 'tempo-fase', 'escalar', 'classes', 'aprovacao'],
    etiquetas: [['Dúvida', '#2D7DD2'], ['Problema', '#E0483C'], ['Pedido', '#2FA05A'], ['Elogio', '#D6489A']],
    campos: [['Canal', 'lista', ['E-mail', 'Telefone', 'WhatsApp', 'Presencial'], 1], ['Protocolo', 'texto']],
    listas: [['Novos', 0, 0, { sla: 4 }], ['Em análise', 0, 5, { sla: 24 }], ['Aguardando cliente', 0, 0, { sla: 72 }], ['Resolvido', 1]] },
  { nome: 'Prazos e processos', icone: '⚖️', fundo: 'noite', desc: 'Processos, prazos fatais e protocolos.', pups: ['campos', 'lembretes', 'contagem', 'v-agenda', 'ics', 'obrigatorios', 'anexos', 'escalar', 'contatos'],
    etiquetas: [['Prazo fatal', '#E0483C'], ['Audiência', '#8B5CF6'], ['Cível', '#2D7DD2'], ['Trabalhista', '#F08A24'], ['Tributário', '#2FA05A'], ['Consultivo', '#6B7280']],
    campos: [['Nº do processo', 'texto', [], 1], ['Cliente', 'texto', [], 1], ['Vara / Tribunal', 'texto'], ['Valor da causa', 'moeda']],
    listas: [['Entrada'], ['A elaborar'], ['Em revisão', 0, 3], ['A protocolar'], ['Aguardando'], ['Concluído', 1]] },
  { nome: 'Recrutamento', icone: '🧑‍💼', fundo: 'rosa', desc: 'Candidatos por etapa do processo seletivo.', pups: ['contatos', 'campos', 'votos', 'anexos', 'aprovacao', 'tempo-fase'],
    campos: [['Vaga', 'texto', [], 1], ['Pretensão', 'moeda'], ['Currículo', 'url']],
    listas: [['Inscritos'], ['Triagem'], ['Entrevista'], ['Teste'], ['Proposta'], ['Contratado', 1], ['Não aprovado']] },
  { nome: 'Calendário editorial', icone: '✍️', fundo: 'poente', desc: 'Pautas da ideia à publicação.', pups: ['inicio', 'v-cronograma', 'v-galeria', 'anexos', 'campos'],
    campos: [['Canal', 'lista', ['Blog', 'Instagram', 'YouTube', 'Newsletter'], 1], ['Link publicado', 'url']],
    listas: [['Ideias'], ['Pauta'], ['Escrevendo', 0, 3], ['Revisão'], ['Agendado'], ['Publicado', 1]] },
  { nome: 'Estudos', icone: '📚', fundo: 'aurora', desc: 'Matérias, revisões e o que já foi dominado.', pups: ['pomodoro', 'cronometro', 'meta', 'recorrencia', 'heatmap', 'meu-dia'],
    listas: [['Para estudar'], ['Estudando', 0, 2], ['Revisar'], ['Dominado', 1]] },
  { nome: 'Semana', icone: '🗓️', fundo: 'sol', desc: 'Um quadro com os dias da semana.', pups: ['meu-dia', 'recorrencia', 'meta'],
    listas: [['Segunda'], ['Terça'], ['Quarta'], ['Quinta'], ['Sexta'], ['Fim de semana'], ['Feito', 1]] },
  { nome: 'Compras e aprovações', icone: '🛒', fundo: 'areia', desc: 'Pedidos que passam por aprovação.', pups: ['valor', 'aprovacao', 'entrada', 'campos', 'obrigatorios', 'sla'],
    campos: [['Fornecedor', 'texto', [], 1], ['Centro de custo', 'lista', ['Administrativo', 'Operação', 'Marketing', 'TI']]],
    listas: [['Solicitado'], ['Em aprovação', 0, 0, { sla: 48 }], ['Aprovado'], ['Comprado'], ['Recebido', 1], ['Recusado']] },
  { nome: 'Bugs', icone: '🐞', fundo: 'grafite', desc: 'Triagem e correção de defeitos.', pups: ['classes', 'bloqueio', 'tempo-fase', 'lead', 'controle', 'campos'],
    etiquetas: [['Crítico', '#E0483C'], ['Alto', '#F08A24'], ['Médio', '#E8B81F'], ['Baixo', '#2FA05A']],
    campos: [['Versão', 'texto', [], 1], ['Ambiente', 'lista', ['Produção', 'Homologação', 'Local']]],
    listas: [['Reportado'], ['Confirmado'], ['Corrigindo', 0, 3], ['Em teste'], ['Corrigido', 1], ['Não é bug']] },
  { nome: 'Roteiro do produto', icone: '🧭', fundo: 'mar', desc: 'Agora, em seguida e depois.', pups: ['votos', 'estimativa', 'v-matriz', 'inicio', 'v-cronograma'],
    listas: [['Ideias'], ['Depois'], ['Em seguida'], ['Agora', 0, 3], ['Lançado', 1]] },
  { nome: 'OKR', icone: '🎯', fundo: 'uva', desc: 'Objetivos e resultados-chave do trimestre.', pups: ['progresso', 'subcartoes', 'campos', 'v-tabela'],
    campos: [['Meta', 'numero', [], 1], ['Atual', 'numero', [], 1], ['Responsável', 'texto']],
    listas: [['Objetivos'], ['Resultados-chave'], ['Iniciativas'], ['Atingido', 1]] },
  { nome: 'Retrospectiva', icone: '🔁', fundo: 'rosa', desc: 'O que foi bem, o que melhorar e as ações.', pups: ['votos', 'adesivos', 'enquete'],
    listas: [['Foi bem 👍'], ['Pode melhorar 🤔'], ['Ideias 💡'], ['Ações'], ['Feito', 1]] },
  { nome: 'Integração de pessoas', icone: '🤝', fundo: 'mata', desc: 'O passo a passo de quem está chegando.', pups: ['ck-fase', 'progresso', 'modelos'],
    listas: [['Antes do 1º dia'], ['1ª semana'], ['1º mês'], ['Concluído', 1]] },
  { nome: 'GTD pessoal', icone: '🧘', fundo: 'grafite', desc: 'Entrada, próximas ações, aguardando e algum dia.', pups: ['meu-dia', 'adiar', 'recorrencia', 'v-matriz', 'meta', 'foco'],
    listas: [['Entrada'], ['Próximas ações', 0, 7], ['Aguardando'], ['Algum dia'], ['Feito', 1]] },
  { nome: 'Viagem', icone: '🧳', fundo: 'sol', desc: 'Antes de ir, malas, roteiro.', pups: ['local', 'valor', 'anexos', 'progresso'],
    listas: [['Antes de ir'], ['Malas'], ['Roteiro'], ['Pronto', 1]],
    cartoes: [{ t: 'Documentos', ck: ['Passagens', 'Reserva', 'Seguro'] }, { t: 'Roupas', l: 1 }] },
];

const EXEMPLO = { icone: '🚀', fundo: 'azul', desc: 'Um quadro de exemplo para você mexer à vontade.', pups: ['estimativa', 'v-cronograma', 'v-agenda', 'inicio', 'progresso', 'pomodoro', 'automacoes', 'tempo-fase', 'meta'],
  listas: [['A fazer'], ['Fazendo', 0, 3], ['Em revisão', 0, 2], ['Feito', 1]],
  cartoes: [
    { t: 'Arraste este cartão para “Fazendo”', l: 0, e: [4], x: 'Cada lista é uma etapa. Soltar o cartão na lista **Feito** conclui a tarefa.\n\nNo celular, segure o cartão por um instante antes de arrastar.' },
    { t: 'Abra um cartão e veja tudo o que cabe nele', l: 0, e: [1], p: 3, dias: 2, ck: ['*Descrição com **Markdown**', 'Etiquetas, membros e prazo', 'Checklists com progresso', 'Comentários e histórico'] },
    { t: 'Conheça os 120 power-ups', l: 0, e: [2], capa: '#8B5CF6', x: 'Clique em **⚡ Power-ups** no topo do quadro. Cada power-up liga uma função: vistas, automações, relatórios, tempo, fluxo e muito mais.\n\nCada quadro tem os seus.' },
    { t: 'Captura rápida: digite “Pagar boleto sexta #urgente !!”', l: 0, e: [0], x: 'Ao criar um cartão:\n- `amanhã`, `sex` ou `25/12` definem o prazo\n- `#etiqueta` marca a etiqueta, `@nome` atribui o membro\n- `!` a `!!!!` definem a prioridade\n\nVárias linhas coladas viram vários cartões.' },
    { t: 'Troque a vista: Quadro, Tabela, Calendário, Painel…', l: 1, e: [4], p: 2, dias: 0 },
    { t: 'Esta lista tem limite de 3 cartões (WIP)', l: 1, e: [5], dias: 5 },
    { t: 'Ligue a sincronização em Ajustes', l: 2, e: [3], x: 'No programa de Windows, a pasta do Google Drive já é detectada sozinha. No site e no celular, conecte a conta Google.' },
    { t: 'Abrir o Kanban pela primeira vez', l: 3, e: [3] },
  ] };
