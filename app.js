'use strict';
/* Kanban — telas: barra lateral, início, quadro, ficha do cartão, galeria de power-ups, busca, lixeira e ajustes. */

const b = (rot, f, cls) => `<button class="b ${cls || ''}" ${on(f)}>${rot}</button>`;
const alt = (csv, id) => { const l = lst(csv), i = l.indexOf(id); if (i < 0) l.push(id); else l.splice(i, 1); return l.join(','); };
const fundoDe = q => q.d.fundoImg ? `#1f2937 url("${String(q.d.fundoImg).replace(/["\\)]/g, '')}") center/cover` : q.d.fundoCss || FUNDOS[q.fundo] || FUNDOS.azul;

function R() {
  if (Arr.s && Arr.s.vivo) return;
  let q = Q();
  if (U.tela === 'quadro' && !q) U.tela = 'inicio';
  if (U.cartao && !byId(S.cartoes, U.cartao)) U.cartao = '';
  const noQ = U.tela === 'quadro' && q, bd = document.body;
  bd.dataset.tema = S.set.tema === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro') : S.set.tema;
  bd.className = ['t-' + U.tela, S.set.lado ? 'lado' : '', noQ ? ativos(q).map(p => typeof p.classe === 'function' ? p.classe(q) : p.classe || '').join(' ') : ''].join(' ');
  $('#main').style.background = noQ ? fundoDe(q) : '';
  pintar('l', $('#side'), lado);
  pintar('m', $('#main'), () => noQ ? telaQuadro(q) : U.tela === 'busca' ? telaBusca() : U.tela === 'lixeira' ? telaLixeira() : U.tela === 'ajustes' ? telaAjustes() : telaInicio());
  Ficha.r();
  const d = Dlg.pilha[Dlg.pilha.length - 1];
  if (d && d.opt.vivo) Dlg.r();
  Pop.r();
  const h = noQ ? '#q=' + q.id + (U.cartao ? '&c=' + U.cartao : '') : U.tela === 'inicio' ? '' : '#' + U.tela;
  if (location.hash !== h) try { history.replaceState(null, '', location.pathname + location.search + h); } catch (e) {}
  document.title = noQ ? q.nome + ' · Kanban' : 'Kanban';
}
R.depois = debounce(() => R(), 220);
const ir = tela => { U.tela = tela; U.cartao = ''; Pop.fechar(); if (innerWidth < 800) S.set.lado = false; R(); };
function abrirQuadro(id, cartao) {
  const q = byId(S.quadros, id);
  if (!q) return ir('inicio');
  if (U.quadro !== id) { U.filtro = filtroVazio(); U.sel.clear(); U.add = ''; }
  U.quadro = id; U.tela = 'quadro'; U.cartao = cartao || '';
  U.vista = q.vista && (q.vista === 'quadro' || (ativo(q.vista, q) && pup(q.vista) && pup(q.vista).vista)) ? q.vista : 'quadro';
  if (innerWidth < 800) S.set.lado = false;
  evento('abrir', q);
  R();
}

/* ---------- Barra lateral ---------- */
function lado() {
  const qs = quadrosVivos(), st = Sync.status();
  const it = (tela, ic, rot) => `<button class="nav ${U.tela === tela ? 'on' : ''}" ${on(() => ir(tela))}><i>${ic}</i>${rot}</button>`;
  return `<div class="marca-app"><img src="logo.svg" alt=""><b>Kanban</b><button class="ic" ${on(() => { S.set.lado = false; DB.saveSet(); R(); })} title="Recolher">«</button></div>
    ${it('inicio', '🏠', 'Início')}${it('busca', '🔎', 'Buscar')}
    <div class="nav-t">Quadros <button class="ic" ${on(() => novoQuadroDlg())} title="Novo quadro">＋</button></div>
    <div class="nav-q">${qs.map(q => `<button class="nav ${U.tela === 'quadro' && U.quadro === q.id ? 'on' : ''}" ${on(() => abrirQuadro(q.id))}><i class="qd" style="background:${FUNDOS[q.fundo] || FUNDOS.azul}">${esc(q.icone)}</i><span>${esc(q.nome)}</span>${q.fav ? '<em>★</em>' : ''}</button>`).join('') || '<p class="dica pad">Nenhum quadro ainda.</p>'}</div>
    <span class="esp"></span>
    ${it('lixeira', '🗑️', 'Lixeira')}${it('ajustes', '⚙️', 'Ajustes')}
    <button class="sinc ${Sync.error || Sync.g.error ? 'erro' : Sync.any() ? 'ok' : ''}" ${on(() => ir('ajustes'))}><i></i>${esc(st)}</button>`;
}

/* ---------- Início ---------- */
function telaInicio() {
  const qs = quadrosVivos(), arq = S.quadros.filter(q => q.arquivado), h = hoje();
  const prox = S.cartoes.filter(c => c.prazo && !c.feito && !c.lixo && !c.arquivado && c.prazo <= mais(h, 7) && byId(S.quadros, c.quadro) && !byId(S.quadros, c.quadro).arquivado).sort((a, x) => a.prazo < x.prazo ? -1 : 1).slice(0, 12);
  const telha = q => { const cs = vivos(q), ab = cs.filter(c => !c.feito).length; return `<button class="telha" style="background:${fundoDe(q)}" ${on(() => abrirQuadro(q.id))}><span class="ti">${esc(q.icone)}</span><b>${esc(q.nome)}</b><small>${ab} em aberto · ${cs.length - ab} concluídos</small>${q.fav ? '<em>★</em>' : ''}</button>`; };
  const meus = S.modelos.filter(m => m.tipo === 'quadro');
  return `<div class="pagina">
    <header class="cab"><button class="ic so-fechado" ${on(abreLado)}>☰</button><h1>Seus quadros</h1><span class="esp"></span>${b('＋ Novo quadro', () => novoQuadroDlg(), 'pri')}</header>
    <div class="telhas">${qs.map(telha).join('')}<button class="telha nova" ${on(() => novoQuadroDlg())}><span class="ti">＋</span><b>Novo quadro</b><small>em branco ou a partir de um modelo</small></button></div>
    ${prox.length ? `<h2>Prazos próximos</h2><div class="linhas">${prox.map(c => { const q = byId(S.quadros, c.quadro); return `<button class="linha" ${on(() => abrirQuadro(q.id, c.id))}><span class="selo prazo ${c.prazo < h ? 'venc' : c.prazo === h ? 'hoje' : ''}">🕒 ${fData(c.prazo)}</span><b>${esc(c.titulo)}</b><small>${esc(q.icone)} ${esc(q.nome)}</small></button>`; }).join('')}</div>` : ''}
    <h2>Modelos de quadro</h2>
    <div class="telhas peq">${meus.map(m => `<button class="telha" style="background:${FUNDOS.grafite}" ${on(() => novoQuadroDlg(m))}><span class="ti">⭐</span><b>${esc(m.nome)}</b><small>seu modelo</small></button>`).join('')}${MODELOS.map(m => `<button class="telha" style="background:${FUNDOS[m.fundo]}" ${on(() => novoQuadroDlg(m))}><span class="ti">${m.icone}</span><b>${esc(m.nome)}</b><small>${esc(m.desc)}</small></button>`).join('')}</div>
    ${arq.length ? `<h2>Quadros arquivados</h2><div class="linhas">${arq.map(q => `<div class="linha"><b>${esc(q.icone)} ${esc(q.nome)}</b><span class="esp"></span>${b('Restaurar', () => { q.arquivado = false; salvarQ(q); R(); })}${b('Excluir', async () => { if (await confirmar(`Excluir o quadro “${q.nome}” e tudo o que há nele?`, 'Excluir')) { excluirQuadro(q); R(); } }, 'perigo')}</div>`).join('')}</div>` : ''}
  </div>`;
}
const abreLado = () => { S.set.lado = true; DB.saveSet(); R(); };
async function novoQuadroDlg(m) {
  const ops = [['', '— Em branco —']].concat(MODELOS.map((x, i) => ['m' + i, x.icone + ' ' + x.nome]), S.modelos.filter(x => x.tipo === 'quadro').map(x => ['u' + x.id, '⭐ ' + x.nome]));
  const pre = m ? (m.id ? 'u' + m.id : 'm' + MODELOS.indexOf(m)) : '';
  const v = await pedir('Novo quadro', [{ k: 'nome', rot: 'Nome', val: m ? m.nome : '', ph: 'Ex.: Reforma da casa' }, { k: 'modelo', rot: 'Modelo', tipo: 'lista', op: ops, val: pre }], { ok: 'Criar' });
  if (!v) return;
  let q;
  if (v.modelo[0] === 'u') q = importarPacote(byId(S.modelos, v.modelo.slice(1)).d, v.nome || 'Quadro');
  else { const mm = v.modelo ? MODELOS[+v.modelo.slice(1)] : { listas: [['A fazer'], ['Fazendo'], ['Feito', 1]] }; q = novoQuadro(mm, v.nome || mm.nome || 'Quadro'); }
  abrirQuadro(q.id);
}
// Um quadro inteiro em um objeto só (para copiar, exportar e guardar como modelo).
function pacoteDe(q, comCartoes) {
  const cs = comCartoes ? S.cartoes.filter(c => c.quadro === q.id && !c.lixo) : [];
  return { app: 'kanban-quadro', quadro: q, listas: S.listas.filter(l => l.quadro === q.id), etiquetas: S.etiquetas.filter(e => e.quadro === q.id), regras: S.regras.filter(r => r.quadro === q.id), cartoes: cs, comentarios: S.comentarios.filter(x => cs.some(c => c.id === x.cartao)) };
}
function importarPacote(p, nome) {
  if (!p || !p.quadro || !Array.isArray(p.listas)) throw new Error('Arquivo de quadro inválido.');
  let s = JSON.stringify(p);
  const ids = [p.quadro.id].concat(...['listas', 'etiquetas', 'regras', 'cartoes', 'comentarios'].map(k => (p[k] || []).map(r => r.id)), ((p.quadro.d || {}).campos || []).map(c => c.id));
  ids.forEach(id => { if (id && String(id).length > 5) s = s.split(id).join(uid()); });
  const n = JSON.parse(s), now = Date.now();
  Data.adopt();
  const q = norm('quadros', Object.assign(n.quadro, { nome: nome || n.quadro.nome, ordem: Math.max(0, ...S.quadros.map(x => x.ordem)) + 1, criado: now, arquivado: false, fav: false }));
  if (q.d.snap) delete q.d.snap;
  Data.put('quadros', q, true);
  ['listas', 'etiquetas', 'regras', 'cartoes', 'comentarios'].forEach(k => (n[k] || []).forEach(r => Data.put(k, norm(k, r), true)));
  DB.changed();
  return q;
}

/* ---------- Quadro ---------- */
function telaQuadro(q) {
  const vs = ativos(q).filter(p => p.vista), v = U.vista !== 'quadro' && vs.find(p => p.id === U.vista), nf = filtroAtivo(), np = ativos(q).length;
  const aba = (id, ic, nome) => `<button class="aba ${U.vista === id ? 'on' : ''}" ${on(() => { U.vista = id; q.vista = id; salvarQ(q); R(); })}>${ic} <span>${esc(nome)}</span></button>`;
  const cs = visiveis(q);
  return `<header class="topo">
      <button class="ic so-fechado" ${on(abreLado)} title="Menu">☰</button>
      <button class="qnome" ${on(() => sobreQuadro(q))}>${esc(q.icone)} <b>${esc(q.nome)}</b></button>
      <button class="ic ${q.fav ? 'fav' : ''}" ${on(() => { q.fav = !q.fav; salvarQ(q); R(); })} title="Favorito">${q.fav ? '★' : '☆'}</button>
      <div class="abas">${aba('quadro', '📋', 'Quadro')}${vs.map(p => aba(p.id, p.vista.icone || p.icone, p.vista.nome)).join('')}</div>
      <span class="esp"></span>
      ${gancho('barra', q)}
      <button class="tb ${nf ? 'on' : ''}" ${on(el => popFiltro(el, q))}>🔍 <span>Filtro${nf ? ' · ' + cs.length : ''}</span></button>
      <button class="tb" ${on(() => galeria(q))}>⚡ <span>Power-ups · ${np}</span></button>
      <button class="tb" ${on(el => ferramentas(el, q))}>🧰 <span>Ferramentas</span></button>
      <button class="ic" ${on(el => menuQuadro(el, q))} title="Menu do quadro">⋯</button>
    </header>
    ${U.sel.size ? barraSel(q) : ''}
    <div class="corpo v-${U.vista}">${v ? `<div class="vista rolav" data-rol="vista">${v.vista.render(q, cs)}</div>` : vQuadro(q)}</div>`;
}
function vQuadro(q) {
  return `<div id="quadro" class="rolah" data-rol="qh" data-solta="listas" data-aceita="lista" data-ord="h">${listasDe(q).map(l => listaHtml(l, q)).join('')}
    <div class="lista nova">${U.add === 'lista' ? `<input data-k="add-lista" placeholder="Nome da lista…" ${onE(v => { if (v.trim()) { Data.put('listas', { quadro: q.id, nome: v.trim(), ordem: Math.max(-1, ...listasDe(q).map(l => l.ordem)) + 1 }); U.foco = 'add-lista'; } else U.add = ''; R(); })}>` : `<button ${on(() => { U.add = 'lista'; U.foco = 'add-lista'; R(); })}>＋ Adicionar lista</button>`}</div></div>`;
}
function listaHtml(l, q) {
  const todos = daLista(l, q), cs = todos.filter(c => passa(c, q)), cheia = l.limite && todos.length > l.limite;
  if (l.fechada) return `<section class="lista fechada" data-arr="lista:${l.id}" data-solta="lista" data-aceita="cartao" data-lista="${l.id}" ${on(() => { l.fechada = false; Data.put('listas', l); R(); })} title="Abrir a lista"><b>${todos.length}</b><span>${esc(l.nome)}</span></section>`;
  return `<section class="lista ${cheia ? 'cheia' : ''} ${l.feito ? 'conclui' : ''}" data-arr="lista:${l.id}" data-alca="header" ${l.cor ? `style="--lc:${l.cor}"` : ''}>
    <header><h3 ${on(() => renomearLista(l))}>${l.feito ? '<span title="Soltar aqui conclui o cartão">✓</span> ' : ''}${esc(l.nome)}</h3><span class="n" title="${l.limite ? 'Limite de ' + l.limite + ' cartões' : 'Cartões'}">${cs.length !== todos.length ? cs.length + ' de ' : ''}${todos.length}${l.limite ? ' / ' + l.limite : ''}</span>${gancho('cabLista', q, l, todos)}<button class="ic" ${on(el => menuLista(el, l, q))}>⋯</button></header>
    <div class="cartoes rolav" data-rol="l-${l.id}" data-solta="lista" data-aceita="cartao" data-ord="v" data-lista="${l.id}">${cs.map(c => cartaoHtml(c, q)).join('')}</div>
    ${gancho('rodLista', q, l, todos)}
    <footer>${U.add === l.id ? `<textarea data-k="add-${l.id}" rows="2" placeholder="Título do cartão…" ${onE(v => addCartao(l, q, v))}></textarea><div class="fl">${b('Adicionar', el => addCartao(l, q, el.closest('footer').querySelector('textarea').value), 'pri')}${b('✕', () => { U.add = ''; R(); })}</div>` : `<button class="mais" ${on(() => { U.add = l.id; U.foco = 'add-' + l.id; R(); })}>＋ Adicionar cartão</button>`}</footer>
  </section>`;
}
function addCartao(l, q, v) {
  v = String(v || '').trim();
  if (!v) { U.add = ''; return R(); }
  const linhas = ativo('colar', q) && v.includes('\n') ? v.split('\n').map(x => x.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()).filter(Boolean) : [v.replace(/\s*\n\s*/g, ' ')];
  linhas.forEach(t => criarCartao(q, l, t));
  if (linhas.length > 1) toast(linhas.length + ' cartões criados');
  U.foco = 'add-' + l.id;
  R();
  const cx = $(`[data-rol="l-${l.id}"]`); if (cx) cx.scrollTop = cx.scrollHeight;
}
// A capa pode ser uma cor, um degradê, um emoji, um endereço de imagem ou uma imagem enviada (guardada em d.capaImg).
function capaHtml(c) { const v = c.d.capaImg || c.capa; return !v ? '' : /^(#|linear|radial)/.test(v) ? `<div class="capa" style="background:${esc(v)}"></div>` : /^(https?:|data:image)/.test(v) ? `<div class="capa img" style="background-image:url('${esc(v.replace(/['\\)]/g, ''))}')"></div>` : `<div class="capa emoji">${esc(v)}</div>`; }
function cartaoHtml(c, q, simples) {
  const es = etq(c), ms = mbs(c), [ok, n] = ckTotal(c), nc = S.comentarios.filter(x => x.cartao === c.id).length, h = hoje();
  let cls = ''; for (const p of ativos(q)) if (p.classeCartao) cls += ' ' + (p.classeCartao(c, q) || '');
  const selos = (c.prazo ? `<span class="selo prazo ${c.feito ? 'ok' : c.prazo < h ? 'venc' : c.prazo === h ? 'hoje' : ''}">🕒 ${fData(c.prazo)}${c.hora ? ' ' + c.hora : ''}</span>` : '') + (c.texto ? '<span class="selo" title="Tem descrição">≡</span>' : '')
    + (n ? `<span class="selo ${ok === n ? 'ok' : ''}">☑ ${ok}/${n}</span>` : '') + (nc ? `<span class="selo">💬 ${nc}</span>` : '') + gancho('selo', q, c);
  return `<article class="cartao ${c.feito ? 'feito' : ''} ${U.sel.has(c.id) ? 'sel' : ''}${cls}" data-arr="cartao:${c.id}" data-id="${c.id}" ${on((el, e) => abrirCartao(c, e))}>
    ${capaHtml(c)}${es.length ? `<div class="ets">${es.map(chip).join('')}</div>` : ''}
    <div class="tit"><button class="okb" ${on(() => { marcarFeito(c, !c.feito); R(); })} title="${c.feito ? 'Reabrir' : 'Concluir'}">${c.feito ? '✓' : ''}</button><span>${esc(c.titulo)}</span></div>
    ${selos || ms.length ? `<div class="selos">${selos}<span class="esp"></span>${ms.map(m => avatar(m)).join('')}</div>` : ''}${simples ? '' : gancho('frente', q, c)}
  </article>`;
}
function abrirCartao(c, e) {
  const q = byId(S.quadros, c.quadro);
  if (ativo('selecao', q) && (U.sel.size || (e && (e.ctrlKey || e.metaKey || e.shiftKey)))) { if (U.sel.has(c.id)) U.sel.delete(c.id); else U.sel.add(c.id); return R(); }
  if (U.quadro !== c.quadro || U.tela !== 'quadro') return abrirQuadro(c.quadro, c.id);
  U.cartao = c.id; R();
}
Solta.lista = (info, ds, idx) => {
  const c = byId(S.cartoes, info.id), l = byId(S.listas, ds.lista);
  if (!c || !l) return;
  const q = byId(S.quadros, l.quadro), cru = cruDaLista(l).filter(x => x.id !== c.id);
  let real = null;
  if (idx != null) { const vis = daLista(l, q).filter(x => x.id !== c.id && passa(x, q)), ref = vis[idx]; real = ref ? cru.indexOf(ref) : cru.length; if (real < 0) real = null; }
  const grupo = U.sel.has(c.id) && U.sel.size > 1 ? [...U.sel].map(id => byId(S.cartoes, id)).filter(Boolean) : [c];
  grupo.forEach((x, i) => moverCartao(x, l, real == null ? null : real + i));
  if (l.fechada) toast('Movido para ' + l.nome);
};
Solta.listas = (info, ds, idx) => {
  const q = Q(), ls = listasDe(q), l = byId(ls, info.id);
  if (!l || idx == null) return;
  const r = ls.filter(x => x !== l); r.splice(idx, 0, l);
  r.forEach((x, i) => { if (x.ordem !== i) { x.ordem = i; Data.put('listas', x, true); } });
  DB.changed();
};
async function renomearLista(l) { const v = await pedir('Nome da lista', [{ k: 'n', rot: 'Nome', val: l.nome }]); if (v && v.n) { l.nome = v.n; Data.put('listas', l); R(); } }
function menuLista(el, l, q) {
  const cs = cruDaLista(l), outras = listasDe(q).filter(x => x.id !== l.id);
  const ordenar = (f, nome) => [nome, () => { cs.slice().sort(f).forEach((c, i) => { c.ordem = i; salvar(c, true); }); DB.changed(); R(); }];
  menu(el, [
    ['＋ Adicionar cartão no topo', async () => { const v = await pedir('Novo cartão em ' + l.nome, [{ k: 't', rot: 'Título' }], { ok: 'Criar' }); if (v && v.t) { criarCartao(q, l, v.t, null, true); R(); } }],
    ['✎ Renomear', () => renomearLista(l)],
    ['🔢 Limite de cartões (WIP)…', async () => { const v = await pedir('Limite de cartões em ' + l.nome, [{ k: 'n', rot: 'Limite (0 = sem limite)', tipo: 'numero', val: l.limite }]); if (v) { l.limite = Math.max(0, Math.round(v.n)); Data.put('listas', l); R(); } }],
    [(l.feito ? '☑' : '☐') + ' Lista de conclusão', () => { l.feito = !l.feito; Data.put('listas', l); R(); }],
    ['🎨 Cor…', async () => { const v = await pedir('Cor da lista', [{ k: 'c', tipo: 'cor', rot: 'Cor', val: l.cor }], { extra: 'Sem cor' }); if (v) { l.cor = v._extra ? '' : v.c; Data.put('listas', l); R(); } }],
    ['⇤ Recolher', () => { l.fechada = true; Data.put('listas', l); R(); }],
    '-',
    ordenar((a, x) => (a.prazo || '9') < (x.prazo || '9') ? -1 : 1, '↕ Ordenar por prazo'),
    ordenar((a, x) => x.prio - a.prio, '↕ Ordenar por prioridade'),
    ordenar((a, x) => a.titulo.localeCompare(x.titulo, 'pt'), '↕ Ordenar por título'),
    ordenar((a, x) => x.criado - a.criado, '↕ Ordenar por mais recentes'),
    '-',
    outras.length && ['→ Mover todos os cartões…', async () => { const v = await pedir('Mover os cartões de ' + l.nome, [{ k: 'l', rot: 'Para a lista', tipo: 'lista', op: outras.map(x => [x.id, x.nome]) }], { ok: 'Mover' }); if (v) { const d = byId(S.listas, v.l); cs.forEach(c => moverCartao(c, d)); R(); } }],
    ['📦 Arquivar todos os cartões', async () => { if (cs.length && await confirmar(`Arquivar os ${cs.length} cartões de “${l.nome}”?`, 'Arquivar')) { cs.forEach(c => { c.arquivado = true; salvar(c, true); }); DB.changed(); R(); } }],
    ['📦 Arquivar a lista', () => { l.arquivada = true; Data.put('listas', l); R(); toast('Lista arquivada', 'Desfazer', () => { l.arquivada = false; Data.put('listas', l); R(); }); }],
  ]);
}
function popFiltro(el, q) {
  const f = U.filtro, tg = (arr, v) => { const i = arr.indexOf(v); if (i < 0) arr.push(v); else arr.splice(i, 1); R(); };
  const op = (k, v, rot) => `<label class="item"><input type="radio" name="f${k}" ${f[k] === v ? 'checked' : ''} ${onC(() => { f[k] = v; R(); })}> ${rot}</label>`;
  Pop.abrir(el, () => `<div class="pop-t">Filtrar cartões</div><input class="cheio" data-k="filtro-q" placeholder="Texto, #número ou campo…" value="${esc(f.q)}" oninput="U.filtro.q=this.value;R.depois()">
    <div class="pop-s">Etiquetas</div>${etiquetasDe(q).map(e => `<label class="item"><input type="checkbox" ${f.et.includes(e.id) ? 'checked' : ''} ${onC(() => tg(f.et, e.id))}> ${chip(e)}</label>`).join('')}<label class="item"><input type="checkbox" ${f.et.includes('-') ? 'checked' : ''} ${onC(() => tg(f.et, '-'))}> Sem etiqueta</label>
    ${S.membros.length ? `<div class="pop-s">Membros</div>${membros().map(m => `<label class="item"><input type="checkbox" ${f.mb.includes(m.id) ? 'checked' : ''} ${onC(() => tg(f.mb, m.id))}> ${avatar(m)} ${esc(m.nome)}</label>`).join('')}<label class="item"><input type="checkbox" ${f.mb.includes('-') ? 'checked' : ''} ${onC(() => tg(f.mb, '-'))}> Sem membro</label>` : ''}
    <div class="pop-s">Prazo</div>${op('prazo', '', 'Qualquer')}${op('prazo', 'venc', 'Vencidos')}${op('prazo', 'hoje', 'Hoje')}${op('prazo', 'sem7', 'Próximos 7 dias')}${op('prazo', 'sem30', 'Próximos 30 dias')}${op('prazo', 'sem', 'Sem prazo')}
    <div class="pop-s">Situação</div>${op('feito', '', 'Todos')}${op('feito', 'n', 'Em aberto')}${op('feito', 's', 'Concluídos')}
    <hr><button class="item" ${on(() => { U.filtro = filtroVazio(); Pop.fechar(); R(); })}>Limpar filtro</button>`);
}
function ferramentas(el, q) {
  const it = [];
  for (const p of ativos(q)) if (p.ferramentas) { const l = p.ferramentas(q) || []; l.forEach(x => it.push([`${p.icone} ${x[0]}`, x[1]])); }
  if (!it.length) it.push(['Nenhuma ferramenta ligada. Abra os power-ups…', () => galeria(q)]);
  menu(el, it, 'Ferramentas dos power-ups');
}
function barraSel(q) {
  const cs = [...U.sel].map(id => byId(S.cartoes, id)).filter(Boolean), cada = f => { cs.forEach(f); DB.changed(); R(); };
  return `<div class="selbar"><b>${cs.length} selecionado${cs.length > 1 ? 's' : ''}</b>
    ${b('→ Mover', el => menu(el, listasDe(q).map(l => [esc(l.nome), () => { cs.forEach(c => moverCartao(c, l)); R(); }])))}
    ${b('🏷️ Etiqueta', el => menu(el, etiquetasDe(q).map(e => [chip(e), () => cada(c => { if (!lst(c.etiquetas).includes(e.id)) { c.etiquetas = alt(c.etiquetas, e.id); salvar(c, true); } })])))}
    ${S.membros.length ? b('👤 Membro', el => menu(el, membros().map(m => [avatar(m) + ' ' + esc(m.nome), () => cada(c => { if (!lst(c.membros).includes(m.id)) { c.membros = alt(c.membros, m.id); salvar(c, true); } })]))) : ''}
    ${b('🕒 Prazo', async () => { const v = await pedir('Prazo dos selecionados', [{ k: 'd', rot: 'Prazo', tipo: 'data', val: hoje() }]); if (v) cada(c => { c.prazo = v.d; salvar(c, true); }); })}
    ${b('✓ Concluir', () => { cs.forEach(c => marcarFeito(c, true, true)); DB.changed(); R(); })}
    ${b('📦 Arquivar', () => { cada(c => { c.arquivado = true; salvar(c, true); }); U.sel.clear(); R(); })}
    ${b('🗑️', () => { cada(c => { c.lixo = Date.now(); salvar(c, true); }); U.sel.clear(); R(); })}
    <span class="esp"></span>${b('Todos', () => { visiveis(q).forEach(c => U.sel.add(c.id)); R(); })}${b('✕ Limpar', () => { U.sel.clear(); R(); })}</div>`;
}
async function sobreQuadro(q) {
  const v = await pedir('Sobre o quadro', [{ k: 'nome', rot: 'Nome', val: q.nome }, { k: 'icone', rot: 'Ícone (emoji)', val: q.icone }, { k: 'desc', rot: 'Descrição', tipo: 'area', val: q.desc }, { k: 'fundo', rot: 'Fundo', tipo: 'lista', op: Object.keys(FUNDOS).map(k => [k, k[0].toUpperCase() + k.slice(1)]), val: q.fundo }]);
  if (v) { Object.assign(q, { nome: v.nome || q.nome, icone: v.icone || '📋', desc: v.desc, fundo: v.fundo }); salvarQ(q); R(); }
}
function menuQuadro(el, q) {
  menu(el, [
    ['ℹ️ Sobre o quadro (nome, ícone, fundo)', () => sobreQuadro(q)],
    ['🏷️ Etiquetas', () => gerirEtiquetas(q)],
    ['👥 Membros', () => gerirMembros()],
    ['📦 Itens arquivados', () => arquivados(q)],
    '-',
    ['⧉ Duplicar quadro…', async () => { const v = await pedir('Duplicar quadro', [{ k: 'n', rot: 'Nome', val: q.nome + ' (cópia)' }, { k: 'c', tipo: 'caixa', rot: 'Copiar também os cartões', val: true }], { ok: 'Duplicar' }); if (v) abrirQuadro(importarPacote(pacoteDe(q, v.c), v.n).id); }],
    ['⭐ Salvar como modelo…', async () => { const v = await pedir('Salvar como modelo', [{ k: 'n', rot: 'Nome do modelo', val: q.nome }, { k: 'c', tipo: 'caixa', rot: 'Incluir os cartões', val: false }]); if (v) { Data.put('modelos', { nome: v.n || q.nome, tipo: 'quadro', d: JSON.parse(JSON.stringify(pacoteDe(q, v.c))) }); toast('Modelo salvo. Ele aparece no Início.'); } }],
    ['⬇️ Exportar quadro (.json)', () => baixar(q.nome.replace(/[^\w\- ]+/g, '') + '.kanban.json', JSON.stringify(pacoteDe(q, true)), 'application/json')],
    '-',
    ['📦 Arquivar quadro', () => { q.arquivado = true; salvarQ(q); ir('inicio'); toast('Quadro arquivado', 'Desfazer', () => { q.arquivado = false; salvarQ(q); R(); }); }],
    ['🗑️ Excluir quadro…', async () => { if (await confirmar(`Excluir o quadro “${q.nome}” e tudo o que há nele? Não dá para desfazer.`, 'Excluir')) { excluirQuadro(q); ir('inicio'); } }, 'perigo'],
  ]);
}
function gerirEtiquetas(q) {
  const editar = async e => {
    const v = await pedir(e ? 'Editar etiqueta' : 'Nova etiqueta', [{ k: 'nome', rot: 'Nome', val: e ? e.nome : '' }, { k: 'cor', rot: 'Cor', tipo: 'cor', val: e ? e.cor : CORES[5] }], e ? { extra: 'Excluir' } : {});
    if (!v) return;
    if (v._extra) { Data.del('etiquetas', e.id, true); S.cartoes.forEach(c => { if (lst(c.etiquetas).includes(e.id)) { c.etiquetas = alt(c.etiquetas, e.id); salvar(c, true); } }); DB.changed(); }
    else Data.put('etiquetas', Object.assign(e || { quadro: q.id, ordem: etiquetasDe(q).length }, { nome: v.nome, cor: v.cor || CORES[5] }));
    R();
  };
  mostrar('Etiquetas do quadro', () => `<div class="linhas">${etiquetasDe(q).map(e => `<div class="linha">${chip(e)}<span class="esp"></span><small>${S.cartoes.filter(c => lst(c.etiquetas).includes(e.id) && !c.lixo).length} cartões</small>${b('✎', () => editar(e))}</div>`).join('')}</div><div class="botoes">${b('＋ Nova etiqueta', () => editar(null), 'pri')}</div>`, 'medio');
}
function gerirMembros() {
  const editar = async m => {
    const v = await pedir(m ? 'Editar membro' : 'Novo membro', [{ k: 'nome', rot: 'Nome', val: m ? m.nome : '' }, { k: 'email', rot: 'E-mail (opcional)', val: m ? m.email : '' }, { k: 'cor', rot: 'Cor', tipo: 'cor', val: m ? m.cor : CORES[S.membros.length % CORES.length] }, { k: 'eu', tipo: 'caixa', rot: 'Este sou eu', val: m ? S.set.eu === m.id : !S.membros.length }], m ? { extra: 'Excluir' } : {});
    if (!v) return;
    if (v._extra) { Data.del('membros', m.id, true); S.cartoes.forEach(c => { if (lst(c.membros).includes(m.id)) { c.membros = alt(c.membros, m.id); salvar(c, true); } }); DB.changed(); }
    else if (v.nome) { const r = Data.put('membros', Object.assign(m || { ordem: S.membros.length }, { nome: v.nome, email: v.email, cor: v.cor || CORES[5] })); if (v.eu) { S.set.eu = r.id; DB.saveSet(); } else if (S.set.eu === r.id) { S.set.eu = ''; DB.saveSet(); } }
    R();
  };
  mostrar('Membros', () => `<p class="dica">Os membros valem para todos os quadros. Servem para atribuir cartões, filtrar e medir a carga de cada pessoa.</p><div class="linhas">${membros().map(m => `<div class="linha">${avatar(m)}<b>${esc(m.nome)}</b>${S.set.eu === m.id ? '<small>(você)</small>' : ''}<span class="esp"></span><small>${esc(m.email)}</small>${b('✎', () => editar(m))}</div>`).join('') || '<p class="vazio">Ninguém ainda.</p>'}</div><div class="botoes">${b('＋ Novo membro', () => editar(null), 'pri')}</div>`, 'medio');
}
function arquivados(q) {
  mostrar('Itens arquivados', () => {
    const cs = S.cartoes.filter(c => c.quadro === q.id && c.arquivado && !c.lixo), ls = S.listas.filter(l => l.quadro === q.id && l.arquivada);
    return `<div class="linhas">${ls.map(l => `<div class="linha"><b>Lista: ${esc(l.nome)}</b><span class="esp"></span>${b('Restaurar', () => { l.arquivada = false; Data.put('listas', l); R(); })}</div>`).join('')}
      ${cs.map(c => `<div class="linha"><b>${esc(c.titulo)}</b><small>${esc((byId(S.listas, c.lista) || {}).nome || '')}</small><span class="esp"></span>${b('Restaurar', () => { c.arquivado = false; const l = byId(S.listas, c.lista); if (!l || l.arquivada) c.lista = listasDe(q)[0].id; salvar(c); R(); })}${b('🗑️', () => { c.lixo = Date.now(); salvar(c); R(); })}</div>`).join('')}
      ${cs.length + ls.length ? '' : '<p class="vazio">Nada arquivado neste quadro.</p>'}</div>`;
  }, 'medio');
}

/* ---------- Galeria de power-ups ---------- */
function galeria(q) {
  U.cat = ''; U.pq = '';
  const configurar = async p => {
    if (p.config) return p.config(q);
    const atual = cfg(p.id, q), v = await pedir(p.icone + ' ' + p.nome, p.cfg.map(c => Object.assign({}, c, { val: c.k ? atual[c.k] : c.val, op: typeof c.op === 'function' ? c.op(q) : c.op })));
    if (v) { q.pups[p.id] = v; salvarQ(q); R(); }
  };
  mostrar('Power-ups', () => {
    const t = semAcento(U.pq), l = PUPS.filter(p => (!U.cat || (U.cat === '*' ? q.pups[p.id] : p.cat === U.cat)) && (!t || semAcento(p.nome + ' ' + p.desc).includes(t))), n = ativos(q).length;
    const massa = (rot, f) => b(rot, () => { PUPS.forEach(p => { const liga = f(p); if (liga !== !!q.pups[p.id]) { if (liga) q.pups[p.id] = true; else delete q.pups[p.id]; } }); salvarQ(q); if (!ativo(U.vista, q)) U.vista = 'quadro'; R(); });
    return `<p class="dica">${PUPS.length} power-ups, ${n} ligados em <b>${esc(q.nome)}</b>. Cada quadro tem os seus; ligue só o que for usar.</p>
      <div class="pg-topo"><input data-k="pq" placeholder="Buscar power-up…" value="${esc(U.pq)}" oninput="U.pq=this.value;R.depois()">${massa('Ligar todos', () => true)}${massa('Só os essenciais', p => PADRAO.includes(p.id))}${massa('Desligar todos', () => false)}</div>
      <div class="cats"><button class="${U.cat === '' ? 'on' : ''}" ${on(() => { U.cat = ''; R(); })}>Todos · ${PUPS.length}</button><button class="${U.cat === '*' ? 'on' : ''}" ${on(() => { U.cat = '*'; R(); })}>Ligados · ${n}</button>${Object.entries(CATS).map(([k, c]) => `<button class="${U.cat === k ? 'on' : ''}" ${on(() => { U.cat = k; R(); })}>${c[0]} ${c[1]} · ${PUPS.filter(p => p.cat === k).length}</button>`).join('')}</div>
      <div class="pups">${l.map(p => `<div class="pup ${q.pups[p.id] ? 'on' : ''}"><div class="pi">${p.icone}</div><div class="pc"><b>${esc(p.nome)}</b><small>${esc(CATS[p.cat][1])}</small><p>${esc(p.desc)}</p></div>
        <div class="pa"><label class="chave"><input type="checkbox" ${q.pups[p.id] ? 'checked' : ''} ${onC(v => { alternarPup(q, p.id, v); R(); })}><i></i></label>${q.pups[p.id] && (p.cfg || p.config) ? `<button class="b mini" ${on(() => configurar(p))}>⚙ Ajustar</button>` : ''}</div></div>`).join('') || '<p class="vazio">Nenhum power-up com esse nome.</p>'}</div>`;
  }, 'enorme');
}

/* ---------- Ficha do cartão ---------- */
const Ficha = {
  edit: '',
  r() {
    const c = U.cartao && byId(S.cartoes, U.cartao), s = $('#sheet');
    $('#scrim').classList.toggle('on', !!c); s.classList.toggle('on', !!c);
    if (!c) { if (s.innerHTML) { s.innerHTML = ''; FNS.s.clear(); Ficha.edit = ''; } return; }
    pintar('s', s, () => fichaHtml(c, byId(S.quadros, c.quadro)));
  },
  fechar() { U.cartao = ''; Ficha.edit = ''; R(); },
};
function popEtiquetas(el, c, q) {
  Pop.abrir(el, () => `<div class="pop-t">Etiquetas</div>${etiquetasDe(q).map(e => `<label class="item"><input type="checkbox" ${lst(c.etiquetas).includes(e.id) ? 'checked' : ''} ${onC(() => { c.etiquetas = alt(c.etiquetas, e.id); salvar(c); R(); })}> ${chip(e)}</label>`).join('')}<hr><button class="item" ${on(() => { Pop.fechar(); gerirEtiquetas(q); })}>✎ Criar e editar etiquetas</button>`);
}
function popMembros(el, c) {
  Pop.abrir(el, () => `<div class="pop-t">Membros</div>${membros().map(m => `<label class="item"><input type="checkbox" ${lst(c.membros).includes(m.id) ? 'checked' : ''} ${onC(() => { c.membros = alt(c.membros, m.id); log(c, (lst(c.membros).includes(m.id) ? 'Atribuído a ' : 'Removido de ') + m.nome); salvar(c); R(); })}> ${avatar(m)} ${esc(m.nome)}</label>`).join('') || '<p class="dica pad">Cadastre as pessoas primeiro.</p>'}<hr><button class="item" ${on(() => { Pop.fechar(); gerirMembros(); })}>✎ Gerenciar membros</button>`);
}
function ckHtml(c, q) {
  return (c.d.ck || []).map(k => {
    const ok = k.itens.filter(i => i.ok).length, pc = k.itens.length ? Math.round(ok / k.itens.length * 100) : 0;
    return `<section class="sec ck"><h4><span ${on(async () => { const v = await pedir('Nome do checklist', [{ k: 'n', rot: 'Nome', val: k.nome }]); if (v && v.n) { k.nome = v.n; salvar(c); R(); } })}>☑ ${esc(k.nome)}</span><small>${ok}/${k.itens.length}</small><span class="esp"></span>${b('Excluir', () => { c.d.ck = c.d.ck.filter(x => x !== k); salvar(c); R(); }, 'mini')}</h4>
      <div class="barra"><i style="width:${pc}%" class="${pc === 100 ? 'ok' : ''}"></i></div>
      ${k.itens.map(i => `<div class="cki ${i.ok ? 'ok' : ''}"><input type="checkbox" ${i.ok ? 'checked' : ''} ${onC(v => { i.ok = v; salvar(c); if (v && k.itens.every(x => x.ok)) evento('checklist', q, c, k); R(); })}><span ${on(async () => { const v = await pedir('Item', [{ k: 't', rot: 'Texto', val: i.t }]); if (v && v.t) { i.t = v.t; salvar(c); R(); } })}>${mdLinha(i.t)}</span>${gancho('ckItem', q, c, k, i)}<button class="ic" ${on(() => { k.itens = k.itens.filter(x => x !== i); salvar(c); R(); })}>✕</button></div>`).join('')}
      <input class="cheio" data-k="ck-${k.id}" placeholder="Adicionar item… (Enter)" ${onE((v, el) => { v.split('\n').map(x => x.trim()).filter(Boolean).forEach(t => k.itens.push({ id: uid(), t, ok: false })); salvar(c); U.foco = 'ck-' + k.id; R(); })}></section>`;
  }).join('');
}
function fichaHtml(c, q) {
  const l = byId(S.listas, c.lista), es = etq(c), ms = mbs(c), cms = comentariosDe(c), me = eu();
  const novoCk = async () => { const v = await pedir('Novo checklist', [{ k: 'n', rot: 'Nome', val: 'Checklist' }, { k: 'i', rot: 'Itens (um por linha, opcional)', tipo: 'area' }], { ok: 'Criar' }); if (v) { (c.d.ck = c.d.ck || []).push({ id: uid(), nome: v.n || 'Checklist', itens: v.i.split('\n').map(x => x.trim()).filter(Boolean).map(t => ({ id: uid(), t, ok: false })) }); salvar(c); R(); } };
  return `<div class="ficha rolav" data-rol="ficha">
    ${capaHtml(c)}
    <button class="x" ${on(() => Ficha.fechar())} aria-label="Fechar">✕</button>
    <div class="f-topo"><button class="okb g ${c.feito ? 'on' : ''}" ${on(() => { marcarFeito(c, !c.feito); R(); })} title="${c.feito ? 'Reabrir' : 'Concluir'}">${c.feito ? '✓' : ''}</button>
      <textarea class="f-tit" data-k="f-tit" rows="1" ${onC(v => { if (v.trim()) { c.titulo = v.trim().replace(/\s*\n\s*/g, ' '); salvar(c); R.depois(); } })} oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'">${esc(c.titulo)}</textarea></div>
    <div class="f-sub">${ativo('numeracao', q) ? `<b>#${c.num}</b> · ` : ''}na lista <select ${onC(v => { if (moverCartao(c, byId(S.listas, v))) toast('Movido'); R(); })}>${listasDe(q).map(x => `<option value="${x.id}" ${x.id === c.lista ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}${l && l.arquivada ? `<option selected>${esc(l.nome)} (arquivada)</option>` : ''}</select> · criado em ${fQuando(c.criado)}${c.arquivado ? ' · <b>arquivado</b>' : ''}</div>
    <div class="f-cols"><div class="f-main">
      <div class="f-meta">
        <div><small>Etiquetas</small><div class="fl">${es.map(chip).join('')}<button class="b mini" ${on(el => popEtiquetas(el, c, q))}>＋</button></div></div>
        <div><small>Membros</small><div class="fl">${ms.map(m => avatar(m)).join('')}<button class="b mini" ${on(el => popMembros(el, c))}>＋</button></div></div>
        <div><small>Prazo</small><div class="fl"><input type="date" value="${c.prazo}" ${onC(v => { c.prazo = v; if (!v) c.hora = ''; log(c, v ? 'Prazo: ' + fData(v) : 'Prazo removido'); salvar(c); R(); })}>${c.prazo ? `<input type="time" value="${c.hora}" ${onC(v => { c.hora = v; salvar(c); R(); })}>` : ''}${atrasado(c) ? '<span class="selo prazo venc">vencido</span>' : ''}</div></div>
        ${gancho('meta', q, c)}
      </div>
      <section class="sec"><h4>≡ Descrição<span class="esp"></span>${Ficha.edit === 'texto' ? '' : b(c.texto ? 'Editar' : 'Escrever', () => { Ficha.edit = 'texto'; U.foco = 'f-texto'; R(); }, 'mini')}</h4>
        ${Ficha.edit === 'texto' ? `<textarea class="cheio" data-k="f-texto" rows="8" placeholder="Markdown: **negrito**, *itálico*, # título, - lista, - [ ] caixinha, \`código\`…">${esc(c.texto)}</textarea><div class="fl">${b('Salvar', el => { c.texto = el.closest('.sec').querySelector('textarea').value; Ficha.edit = ''; salvar(c); R(); }, 'pri')}${b('Cancelar', () => { Ficha.edit = ''; R(); })}</div>`
          : c.texto ? `<div class="md">${md(c.texto, i => { c.texto = mdAlterna(c.texto, i); salvar(c); R(); })}</div>` : `<p class="dica clic" ${on(() => { Ficha.edit = 'texto'; U.foco = 'f-texto'; R(); })}>Adicione uma descrição mais detalhada…</p>`}</section>
      ${ckHtml(c, q)}
      ${gancho('secao', q, c)}
      <section class="sec"><h4>💬 Comentários <small>${cms.length || ''}</small></h4>
        <div class="com-novo">${me ? avatar(me) : ''}<textarea data-k="f-com" rows="1" placeholder="Escreva um comentário… (Enter envia, Shift+Enter quebra a linha)" ${onE((v, el) => { if (!v.trim()) return; Data.put('comentarios', { cartao: c.id, autor: me ? me.id : '', texto: v.trim(), criado: Date.now() }); evento('comentar', q, c, v.trim()); el.value = ''; U.foco = 'f-com'; R(); })}></textarea></div>
        ${cms.slice().reverse().map(x => { const a = byId(S.membros, x.autor); return `<div class="com">${a ? avatar(a) : '<span class="av">?</span>'}<div><b>${esc(a ? a.nome : 'Você')}</b> <small>${fQuando(x.criado)}</small><div class="md">${md(x.texto)}</div>${gancho('comentario', q, x, c)}</div><button class="ic" ${on(() => { Data.del('comentarios', x.id); R(); })} title="Excluir">✕</button></div>`; }).join('')}</section>
    </div>
    <aside class="f-lado">
      <small>Adicionar</small>
      ${b('🏷️ Etiquetas', el => popEtiquetas(el, c, q), 'lat')}${b('👤 Membros', el => popMembros(el, c), 'lat')}${b('☑ Checklist', novoCk, 'lat')}
      ${gancho('lateral', q, c)}
      <small>Ações</small>
      ${b('→ Mover…', async () => { const qs = quadrosVivos(), v = await pedir('Mover cartão', [{ k: 'q', rot: 'Quadro', tipo: 'lista', op: qs.map(x => [x.id, x.nome]), val: q.id }, { k: 'pos', rot: 'Posição', tipo: 'lista', op: [['fim', 'No fim da lista'], ['topo', 'No topo da lista']] }], { ok: 'Escolher lista' }); if (!v) return; const dq = byId(S.quadros, v.q), w = await pedir('Mover para ' + dq.nome, [{ k: 'l', rot: 'Lista', tipo: 'lista', op: listasDe(dq).map(x => [x.id, x.nome]), val: c.lista }], { ok: 'Mover' }); if (w && moverCartao(c, byId(S.listas, w.l), v.pos === 'topo' ? 0 : null)) { if (dq.id !== q.id) U.cartao = ''; toast('Movido para ' + dq.nome); } R(); }, 'lat')}
      ${b('⧉ Copiar', () => { const n = copiarCartao(c); n.titulo += ' (cópia)'; salvar(n); U.cartao = n.id; R(); toast('Cartão copiado'); }, 'lat')}
      ${b(c.arquivado ? '↩ Desarquivar' : '📦 Arquivar', () => { c.arquivado = !c.arquivado; salvar(c); if (c.arquivado) U.cartao = ''; R(); }, 'lat')}
      ${b('🗑️ Excluir', () => { excluirCartao(c); R(); }, 'lat perigo')}
    </aside></div></div>`;
}
// Atalho para os power-ups montarem uma seção na ficha.
const sec = (titulo, corpo, extra) => `<section class="sec"><h4>${titulo}<span class="esp"></span>${extra || ''}</h4>${corpo}</section>`;

/* ---------- Busca, lixeira e ajustes ---------- */
function telaBusca() {
  const t = semAcento(U.buscaG.trim()), res = t.length < 2 ? [] : S.cartoes.filter(c => !c.lixo && semAcento(c.titulo + ' ' + c.texto + ' ' + Object.values(c.d.cf || {}).join(' ')).includes(t)).slice(0, 80);
  return `<div class="pagina"><header class="cab"><button class="ic so-fechado" ${on(abreLado)}>☰</button><h1>Buscar</h1></header>
    <input class="busca" data-k="buscaG" placeholder="Buscar em todos os quadros…" value="${esc(U.buscaG)}" oninput="U.buscaG=this.value;R.depois()">
    <div class="linhas">${res.map(c => { const q = byId(S.quadros, c.quadro); return q ? `<button class="linha" ${on(() => abrirQuadro(q.id, c.id))}><b class="${c.feito ? 'risc' : ''}">${esc(c.titulo)}</b><small>${esc(q.icone)} ${esc(q.nome)} › ${esc((byId(S.listas, c.lista) || {}).nome || '')}${c.arquivado ? ' · arquivado' : ''}</small>${c.prazo ? `<span class="selo prazo">🕒 ${fData(c.prazo)}</span>` : ''}</button>` : ''; }).join('') || `<p class="vazio">${t.length < 2 ? 'Digite ao menos duas letras.' : 'Nada encontrado.'}</p>`}</div></div>`;
}
function telaLixeira() {
  const cs = S.cartoes.filter(c => c.lixo).sort((a, x) => x.lixo - a.lixo);
  return `<div class="pagina"><header class="cab"><button class="ic so-fechado" ${on(abreLado)}>☰</button><h1>Lixeira</h1><span class="esp"></span>${cs.length ? b('Esvaziar', async () => { if (await confirmar('Excluir de vez os ' + cs.length + ' cartões da lixeira?', 'Esvaziar')) { cs.forEach(c => Data.del('cartoes', c.id, true)); DB.changed(); R(); } }, 'perigo') : ''}</header>
    <p class="dica">Os cartões ficam aqui por 30 dias antes de sumirem de vez.</p>
    <div class="linhas">${cs.map(c => { const q = byId(S.quadros, c.quadro); return `<div class="linha"><b>${esc(c.titulo)}</b><small>${q ? esc(q.nome) : 'quadro excluído'} · ${fQuando(c.lixo)}</small><span class="esp"></span>${q ? b('Restaurar', () => { c.lixo = 0; const l = byId(S.listas, c.lista); if (!l || l.arquivada) c.lista = (listasDe(q)[0] || {}).id || c.lista; salvar(c); R(); }) : ''}${b('Excluir', () => { Data.del('cartoes', c.id); R(); }, 'perigo')}</div>`; }).join('') || '<p class="vazio">A lixeira está vazia.</p>'}</div></div>`;
}
function telaAjustes() {
  const g = Sync.gOn(), tema = (v, r) => `<button class="${S.set.tema === v ? 'on' : ''}" ${on(() => { S.set.tema = v; DB.saveSet(); R(); })}>${r}</button>`;
  const tenta = async f => { try { await f(); } catch (e) { toast(e.message || 'Não deu certo.'); } R(); };
  return `<div class="pagina estreita"><header class="cab"><button class="ic so-fechado" ${on(abreLado)}>☰</button><h1>Ajustes</h1></header>
    <section class="cartaoz"><h2>Aparência</h2><div class="seg">${tema('auto', 'Automático')}${tema('claro', 'Claro')}${tema('escuro', 'Escuro')}</div></section>
    <section class="cartaoz"><h2>Você e a equipe</h2><p class="dica">Diga quem é você para assinar comentários e usar “atribuir a mim”.</p><div class="fl">${eu() ? avatar(eu()) + `<b>${esc(eu().nome)}</b>` : '<span class="dica">Ninguém definido.</span>'}<span class="esp"></span>${b('Gerenciar membros', gerirMembros)}</div></section>
    <section class="cartaoz"><h2>Sincronização</h2>
      ${Sync.avail ? `<h3>1. Pasta do Google Drive para computador</h3><p class="dica">${Sync.on ? 'Gravando <b>kanban-sync.json</b> em <code>' + esc(Sync.folder) + '</code>.' : Sync.detected ? 'Desligada. Google Drive detectado em <code>' + esc(Sync.detected) + '</code>.' : 'Nenhuma pasta do Google Drive encontrada neste computador.'}${Sync.error ? ' <b class="erro">' + esc(Sync.error) + '</b>' : ''}</p>
        <div class="fl">${Sync.drives.map(d => b('Usar ' + esc(d), () => tenta(() => Sync.config(d)))).join('')}${b('Escolher pasta…', () => tenta(() => Sync.config('choose')))}${Sync.on ? b('Desligar', () => tenta(() => Sync.config('off'))) : Sync.detected ? b('Ligar (automático)', () => tenta(() => Sync.config('auto')), 'pri') : ''}</div><h3>2. Conta Google</h3>` : '<h3>Conta Google</h3>'}
      <p class="dica">O arquivo fica na área privada do aplicativo no seu Google Drive e vale para o programa de Windows, o site e o celular. Usa o mesmo “ID do cliente OAuth” dos seus outros aplicativos${Sync.avail ? '; para o programa de Windows, acrescente a origem <code>http://localhost:' + PORT + '</code> no Console do Google' : ''}.</p>
      <label class="campo"><span>ID do cliente OAuth</span><input value="${esc(S.set.gClient)}" placeholder="0000000-xxxx.apps.googleusercontent.com" ${onC(v => { S.set.gClient = v.trim(); DB.saveSet(); R(); })}></label>
      <div class="fl">${g ? `<span class="selo ok">Conectado</span>${b('Sincronizar agora', () => tenta(() => Sync.run()))}${b('Desconectar', () => { Sync.disconnect(); R(); })}` : b(S.set.gWas ? 'Reconectar' : 'Conectar conta Google', () => tenta(() => Sync.connect()), 'pri')}</div>
      ${Sync.g.error ? `<p class="erro">${esc(Sync.g.error)}</p>` : ''}<p class="dica">Situação: ${esc(Sync.status())}. Dois aparelhos mexendo ao mesmo tempo são mesclados por registro: vale a versão mais recente de cada cartão, lista ou quadro, e as exclusões também viajam.</p></section>
    <section class="cartaoz"><h2>Cópia de segurança</h2><p class="dica">${S.quadros.length} quadros, ${S.cartoes.length} cartões${DB.cheio ? ' · <b class="erro">O armazenamento do navegador está cheio; exporte uma cópia e apague anexos grandes.</b>' : ''}</p>
      <div class="fl">${b('⬇️ Exportar tudo (.json)', () => baixar('kanban-' + hoje() + '.json', JSON.stringify(Sync.payload()), 'application/json'))}${b('⬆️ Importar…', async () => { const f = await lerArquivo('.json,application/json'); if (!f) return; try { const j = JSON.parse(f.dados); if (j.app === 'kanban-quadro') { abrirQuadro(importarPacote(j).id); toast('Quadro importado'); } else if (j.app === 'kanban' && j.stores) { j.tomb = {}; Object.values(j.stores).forEach(l => l.forEach(r => { r.mod = Date.now(); })); Sync.merge(j); DB.changed(); toast('Cópia importada'); R(); } else throw 0; } catch (e) { toast('Este arquivo não é uma cópia do Kanban.'); } })}</div></section>
    <section class="cartaoz"><h2>Sobre</h2><p class="dica">Kanban ${VERSAO} · ${PUPS.length} power-ups · feito em HTML, CSS e JavaScript puros, sem dependências. Seus dados ficam neste aparelho e, se você ligar, no seu Google Drive.</p></section></div>`;
}
const VERSAO = '1.0';

/* ---------- Partida ---------- */
const App = {
  ini() {
    DB.load(); Arr.ini();
    if (innerWidth < 800) S.set.lado = false;
    const m = location.hash.match(/q=([\w]+)(?:&c=([\w]+))?/);
    if (m && byId(S.quadros, m[1])) abrirQuadro(m[1], m[2]);
    else if (DB.novo && S.quadros[0]) abrirQuadro(S.quadros[0].id);   // primeira vez: já cai no quadro de exemplo
    else { if (/^#(busca|lixeira|ajustes)$/.test(location.hash)) U.tela = location.hash.slice(1); R(); }
    Sync.init();
    setInterval(App.minuto, 60000); setTimeout(App.minuto, 3000);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => R());
    $('#scrim').addEventListener('click', () => Ficha.fechar());
    $('#dlgw').addEventListener('mousedown', e => { if (e.target.id === 'dlgw') Dlg.fechar(); });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (Pop.f) Pop.fechar(); else if (Dlg.pilha.length) Dlg.fechar(); else if (U.cartao) Ficha.fechar(); else if (U.sel.size) { U.sel.clear(); R(); } else if (U.add) { U.add = ''; R(); }
    });
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  },
  minuto() { quadrosVivos().forEach(q => evento('minuto', q)); },
  synced(changed) { if (changed) R(); else { const s = $('#side .sinc'); if (s) { s.lastChild.textContent = Sync.status(); s.className = 'sinc ' + (Sync.error || Sync.g.error ? 'erro' : Sync.any() ? 'ok' : ''); } } },
};
