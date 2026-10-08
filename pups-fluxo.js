'use strict';
/* Kanban — power-ups de fluxo (WIP, classes de serviço, bloqueios…), de processo (formulário, campos obrigatórios, aprovação…) e de automação. */

const opListas = q => listasDe(q).map(l => [l.id, l.nome]);
const opListasOpc = q => [['', '— nenhuma —']].concat(opListas(q));
const emCurso = q => { const ls = listasDe(q); return ls.filter((l, i) => i > 0 && !l.feito).map(l => l.id); };
function etiquetaPorNome(q, nome, criar) {
  const t = semAcento(nome.trim()); if (!t) return null;
  const es = etiquetasDe(q);
  return es.find(e => semAcento(e.nome) === t) || es.find(e => semAcento(e.nome).startsWith(t)) || (criar ? Data.put('etiquetas', { quadro: q.id, nome: nome.trim(), cor: CORES[es.length % CORES.length], ordem: es.length }, true) : null);
}
const comentar = (c, texto) => Data.put('comentarios', { cartao: c.id, autor: S.set.eu || '', texto, criado: Date.now() }, true);
// Ajuste "um valor por lista": abre um formulário com um campo para cada lista do quadro e grava em lista.d[chave].
async function porLista(q, titulo, chave, tipo, extra) {
  const ls = listasDe(q), v = await pedir(titulo, ls.map(l => Object.assign({ k: l.id, rot: l.nome, tipo, val: l.d[chave] == null ? (tipo === 'numero' ? 0 : '') : l.d[chave] }, extra)));
  if (!v) return;
  ls.forEach(l => { if (v[l.id] === '' || v[l.id] === 0 || (Array.isArray(v[l.id]) && !v[l.id].length)) delete l.d[chave]; else l.d[chave] = v[l.id]; Data.put('listas', l, true); });
  DB.changed(); R();
}

/* ===== Fluxo e limites ===== */
PUP({ id: 'wip', cat: 'fluxo', icone: '🚧', nome: 'Limites de WIP', desc: 'O coração do método Kanban: cada lista aceita um número máximo de cartões. A lista fica vermelha ao estourar e, se quiser, o quadro recusa o cartão a mais.',
  cfg: [{ k: 'bloquear', tipo: 'caixa', rot: 'Impedir a entrada quando a lista estiver cheia', val: false }, { tipo: 'info', rot: 'O limite de cada lista é definido no menu ⋯ da própria lista.' }],
  ao: { antesMover(c, de, para, q) { if (!para.limite || cruDaLista(para).length < para.limite) return; if (cfg('wip', q).bloquear) return `“${para.nome}” está no limite de ${para.limite} cartões. Termine algo antes de começar outro.`; toast(`Atenção: “${para.nome}” passou do limite de ${para.limite}.`); } } });

PUP({ id: 'sequencial', cat: 'fluxo', icone: '➡️', nome: 'Fluxo sequencial', desc: 'Os cartões só andam de uma etapa para a vizinha, sem pular fases. Opcionalmente, também não voltam.',
  cfg: [{ k: 'voltar', tipo: 'caixa', rot: 'Permitir voltar uma etapa', val: true }],
  ao: { antesMover(c, de, para, q) { const ls = listasDe(q), a = ls.findIndex(l => l.id === (de || {}).id), z = ls.findIndex(l => l.id === para.id); if (a < 0 || z < 0) return; if (z - a > 1) return 'Fluxo sequencial: o cartão precisa passar por “' + ls[a + 1].nome + '” antes.'; if (z < a && (!cfg('sequencial', q).voltar || a - z > 1)) return 'Fluxo sequencial: não é permitido voltar' + (cfg('sequencial', q).voltar ? ' mais de uma etapa.' : '.'); } } });

PUP({ id: 'limite-pessoa', cat: 'fluxo', icone: '🙋', nome: 'WIP por pessoa', desc: 'Limita quantos cartões cada membro pode ter em andamento ao mesmo tempo. Ninguém começa a quinta tarefa sem terminar alguma.',
  cfg: [{ k: 'max', rot: 'Máximo de cartões em andamento por pessoa', tipo: 'numero', val: 3 }, { k: 'bloquear', tipo: 'caixa', rot: 'Impedir o movimento (em vez de só avisar)', val: false }],
  ao: { antesMover(c, de, para, q) {
    const curso = emCurso(q), k = cfg('limite-pessoa', q);
    if (!curso.includes(para.id) || (de && curso.includes(de.id))) return;
    const cheio = mbs(c).find(m => vivos(q).filter(x => x.id !== c.id && curso.includes(x.lista) && lst(x.membros).includes(m.id)).length >= k.max);
    if (!cheio) return;
    const msg = `${cheio.nome} já tem ${k.max} cartões em andamento.`;
    if (k.bloquear) return msg; toast('Atenção: ' + msg);
  } } });

PUP({ id: 'arquivar-auto', cat: 'fluxo', icone: '🧹', nome: 'Arquivar concluídos', desc: 'Cartões concluídos há mais de alguns dias saem do quadro sozinhos e vão para o arquivo, de onde podem voltar.',
  cfg: [{ k: 'dias', rot: 'Arquivar depois de quantos dias concluído', tipo: 'numero', val: 7 }],
  ao: { abrir(q) { const lim = Date.now() - (cfg('arquivar-auto', q).dias || 7) * 864e5, cs = vivos(q).filter(c => c.feito && c.feito < lim); if (!cs.length) return; cs.forEach(c => { c.arquivado = true; salvar(c, true); }); DB.changed(); toast(cs.length + ' cartões concluídos foram arquivados'); } } });

const ORDENS = { prazo: ['Prazo mais próximo', (a, x) => (a.prazo || '9') < (x.prazo || '9') ? -1 : (a.prazo || '9') > (x.prazo || '9') ? 1 : 0], prio: ['Maior prioridade', (a, x) => x.prio - a.prio], titulo: ['Título (A–Z)', (a, x) => a.titulo.localeCompare(x.titulo, 'pt')], novo: ['Mais recentes', (a, x) => x.criado - a.criado], velho: ['Mais antigos na lista', (a, x) => a.entrou - x.entrou], pts: ['Mais pontos', (a, x) => (x.d.pts || 0) - (a.d.pts || 0)], valor: ['Maior valor', (a, x) => (x.d.valor || 0) - (a.d.valor || 0)] };
PUP({ id: 'ordenar-auto', cat: 'fluxo', icone: '↕️', nome: 'Ordenação automática', desc: 'As listas se mantêm sempre em ordem: por prazo, prioridade, título, data de criação, tempo na lista, pontos ou valor.',
  cfg: [{ k: 'por', rot: 'Ordenar por', tipo: 'lista', op: Object.entries(ORDENS).map(([k, v]) => [k, v[0]]), val: 'prazo' }, { k: 'feitos', tipo: 'caixa', rot: 'Concluídos sempre no fim', val: true }],
  ordenar(l, cs, q) { const k = cfg('ordenar-auto', q), f = (ORDENS[k.por] || ORDENS.prazo)[1]; return cs.slice().sort((a, x) => (k.feitos ? (a.feito ? 1 : 0) - (x.feito ? 1 : 0) : 0) || f(a, x)); } });

const CLASSES = { exp: ['🚨 Expresso', 'ruim'], fixa: ['📌 Data fixa', 'aviso'], pad: ['Padrão', 'neutro'], int: ['🌫️ Intangível', 'neutro'] };
PUP({ id: 'classes', cat: 'fluxo', icone: '🚨', nome: 'Classes de serviço', desc: 'Como no Kanban de verdade: expresso (fura a fila e vai para o topo), data fixa, padrão e intangível. A lista se organiza conforme a classe.',
  selo: c => c.d.classe && c.d.classe !== 'pad' ? `<span class="selo ${CLASSES[c.d.classe][1]}">${CLASSES[c.d.classe][0]}</span>` : '',
  classeCartao: c => c.d.classe === 'exp' && !c.feito ? 'expresso' : '',
  meta: c => metaF('Classe de serviço', `<select ${onC(v => { c.d.classe = v; log(c, 'Classe: ' + CLASSES[v][0]); salvar(c); R(); })}>${Object.entries(CLASSES).map(([k, v]) => `<option value="${k}" ${(c.d.classe || 'pad') === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`),
  ordenar: (l, cs) => { const p = c => c.feito ? 3 : c.d.classe === 'exp' ? 0 : c.d.classe === 'int' ? 2 : 1; return cs.slice().sort((a, x) => p(a) - p(x)); } });

PUP({ id: 'bloqueio', cat: 'fluxo', icone: '⛔', nome: 'Impedimentos', desc: 'Marque o cartão como bloqueado e diga o motivo. Ele ganha listras vermelhas, e o quadro pode proibir que avance enquanto o impedimento existir.',
  cfg: [{ k: 'impedir', tipo: 'caixa', rot: 'Cartão bloqueado não muda de lista', val: true }],
  classeCartao: c => c.d.bloq && !c.feito ? 'bloq' : '',
  selo: c => c.d.bloq ? `<span class="selo ruim" title="${esc(c.d.bloq)}">⛔ ${esc(c.d.bloq.slice(0, 24))}</span>` : '',
  lateral: c => lat(c.d.bloq ? '✅ Desbloquear' : '⛔ Bloquear…', async () => { if (c.d.bloq) { log(c, 'Desbloqueado (' + c.d.bloq + ')'); delete c.d.bloq; delete c.d.bloqEm; } else { const v = await pedir('Bloquear cartão', [{ k: 'm', rot: 'O que está impedindo?', ph: 'Ex.: aguardando resposta do cliente' }], { ok: 'Bloquear' }); if (!v) return; c.d.bloq = v.m || 'Bloqueado'; c.d.bloqEm = Date.now(); log(c, 'Bloqueado: ' + c.d.bloq); } salvar(c); R(); }),
  ao: { antesMover(c, de, para, q) { if (c.d.bloq && cfg('bloqueio', q).impedir) return 'Cartão bloqueado: ' + c.d.bloq; } },
  ferramentas: q => [['Ver os cartões bloqueados', () => mostrar('⛔ Impedimentos', () => `<div class="linhas">${vivos(q).filter(c => c.d.bloq).map(c => linhaC(c, `<small>${esc(c.d.bloq)} · há ${fDur(Date.now() - (c.d.bloqEm || Date.now()))}</small>`)).join('') || '<p class="vazio">Nenhum impedimento. 🎉</p>'}</div>`, 'medio')]] });

PUP({ id: 'politica', cat: 'fluxo', icone: '📜', nome: 'Políticas da lista', desc: 'Escreva as regras de cada etapa: o que precisa estar pronto para entrar e para sair (a “definição de pronto”). Um botão no topo da lista mostra o combinado.',
  config: q => porLista(q, 'Política de cada lista', 'pol', 'area', { linhas: 3, ph: 'Ex.: só entra com descrição e responsável; só sai com revisão feita.' }),
  cabLista: l => l.d.pol ? `<button class="lista-x" ${on(() => mostrar('📜 ' + l.nome, () => `<div class="md">${md(l.d.pol)}</div>`, 'medio'))} title="Política da lista">📜</button>` : '',
  ferramentas: q => [['Editar as políticas das listas', () => pup('politica').config(q)]] });

PUP({ id: 'estagnado', cat: 'fluxo', icone: '🐌', nome: 'Alerta de cartão parado', desc: 'Aponta os cartões que estão há dias demais na mesma etapa em andamento, antes que virem um problema.',
  cfg: [{ k: 'dias', rot: 'Considerar parado depois de quantos dias na lista', tipo: 'numero', val: 5 }],
  selo(c, q) { const d = naFase(c) / 864e5; return !c.feito && d >= (cfg('estagnado', q).dias || 5) && emCurso(q).includes(c.lista) ? `<span class="selo aviso" title="Parado nesta etapa">🐌 ${Math.floor(d)}d</span>` : ''; },
  ferramentas: q => [['Ver os cartões parados', () => mostrar('🐌 Cartões parados', () => { const n = cfg('estagnado', q).dias || 5; return `<div class="linhas">${vivos(q).filter(c => !c.feito && emCurso(q).includes(c.lista) && naFase(c) / 864e5 >= n).sort((a, x) => a.entrou - x.entrou).map(c => linhaC(c, `<span class="selo aviso">${fDur(naFase(c))}</span>`)).join('') || '<p class="vazio">Nada parado há mais de ' + n + ' dias.</p>'}</div>`; }, 'medio')]] });

PUP({ id: 'concluir-move', cat: 'fluxo', icone: '🏁', nome: 'Concluir move o cartão', desc: 'Marcar a bolinha de concluído leva o cartão direto para a lista de conclusão; reabrir devolve para a primeira lista.',
  ao: { concluir(c, q) { const l = byId(S.listas, c.lista); if (l && !l.feito) { const d = listasDe(q).find(x => x.feito); if (d) moverCartao(c, d, 0, true); } },
    reabrir(c, q) { const l = byId(S.listas, c.lista); if (l && l.feito) { const d = listasDe(q).find(x => !x.feito); if (d) moverCartao(c, d, null, true); } } } });

/* ===== Processos (no espírito do Pipefy) ===== */
PUP({ id: 'entrada', cat: 'processo', icone: '📥', nome: 'Formulário de entrada', desc: 'Um botão no topo abre um formulário padronizado para criar pedidos: título, descrição, prazo e os campos personalizados do quadro. Todo cartão nasce completo e na lista certa.',
  cfg: [{ k: 'rot', rot: 'Texto do botão', val: 'Novo pedido' }, { k: 'lista', rot: 'Lista de destino', tipo: 'lista', op: opListas, val: '' }, { k: 'desc', tipo: 'caixa', rot: 'Pedir descrição', val: true }, { k: 'prazo', tipo: 'caixa', rot: 'Pedir prazo', val: true }, { k: 'campos', tipo: 'caixa', rot: 'Pedir os campos personalizados', val: true }, { k: 'contato', tipo: 'caixa', rot: 'Pedir nome e contato do solicitante', val: false }],
  barra: q => `<button class="tb on" ${on(async () => {
    const k = cfg('entrada', q), fs = k.campos ? campos(q) : [], tp = { numero: 'numero', moeda: 'numero', data: 'data', lista: 'lista', caixa: 'caixa' };
    const v = await pedir(k.rot || 'Novo pedido', [{ k: 't', rot: 'Título' }].concat(k.desc ? [{ k: 'x', rot: 'Descrição', tipo: 'area', linhas: 4 }] : [], k.prazo ? [{ k: 'p', rot: 'Prazo', tipo: 'data' }] : [], k.contato ? [{ k: 'cn', rot: 'Solicitante' }, { k: 'ce', rot: 'E-mail ou telefone' }] : [], fs.map(f => ({ k: 'cf' + f.id, rot: f.nome, tipo: tp[f.tipo] || 'texto', op: f.tipo === 'lista' ? [''].concat(f.op) : null }))), { ok: 'Enviar', semSel: true });
    if (!v || !v.t) return;
    const cf = {}; fs.forEach(f => { const x = v['cf' + f.id]; if (x !== '' && x !== 0 && x !== false) cf[f.id] = f.tipo === 'caixa' ? 1 : x; });
    const d = { cf }; if (v.cn || v.ce) d.ct = { nome: v.cn || '', email: /@/.test(v.ce || '') ? v.ce : '', tel: /@/.test(v.ce || '') ? '' : v.ce || '' };
    const c = criarCartao(q, byId(S.listas, k.lista) || listasDe(q)[0], v.t, { texto: v.x || '', prazo: v.p || '', d });
    R(); toast('Pedido #' + c.num + ' criado', 'Abrir', () => abrirCartao(c));
  })}>📥 <span>${esc(cfg('entrada', q).rot || 'Novo pedido')}</span></button>` });

const REQ = { texto: ['Descrição', c => !!c.texto.trim()], prazo: ['Prazo', c => !!c.prazo], membros: ['Responsável', c => !!c.membros], etiquetas: ['Etiqueta', c => !!c.etiquetas], ck: ['Checklists completos', c => { const [ok, n] = ckTotal(c); return ok === n; }], anexo: ['Anexo', c => (c.d.an || []).length > 0], valor: ['Valor', c => !!c.d.valor], pts: ['Pontos', c => !!c.d.pts] };
PUP({ id: 'obrigatorios', cat: 'processo', icone: '❗', nome: 'Campos obrigatórios por etapa', desc: 'Defina o que o cartão precisa ter para entrar em cada lista: descrição, prazo, responsável, checklists completos ou qualquer campo personalizado. Sem isso, ele não passa.',
  config: q => porLista(q, 'Exigir para entrar em cada lista', 'obrig', 'multi', { op: Object.entries(REQ).map(([k, v]) => [k, v[0]]).concat(campos(q).map(f => ['cf:' + f.id, 'Campo: ' + f.nome])) }),
  ao: { antesMover(c, de, para, q) { const falta = (para.d.obrig || []).map(k => k.startsWith('cf:') ? (() => { const f = campos(q).find(x => x.id === k.slice(3)); return f && ((c.d.cf || {})[f.id] == null || (c.d.cf || {})[f.id] === '') ? f.nome : null; })() : REQ[k] && !REQ[k][1](c) ? REQ[k][0] : null).filter(Boolean); if (falta.length) return `Para entrar em “${para.nome}” falta: ${falta.join(', ')}.`; } },
  cabLista: l => (l.d.obrig || []).length ? `<span class="lista-x" title="Esta lista exige ${l.d.obrig.length} item(ns) para entrar">❗${l.d.obrig.length}</span>` : '',
  ferramentas: q => [['Definir os campos obrigatórios', () => pup('obrigatorios').config(q)]] });

PUP({ id: 'ck-fase', cat: 'processo', icone: '🧷', nome: 'Checklist automático da etapa', desc: 'Cada lista pode ter o seu roteiro. Quando o cartão entra na etapa, o checklist daquela fase é acrescentado sozinho.',
  config: q => porLista(q, 'Itens do checklist de cada lista (um por linha)', 'ckAuto', 'area', { linhas: 3 }),
  ao: { mover(c, de, para) { if (!para.d.ckAuto || (c.d.ck || []).some(k => k.de === para.id)) return; (c.d.ck = c.d.ck || []).push({ id: uid(), de: para.id, nome: para.nome, itens: String(para.d.ckAuto).split('\n').map(t => t.trim()).filter(Boolean).map(t => ({ id: uid(), t, ok: false })) }); salvar(c, true); },
    criar(c, q) { const l = byId(S.listas, c.lista); if (l) this.mover(c, null, l); } },
  ferramentas: q => [['Definir os checklists das etapas', () => pup('ck-fase').config(q)]] });

PUP({ id: 'aprovacao', cat: 'processo', icone: '✅', nome: 'Aprovação', desc: 'Botões de aprovar e recusar na ficha. Registra quem decidiu, quando e por quê, e manda o cartão para a lista certa em cada caso.',
  cfg: [{ k: 'sim', rot: 'Aprovado vai para', tipo: 'lista', op: opListasOpc, val: '' }, { k: 'nao', rot: 'Recusado vai para', tipo: 'lista', op: opListasOpc, val: '' }],
  selo: c => c.d.apr ? `<span class="selo ${c.d.apr.ok ? 'ok' : 'ruim'}">${c.d.apr.ok ? '✅ Aprovado' : '❌ Recusado'}</span>` : '',
  secao(c, q) {
    const a = c.d.apr, k = cfg('aprovacao', q);
    const decide = async ok => { const v = await pedir(ok ? 'Aprovar' : 'Recusar', [{ k: 'm', rot: ok ? 'Observação (opcional)' : 'Motivo', tipo: 'area', linhas: 3 }], { ok: ok ? 'Aprovar' : 'Recusar' }); if (!v) return; c.d.apr = { ok, por: (eu() || {}).nome || 'Você', em: Date.now(), m: v.m }; log(c, (ok ? 'Aprovado' : 'Recusado') + ' por ' + c.d.apr.por); if (v.m) comentar(c, (ok ? '✅ **Aprovado.** ' : '❌ **Recusado.** ') + v.m); salvar(c); const d = byId(S.listas, ok ? k.sim : k.nao); if (d && d.id !== c.lista) moverCartao(c, d); R(); };
    return sec('✅ Aprovação', a ? `<p><span class="selo ${a.ok ? 'ok' : 'ruim'}">${a.ok ? 'Aprovado' : 'Recusado'}</span> por <b>${esc(a.por)}</b> em ${fQuando(a.em)}${a.m ? ' — ' + esc(a.m) : ''} ${b('Refazer', () => { delete c.d.apr; salvar(c); R(); }, 'mini')}</p>` : `<div class="fl">${b('✅ Aprovar', () => decide(true), 'pri')}${b('❌ Recusar', () => decide(false), 'perigo')}<span class="dica">Aguardando decisão.</span></div>`);
  } });

PUP({ id: 'escalar', cat: 'processo', icone: '📣', nome: 'Escalonamento de atrasos', desc: 'Quando um prazo vence, o cartão sobe um nível de prioridade e recebe uma etiqueta de atraso, sem ninguém precisar lembrar.',
  cfg: [{ k: 'etq', rot: 'Etiqueta aplicada (em branco = nenhuma)', val: 'Atrasado' }, { k: 'prio', tipo: 'caixa', rot: 'Subir a prioridade em um nível', val: true }],
  ao: { minuto(q) { this.abrir(q); },
    abrir(q) { const k = cfg('escalar', q), cs = vivos(q).filter(c => atrasado(c) && c.d.esc !== c.prazo); if (!cs.length) return; const e = k.etq ? etiquetaPorNome(q, k.etq, true) : null; cs.forEach(c => { c.d.esc = c.prazo; if (k.prio) c.prio = Math.min(4, c.prio + 1); if (e && !lst(c.etiquetas).includes(e.id)) c.etiquetas = alt(c.etiquetas, e.id); log(c, 'Escalonado por atraso'); salvar(c, true); }); DB.changed(); R.depois(); } } });

PUP({ id: 'responsavel-fase', cat: 'processo', icone: '🧑‍🔧', nome: 'Responsável por etapa', desc: 'Cada lista pode ter um dono. Ao entrar na etapa, o cartão é atribuído automaticamente a essa pessoa.',
  config: q => S.membros.length ? porLista(q, 'Responsável de cada lista', 'resp', 'lista', { op: [['', '— ninguém —']].concat(membros().map(m => [m.id, m.nome])) }) : toast('Cadastre os membros primeiro, no menu ⋯ do quadro.'),
  ao: { mover(c, de, para) { const m = para.d.resp && byId(S.membros, para.d.resp); if (m && !lst(c.membros).includes(m.id)) { c.membros = alt(c.membros, m.id); log(c, 'Atribuído a ' + m.nome + ' (dono da etapa)'); salvar(c, true); } } },
  cabLista: l => l.d.resp && byId(S.membros, l.d.resp) ? avatar(byId(S.membros, l.d.resp)) : '' });

PUP({ id: 'prazo-fase', cat: 'processo', icone: '📆', nome: 'Prazo por etapa', desc: 'Ao entrar em uma lista, o cartão recebe um prazo novo: hoje mais os dias combinados para aquela fase.',
  config: q => porLista(q, 'Dias de prazo ao entrar em cada lista (0 = não mexer)', 'prazoDias', 'numero'),
  ao: { mover(c, de, para) { if (para.d.prazoDias > 0 && !para.feito) { c.prazo = mais(hoje(), Math.round(para.d.prazoDias)); log(c, 'Prazo da etapa: ' + fData(c.prazo)); salvar(c, true); } } } });

PUP({ id: 'motivo', cat: 'processo', icone: '📝', nome: 'Motivo de saída', desc: 'Ao mover um cartão para listas como “Perdido”, “Recusado” ou “Cancelado”, o app pergunta o motivo e guarda a resposta. Depois dá para ver o que mais derruba os pedidos.',
  cfg: [{ k: 'listas', rot: 'Perguntar o motivo ao entrar em', tipo: 'multi', op: opListas, val: [] }, { k: 'ops', rot: 'Motivos sugeridos (um por linha)', tipo: 'area', linhas: 4, val: 'Preço\nPrazo\nSem resposta\nDesistência' }],
  selo: c => c.d.motivo ? `<span class="selo neutro" title="Motivo">📝 ${esc(c.d.motivo.slice(0, 20))}</span>` : '',
  ao: { mover(c, de, para, q) { const k = cfg('motivo', q); if (!(k.listas || []).includes(para.id)) { if (c.d.motivo) { delete c.d.motivo; salvar(c, true); } return; } setTimeout(async () => { const ops = String(k.ops || '').split('\n').map(x => x.trim()).filter(Boolean), v = await pedir('Por que foi para “' + para.nome + '”?', [{ k: 'o', rot: 'Motivo', tipo: 'lista', op: ops.concat(['Outro']) }, { k: 'd', rot: 'Detalhes (opcional)', tipo: 'area', linhas: 3 }]); if (!v) return; c.d.motivo = v.o; comentar(c, '📝 **' + para.nome + ':** ' + v.o + (v.d ? ' — ' + v.d : '')); salvar(c); R(); }, 50); } },
  ferramentas: q => [['Motivos mais comuns', () => mostrar('📝 Motivos de saída', () => { const g = grupo(S.cartoes.filter(c => c.quadro === q.id && c.d.motivo && !c.lixo), c => c.d.motivo), d = Object.entries(g).map(([k, v]) => [k, v.length]).sort((a, x) => x[1] - a[1]); return d.length ? G.barras(d) : '<p class="vazio">Nenhum motivo registrado ainda.</p>'; }, 'medio')]] });

PUP({ id: 'fases', cat: 'processo', icone: '🧭', nome: 'Trilha de etapas na ficha', desc: 'Dentro do cartão, uma trilha mostra todas as fases do processo, onde o cartão está e quanto tempo ficou em cada uma. Um clique leva para outra etapa.',
  secao(c, q) { const ls = listasDe(q), at = ls.findIndex(l => l.id === c.lista), tl = c.d.tl || {}; return sec('🧭 Etapas', `<div class="passos">${ls.map((l, i) => `<button class="${i < at ? 'ok' : i === at ? 'on' : ''}" ${on(() => { if (l.id !== c.lista) { moverCartao(c, l); R(); } })} title="Mover para ${esc(l.nome)}"><b>${i < at ? '✓' : i + 1}</b><span>${esc(l.nome)}</span><small>${i === at && !c.feito ? fDur(naFase(c)) : tl[l.id] ? fDur(tl[l.id]) : '&nbsp;'}</small></button>`).join('')}</div>`); } });

PUP({ id: 'protocolo', cat: 'processo', icone: '🎫', nome: 'Número de protocolo', desc: 'Todo cartão novo recebe um protocolo no formato PREFIXO-ANO-0001, para citar em e-mails e atendimentos. Aparece na frente e entra na busca.',
  cfg: [{ k: 'pre', rot: 'Prefixo', val: 'PRT' }],
  selo: c => c.d.prot ? `<span class="selo neutro">🎫 ${esc(c.d.prot)}</span>` : '',
  ao: { criar(c, q) { q.d.protSeq = (q.d.protSeq || 0) + 1; salvarQ(q, true); c.d.prot = (cfg('protocolo', q).pre || 'PRT') + '-' + new Date().getFullYear() + '-' + String(q.d.protSeq).padStart(4, '0'); (c.d.cf = c.d.cf || {})._prot = c.d.prot; } },
  lateral: c => c.d.prot ? lat('🎫 Copiar protocolo', () => copiar(c.d.prot)) : '' });

const trocaVars = (t, c, q) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => ({ titulo: c.titulo, prazo: c.prazo ? fData(c.prazo) : 'sem prazo', lista: (byId(S.listas, c.lista) || {}).nome || '', quadro: q.nome, numero: '#' + c.num, protocolo: c.d.prot || '#' + c.num, contato: ((c.d.ct || {}).nome || '').split(' ')[0], responsavel: mbs(c).map(x => x.nome).join(', '), descricao: c.texto })[k] ?? m);
PUP({ id: 'email-modelo', cat: 'processo', icone: '📨', nome: 'E-mail modelo', desc: 'Um e-mail pronto para avisar o solicitante, com o assunto e o texto preenchidos a partir do cartão: {titulo}, {lista}, {prazo}, {protocolo}, {contato}.',
  cfg: [{ k: 'assunto', rot: 'Assunto', val: '[{protocolo}] {titulo}' }, { k: 'corpo', rot: 'Texto', tipo: 'area', linhas: 7, val: 'Olá, {contato}!\n\nSeu pedido “{titulo}” está agora na etapa “{lista}”.\nPrazo previsto: {prazo}.\n\nQualquer dúvida, é só responder este e-mail.' }, { tipo: 'info', rot: 'Variáveis: {titulo} {lista} {prazo} {protocolo} {numero} {contato} {responsavel} {quadro} {descricao}' }],
  lateral: (c, q) => lat('📨 E-mail modelo', () => { const k = cfg('email-modelo', q); location.href = 'mailto:' + encodeURIComponent((c.d.ct || {}).email || '') + '?subject=' + encodeURIComponent(trocaVars(k.assunto, c, q)) + '&body=' + encodeURIComponent(trocaVars(k.corpo, c, q)); log(c, 'E-mail modelo aberto'); salvar(c); }) });

/* ===== Automação ===== */
// Ações que regras e botões sabem executar. [rótulo, tipo do valor, executor(c, q, v)]
const ACOES = {
  mover: ['Mover para a lista…', 'lista', (c, q, v) => { const l = byId(S.listas, v); if (l && l.id !== c.lista) moverCartao(c, l); }],
  topo: ['Levar para o topo da lista', '', c => moverCartao(c, byId(S.listas, c.lista), 0)],
  etiqueta: ['Adicionar a etiqueta…', 'etiqueta', (c, q, v) => { if (v && !lst(c.etiquetas).includes(v)) c.etiquetas = alt(c.etiquetas, v); }],
  semEtiqueta: ['Remover a etiqueta…', 'etiqueta', (c, q, v) => { if (lst(c.etiquetas).includes(v)) c.etiquetas = alt(c.etiquetas, v); }],
  membro: ['Atribuir ao membro…', 'membro', (c, q, v) => { if (v && !lst(c.membros).includes(v)) c.membros = alt(c.membros, v); }],
  eu: ['Atribuir a mim', '', c => { if (S.set.eu && !lst(c.membros).includes(S.set.eu)) c.membros = alt(c.membros, S.set.eu); }],
  semMembro: ['Remover todos os membros', '', c => { c.membros = ''; }],
  prazo: ['Definir o prazo para daqui a … dias', 'numero', (c, q, v) => { c.prazo = mais(hoje(), Math.round(+v || 0)); }],
  semPrazo: ['Remover o prazo', '', c => { c.prazo = ''; c.hora = ''; }],
  prio: ['Definir a prioridade…', 'prio', (c, q, v) => { c.prio = +v || 0; }],
  feito: ['Marcar como concluído', '', c => marcarFeito(c, true, true)],
  reabrir: ['Reabrir', '', c => marcarFeito(c, false, true)],
  checklist: ['Adicionar um checklist (itens separados por ;)', 'texto', (c, q, v) => { (c.d.ck = c.d.ck || []).push({ id: uid(), nome: 'Checklist', itens: String(v).split(';').map(t => t.trim()).filter(Boolean).map(t => ({ id: uid(), t, ok: false })) }); }],
  comentar: ['Escrever um comentário…', 'texto', (c, q, v) => comentar(c, trocaVars(v, c, q))],
  capa: ['Pintar a capa…', 'cor', (c, q, v) => { c.capa = v; }],
  dia: ['Pôr no “Meu dia”', '', c => { c.d.dia = hoje(); }],
  arquivar: ['Arquivar', '', c => { c.arquivado = true; }],
};
function executar(c, q, acoes) { (acoes || []).forEach(a => { const f = ACOES[a.t]; if (f) { f[2](c, q, a.v); salvar(c, true); } }); DB.changed(); }
function descAcoes(q, acoes) { return (acoes || []).map(a => { const f = ACOES[a.t]; if (!f) return '?'; const v = f[1] === 'lista' ? (byId(S.listas, a.v) || {}).nome : f[1] === 'etiqueta' ? (byId(S.etiquetas, a.v) || {}).nome : f[1] === 'membro' ? (byId(S.membros, a.v) || {}).nome : f[1] === 'prio' ? PRIOS[a.v] : a.v; return f[0].replace(/…| …/g, '').replace(' (itens separados por ;)', '') + (f[1] ? ' “' + (v == null ? '?' : v) + '”' : ''); }).join(' + '); }
// Editor em dois passos: primeiro quais ações, depois o valor de cada uma.
async function editarAcoes(q, atuais, titulo) {
  const ops = [['', '— nada —']].concat(Object.entries(ACOES).map(([k, v]) => [k, v[0]])), at = atuais || [];
  const v = await pedir(titulo || 'O que fazer', [0, 1, 2].map(i => ({ k: 'a' + i, rot: (i + 1) + 'ª ação', tipo: 'lista', op: i ? ops : ops.slice(1), val: (at[i] || {}).t || (i ? '' : 'mover') })), { ok: 'Continuar' });
  if (!v) return null;
  const ts = [v.a0, v.a1, v.a2].filter(Boolean), comValor = ts.map((t, i) => [t, i]).filter(x => ACOES[x[0]][1]);
  let w = {};
  if (comValor.length) {
    w = await pedir('Detalhes das ações', comValor.map(([t, i]) => { const tp = ACOES[t][1], ant = (at.find(a => a.t === t) || {}).v; return { k: 'v' + i, rot: ACOES[t][0].replace('…', ''), val: ant, tipo: { lista: 'lista', etiqueta: 'lista', membro: 'lista', prio: 'lista', numero: 'numero', cor: 'cor' }[tp] || 'texto', op: tp === 'lista' ? opListas(q) : tp === 'etiqueta' ? etiquetasDe(q).map(e => [e.id, e.nome]) : tp === 'membro' ? membros().map(m => [m.id, m.nome]) : tp === 'prio' ? PRIOS.map((p, j) => [String(j), p]) : null }; }));
    if (!w) return null;
  }
  return ts.map((t, i) => ({ t, v: w['v' + i] == null ? '' : w['v' + i] }));
}
const regrasDe = (q, tipo) => S.regras.filter(r => r.quadro === q.id && r.tipo === tipo).sort((a, x) => a.ordem - x.ordem);
const GATS = { criar: 'Quando um cartão for criado', entrar: 'Quando um cartão entrar na lista', sair: 'Quando um cartão sair da lista', concluir: 'Quando um cartão for concluído', reabrir: 'Quando um cartão for reaberto', checklist: 'Quando um checklist for completado', vencer: 'Quando o prazo vencer', comentar: 'Quando alguém comentar' };
function rodarRegras(q, gat, c, lista) { regrasDe(q, 'regra').forEach(r => { if (!r.ativa || r.d.gat !== gat || (r.d.lista && lista && r.d.lista !== lista.id) || (r.d.lista && !lista && (gat === 'criar' || gat === 'entrar' || gat === 'sair'))) return; r.d.n = (r.d.n || 0) + 1; executar(c, q, r.d.acoes); }); }
// Tela comum para gerenciar regras, botões e agendamentos.
function gerirRegras(q, tipo, titulo, dica, desc, editar, prontas) {
  mostrar(titulo, () => `<p class="dica" style="margin-bottom:10px">${dica}</p><div class="linhas">${regrasDe(q, tipo).map(r => `<div class="regra ${r.ativa ? '' : 'off'}"><label class="chave"><input type="checkbox" ${r.ativa ? 'checked' : ''} ${onC(v => { r.ativa = v; Data.put('regras', r); R(); })}><i></i></label><p><b>${esc(r.nome)}</b><br><small class="dica">${esc(desc(r))}</small></p>${b('✎', () => editar(r), 'mini')}${b('🗑️', () => { Data.del('regras', r.id); R(); }, 'mini')}</div>`).join('') || '<p class="vazio">Nada por aqui ainda.</p>'}</div>
    <div class="botoes">${b('＋ Criar', () => editar(null), 'pri')}${(prontas || []).map(p => b('＋ ' + p[0], () => { Data.put('regras', Object.assign({ quadro: q.id, tipo, ativa: true, ordem: Date.now() % 1e9 }, p[1](q))); R(); })).join('')}</div>`, 'largo');
}
PUP({ id: 'automacoes', cat: 'auto', icone: '🤖', nome: 'Regras de automação', desc: 'Monte regras “quando acontecer isto, faça aquilo”: ao criar, entrar ou sair de uma lista, concluir, completar o checklist, vencer o prazo ou comentar, execute até três ações em sequência.',
  config(q) {
    const editar = async r => {
      const d = r ? r.d : {}, v = await pedir(r ? 'Editar regra' : 'Nova regra', [{ k: 'nome', rot: 'Nome da regra', val: r ? r.nome : '' }, { k: 'gat', rot: 'Gatilho', tipo: 'lista', op: Object.entries(GATS), val: d.gat || 'entrar' }, { k: 'lista', rot: 'Lista (para criar, entrar e sair)', tipo: 'lista', op: [['', 'Qualquer lista']].concat(opListas(q)), val: d.lista || '' }], { ok: 'Continuar' });
      if (!v) return;
      const acoes = await editarAcoes(q, d.acoes);
      if (!acoes) return;
      Data.put('regras', Object.assign(r || { quadro: q.id, tipo: 'regra', ativa: true, ordem: Date.now() % 1e9 }, { nome: v.nome || GATS[v.gat], d: Object.assign({}, d, { gat: v.gat, lista: v.lista, acoes }) })); R();
    };
    const fim = qq => (listasDe(qq).find(l => l.feito) || {}).id;
    gerirRegras(q, 'regra', '🤖 Regras de automação', 'Cada regra vigia um acontecimento do quadro e executa as ações na ordem.', r => GATS[r.d.gat] + (r.d.lista ? ' “' + ((byId(S.listas, r.d.lista) || {}).nome || '?') + '”' : '') + ' → ' + descAcoes(q, r.d.acoes) + (r.d.n ? ' · rodou ' + r.d.n + '×' : ''), editar,
      [['Checklist completo conclui', qq => ({ nome: 'Checklist completo conclui o cartão', d: { gat: 'checklist', acoes: fim(qq) ? [{ t: 'mover', v: fim(qq) }] : [{ t: 'feito' }] } })], ['Prazo vencido vira crítico', () => ({ nome: 'Prazo vencido vira prioridade crítica', d: { gat: 'vencer', acoes: [{ t: 'prio', v: '4' }, { t: 'topo' }] } })], ['Novo cartão ganha prazo', () => ({ nome: 'Cartão novo ganha prazo de 3 dias', d: { gat: 'criar', acoes: [{ t: 'prazo', v: 3 }] } })]]);
  },
  ao: { criar(c, q) { rodarRegras(q, 'criar', c, byId(S.listas, c.lista)); }, mover(c, de, para, q) { if (de) rodarRegras(q, 'sair', c, de); rodarRegras(q, 'entrar', c, para); }, concluir(c, q) { rodarRegras(q, 'concluir', c); }, reabrir(c, q) { rodarRegras(q, 'reabrir', c); }, checklist(c, k, q) { rodarRegras(q, 'checklist', c); }, comentar(c, t, q) { rodarRegras(q, 'comentar', c); },
    minuto(q) { if (!regrasDe(q, 'regra').some(r => r.ativa && r.d.gat === 'vencer')) return; const cs = vivos(q).filter(c => atrasado(c) && c.d.rv !== c.prazo); cs.forEach(c => { c.d.rv = c.prazo; salvar(c, true); rodarRegras(q, 'vencer', c); }); if (cs.length) R.depois(); } },
  ferramentas: q => [['Regras de automação (' + regrasDe(q, 'regra').filter(r => r.ativa).length + ' ativas)', () => pup('automacoes').config(q)]] });

PUP({ id: 'botoes-cartao', cat: 'auto', icone: '🔘', nome: 'Botões de cartão', desc: 'Crie os seus botões na ficha do cartão. Um clique executa várias ações de uma vez: “Começar” move, atribui a você e põe prazo; “Devolver” volta a etapa e comenta.',
  config(q) {
    const editar = async r => { const v = await pedir(r ? 'Editar botão' : 'Novo botão de cartão', [{ k: 'nome', rot: 'Texto do botão', val: r ? r.nome : '', ph: 'Ex.: ▶ Começar' }], { ok: 'Continuar' }); if (!v || !v.nome) return; const acoes = await editarAcoes(q, r ? r.d.acoes : null, 'Ao clicar em “' + v.nome + '”'); if (!acoes) return; Data.put('regras', Object.assign(r || { quadro: q.id, tipo: 'bcartao', ativa: true, ordem: Date.now() % 1e9 }, { nome: v.nome, d: { acoes } })); R(); };
    const l1 = qq => (listasDe(qq)[1] || listasDe(qq)[0]).id;
    gerirRegras(q, 'bcartao', '🔘 Botões de cartão', 'Os botões ativos aparecem na lateral da ficha de todo cartão deste quadro.', r => descAcoes(q, r.d.acoes), editar, [['“Começar”', qq => ({ nome: '▶ Começar', d: { acoes: [{ t: 'mover', v: l1(qq) }, { t: 'eu' }, { t: 'prazo', v: 2 }] } })], ['“Para hoje”', () => ({ nome: '☀ Para hoje', d: { acoes: [{ t: 'prazo', v: 0 }, { t: 'topo' }] } })]]);
  },
  lateral: (c, q) => regrasDe(q, 'bcartao').filter(r => r.ativa).map(r => lat(esc(r.nome), () => { executar(c, q, r.d.acoes); if (c.arquivado) U.cartao = ''; R(); toast('Feito: ' + descAcoes(q, r.d.acoes)); })).join('') });

PUP({ id: 'botoes-quadro', cat: 'auto', icone: '🎛️', nome: 'Botões de quadro', desc: 'Botões no topo do quadro que agem em vários cartões de uma vez: arquivar tudo o que está em “Feito”, mover a lista inteira, zerar prazos, atribuir em massa.',
  config(q) {
    const editar = async r => { const v = await pedir(r ? 'Editar botão' : 'Novo botão de quadro', [{ k: 'nome', rot: 'Texto do botão', val: r ? r.nome : '', ph: 'Ex.: 🧹 Limpar feitos' }, { k: 'lista', rot: 'Agir sobre os cartões de', tipo: 'lista', op: [['', 'Todas as listas']].concat(opListas(q)), val: r ? r.d.lista : '' }, { k: 'conf', tipo: 'caixa', rot: 'Pedir confirmação antes', val: r ? r.d.conf : true }], { ok: 'Continuar' }); if (!v || !v.nome) return; const acoes = await editarAcoes(q, r ? r.d.acoes : null, 'Em cada cartão…'); if (!acoes) return; Data.put('regras', Object.assign(r || { quadro: q.id, tipo: 'bquadro', ativa: true, ordem: Date.now() % 1e9 }, { nome: v.nome, d: { lista: v.lista, conf: v.conf, acoes } })); R(); };
    gerirRegras(q, 'bquadro', '🎛️ Botões de quadro', 'Cada botão aplica as ações a todos os cartões de uma lista (ou do quadro inteiro).', r => (r.d.lista ? 'Em “' + ((byId(S.listas, r.d.lista) || {}).nome || '?') + '”' : 'Em todo o quadro') + ': ' + descAcoes(q, r.d.acoes), editar,
      [['“Arquivar feitos”', qq => ({ nome: '🧹 Arquivar feitos', d: { lista: (listasDe(qq).find(l => l.feito) || {}).id || '', conf: true, acoes: [{ t: 'arquivar' }] } })]]);
  },
  barra: q => regrasDe(q, 'bquadro').filter(r => r.ativa).map(r => `<button class="tb" ${on(async () => { const cs = vivos(q).filter(c => !r.d.lista || c.lista === r.d.lista); if (!cs.length) return toast('Nenhum cartão para agir.'); if (r.d.conf && !await confirmar(`“${r.nome}” vai agir em ${cs.length} cartões. Continuar?`)) return; cs.forEach(c => executar(c, q, r.d.acoes)); R(); toast(cs.length + ' cartões atualizados'); })}>${esc(r.nome)}</button>`).join('') });

const FREQ = { dia: 'Todos os dias', util: 'Dias úteis', semana: 'Toda semana', mes: 'Todo mês' };
PUP({ id: 'agendadas', cat: 'auto', icone: '📅', nome: 'Cartões agendados', desc: 'O quadro cria cartões sozinho: todo dia, nos dias úteis, em um dia da semana ou do mês. Para rotinas, relatórios e fechamentos que não podem ser esquecidos.',
  config(q) {
    const editar = async r => { const d = r ? r.d : {}, v = await pedir(r ? 'Editar agendamento' : 'Novo cartão agendado', [{ k: 'nome', rot: 'Título do cartão', val: r ? r.nome : '' }, { k: 'freq', rot: 'Frequência', tipo: 'lista', op: Object.entries(FREQ), val: d.freq || 'semana' }, { k: 'sem', rot: 'Dia da semana (para “toda semana”)', tipo: 'lista', op: DIAS.map((x, i) => [String(i), x]), val: String(d.sem == null ? 1 : d.sem) }, { k: 'dm', rot: 'Dia do mês (para “todo mês”)', tipo: 'numero', val: d.dm || 1 }, { k: 'lista', rot: 'Criar na lista', tipo: 'lista', op: opListas(q), val: d.lista || '' }, { k: 'prazo', rot: 'Prazo em quantos dias (0 = no próprio dia, -1 = sem prazo)', tipo: 'numero', val: d.prazo == null ? 0 : d.prazo }, { k: 'ck', rot: 'Checklist (um item por linha, opcional)', tipo: 'area', linhas: 3, val: d.ck || '' }]); if (!v || !v.nome) return; Data.put('regras', Object.assign(r || { quadro: q.id, tipo: 'agenda', ativa: true, ordem: Date.now() % 1e9 }, { nome: v.nome, d: { freq: v.freq, sem: +v.sem, dm: Math.max(1, Math.min(31, Math.round(v.dm))), lista: v.lista, prazo: Math.round(v.prazo), ck: v.ck, ult: r ? d.ult : hoje() } })); R(); };
    gerirRegras(q, 'agenda', '📅 Cartões agendados', 'O cartão é criado na primeira vez que o Kanban estiver aberto no dia marcado. Um agendamento novo começa a valer a partir de amanhã.', r => FREQ[r.d.freq] + (r.d.freq === 'semana' ? ' (' + DIAS[r.d.sem] + ')' : r.d.freq === 'mes' ? ' (dia ' + r.d.dm + ')' : '') + ' em “' + ((byId(S.listas, r.d.lista) || {}).nome || '?') + '”' + (r.d.ult ? ' · último: ' + fData(r.d.ult) : ''), editar);
  },
  ao: { abrir(q) { this.minuto(q); },
    minuto(q) { const h = hoje(), d = new Date(); regrasDe(q, 'agenda').forEach(r => { if (!r.ativa || r.d.ult === h) return; const k = r.d, vale = k.freq === 'dia' || (k.freq === 'util' && d.getDay() % 6) || (k.freq === 'semana' && d.getDay() === k.sem) || (k.freq === 'mes' && d.getDate() === Math.min(k.dm, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); if (!vale) return; k.ult = h; Data.put('regras', r, true); const l = byId(S.listas, k.lista) || listasDe(q)[0]; if (!l) return; const dd = {}; if (k.ck) dd.ck = [{ id: uid(), nome: 'Checklist', itens: k.ck.split('\n').map(t => t.trim()).filter(Boolean).map(t => ({ id: uid(), t, ok: false })) }]; criarCartao(q, l, r.nome, { prazo: k.prazo >= 0 ? mais(h, k.prazo) : '', d: dd }); toast('📅 Cartão agendado criado: ' + r.nome); R.depois(); }); } },
  ferramentas: q => [['Cartões agendados (' + regrasDe(q, 'agenda').filter(r => r.ativa).length + ')', () => pup('agendadas').config(q)]] });

const SEMANA = { dom: 0, domingo: 0, seg: 1, segunda: 1, ter: 2, terca: 2, qua: 3, quarta: 3, qui: 4, quinta: 4, sex: 5, sexta: 5, sab: 6, sabado: 6 };
PUP({ id: 'captura', cat: 'auto', icone: '⚡', nome: 'Captura rápida', desc: 'Escreva tudo em uma linha ao criar o cartão: “Pagar boleto sexta às 14h #urgente @ana !!!”. O app entende o prazo, a hora, a etiqueta, o membro e a prioridade.',
  ao: { criar(c, q) {
    let t = ' ' + c.titulo + ' ', m; const h = hoje();
    t = t.replace(/\s#([\wÀ-ÿ-]+)/g, (x, n) => { const e = etiquetaPorNome(q, n, false); if (!e) return x; if (!lst(c.etiquetas).includes(e.id)) c.etiquetas = alt(c.etiquetas, e.id); return ' '; });
    t = t.replace(/\s@([\wÀ-ÿ-]+)/g, (x, n) => { const mb = membros().find(k => semAcento(k.nome).startsWith(semAcento(n))); if (!mb) return x; if (!lst(c.membros).includes(mb.id)) c.membros = alt(c.membros, mb.id); return ' '; });
    t = t.replace(/\s(!{1,4})(?=\s)/, (x, p) => { c.prio = p.length; return ' '; });
    t = t.replace(/\s(?:[àa]s\s)?(\d{1,2})(?:h(\d{2})?|:(\d{2}))(?=\s)/i, (x, hh, m1, m2) => { if (+hh > 23) return x; c.hora = pad(+hh) + ':' + (m1 || m2 || '00'); return ' '; });
    if (!c.prazo) {
      if ((m = t.match(/\s(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/))) { const a = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear(); let d = a + '-' + pad(+m[2]) + '-' + pad(+m[1]); if (!m[3] && d < h) d = (a + 1) + d.slice(4); if (+m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) { c.prazo = d; t = t.replace(m[0], ' '); } }
      else if ((m = t.match(/\s(hoje|amanh[ãa]|depois de amanh[ãa])(?=\s)/i))) { c.prazo = mais(h, /^hoje/i.test(m[1]) ? 0 : /^depois/i.test(m[1]) ? 2 : 1); t = t.replace(m[0], ' '); }
      else if ((m = t.match(/\s\+(\d{1,3})d(?=\s)/i))) { c.prazo = mais(h, +m[1]); t = t.replace(m[0], ' '); }
      else if ((m = t.match(/\s(dom|domingo|seg|segunda|ter|ter[çc]a|qua|quarta|qui|quinta|sex|sexta|s[áa]b|s[áa]bado)(?:-feira)?(?=\s)/i))) { const alvo = SEMANA[semAcento(m[1])]; if (alvo != null) { c.prazo = mais(h, ((alvo - new Date().getDay() + 7) % 7) || 7); t = t.replace(m[0], ' '); } }
    }
    if (c.hora && !c.prazo) c.prazo = h;
    c.titulo = t.replace(/\s+/g, ' ').trim() || c.titulo;
  } } });

PUP({ id: 'colar', cat: 'auto', icone: '📋', nome: 'Colar vira cartões', desc: 'Cole uma lista de várias linhas no campo de novo cartão e cada linha vira um cartão, já sem os marcadores (-, •, 1.) do texto original.' });

PUP({ id: 'modelos', cat: 'auto', icone: '📑', nome: 'Modelos de cartão', desc: 'Guarde um cartão como modelo, com descrição, checklists, etiquetas e campos, e crie cópias quando precisar. Ideal para tarefas que se repetem com o mesmo roteiro.',
  lateral: (c, q) => lat('📑 Salvar como modelo', async () => { const v = await pedir('Salvar como modelo de cartão', [{ k: 'n', rot: 'Nome do modelo', val: c.titulo }]); if (!v) return; const d = JSON.parse(JSON.stringify(c.d)); ['h', 'tl', 'ini', 'tt', 'pom', 'votos', 'apr', 'prot'].forEach(k => delete d[k]); (d.ck || []).forEach(k => k.itens.forEach(i => { i.ok = false; })); Data.put('modelos', { nome: v.n || c.titulo, tipo: 'cartao', d: { titulo: c.titulo, texto: c.texto, prio: c.prio, capa: c.capa, ets: etq(c).map(e => e.nome), d } }); toast('Modelo salvo'); }),
  ferramentas: q => [['Novo cartão a partir de modelo', async () => { const ms = S.modelos.filter(m => m.tipo === 'cartao'); if (!ms.length) return toast('Nenhum modelo ainda. Abra um cartão e clique em “Salvar como modelo”.'); const v = await pedir('Novo cartão a partir de modelo', [{ k: 'm', rot: 'Modelo', tipo: 'lista', op: ms.map(m => [m.id, m.nome]) }, { k: 't', rot: 'Título (em branco = o do modelo)' }, { k: 'l', rot: 'Lista', tipo: 'lista', op: opListas(q) }], { ok: 'Criar', extra: 'Excluir modelo' }); if (!v) return; if (v._extra) { const w = await pedir('Excluir qual modelo?', [{ k: 'm', rot: 'Modelo', tipo: 'lista', op: ms.map(m => [m.id, m.nome]) }], { ok: 'Excluir' }); if (w) { Data.del('modelos', w.m); toast('Modelo excluído'); } return; } const m = byId(S.modelos, v.m).d, c = criarCartao(q, byId(S.listas, v.l), v.t || m.titulo, { texto: m.texto || '', prio: m.prio || 0, capa: m.capa || '', etiquetas: (m.ets || []).map(n => etiquetaPorNome(q, n, true)).filter(Boolean).map(e => e.id).join(','), d: JSON.parse(JSON.stringify(m.d || {})) }); R(); abrirCartao(c); }]] });

PUP({ id: 'selecao', cat: 'auto', icone: '☑️', nome: 'Seleção múltipla', desc: 'Ctrl+clique (ou Shift+clique) seleciona vários cartões. Uma barra aparece para mover, etiquetar, atribuir, definir prazo, concluir ou arquivar todos de uma vez; arrastar um leva o grupo.',
  ferramentas: q => [['Selecionar todos os cartões visíveis', () => { visiveis(q).forEach(c => U.sel.add(c.id)); R(); }]] });

PUP({ id: 'prazo-auto', cat: 'auto', icone: '🗓️', nome: 'Prazo automático', desc: 'Todo cartão novo sem prazo ganha um: hoje mais alguns dias, contando só os dias úteis se você preferir.',
  cfg: [{ k: 'dias', rot: 'Dias a partir da criação', tipo: 'numero', val: 3 }, { k: 'uteis', tipo: 'caixa', rot: 'Contar só dias úteis', val: true }],
  ao: { criar(c, q) { if (c.prazo) return; const k = cfg('prazo-auto', q); c.prazo = k.uteis ? proximaData(hoje(), { t: 'u', n: k.dias }) : mais(hoje(), Math.round(k.dias)); } } });

PUP({ id: 'etiqueta-auto', cat: 'auto', icone: '🏷️', nome: 'Etiquetas por palavra-chave', desc: 'Ensine o quadro a etiquetar sozinho: se o título tiver “boleto”, etiqueta Financeiro; se tiver “erro”, etiqueta Bug.',
  cfg: [{ k: 'regras', rot: 'Uma regra por linha: palavra = Etiqueta', tipo: 'area', linhas: 6, val: 'urgente = Urgente\nreunião = Trabalho' }, { tipo: 'info', rot: 'A etiqueta é criada se ainda não existir. Maiúsculas e acentos não importam.' }],
  ao: { criar(c, q) { const t = semAcento(c.titulo); String(cfg('etiqueta-auto', q).regras || '').split('\n').forEach(l => { const [p, n] = l.split('=').map(x => (x || '').trim()); if (p && n && t.includes(semAcento(p))) { const e = etiquetaPorNome(q, n, true); if (e && !lst(c.etiquetas).includes(e.id)) c.etiquetas = alt(c.etiquetas, e.id); } }); } } });

PUP({ id: 'rodizio', cat: 'auto', icone: '🎠', nome: 'Rodízio de responsáveis', desc: 'Distribui os cartões novos entre as pessoas escolhidas, um para cada, em fila. Ninguém fica sobrecarregado e nada fica sem dono.',
  cfg: [{ k: 'quem', rot: 'Participam do rodízio', tipo: 'multi', op: () => membros().map(m => [m.id, m.nome]), val: [] }],
  ao: { criar(c, q) { const l = (cfg('rodizio', q).quem || []).filter(id => byId(S.membros, id)); if (!l.length || c.membros) return; q.d.rr = ((q.d.rr || 0) + 1) % l.length; c.membros = l[q.d.rr]; salvarQ(q, true); } } });

PUP({ id: 'desbloqueio', cat: 'auto', icone: '🔓', nome: 'Desbloqueio em cadeia', desc: 'Quando um cartão é concluído, os que dependiam dele são avisados; os que ficaram livres podem ir sozinhos para a lista de “prontos para começar”.',
  cfg: [{ k: 'lista', rot: 'Mover os cartões liberados para', tipo: 'lista', op: opListasOpc, val: '' }],
  ao: { concluir(c, q) { const lib = vivos(q).filter(x => (x.d.dep || []).includes(c.id) && !x.feito && !depsAbertas(x).length); if (!lib.length) return; const d = byId(S.listas, cfg('desbloqueio', q).lista); lib.forEach(x => { log(x, 'Liberado: “' + c.titulo + '” foi concluído'); salvar(x, true); if (d && x.lista !== d.id) moverCartao(x, d); }); toast('🔓 Liberado' + (lib.length > 1 ? 's' : '') + ': ' + lib.map(x => x.titulo).join(', ')); } } });

PUP({ id: 'limpeza', cat: 'auto', icone: '🧽', nome: 'Faxina do quadro', desc: 'Ferramentas de arrumação: arquivar tudo o que está concluído, achar cartões duplicados, remover etiquetas que ninguém usa e esvaziar listas arquivadas.',
  ferramentas: q => [
    ['Arquivar todos os concluídos', async () => { const cs = vivos(q).filter(c => c.feito); if (cs.length && await confirmar('Arquivar ' + cs.length + ' cartões concluídos?', 'Arquivar')) { cs.forEach(c => { c.arquivado = true; salvar(c, true); }); DB.changed(); R(); } else if (!cs.length) toast('Nenhum concluído.'); }],
    ['Encontrar cartões duplicados', () => mostrar('Cartões duplicados', () => { const g = Object.values(grupo(vivos(q), c => semAcento(c.titulo).replace(/\s+/g, ' ').trim())).filter(l => l.length > 1); return g.map(l => `<h3>${esc(l[0].titulo)}</h3><div class="linhas">${l.map(c => linhaC(c, b('🗑️', () => { c.lixo = Date.now(); salvar(c); R(); }, 'mini'))).join('')}</div>`).join('') || '<p class="vazio">Nenhum título repetido.</p>'; }, 'medio')],
    ['Remover etiquetas sem uso', async () => { const es = etiquetasDe(q).filter(e => !S.cartoes.some(c => !c.lixo && lst(c.etiquetas).includes(e.id))); if (!es.length) return toast('Todas as etiquetas estão em uso.'); if (await confirmar('Remover ' + es.length + ' etiquetas sem uso: ' + es.map(e => e.nome).join(', ') + '?', 'Remover')) { es.forEach(e => Data.del('etiquetas', e.id, true)); DB.changed(); R(); } }],
    ['Excluir o que está arquivado', async () => { const cs = S.cartoes.filter(c => c.quadro === q.id && c.arquivado && !c.lixo); if (!cs.length) return toast('Nada arquivado.'); if (await confirmar('Mandar ' + cs.length + ' cartões arquivados para a lixeira?', 'Excluir')) { cs.forEach(c => { c.lixo = Date.now(); salvar(c, true); }); DB.changed(); R(); } }]] });

function webhook(q, tipo, c, extra) { const k = cfg('webhook', q); if (!/^https?:\/\//.test(k.url || '') || !(k.eventos || []).includes(tipo)) return; try { fetch(k.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(Object.assign({ evento: tipo, quando: new Date().toISOString(), quadro: q.nome, cartao: { id: c.id, numero: c.num, titulo: c.titulo, lista: (byId(S.listas, c.lista) || {}).nome, prazo: c.prazo, etiquetas: etq(c).map(e => e.nome), membros: mbs(c).map(m => m.nome), concluido: !!c.feito } }, extra)) }).catch(() => {}); } catch (e) {} }
PUP({ id: 'webhook', cat: 'auto', icone: '📡', nome: 'Webhook de saída', desc: 'Avisa outros sistemas (Zapier, Make, n8n, Google Apps Script, Slack) quando um cartão é criado, movido ou concluído, enviando os dados em JSON para o endereço que você indicar.',
  cfg: [{ k: 'url', rot: 'Endereço que recebe o aviso (https://…)', val: '' }, { k: 'eventos', rot: 'Avisar quando um cartão for', tipo: 'multi', op: [['criar', 'Criado'], ['mover', 'Movido de lista'], ['concluir', 'Concluído']], val: ['criar', 'mover', 'concluir'] }, { tipo: 'info', rot: 'Os dados do cartão (título, lista, prazo, etiquetas e membros) saem deste aparelho para o endereço acima. Use só com serviços em que você confia.' }],
  ao: { criar(c, q) { setTimeout(() => webhook(q, 'criar', c), 0); }, mover(c, de, para, q) { webhook(q, 'mover', c, { de: de ? de.nome : null, para: para.nome }); }, concluir(c, q) { webhook(q, 'concluir', c); } } });
