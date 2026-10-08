'use strict';
/* Kanban — power-ups de vista: cada um acrescenta uma aba ao quadro. Todas respeitam o filtro. */

const V = { ord: '', dir: 1, grp: '', mes: 0, sem: 0, gan: 0, raia: 'membro', slide: 0 };
const mini = (c, q) => { const e = etq(c)[0]; return `<div class="mini-c ${c.feito ? 'feito' : atrasado(c) ? 'venc' : ''}" data-arr="cartao:${c.id}" style="--mc:${e ? e.cor : 'var(--pri)'}" title="${esc(c.titulo)}" ${on(() => abrirCartao(c))}>${c.hora ? c.hora + ' ' : ''}${esc(c.titulo)}</div>`; };
const tituloV = (t, extra) => `<div class="vt"><h2>${t}</h2><span class="esp"></span>${extra || ''}</div>`;
const nav3 = (k, rot) => `${b('◀', () => { V[k]--; R(); })}${b(rot || 'Hoje', () => { V[k] = 0; R(); })}${b('▶', () => { V[k]++; R(); })}`;

// Campos personalizados: editor de uma célula e texto para leitura.
function cfInput(c, f) {
  const v = (c.d.cf || {})[f.id], num = f.tipo === 'numero' || f.tipo === 'moeda';
  const set = x => { c.d.cf = c.d.cf || {}; if (x === '' || x == null) delete c.d.cf[f.id]; else c.d.cf[f.id] = x; salvar(c); R.depois(); };
  return f.tipo === 'lista' ? `<select ${onC(set)}><option value="">—</option>${(f.op || []).map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
    : f.tipo === 'caixa' ? `<input type="checkbox" ${v ? 'checked' : ''} ${onC(x => set(x ? 1 : ''))}>`
    : `<input type="${num ? 'number' : f.tipo === 'data' ? 'date' : 'text'}" ${num ? 'step="any"' : ''} value="${esc(v == null ? '' : v)}" ${onC(x => set(num ? (x === '' ? '' : Number(x)) : x))}>`;
}
const cfTexto = (f, v) => v == null || v === '' ? '' : f.tipo === 'moeda' ? fBRL(v) : f.tipo === 'data' ? fData(v) : f.tipo === 'caixa' ? '✓' : f.tipo === 'numero' ? fNum(v) : String(v);

// Quadro "pivô": colunas por uma propriedade qualquer; soltar um cartão numa coluna muda a propriedade.
const Pivo = { f: null };
Solta.pivo = (info, ds) => { const c = byId(S.cartoes, info.id); if (c && Pivo.f) { Pivo.f(c, ds.k); DB.changed(); } };
function pivo(q, cs, cols, chave, soltar, cls) {
  Pivo.f = soltar;
  const g = {}; cs.forEach(c => [].concat(chave(c)).forEach(k => (g[k] = g[k] || []).push(c)));
  return `<div class="${cls || 'raia-cols'}">${cols.map(k => `<div class="${cls ? 'quad' : 'raia-col'}" style="--qc:${k[2] || 'var(--borda)'}" data-solta="pivo" data-aceita="cartao" data-k="${esc(k[0])}"><${cls ? 'h3' : 'small'}>${k[1]} · ${(g[k[0]] || []).length}${k[3] || ''}</${cls ? 'h3' : 'small'}>${(g[k[0]] || []).map(c => cartaoHtml(c, q, true)).join('')}</div>`).join('')}</div>`;
}

PUP({ id: 'v-tabela', cat: 'vistas', icone: '▦', nome: 'Tabela', desc: 'Planilha no estilo Notion: uma linha por cartão, colunas ordenáveis, agrupamento, edição direta e totais. Mostra também os campos personalizados.',
  vista: { nome: 'Tabela', icone: '▦', render(q, cs) {
    const ls = listasDe(q), fs = campos(q), pts = ativo('estimativa', q), val = ativo('valor', q), pr = ativo('prioridade', q), num = ativo('numeracao', q);
    const cols = [num && ['num', '#', c => c.num], ['titulo', 'Título', c => c.titulo.toLowerCase()], ['lista', 'Lista', c => (byId(ls, c.lista) || {}).ordem], ['et', 'Etiquetas', c => (etq(c)[0] || {}).nome || '~'], ['mb', 'Membros', c => (mbs(c)[0] || {}).nome || '~'], ['prazo', 'Prazo', c => c.prazo || '9'],
      pr && ['prio', 'Prioridade', c => -c.prio], pts && ['pts', 'Pontos', c => -(c.d.pts || 0)], val && ['valor', 'Valor', c => -(c.d.valor || 0)]].filter(Boolean).concat(fs.map(f => ['cf' + f.id, f.nome, c => { const v = (c.d.cf || {})[f.id]; return v == null ? '~' : v; }, f]), [['feito', '✓', c => c.feito ? 1 : 0]]);
    const col = cols.find(k => k[0] === V.ord);
    const l = cs.slice().sort((a, x) => { if (!col) return ((byId(ls, a.lista) || {}).ordem - (byId(ls, x.lista) || {}).ordem) || a.ordem - x.ordem; const va = col[2](a), vx = col[2](x); return (va < vx ? -1 : va > vx ? 1 : 0) * V.dir; });
    const cel = (k, c) => k[0] === 'num' ? '#' + c.num : k[0] === 'titulo' ? esc(c.titulo)
      : k[0] === 'lista' ? `<select ${onC(v => { moverCartao(c, byId(S.listas, v)); R(); })}>${ls.map(x => `<option value="${x.id}" ${x.id === c.lista ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select>`
      : k[0] === 'et' ? `<span class="fl" ${on(el => popEtiquetas(el, c, q))}>${etq(c).map(chip).join('') || '<span class="dica">＋</span>'}</span>` : k[0] === 'mb' ? `<span class="fl" ${on(el => popMembros(el, c))}>${mbs(c).map(m => avatar(m)).join('') || '<span class="dica">＋</span>'}</span>`
      : k[0] === 'prazo' ? `<input type="date" value="${c.prazo}" class="${atrasado(c) ? 'erro' : ''}" ${onC(v => { c.prazo = v; salvar(c); R(); })}>`
      : k[0] === 'prio' ? `<select ${onC(v => { c.prio = +v; salvar(c); R(); })}>${PRIOS.map((p, i) => `<option value="${i}" ${c.prio === i ? 'selected' : ''}>${p}</option>`).join('')}</select>`
      : k[0] === 'pts' ? `<input type="number" style="width:70px" value="${c.d.pts || ''}" ${onC(v => { c.d.pts = +v || 0; salvar(c); R.depois(); })}>` : k[0] === 'valor' ? `<input type="number" step="any" style="width:110px" value="${c.d.valor || ''}" ${onC(v => { c.d.valor = +v || 0; salvar(c); R.depois(); })}>`
      : k[0] === 'feito' ? `<input type="checkbox" ${c.feito ? 'checked' : ''} ${onC(v => { marcarFeito(c, v); R(); })}>` : cfInput(c, k[3]);
    const linha = c => `<tr>${cols.map(k => `<td class="${k[0] === 'titulo' ? 't' + (c.feito ? ' risc' : '') : ''}" ${k[0] === 'titulo' ? on(() => abrirCartao(c)) : ''}>${cel(k, c)}</td>`).join('')}</tr>`;
    const gk = { lista: c => (byId(ls, c.lista) || {}).nome || '—', et: c => (etq(c)[0] || {}).nome || 'Sem etiqueta', mb: c => (mbs(c)[0] || {}).nome || 'Sem membro', prio: c => PRIOS[c.prio], feito: c => c.feito ? 'Concluídos' : 'Em aberto' }[V.grp];
    const corpo = gk ? Object.entries(grupo(l, gk)).map(([k, g]) => `<tr class="grp"><td colspan="${cols.length}">${esc(k)} · ${g.length}</td></tr>` + g.map(linha).join('')).join('') : l.map(linha).join('');
    const tot = k => k[0] === 'titulo' ? l.length + ' cartões' : k[0] === 'pts' ? fNum(soma(l, c => c.d.pts)) : k[0] === 'valor' ? fBRL(soma(l, c => c.d.valor)) : k[3] && (k[3].tipo === 'numero' || k[3].tipo === 'moeda') ? cfTexto(k[3], soma(l, c => (c.d.cf || {})[k[3].id])) : k[0] === 'feito' ? l.filter(c => c.feito).length : '';
    return `<div class="painelv">${tituloV('Tabela', `<label class="fl">Agrupar por <select ${onC(v => { V.grp = v; R(); })}>${[['', 'Nada'], ['lista', 'Lista'], ['et', 'Etiqueta'], ['mb', 'Membro'], ['prio', 'Prioridade'], ['feito', 'Situação']].map(o => `<option value="${o[0]}" ${V.grp === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>${b('＋ Cartão', async () => { const v = await pedir('Novo cartão', [{ k: 't', rot: 'Título' }, { k: 'l', rot: 'Lista', tipo: 'lista', op: ls.map(x => [x.id, x.nome]) }], { ok: 'Criar' }); if (v && v.t) { criarCartao(q, byId(ls, v.l), v.t); R(); } }, 'pri')}`)}
      <div class="tabw"><table class="tab"><thead><tr>${cols.map(k => `<th ${on(() => { if (V.ord === k[0]) { if (V.dir === 1) V.dir = -1; else { V.ord = ''; V.dir = 1; } } else { V.ord = k[0]; V.dir = 1; } R(); })}>${esc(k[1])}${V.ord === k[0] ? (V.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>${corpo}</tbody><tfoot><tr>${cols.map(k => `<td>${tot(k)}</td>`).join('')}</tr></tfoot></table></div></div>`;
  } } });
const PRIOS = ['—', 'Baixa', 'Média', 'Alta', 'Crítica'];

PUP({ id: 'v-lista', cat: 'vistas', icone: '☰', nome: 'Lista', desc: 'Tudo em uma lista corrida, agrupada pelas etapas do quadro, com caixinha de concluir e adição rápida.',
  vista: { nome: 'Lista', icone: '☰', render(q, cs) {
    return `<div class="painelv">${tituloV('Lista')}${listasDe(q).map(l => { const g = cs.filter(c => c.lista === l.id).sort((a, x) => a.ordem - x.ordem); return `<h3 style="margin-top:14px">${esc(l.nome)} · ${g.length}</h3><div class="linhas">${g.map(c => `<div class="linha"><input type="checkbox" ${c.feito ? 'checked' : ''} ${onC(v => { marcarFeito(c, v); R(); })}><b class="${c.feito ? 'risc' : ''}" style="cursor:pointer;flex:1" ${on(() => abrirCartao(c))}>${esc(c.titulo)}</b>${etq(c).map(e => `<span class="et g" style="background:${e.cor};color:${claro(e.cor) ? '#111' : '#fff'}"><b>${esc(e.nome)}</b></span>`).join('')}${c.prazo ? `<span class="selo prazo ${atrasado(c) ? 'venc' : ''}">🕒 ${fData(c.prazo)}</span>` : ''}${mbs(c).map(m => avatar(m)).join('')}</div>`).join('')}
      <input class="cheio" data-k="vl-${l.id}" placeholder="＋ Adicionar em ${esc(l.nome)}… (Enter)" ${onE(v => { if (v.trim()) { criarCartao(q, l, v); U.foco = 'vl-' + l.id; R(); } })}></div>`; }).join('')}</div>`;
  } } });

Solta.dia = (info, ds) => { const c = byId(S.cartoes, info.id); if (c && c.prazo !== ds.dia) { c.prazo = ds.dia; log(c, 'Prazo: ' + fData(ds.dia)); salvar(c); } };
const novoNoDia = async (q, dia) => { const ls = listasDe(q), v = await pedir('Novo cartão em ' + fData(dia), [{ k: 't', rot: 'Título' }, { k: 'l', rot: 'Lista', tipo: 'lista', op: ls.map(x => [x.id, x.nome]) }], { ok: 'Criar' }); if (v && v.t) { criarCartao(q, byId(ls, v.l), v.t, { prazo: dia }); R(); } };
PUP({ id: 'v-calendario', cat: 'vistas', icone: '📅', nome: 'Calendário', desc: 'O mês inteiro com os cartões no dia do prazo. Arraste um cartão para outro dia para mudar o prazo; clique no dia para criar.',
  vista: { nome: 'Calendário', icone: '📅', render(q, cs) {
    const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + V.mes);
    const ini = new Date(base); ini.setDate(1 - ini.getDay());
    const pd = grupo(cs.filter(c => c.prazo), c => c.prazo), h = hoje(), sem = cs.filter(c => !c.prazo && !c.feito);
    let cel = '';
    for (let i = 0; i < 42; i++) { const d = new Date(ini); d.setDate(ini.getDate() + i); const k = ymd(d), l = (pd[k] || []).sort((a, x) => (a.hora || '99') < (x.hora || '99') ? -1 : 1); cel += `<div class="dia ${d.getMonth() !== base.getMonth() ? 'fora' : ''} ${k === h ? 'hj' : ''}" data-solta="dia" data-aceita="cartao" data-dia="${k}"><b><span>${d.getDate()}</span><button ${on(() => novoNoDia(q, k))} title="Novo cartão neste dia">＋</button></b>${l.slice(0, 5).map(c => mini(c, q)).join('')}${l.length > 5 ? `<small class="dica">+${l.length - 5}</small>` : ''}</div>`; }
    return `<div class="painelv">${tituloV(MESESL[base.getMonth()] + ' de ' + base.getFullYear(), nav3('mes'))}<div class="cal">${DIAS.map(d => `<div class="dn">${d}</div>`).join('')}${cel}</div>
      ${sem.length ? `<h3 style="margin-top:14px">Sem prazo · ${sem.length} <small class="dica">arraste para um dia</small></h3><div class="grade" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:5px">${sem.slice(0, 60).map(c => mini(c, q)).join('')}</div>` : ''}</div>`;
  } } });

PUP({ id: 'v-semana', cat: 'vistas', icone: '🗓️', nome: 'Semana', desc: 'Sete colunas, uma por dia. Arraste os cartões entre os dias para planejar a semana.',
  vista: { nome: 'Semana', icone: '🗓️', render(q, cs) {
    const d0 = new Date(); d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7) + V.sem * 7);
    const dias = [...Array(7)].map((_, i) => { const d = new Date(d0); d.setDate(d0.getDate() + i); return ymd(d); }), h = hoje();
    return `<div class="painelv">${tituloV('Semana de ' + fData(dias[0]) + ' a ' + fData(dias[6]), nav3('sem', 'Esta semana'))}<div style="overflow:auto">${pivo(q, cs.filter(c => dias.includes(c.prazo)), dias.map(k => [k, (k === h ? '● ' : '') + DIAS[dt(k).getDay()] + ' ' + dt(k).getDate(), k === h ? 'var(--pri)' : '']), c => c.prazo, (c, k) => { c.prazo = k; salvar(c, true); })}</div>
      <h3 style="margin-top:14px">Sem prazo</h3><div class="grade" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:5px">${cs.filter(c => !c.prazo && !c.feito).slice(0, 40).map(c => mini(c, q)).join('') || '<span class="dica">Nada sem prazo.</span>'}</div></div>`;
  } } });

PUP({ id: 'v-agenda', cat: 'vistas', icone: '📆', nome: 'Agenda', desc: 'Os prazos em ordem: vencidos, hoje, amanhã, esta semana, depois. Bom para a revisão do dia.',
  vista: { nome: 'Agenda', icone: '📆', render(q, cs) {
    const h = hoje(), ab = cs.filter(c => !c.feito && c.prazo).sort((a, x) => (a.prazo + a.hora) < (x.prazo + x.hora) ? -1 : 1);
    const gs = [['⚠️ Vencidos', c => c.prazo < h], ['Hoje', c => c.prazo === h], ['Amanhã', c => c.prazo === mais(h, 1)], ['Próximos 7 dias', c => c.prazo > mais(h, 1) && c.prazo <= mais(h, 7)], ['Depois', c => c.prazo > mais(h, 7)]];
    return `<div class="painelv">${tituloV('Agenda')}${gs.map(g => { const l = ab.filter(g[1]); return l.length ? `<h3 style="margin-top:14px">${g[0]} · ${l.length}</h3><div class="linhas">${l.map(c => `<button class="linha" ${on(() => abrirCartao(c))}><span class="selo prazo ${c.prazo < h ? 'venc' : c.prazo === h ? 'hoje' : 'neutro'}">${DIAS[dt(c.prazo).getDay()]} ${fData(c.prazo)}${c.hora ? ' ' + c.hora : ''}</span><b>${esc(c.titulo)}</b><small>${esc((byId(S.listas, c.lista) || {}).nome || '')}</small><span class="esp"></span>${mbs(c).map(m => avatar(m)).join('')}</button>`).join('')}</div>` : ''; }).join('') || '<p class="vazio">Nenhum prazo em aberto. 🎉</p>'}</div>`;
  } } });

PUP({ id: 'v-cronograma', cat: 'vistas', icone: '📊', nome: 'Cronograma (Gantt)', desc: 'Barras do início ao prazo de cada cartão, em seis semanas. Use com o power-up “Data de início” para ver a duração.',
  vista: { nome: 'Cronograma', icone: '📊', render(q, cs) {
    const N = 42, h = hoje(), d0 = mais(h, -7 + V.gan * 7), fim = mais(d0, N - 1), W = 30;
    const l = cs.filter(c => c.prazo || c.inicio).map(c => ({ c, a: c.inicio || c.prazo, z: c.prazo || c.inicio })).map(x => x.a > x.z ? { c: x.c, a: x.z, z: x.a } : x).sort((a, x) => a.a < x.a ? -1 : 1);
    const cab = [...Array(N)].map((_, i) => { const k = mais(d0, i), d = dt(k); return `<div class="g-cab ${d.getDay() % 6 ? '' : 'fds'} ${k === h ? 'hj' : ''}" style="grid-row:1;grid-column:${i + 2}">${d.getDate() === 1 || !i ? MESES[d.getMonth()] + '<br>' : '<br>'}${d.getDate()}</div>`; }).join('');
    const linhas = l.map((x, r) => { const a = Math.max(0, difDias(x.a, d0)), z = Math.min(N - 1, difDias(x.z, d0)), e = etq(x.c)[0], vis = x.z >= d0 && x.a <= fim;
      return `<div class="g-nome" style="grid-row:${r + 2};grid-column:1" ${on(() => abrirCartao(x.c))}>${esc(x.c.titulo)}</div><div class="g-cel" style="grid-row:${r + 2};grid-column:2/-1;background-image:repeating-linear-gradient(90deg,var(--borda) 0 1px,transparent 1px ${W}px)"></div>${vis ? `<div class="g-bar ${x.c.feito ? 'feito' : ''}" style="grid-row:${r + 2};grid-column:${a + 2}/${z + 3};--gc:${atrasado(x.c) ? 'var(--erro)' : e ? e.cor : 'var(--pri)'}" title="${esc(x.c.titulo)}: ${fData(x.a)} a ${fData(x.z)}" ${on(() => abrirCartao(x.c))}>${esc(x.c.titulo)}</div>` : ''}`; }).join('');
    return `<div class="painelv">${tituloV('Cronograma · ' + fData(d0) + ' a ' + fData(fim), nav3('gan'))}${l.length ? `<div class="gantt"><div class="gantt-g" style="grid-template-columns:minmax(140px,240px) repeat(${N},${W}px)"><div class="g-nome cab" style="grid-row:1;grid-column:1">Cartão</div>${cab}${linhas}</div></div>` : '<p class="vazio">Nenhum cartão com prazo ou data de início.</p>'}</div>`;
  } } });

PUP({ id: 'v-painel', cat: 'vistas', icone: '📈', nome: 'Painel', desc: 'Indicadores e gráficos do quadro: cartões por lista, etiqueta e membro, prazos dos próximos dias e criados × concluídos.',
  vista: { nome: 'Painel', icone: '📈', render(q, cs) {
    const h = hoje(), ab = cs.filter(c => !c.feito), fe = cs.filter(c => c.feito), s7 = Date.now() - 7 * 864e5;
    const kpi = (n, r, cls) => `<div class="kpi ${cls || ''}"><b>${n}</b><small>${r}</small></div>`;
    const porLista = listasDe(q).map(l => [l.nome, cs.filter(c => c.lista === l.id).length, l.cor || (l.feito ? 'var(--ok)' : 'var(--pri)')]);
    const porEt = etiquetasDe(q).map(e => [e.nome, cs.filter(c => lst(c.etiquetas).includes(e.id)).length, e.cor]).filter(x => x[1]);
    const porMb = membros().map(m => [m.nome.split(' ')[0], ab.filter(c => lst(c.membros).includes(m.id)).length, m.cor]);
    const dias = [...Array(14)].map((_, i) => mais(h, i)), sem = [...Array(8)].map((_, i) => 7 - i);
    const semK = t => Math.floor((Date.now() - t) / (7 * 864e5));
    return `<div class="painelv">${tituloV('Painel')}<div class="kpis">${kpi(cs.length, 'cartões')}${kpi(ab.length, 'em aberto')}${kpi(fe.length, 'concluídos', 'bom')}${kpi(ab.filter(c => c.prazo && c.prazo < h).length, 'vencidos', 'ruim')}${kpi(ab.filter(c => c.prazo === h).length, 'para hoje')}${kpi(fe.filter(c => c.feito > s7).length, 'concluídos em 7 dias', 'bom')}${kpi(cs.length ? Math.round(fe.length / cs.length * 100) + '%' : '—', 'do quadro concluído')}</div>
      <div class="grafs"><div class="cx-graf"><h3>Cartões por lista</h3>${G.barras(porLista)}</div>
      <div class="cx-graf"><h3>Por etiqueta</h3>${porEt.length ? G.rosca(porEt) : '<p class="vazio">Sem etiquetas em uso.</p>'}</div>
      <div class="cx-graf"><h3>Em aberto por membro</h3>${porMb.length ? G.barras(porMb.concat([['Ninguém', ab.filter(c => !c.membros).length, '#9aa3af']])) : '<p class="vazio">Cadastre membros no menu do quadro.</p>'}</div>
      <div class="cx-graf"><h3>Prazos dos próximos 14 dias</h3>${G.barras(dias.map(d => [dt(d).getDate(), ab.filter(c => c.prazo === d).length, d === h ? 'var(--aviso)' : 'var(--pri)']))}</div>
      <div class="cx-graf"><h3>Criados × concluídos (8 semanas)</h3>${G.linhas([{ nome: 'Criados', cor: '#2D7DD2', pts: sem.map(k => cs.filter(c => semK(c.criado) === k).length) }, { nome: 'Concluídos', cor: '#2FA05A', pts: sem.map(k => fe.filter(c => semK(c.feito) === k).length) }], sem.map(k => k ? '-' + k + 's' : 'agora'))}</div>
      <div class="cx-graf"><h3>Situação</h3>${G.rosca([['Em aberto', ab.length - ab.filter(c => atrasado(c)).length, '#2D7DD2'], ['Vencidos', ab.filter(c => atrasado(c)).length, '#E0483C'], ['Concluídos', fe.length, '#2FA05A']])}</div></div></div>`;
  } } });

PUP({ id: 'v-galeria', cat: 'vistas', icone: '🖼️', nome: 'Galeria', desc: 'Os cartões como uma grade de fichas com capa, no estilo da galeria do Notion.',
  vista: { nome: 'Galeria', icone: '🖼️', render(q, cs) { return `<div class="painelv">${tituloV('Galeria')}<div class="grade">${cs.map(c => cartaoHtml(c, q)).join('') || '<p class="vazio">Nenhum cartão.</p>'}</div></div>`; } } });

Solta.raia = (info, ds) => {
  const c = byId(S.cartoes, info.id), l = byId(S.listas, ds.lista);
  if (!c || !l) return;
  if (c.lista !== l.id && !moverCartao(c, l)) return;
  const k = ds.k === '-' ? '' : ds.k;
  if (V.raia === 'membro') c.membros = k; else if (V.raia === 'prio') c.prio = +k || 0; else { const es = lst(c.etiquetas); es.shift(); if (k) es.unshift(k); c.etiquetas = es.join(','); }
  salvar(c);
};
PUP({ id: 'v-raias', cat: 'vistas', icone: '🏊', nome: 'Raias', desc: 'O quadro cortado em faixas horizontais por membro, etiqueta ou prioridade. Arrastar muda a etapa e a raia de uma vez.',
  vista: { nome: 'Raias', icone: '🏊', render(q, cs) {
    const ls = listasDe(q).filter(l => !l.fechada);
    const rs = V.raia === 'membro' ? membros().map(m => [m.id, avatar(m) + ' ' + esc(m.nome)]) : V.raia === 'prio' ? [4, 3, 2, 1].map(p => [String(p), PRIOS[p]]) : etiquetasDe(q).map(e => [e.id, chip(e) + ' ' + esc(e.nome)]);
    rs.push([V.raia === 'prio' ? '0' : '-', V.raia === 'membro' ? 'Sem membro' : V.raia === 'prio' ? 'Sem prioridade' : 'Sem etiqueta']);
    const ch = c => V.raia === 'membro' ? lst(c.membros)[0] || '-' : V.raia === 'prio' ? String(c.prio) : lst(c.etiquetas)[0] || '-';
    return `<div class="painelv" style="background:transparent;box-shadow:none;padding:0">${tituloV('<span style="color:#fff">Raias</span>', `<div class="seg">${[['membro', 'Membro'], ['etiqueta', 'Etiqueta'], ['prio', 'Prioridade']].map(o => `<button class="${V.raia === o[0] ? 'on' : ''}" ${on(() => { V.raia = o[0]; R(); })}>${o[1]}</button>`).join('')}</div>`)}
      <div class="raias">${rs.map(r => { const g = cs.filter(c => ch(c) === r[0]); return g.length || r[0] !== '-' && r[0] !== '0' ? `<div class="raia"><h3>${r[1]} <small class="dica">${g.length}</small></h3><div class="raia-cols">${ls.map(l => `<div class="raia-col" data-solta="raia" data-aceita="cartao" data-lista="${l.id}" data-k="${r[0]}"><small>${esc(l.nome)}</small>${g.filter(c => c.lista === l.id).sort((a, x) => a.ordem - x.ordem).map(c => cartaoHtml(c, q, true)).join('')}</div>`).join('')}</div></div>` : ''; }).join('')}</div></div>`;
  } } });

PUP({ id: 'v-matriz', cat: 'vistas', icone: '🧮', nome: 'Matriz de Eisenhower', desc: 'Urgente × importante em quatro quadrantes. Importante é prioridade alta ou crítica; urgente é prazo em até dois dias. Arrastar ajusta os dois.',
  vista: { nome: 'Matriz', icone: '🧮', render(q, cs) {
    const h = hoje(), urg = c => !!c.prazo && c.prazo <= mais(h, 2), imp = c => c.prio >= 3;
    return `<div class="painelv">${tituloV('Matriz de Eisenhower')}${pivo(q, cs.filter(c => !c.feito), [['11', '🔥 Fazer agora', '#E0483C', ' <small class="dica">urgente e importante</small>'], ['01', '📅 Agendar', '#2D7DD2', ' <small class="dica">importante, sem urgência</small>'], ['10', '🤝 Delegar', '#E8B81F', ' <small class="dica">urgente, pouco importante</small>'], ['00', '🗑️ Eliminar', '#9aa3af', ' <small class="dica">nem um, nem outro</small>']],
      c => (urg(c) ? '1' : '0') + (imp(c) ? '1' : '0'), (c, k) => { if (k[1] === '1' && !imp(c)) c.prio = 3; if (k[1] === '0' && imp(c)) c.prio = 1; if (k[0] === '1' && !urg(c)) c.prazo = h; if (k[0] === '0' && urg(c)) c.prazo = mais(h, 7); salvar(c, true); }, 'matriz')}</div>`;
  } } });

PUP({ id: 'v-carga', cat: 'vistas', icone: '⚖️', nome: 'Carga da equipe', desc: 'Uma coluna por pessoa com o que está em aberto, e a carga em cartões e pontos. Arraste para redistribuir o trabalho.',
  cfg: [{ k: 'max', rot: 'Carga máxima por pessoa (cartões)', tipo: 'numero', val: 6 }],
  vista: { nome: 'Carga', icone: '⚖️', render(q, cs) {
    const ab = cs.filter(c => !c.feito), mx = cfg('v-carga', q).max || 6, pts = ativo('estimativa', q);
    const carga = id => { const g = ab.filter(c => id === '-' ? !c.membros : lst(c.membros).includes(id)), n = g.length; return `<div class="barra" style="margin:4px 0"><i class="${n > mx ? 'ruim' : ''}" style="width:${Math.min(100, n / mx * 100)}%"></i></div><small class="dica">${n}/${mx} cartões${pts ? ' · ' + fNum(soma(g, c => c.d.pts)) + ' pts' : ''}</small>`; };
    return `<div class="painelv">${tituloV('Carga da equipe')}${S.membros.length ? `<div style="overflow:auto">${pivo(q, ab, membros().map(m => [m.id, avatar(m) + ' ' + esc(m.nome), m.cor, carga(m.id)]).concat([['-', 'Sem membro', '', carga('-')]]), c => lst(c.membros).length ? lst(c.membros) : '-', (c, k) => { c.membros = k === '-' ? '' : k; salvar(c, true); })}</div>` : '<p class="vazio">Cadastre membros no menu ⋯ do quadro.</p>'}</div>`;
  } } });

PUP({ id: 'v-etiquetas', cat: 'vistas', icone: '🏷️', nome: 'Quadro por etiqueta', desc: 'As mesmas tarefas, com uma coluna por etiqueta. Soltar um cartão em outra coluna troca a etiqueta principal.',
  vista: { nome: 'Por etiqueta', icone: '🏷️', render(q, cs) {
    return `<div class="painelv">${tituloV('Por etiqueta')}<div style="overflow:auto">${pivo(q, cs, etiquetasDe(q).map(e => [e.id, esc(e.nome), e.cor]).concat([['-', 'Sem etiqueta']]), c => lst(c.etiquetas)[0] || '-', (c, k) => { const es = lst(c.etiquetas).filter(x => x !== k); es.shift(); if (k !== '-') es.unshift(k); c.etiquetas = es.join(','); salvar(c, true); })}</div></div>`;
  } } });

PUP({ id: 'v-prazos', cat: 'vistas', icone: '⏳', nome: 'Quadro por prazo', desc: 'Colunas de vencidos, hoje, amanhã, esta semana, próxima semana, depois e sem prazo. Arrastar reagenda.',
  vista: { nome: 'Por prazo', icone: '⏳', render(q, cs) {
    const h = hoje(), k = c => !c.prazo ? 'sem' : c.prazo < h ? 'venc' : c.prazo === h ? 'hoje' : c.prazo === mais(h, 1) ? 'am' : c.prazo <= mais(h, 7) ? 's1' : c.prazo <= mais(h, 14) ? 's2' : 'dep';
    const novo = { hoje: h, am: mais(h, 1), s1: mais(h, 5), s2: mais(h, 12), dep: mais(h, 30), sem: '' };
    return `<div class="painelv">${tituloV('Por prazo')}<div style="overflow:auto">${pivo(q, cs.filter(c => !c.feito), [['venc', '⚠️ Vencidos', '#E0483C'], ['hoje', 'Hoje', '#E8A317'], ['am', 'Amanhã', '#2D7DD2'], ['s1', 'Em 7 dias', '#2D7DD2'], ['s2', 'Em 14 dias', '#5B6CF0'], ['dep', 'Depois', '#8B5CF6'], ['sem', 'Sem prazo', '#9aa3af']], k, (c, d) => { if (d !== 'venc' && k(c) !== d) { c.prazo = novo[d]; salvar(c, true); } })}</div></div>`;
  } } });

PUP({ id: 'v-funil', cat: 'vistas', icone: '🔻', nome: 'Funil', desc: 'Quantos cartões há em cada etapa e a taxa de passagem de uma para a outra. Com o power-up “Valor”, soma o dinheiro de cada fase.',
  vista: { nome: 'Funil', icone: '🔻', render(q, cs) {
    const ls = listasDe(q), val = ativo('valor', q), n = ls.map((l, i) => cs.filter(c => ls.findIndex(x => x.id === c.lista) >= i).length), mx = Math.max(1, n[0]);
    return `<div class="painelv">${tituloV('Funil')}<p class="dica" style="margin-bottom:12px">Cada faixa conta os cartões que já chegaram até aquela etapa (os que estão nela ou adiante).</p><div class="funil">${ls.map((l, i) => { const aqui = cs.filter(c => c.lista === l.id); return `<div style="width:${Math.max(18, n[i] / mx * 100)}%;background:${l.cor || (l.feito ? 'var(--ok)' : 'var(--pri)')}">${esc(l.nome)} · ${n[i]}${i ? ` <small>(${n[i - 1] ? Math.round(n[i] / n[i - 1] * 100) : 0}% da etapa anterior)</small>` : ''}<br><small>${aqui.length} nesta etapa${val ? ' · ' + fBRL(soma(aqui, c => c.d.valor)) : ''}</small></div>`; }).join('')}</div></div>`;
  } } });

PUP({ id: 'v-atividade', cat: 'vistas', icone: '📰', nome: 'Atividade do quadro', desc: 'Um feed com tudo o que aconteceu: criações, movimentos, conclusões e mudanças de prazo, do mais recente ao mais antigo.',
  vista: { nome: 'Atividade', icone: '📰', render(q) {
    const evs = []; S.cartoes.filter(c => c.quadro === q.id).forEach(c => (c.d.h || []).forEach(h => evs.push({ t: h.t, x: h.x, c })));
    evs.sort((a, x) => x.t - a.t);
    return `<div class="painelv">${tituloV('Atividade')}<div class="linhas">${evs.slice(0, 200).map(e => `<button class="linha" ${on(() => abrirCartao(e.c))}><small style="min-width:92px">${fQuando(e.t)}</small><span>${esc(e.x)}</span><b>${esc(e.c.titulo)}</b></button>`).join('') || '<p class="vazio">Nada aconteceu ainda.</p>'}</div></div>`;
  } } });

PUP({ id: 'v-apresentacao', cat: 'vistas', icone: '🎞️', nome: 'Apresentação', desc: 'Um cartão por vez, em tela grande, com descrição e checklist. Para reuniões e revisões: avance com as setas.',
  vista: { nome: 'Apresentação', icone: '🎞️', render(q, cs) {
    const ls = listasDe(q), l = cs.slice().sort((a, x) => ((byId(ls, a.lista) || {}).ordem - (byId(ls, x.lista) || {}).ordem) || a.ordem - x.ordem);
    if (!l.length) return '<div class="painelv"><p class="vazio">Nenhum cartão para apresentar.</p></div>';
    V.slide = (V.slide % l.length + l.length) % l.length;
    const c = l[V.slide], [ok, n] = ckTotal(c);
    return `<div class="slide" id="slide"><div class="fl"><span class="selo neutro">${V.slide + 1} / ${l.length}</span><span class="selo info">${esc((byId(ls, c.lista) || {}).nome || '')}</span>${etq(c).map(e => `<span class="et g" style="background:${e.cor};color:${claro(e.cor) ? '#111' : '#fff'}"><b>${esc(e.nome)}</b></span>`).join('')}<span class="esp"></span>${b('◀', () => { V.slide--; R(); })}${b('▶', () => { V.slide++; R(); }, 'pri')}${b('⛶', () => { const s = $('#slide'); if (s.requestFullscreen) s.requestFullscreen(); })}${b('Abrir', () => abrirCartao(c))}</div>
      <h1 class="${c.feito ? 'risc' : ''}">${esc(c.titulo)}</h1><div class="fl">${c.prazo ? `<span class="selo prazo ${atrasado(c) ? 'venc' : 'neutro'}">🕒 ${fData(c.prazo)}</span>` : ''}${mbs(c).map(m => avatar(m, 'g') + ' ' + esc(m.nome)).join(' ')}${n ? `<span class="selo neutro">☑ ${ok}/${n}</span>` : ''}</div>
      <div class="md" style="font-size:1.2em">${md(c.texto)}</div>${(c.d.ck || []).map(k => `<div><b>${esc(k.nome)}</b>${k.itens.map(i => `<div class="cki ${i.ok ? 'ok' : ''}"><span>${i.ok ? '☑' : '☐'} ${esc(i.t)}</span></div>`).join('')}</div>`).join('')}</div>`;
  } } });

PUP({ id: 'v-impressao', cat: 'vistas', icone: '🖨️', nome: 'Folha para imprimir', desc: 'O quadro como um documento limpo, lista por lista, pronto para imprimir ou salvar em PDF pelo navegador.',
  vista: { nome: 'Imprimir', icone: '🖨️', render(q, cs) {
    return `<div class="painelv folha">${tituloV(esc(q.icone + ' ' + q.nome), b('🖨️ Imprimir / PDF', () => print(), 'pri'))}<p class="dica">${esc(q.desc)} · ${fData(hoje())}</p>${listasDe(q).map(l => { const g = cs.filter(c => c.lista === l.id).sort((a, x) => a.ordem - x.ordem); return `<h3 style="margin-top:16px;border-bottom:2px solid var(--borda);padding-bottom:4px">${esc(l.nome)} (${g.length})</h3>${g.map(c => `<div style="padding:5px 0;border-bottom:1px solid var(--borda)">${c.feito ? '☑' : '☐'} <b>${esc(c.titulo)}</b>${c.prazo ? ' · ' + fData(c.prazo) : ''}${etq(c).length ? ' · ' + etq(c).map(e => esc(e.nome)).join(', ') : ''}${mbs(c).length ? ' · ' + mbs(c).map(m => esc(m.nome)).join(', ') : ''}${(c.d.ck || []).map(k => k.itens.map(i => `<div style="padding-left:22px;font-size:.93em">${i.ok ? '☑' : '☐'} ${esc(i.t)}</div>`).join('')).join('')}</div>`).join('') || '<p class="dica">—</p>'}`; }).join('')}</div>`;
  } } });
