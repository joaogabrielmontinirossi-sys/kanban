'use strict';
/* Kanban — power-ups do cartão (campos, anexos, vínculos…) e de tempo (cronômetro, pomodoro, SLA, lembretes…). */

const metaF = (rot, html) => `<div><small>${rot}</small><div class="fl">${html}</div></div>`;
const lat = (rot, f) => b(rot, f, 'lat');
const quemSou = () => S.set.eu || 'eu';
const tirar = (l, x) => { const i = l.indexOf(x); if (i >= 0) l.splice(i, 1); return l; };
const linhaC = (c, extra) => `<div class="linha"><span class="${c.feito ? 'selo ok' : 'selo neutro'}">${c.feito ? '✓' : '○'}</span><b class="${c.feito ? 'risc' : ''}" style="cursor:pointer;flex:1" ${on(() => abrirCartao(c))}>${esc(c.titulo)}</b><small>${esc((byId(S.listas, c.lista) || {}).nome || '')}</small>${extra || ''}</div>`;
async function escolherCartao(q, titulo, fora) {
  const cs = vivos(q).filter(c => !fora.includes(c.id));
  if (!cs.length) { toast('Não há outros cartões neste quadro.'); return null; }
  const v = await pedir(titulo, [{ k: 'c', rot: 'Cartão', tipo: 'lista', op: cs.map(c => [c.id, (c.num ? '#' + c.num + ' ' : '') + c.titulo.slice(0, 70)]) }], { ok: 'Escolher' });
  return v ? byId(S.cartoes, v.c) : null;
}
// Reduz uma imagem para caber no armazenamento do navegador e na sincronização.
const encolher = (url, max) => new Promise(res => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/jpeg', .72)); }; im.onerror = () => res(''); im.src = url; });
function notificar(titulo, corpo) {
  toast(titulo + (corpo ? ': ' + corpo : ''));
  try { if (window.Notification && Notification.permission === 'granted') new Notification(titulo, { body: corpo || '', icon: 'icons/icon-192.png' }); } catch (e) {}
}
const pedirAviso = () => { try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} };

/* ===== Cartão turbinado ===== */
PUP({ id: 'prioridade', cat: 'cartao', icone: '🚩', nome: 'Prioridade', desc: 'Quatro níveis (baixa, média, alta e crítica) com faixa colorida na borda do cartão, selo e coluna própria na tabela.',
  classeCartao: c => c.prio ? 'p' + c.prio : '',
  selo: c => c.prio >= 3 ? `<span class="selo ${c.prio === 4 ? 'ruim' : 'aviso'}">🚩 ${PRIOS[c.prio]}</span>` : '',
  meta: c => metaF('Prioridade', `<select ${onC(v => { c.prio = +v; log(c, 'Prioridade: ' + PRIOS[c.prio]); salvar(c); R(); })}>${PRIOS.map((p, i) => `<option value="${i}" ${c.prio === i ? 'selected' : ''}>${p}</option>`).join('')}</select>`) });

PUP({ id: 'capas', cat: 'cartao', icone: '🖼️', nome: 'Capas', desc: 'Capa no topo do cartão: cor, degradê, emoji gigante, imagem da internet ou uma foto enviada do aparelho.',
  lateral: c => lat('🖼️ Capa', el => {
    const set = (v, img) => { c.capa = v; c.d.capaImg = img || ''; if (!img) delete c.d.capaImg; salvar(c); Pop.fechar(); R(); };
    Pop.abrir(el, () => `<div class="pop-t">Capa</div><div class="cores pad">${CORES.map(k => `<i style="background:${k}" ${on(() => set(k))}></i>`).join('')}</div><div class="cores pad">${Object.values(FUNDOS).map(k => `<i style="background:${k}" ${on(() => set(k))}></i>`).join('')}</div><hr>
      <button class="item" ${on(async () => { Pop.fechar(); const v = await pedir('Emoji de capa', [{ k: 'e', rot: 'Emoji', val: '🚀' }]); if (v && v.e) set([...v.e].slice(0, 4).join('')); })}>😀 Emoji…</button>
      <button class="item" ${on(async () => { Pop.fechar(); const v = await pedir('Imagem da internet', [{ k: 'u', rot: 'Endereço da imagem (https://…)', ph: 'https://' }]); if (v && /^https?:\/\//.test(v.u)) set(v.u.slice(0, 590)); })}>🌐 Imagem por endereço…</button>
      <button class="item" ${on(async () => { Pop.fechar(); const f = await lerArquivo('image/*', 'url'); if (f) { const u = await encolher(f.dados, 640); if (u) set('', u); else toast('Não consegui ler a imagem.'); } })}>📷 Enviar imagem…</button>
      <button class="item perigo" ${on(() => set(''))}>Remover capa</button>`);
  }) });

PUP({ id: 'campos', cat: 'cartao', icone: '🧩', nome: 'Campos personalizados', desc: 'Crie os seus campos como no Notion e no Pipefy: texto, número, moeda, data, lista de opções e caixa de marcar. Aparecem na ficha, na tabela e, se quiser, na frente do cartão.',
  config(q) {
    const editar = async f => {
      const v = await pedir(f ? 'Editar campo' : 'Novo campo', [{ k: 'nome', rot: 'Nome', val: f ? f.nome : '' }, { k: 'tipo', rot: 'Tipo', tipo: 'lista', op: [['texto', 'Texto'], ['numero', 'Número'], ['moeda', 'Moeda (R$)'], ['data', 'Data'], ['lista', 'Lista de opções'], ['caixa', 'Caixa de marcar'], ['url', 'Link']], val: f ? f.tipo : 'texto' }, { k: 'op', rot: 'Opções (uma por linha, só para “lista”)', tipo: 'area', linhas: 4, val: f ? (f.op || []).join('\n') : '' }, { k: 'frente', tipo: 'caixa', rot: 'Mostrar na frente do cartão', val: f ? f.frente : true }], f ? { extra: 'Excluir' } : {});
      if (!v) return;
      q.d.campos = q.d.campos || [];
      if (v._extra) q.d.campos = q.d.campos.filter(x => x !== f);
      else if (v.nome) { const n = { nome: v.nome, tipo: v.tipo, op: v.op.split('\n').map(x => x.trim()).filter(Boolean), frente: v.frente }; if (f) Object.assign(f, n); else q.d.campos.push(Object.assign({ id: uid() }, n)); }
      salvarQ(q); R();
    };
    mostrar('Campos personalizados', () => `<div class="linhas">${campos(q).map((f, i) => `<div class="linha"><b>${esc(f.nome)}</b><small>${esc(f.tipo)}${f.frente ? ' · na frente' : ''}</small><span class="esp"></span>${i ? b('↑', () => { const l = q.d.campos; l.splice(i - 1, 0, l.splice(i, 1)[0]); salvarQ(q); R(); }, 'mini') : ''}${b('✎', () => editar(f), 'mini')}</div>`).join('') || '<p class="vazio">Nenhum campo ainda.</p>'}</div><div class="botoes">${b('＋ Novo campo', () => editar(null), 'pri')}</div>`, 'medio');
  },
  secao: (c, q) => campos(q).length ? sec('🧩 Campos', `<div class="grade2">${campos(q).map(f => `<label class="${f.tipo === 'caixa' ? 'cxl' : ''}">${f.tipo === 'caixa' ? cfInput(c, f) + esc(f.nome) : esc(f.nome) + cfInput(c, f)}${f.tipo === 'url' && (c.d.cf || {})[f.id] ? `<a href="${esc(c.d.cf[f.id])}" target="_blank" rel="noopener">abrir ↗</a>` : ''}</label>`).join('')}</div>`, b('⚙', () => pup('campos').config(q), 'mini')) : sec('🧩 Campos', `<p class="dica clic" ${on(() => pup('campos').config(q))}>Crie o primeiro campo deste quadro…</p>`),
  frente: (c, q) => { const h = campos(q).filter(f => f.frente && (c.d.cf || {})[f.id] != null).map(f => `<span>${esc(f.nome)}: <b>${esc(cfTexto(f, c.d.cf[f.id]))}</b></span>`).join(''); return h ? `<div class="frente-cf">${h}</div>` : ''; } });

PUP({ id: 'numeracao', cat: 'cartao', icone: '#️⃣', nome: 'Numeração', desc: 'Cada cartão ganha um número sequencial do quadro (#1, #2, #3…), visível na frente, na ficha, na tabela e na busca.',
  selo: c => `<span class="selo neutro">#${c.num}</span>` });

PUP({ id: 'estimativa', cat: 'cartao', icone: '◆', nome: 'Pontos de esforço', desc: 'Estime o tamanho de cada cartão em pontos. O total aparece no topo de cada lista e alimenta o burndown, a carga da equipe e o placar.',
  selo: c => c.d.pts ? `<span class="selo info">◆ ${fNum(c.d.pts)}</span>` : '',
  meta: c => metaF('Pontos', `<input type="number" step="any" min="0" style="width:80px" value="${c.d.pts || ''}" ${onC(v => { c.d.pts = Math.max(0, +v || 0); salvar(c); R.depois(); })}>${[1, 2, 3, 5, 8, 13].map(n => `<button class="b mini ${c.d.pts === n ? 'on' : ''}" ${on(() => { c.d.pts = n; salvar(c); R(); })}>${n}</button>`).join('')}`),
  cabLista: (l, cs) => { const t = soma(cs, c => c.d.pts); return t ? `<span class="lista-x" title="Pontos na lista">◆ ${fNum(t)}</span>` : ''; } });

PUP({ id: 'valor', cat: 'cartao', icone: '💰', nome: 'Valor em dinheiro', desc: 'Um valor em reais por cartão, com a soma no topo de cada lista. Transforma o quadro em funil de vendas, orçamento ou controle de compras.',
  selo: c => c.d.valor ? `<span class="selo ok">${fBRL(c.d.valor)}</span>` : '',
  meta: c => metaF('Valor (R$)', `<input type="number" step="0.01" style="width:130px" value="${c.d.valor || ''}" ${onC(v => { c.d.valor = +v || 0; salvar(c); R.depois(); })}>`),
  cabLista: (l, cs) => { const t = soma(cs, c => c.d.valor); return t ? `<span class="lista-x" title="Soma dos valores">${fBRL(t)}</span>` : ''; } });

PUP({ id: 'inicio', cat: 'cartao', icone: '▶️', nome: 'Data de início', desc: 'Além do prazo, o cartão ganha a data em que o trabalho começa. Mostra a duração e desenha a barra inteira no cronograma.',
  selo: c => c.inicio && !c.feito ? `<span class="selo neutro">▶ ${fData(c.inicio)}</span>` : '',
  meta: c => metaF('Início', `<input type="date" value="${c.inicio}" ${onC(v => { c.inicio = v; salvar(c); R(); })}>${c.inicio && c.prazo ? `<span class="dica">${difDias(c.prazo, c.inicio) + 1} dia(s)</span>` : ''}`) });

const depsAbertas = c => (c.d.dep || []).map(id => byId(S.cartoes, id)).filter(x => x && !x.feito && !x.lixo);
PUP({ id: 'dependencias', cat: 'cartao', icone: '🔒', nome: 'Dependências', desc: 'Diga de quais cartões este depende. Enquanto houver pendência, ele mostra um cadeado e não pode ser concluído; a ficha lista também quem ele bloqueia.',
  selo: c => { const n = depsAbertas(c).length; return n ? `<span class="selo ruim" title="Depende de ${n} cartão(ões) em aberto">🔒 ${n}</span>` : ''; },
  secao(c, q) {
    const deps = (c.d.dep || []).map(id => byId(S.cartoes, id)).filter(Boolean), bloq = vivos(q).filter(x => (x.d.dep || []).includes(c.id));
    return sec('🔒 Dependências', `<div class="linhas">${deps.map(x => linhaC(x, b('✕', () => { tirar(c.d.dep, x.id); salvar(c); R(); }, 'mini'))).join('')}</div>${bloq.length ? `<p class="dica" style="margin-top:8px">Bloqueia:</p><div class="linhas">${bloq.map(x => linhaC(x)).join('')}</div>` : ''}`,
      b('＋ Depende de…', async () => { const x = await escolherCartao(q, 'Este cartão depende de…', [c.id].concat(c.d.dep || [])); if (x) { (c.d.dep = c.d.dep || []).push(x.id); log(c, 'Passou a depender de ' + x.titulo); salvar(c); R(); } }, 'mini'));
  },
  ao: { antesMover(c, de, para) { const d = depsAbertas(c); if (para.feito && d.length) return 'Antes é preciso concluir: ' + d.map(x => x.titulo).join(', '); },
    concluir(c) { const d = depsAbertas(c); if (d.length) toast('Atenção: este cartão ainda depende de ' + d.length + ' em aberto.'); } } });

PUP({ id: 'relacionados', cat: 'cartao', icone: '🔗', nome: 'Cartões relacionados', desc: 'Ligue cartões que têm a ver um com o outro. O vínculo aparece nos dois lados e abre com um clique.',
  selo: c => (c.d.rel || []).length ? `<span class="selo neutro">⇄ ${c.d.rel.length}</span>` : '',
  secao: (c, q) => sec('🔗 Relacionados', `<div class="linhas">${(c.d.rel || []).map(id => byId(S.cartoes, id)).filter(Boolean).map(x => linhaC(x, b('✕', () => { tirar(c.d.rel, x.id); tirar(x.d.rel || [], c.id); salvar(x, true); salvar(c); R(); }, 'mini'))).join('')}</div>`,
    b('＋ Relacionar…', async () => { const x = await escolherCartao(q, 'Relacionar com…', [c.id].concat(c.d.rel || [])); if (x) { (c.d.rel = c.d.rel || []).push(x.id); (x.d.rel = x.d.rel || []).push(c.id); salvar(x, true); salvar(c); R(); } }, 'mini')) });

PUP({ id: 'anexos', cat: 'cartao', icone: '📎', nome: 'Anexos', desc: 'Guarde links e imagens no cartão. As imagens são reduzidas para caber na sincronização e podem virar a capa com um clique.',
  selo: c => (c.d.an || []).length ? `<span class="selo">📎 ${c.d.an.length}</span>` : '',
  secao: c => sec('📎 Anexos', `<div class="grade" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${(c.d.an || []).map(a => `<div class="cx-graf" style="padding:8px">${/^data:image/.test(a.url) ? `<img src="${a.url}" alt="" style="width:100%;border-radius:6px;display:block">` : ''}<a href="${esc(a.url)}" target="_blank" rel="noopener" ${/^data:/.test(a.url) ? `download="${esc(a.nome)}"` : ''} style="overflow-wrap:anywhere">${esc(a.nome)}</a><div class="fl" style="margin-top:4px">${/^data:image/.test(a.url) ? b('Capa', () => { c.d.capaImg = a.url; salvar(c); R(); }, 'mini') : ''}${b('✕', () => { tirar(c.d.an, a); salvar(c); R(); }, 'mini')}</div></div>`).join('')}</div>`,
    b('＋ Link', async () => { const v = await pedir('Anexar link', [{ k: 'u', rot: 'Endereço', ph: 'https://' }, { k: 'n', rot: 'Nome (opcional)' }]); if (v && v.u) { (c.d.an = c.d.an || []).push({ id: uid(), nome: v.n || v.u.replace(/^https?:\/\//, '').slice(0, 60), url: /^\w+:/.test(v.u) ? v.u : 'https://' + v.u }); salvar(c); R(); } }, 'mini')
    + b('＋ Imagem', async () => { const f = await lerArquivo('image/*', 'url'); if (!f) return; const u = await encolher(f.dados, 720); if (!u) return toast('Não consegui ler a imagem.'); (c.d.an = c.d.an || []).push({ id: uid(), nome: f.nome, url: u }); salvar(c); R(); if (DB.cheio) toast('O armazenamento do navegador está cheio.'); }, 'mini')) });

PUP({ id: 'local', cat: 'cartao', icone: '📍', nome: 'Local', desc: 'Um endereço no cartão, com atalho para abrir no mapa. Para visitas, audiências, entregas e viagens.',
  selo: c => c.d.local ? `<span class="selo" title="${esc(c.d.local)}">📍 ${esc(c.d.local.slice(0, 22))}</span>` : '',
  secao: c => sec('📍 Local', `<div class="fl"><input style="flex:1" placeholder="Endereço ou nome do lugar" value="${esc(c.d.local || '')}" ${onC(v => { c.d.local = v.trim(); salvar(c); R.depois(); })}>${c.d.local ? `<a class="b" target="_blank" rel="noopener" href="https://www.openstreetmap.org/search?query=${encodeURIComponent(c.d.local)}">OpenStreetMap ↗</a><a class="b" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.d.local)}">Google Maps ↗</a>` : ''}</div>`) });

PUP({ id: 'votos', cat: 'cartao', icone: '👍', nome: 'Votação', desc: 'Vote nos cartões para decidir o que vem primeiro. O total aparece na frente e a lista pode se ordenar sozinha pelos mais votados.',
  cfg: [{ k: 'ordenar', tipo: 'caixa', rot: 'Ordenar as listas pelos mais votados', val: false }],
  selo: c => { const v = c.d.votos || [], meu = v.includes(quemSou()); return `<button class="selo ${meu ? 'info' : 'neutro'}" ${on(() => { if (meu) tirar(v, quemSou()); else v.push(quemSou()); c.d.votos = v; salvar(c); R(); })} title="Votar">👍 ${v.length}</button>`; },
  ordenar: (l, cs, q) => cfg('votos', q).ordenar ? cs.slice().sort((a, x) => (x.d.votos || []).length - (a.d.votos || []).length) : cs,
  ferramentas: q => [['Zerar os votos do quadro', async () => { if (await confirmar('Zerar todos os votos deste quadro?')) { vivos(q).forEach(c => { if ((c.d.votos || []).length) { c.d.votos = []; salvar(c, true); } }); DB.changed(); R(); } }]] });

PUP({ id: 'adesivos', cat: 'cartao', icone: '⭐', nome: 'Adesivos', desc: 'Cole emojis no canto do cartão para sinalizar de longe: estrela, fogo, dúvida, comemoração.',
  frente: c => (c.d.ads || []).length ? `<div class="adesivos">${c.d.ads.map(esc).join('')}</div>` : '',
  lateral: c => lat('⭐ Adesivos', el => Pop.abrir(el, () => `<div class="pop-t">Adesivos</div><div class="cores pad" style="font-size:24px">${['⭐', '🔥', '❓', '❗', '🎉', '👀', '💡', '🐞', '🚀', '❤️', '⏳', '✅', '🧊', '💎', '🌱', '⚠️'].map(e => `<i style="width:36px;height:36px;font-style:normal;text-align:center;${(c.d.ads || []).includes(e) ? 'outline:2px solid var(--pri)' : ''}" ${on(() => { const l = c.d.ads = c.d.ads || []; if (l.includes(e)) tirar(l, e); else if (l.length < 3) l.push(e); salvar(c); R(); })}>${e}</i>`).join('')}</div>`)) });

PUP({ id: 'subcartoes', cat: 'cartao', icone: '🪜', nome: 'Subcartões', desc: 'Cartões dentro de cartões: quebre uma entrega em partes que andam sozinhas pelo quadro, com o progresso somado no cartão-pai.',
  selo(c) { const f = filhosDe(c), p = c.pai && byId(S.cartoes, c.pai); return (f.length ? `<span class="selo ${f.every(x => x.feito) ? 'ok' : 'neutro'}">🪜 ${f.filter(x => x.feito).length}/${f.length}</span>` : '') + (p ? `<span class="selo neutro" title="Parte de: ${esc(p.titulo)}">↳ ${esc(p.titulo.slice(0, 18))}</span>` : ''); },
  secao(c, q) {
    const f = filhosDe(c), p = c.pai && byId(S.cartoes, c.pai);
    return sec('🪜 Subcartões', (p ? `<p class="dica">Parte de <a href="#" ${on((el, e) => { e.preventDefault(); abrirCartao(p); })}>${esc(p.titulo)}</a> ${b('Desvincular', () => { c.pai = ''; salvar(c); R(); }, 'mini')}</p>` : '') + `<div class="linhas">${f.map(x => `<div class="linha"><input type="checkbox" ${x.feito ? 'checked' : ''} ${onC(v => { marcarFeito(x, v); R(); })}><b class="${x.feito ? 'risc' : ''}" style="cursor:pointer;flex:1" ${on(() => abrirCartao(x))}>${esc(x.titulo)}</b><small>${esc((byId(S.listas, x.lista) || {}).nome || '')}</small></div>`).join('')}</div>
      <input class="cheio" style="margin-top:6px" data-k="sub-${c.id}" placeholder="＋ Novo subcartão… (Enter)" ${onE(v => { if (v.trim()) { criarCartao(q, byId(S.listas, c.lista), v, { pai: c.id }); U.foco = 'sub-' + c.id; R(); } })}>`,
      b('Vincular existente…', async () => { const x = await escolherCartao(q, 'Tornar subcartão deste', [c.id, c.pai].concat(f.map(y => y.id))); if (x) { x.pai = c.id; salvar(x); R(); } }, 'mini'));
  } });

const pcDe = c => { if (c.d.pc != null) return c.d.pc; const [ok, n] = ckTotal(c), f = filhosDe(c), t = n + f.length; return t ? Math.round((ok + f.filter(x => x.feito).length) / t * 100) : null; };
PUP({ id: 'progresso', cat: 'cartao', icone: '📶', nome: 'Barra de progresso', desc: 'Uma barra na frente do cartão, calculada pelos checklists e subcartões ou ajustada à mão de 0 a 100%.',
  frente: c => { const p = pcDe(c); return p == null ? '' : `<div class="barra" title="${p}%"><i class="${p >= 100 ? 'ok' : ''}" style="width:${p}%"></i></div>`; },
  secao: c => { const p = pcDe(c); return sec('📶 Progresso', `<div class="fl"><input type="range" min="0" max="100" step="5" value="${p || 0}" style="flex:1" ${onC(v => { c.d.pc = +v; salvar(c); R(); })}><b>${p == null ? '—' : p + '%'}</b>${c.d.pc != null ? b('Automático', () => { delete c.d.pc; salvar(c); R(); }, 'mini') : '<span class="dica">automático</span>'}</div>`); } });

PUP({ id: 'contatos', cat: 'cartao', icone: '👤', nome: 'Contato', desc: 'Nome, empresa, telefone e e-mail da pessoa ligada ao cartão, com botões para ligar, escrever e chamar no WhatsApp.',
  selo: c => (c.d.ct || {}).nome ? `<span class="selo">👤 ${esc(c.d.ct.nome.slice(0, 20))}</span>` : '',
  secao(c) {
    const t = c.d.ct || {}, cp = (k, rot, tipo) => `<label>${rot}<input type="${tipo || 'text'}" value="${esc(t[k] || '')}" ${onC(v => { (c.d.ct = c.d.ct || {})[k] = v.trim(); salvar(c); R.depois(); })}></label>`, tel = (t.tel || '').replace(/\D/g, '');
    return sec('👤 Contato', `<div class="grade2">${cp('nome', 'Nome')}${cp('emp', 'Empresa')}${cp('tel', 'Telefone', 'tel')}${cp('email', 'E-mail', 'email')}</div><div class="fl" style="margin-top:8px">${tel ? `<a class="b" href="tel:${tel}">📞 Ligar</a><a class="b" target="_blank" rel="noopener" href="https://wa.me/${tel.length <= 11 ? '55' + tel : tel}?text=${encodeURIComponent('Olá' + (t.nome ? ', ' + t.nome.split(' ')[0] : '') + '!')}">💬 WhatsApp</a>` : ''}${t.email ? `<a class="b" href="mailto:${esc(t.email)}?subject=${encodeURIComponent(c.titulo)}">✉️ E-mail</a>` : ''}</div>`);
  } });

const linksDe = c => [...new Set((c.titulo + ' ' + c.texto).match(/https?:\/\/[^\s<>)\]]+/g) || [])];
PUP({ id: 'links', cat: 'cartao', icone: '🌐', nome: 'Links rápidos', desc: 'Encontra os endereços escritos no título e na descrição e põe um botão na frente do cartão para abrir sem entrar na ficha.',
  selo: c => { const l = linksDe(c); return l.length ? `<a class="selo info" href="${esc(l[0])}" target="_blank" rel="noopener" title="${esc(l[0])}">🌐 ${esc(l[0].replace(/^https?:\/\/(www\.)?/, '').split('/')[0].slice(0, 20))}${l.length > 1 ? ' +' + (l.length - 1) : ''}</a>` : ''; },
  secao: c => { const l = linksDe(c); return l.length ? sec('🌐 Links', `<div class="linhas">${l.map(u => `<a class="linha" href="${esc(u)}" target="_blank" rel="noopener" style="overflow-wrap:anywhere">${esc(u)}</a>`).join('')}</div>`) : ''; } });

PUP({ id: 'ck-pro', cat: 'cartao', icone: '🧾', nome: 'Checklists avançados', desc: 'Cada item do checklist pode ter prazo e responsável, e virar um cartão de verdade quando crescer. O cartão avisa quando há item vencido.',
  selo: c => { const h = hoje(), v = (c.d.ck || []).flatMap(k => k.itens).filter(i => !i.ok && i.prazo && i.prazo <= h).length; return v ? `<span class="selo ruim" title="Itens de checklist vencendo">☑ ${v} vencendo</span>` : ''; },
  ckItem: (c, k, i, q) => (i.prazo ? `<span class="selo ${!i.ok && i.prazo < hoje() ? 'venc' : 'neutro'}">${fData(i.prazo)}</span>` : '') + (i.quem && byId(S.membros, i.quem) ? avatar(byId(S.membros, i.quem)) : '')
    + `<button class="ic" ${on(el => menu(el, [
      ['🕒 Prazo do item…', async () => { const v = await pedir('Prazo do item', [{ k: 'd', rot: 'Prazo', tipo: 'data', val: i.prazo || hoje() }], { extra: 'Sem prazo' }); if (v) { i.prazo = v._extra ? '' : v.d; salvar(c); R(); } }],
      ['👤 Responsável…', async () => { const v = await pedir('Responsável pelo item', [{ k: 'm', rot: 'Membro', tipo: 'lista', op: [['', '— ninguém —']].concat(membros().map(m => [m.id, m.nome])), val: i.quem || '' }]); if (v) { i.quem = v.m; salvar(c); R(); } }],
      ['🃏 Transformar em cartão', () => { const n = criarCartao(q, byId(S.listas, c.lista), i.t, { prazo: i.prazo || '', membros: i.quem || '', pai: ativo('subcartoes', q) ? c.id : '' }); tirar(k.itens, i); salvar(c); R(); toast('Item virou o cartão #' + n.num); }],
    ]))}>⋯</button>` });

/* ===== Tempo e foco ===== */
const ttTotal = c => { const t = c.d.tt || {}; return (t.ms || 0) + (t.ini ? Date.now() - t.ini : 0); };
const ttParar = c => { const t = c.d.tt; if (t && t.ini) { t.ms = (t.ms || 0) + Date.now() - t.ini; t.ini = 0; (t.log = t.log || []).push({ d: hoje(), ms: Date.now() - (t.desde || Date.now()) }); if (t.log.length > 60) t.log.shift(); salvar(c, true); } };
PUP({ id: 'cronometro', cat: 'tempo', icone: '⏱️', nome: 'Cronômetro', desc: 'Marque o tempo gasto em cada cartão com um clique. O total fica na frente, dá para lançar minutos à mão, e há um relatório de horas por cartão e por pessoa.',
  selo: c => { const t = ttTotal(c); return t || (c.d.tt || {}).ini ? `<span class="selo cronom ${(c.d.tt || {}).ini ? 'ok pisca' : 'neutro'}" data-tt="${c.id}">⏱ ${fDur(t)}</span>` : ''; },
  lateral: (c, q) => lat((c.d.tt || {}).ini ? '⏹ Parar cronômetro' : '⏱️ Iniciar cronômetro', () => { const t = c.d.tt = c.d.tt || {}; if (t.ini) ttParar(c); else { vivos(q).forEach(x => ttParar(x)); t.ini = t.desde = Date.now(); salvar(c, true); log(c, 'Cronômetro iniciado'); } DB.changed(); R(); }),
  secao: c => ttTotal(c) ? sec('⏱️ Tempo gasto', `<div class="fl"><b class="cronom" data-tt="${c.id}" style="font-size:20px">${fDur(ttTotal(c))}</b><span class="esp"></span>${b('＋ Lançar minutos', async () => { const v = await pedir('Lançar tempo', [{ k: 'm', rot: 'Minutos', tipo: 'numero', val: 30 }]); if (v && v.m) { const t = c.d.tt = c.d.tt || {}; t.ms = Math.max(0, (t.ms || 0) + v.m * 60000); salvar(c); R(); } }, 'mini')}${b('Zerar', () => { c.d.tt = {}; salvar(c); R(); }, 'mini')}</div>`) : '',
  ferramentas: q => [['Relatório de horas', () => mostrar('Relatório de horas', () => { const cs = S.cartoes.filter(c => c.quadro === q.id && !c.lixo && ttTotal(c)).sort((a, x) => ttTotal(x) - ttTotal(a)), pm = membros().map(m => [m.nome.split(' ')[0], Math.round(soma(cs.filter(c => lst(c.membros).includes(m.id)), ttTotal) / 36e4) / 10, m.cor]).filter(x => x[1]); return `<div class="kpis"><div class="kpi"><b>${fDur(soma(cs, ttTotal))}</b><small>no quadro</small></div><div class="kpi"><b>${cs.length}</b><small>cartões com tempo</small></div></div>${pm.length ? `<h3>Horas por pessoa</h3>${G.barras(pm, { h: 130 })}` : ''}<table class="tab"><thead><tr><th>Cartão</th><th>Lista</th><th>Tempo</th></tr></thead><tbody>${cs.map(c => `<tr><td class="t" ${on(() => { Dlg.fechar(); abrirCartao(c); })}>${esc(c.titulo)}</td><td>${esc((byId(S.listas, c.lista) || {}).nome || '')}</td><td>${fDur(ttTotal(c))}</td></tr>`).join('') || '<tr><td colspan="3" class="vazio">Nenhum tempo marcado.</td></tr>'}</tbody></table>`; })]] });
setInterval(() => $$('.cronom[data-tt]').forEach(e => { const c = byId(S.cartoes, e.dataset.tt); if (c && (c.d.tt || {}).ini) e.textContent = (e.tagName === 'B' ? '' : '⏱ ') + fDur(ttTotal(c)); }), 15000);

const Pomo = { e: (() => { try { return JSON.parse(localStorage.getItem('kanban-pomo')) || null; } catch (x) { return null; } })(),
  grava() { try { localStorage.setItem('kanban-pomo', JSON.stringify(Pomo.e)); } catch (x) {} },
  inicia(c, q, modo) { const k = cfg('pomodoro', q); Pomo.e = { fim: Date.now() + (modo === 'pausa' ? k.pausa : k.foco) * 60000, cartao: c ? c.id : '', quadro: q.id, modo: modo || 'foco' }; Pomo.grava(); pedirAviso(); R(); },
  para() { Pomo.e = null; Pomo.grava(); R(); },
  tique() {
    const e = Pomo.e, el = $('#pomo-t');
    if (!e) return;
    const r = e.fim - Date.now();
    if (el) el.textContent = pad(Math.max(0, Math.floor(r / 60000))) + ':' + pad(Math.max(0, Math.floor(r / 1000) % 60));
    if (r > 0) return;
    const c = byId(S.cartoes, e.cartao), q = byId(S.quadros, e.quadro);
    if (e.modo === 'foco') { if (c) { c.d.pom = (c.d.pom || 0) + 1; const t = c.d.tt = c.d.tt || {}; if (q && ativo('cronometro', q) && !t.ini) t.ms = (t.ms || 0) + cfg('pomodoro', q).foco * 60000; log(c, 'Pomodoro concluído'); salvar(c); } notificar('🍅 Pomodoro concluído', 'Hora da pausa.'); if (q && ativo('pomodoro', q)) Pomo.inicia(c, q, 'pausa'); else Pomo.para(); }
    else { notificar('⏰ Fim da pausa', 'Pronto para o próximo foco?'); Pomo.para(); }
  } };
setInterval(Pomo.tique, 1000);
PUP({ id: 'pomodoro', cat: 'tempo', icone: '🍅', nome: 'Pomodoro', desc: 'Ciclos de foco e pausa ligados a um cartão. O relógio fica no topo do quadro, avisa quando termina e conta quantos pomodoros cada cartão levou.',
  cfg: [{ k: 'foco', rot: 'Minutos de foco', tipo: 'numero', val: 25 }, { k: 'pausa', rot: 'Minutos de pausa', tipo: 'numero', val: 5 }],
  selo: c => c.d.pom ? `<span class="selo neutro">🍅 ${c.d.pom}</span>` : '',
  barra(q) { const e = Pomo.e, c = e && byId(S.cartoes, e.cartao); return e ? `<span class="barra-w" title="${esc(c ? c.titulo : '')}">${e.modo === 'foco' ? '🍅' : '☕'} <b id="pomo-t">--:--</b><button ${on(() => Pomo.para())} title="Parar">✕</button></span>` : `<button class="tb" ${on(() => Pomo.inicia(null, q))} title="Iniciar um pomodoro">🍅</button>`; },
  lateral: (c, q) => lat(Pomo.e && Pomo.e.cartao === c.id ? '🍅 Parar pomodoro' : '🍅 Pomodoro', () => { if (Pomo.e && Pomo.e.cartao === c.id) Pomo.para(); else { Pomo.inicia(c, q); toast('Foco de ' + cfg('pomodoro', q).foco + ' minutos iniciado'); } }) });

PUP({ id: 'idade', cat: 'tempo', icone: '🍂', nome: 'Cartões envelhecem', desc: 'Cartões parados vão desbotando com o passar dos dias, como papel antigo. O que ficou esquecido salta aos olhos.',
  cfg: [{ k: 'dias', rot: 'Começa a desbotar depois de quantos dias sem mexer', tipo: 'numero', val: 7 }],
  classeCartao(c, q) { if (c.feito) return ''; const n = cfg('idade', q).dias || 7, d = (Date.now() - c.mod) / 864e5; return d >= n * 3 ? 'velho3' : d >= n * 2 ? 'velho2' : d >= n ? 'velho1' : ''; } });

const naFase = c => Date.now() - (c.entrou || c.criado || Date.now());
PUP({ id: 'tempo-fase', cat: 'tempo', icone: '⏳', nome: 'Tempo na etapa', desc: 'Mostra há quanto tempo o cartão está na lista atual e, na ficha, quanto ficou em cada etapa por onde passou.',
  selo: c => c.feito || naFase(c) < 36e5 ? '' : `<span class="selo neutro" title="Tempo nesta lista">⏳ ${fDur(naFase(c))}</span>`,
  secao(c, q) { const tl = Object.assign({}, c.d.tl); tl[c.lista] = (tl[c.lista] || 0) + (c.feito ? 0 : naFase(c)); const d = listasDe(q).filter(l => tl[l.id]).map(l => [l.nome, Math.round(tl[l.id] / 36e5 * 10) / 10, l.id === c.lista ? 'var(--ok)' : 'var(--pri)']); return d.length > 1 ? sec('⏳ Tempo por etapa (horas)', G.barras(d, { h: 110 })) : ''; } });

PUP({ id: 'sla', cat: 'tempo', icone: '⏰', nome: 'SLA por etapa', desc: 'Defina o tempo máximo que um cartão pode ficar em cada lista, como no Pipefy. O cartão mostra quanto falta e fica vermelho quando estoura; a lista conta os estouros.',
  async config(q) { const ls = listasDe(q), v = await pedir('SLA de cada lista (em horas; 0 = sem SLA)', ls.map(l => ({ k: l.id, rot: l.nome, tipo: 'numero', val: l.d.sla || 0 }))); if (v) { ls.forEach(l => { l.d.sla = Math.max(0, v[l.id]); Data.put('listas', l, true); }); DB.changed(); R(); } },
  selo(c) { const l = byId(S.listas, c.lista); if (!l || !l.d.sla || c.feito) return ''; const r = l.d.sla * 36e5 - naFase(c); return r < 0 ? `<span class="selo ruim" title="SLA estourado">⏰ +${fDur(-r)}</span>` : `<span class="selo ${r < l.d.sla * 9e5 ? 'aviso' : 'neutro'}" title="Tempo restante do SLA">⏰ ${fDur(r)}</span>`; },
  cabLista(l, cs) { if (!l.d.sla) return ''; const n = cs.filter(c => !c.feito && naFase(c) > l.d.sla * 36e5).length; return `<span class="lista-x ${n ? 'ruim' : ''}" title="SLA de ${l.d.sla}h">⏰ ${n ? n + ' fora' : l.d.sla + 'h'}</span>`; },
  ferramentas: q => [['Definir o SLA das listas', () => pup('sla').config(q)]] });

PUP({ id: 'semaforo', cat: 'tempo', icone: '🚦', nome: 'Semáforo de prazos', desc: 'Uma faixa no topo do cartão: verde quando o prazo está longe, amarela quando se aproxima e vermelha quando venceu.',
  cfg: [{ k: 'dias', rot: 'Fica amarelo quando faltarem quantos dias', tipo: 'numero', val: 2 }],
  classeCartao: (c, q) => !c.prazo || c.feito ? '' : c.prazo < hoje() ? 'sem-r' : c.prazo <= mais(hoje(), cfg('semaforo', q).dias) ? 'sem-a' : 'sem-v' });

PUP({ id: 'contagem', cat: 'tempo', icone: '⌛', nome: 'Contagem regressiva', desc: 'Em vez da data, o cartão diz quanto falta: “faltam 3d 4h”, “vence em 50min” ou “atrasado há 2d”.',
  selo(c) { if (!c.prazo || c.feito) return ''; const r = new Date(c.prazo + 'T' + (c.hora || '23:59')) - Date.now(); return `<span class="selo ${r < 0 ? 'ruim' : r < 864e5 ? 'aviso' : 'neutro'}">⌛ ${r < 0 ? 'atrasado há ' + fDur(-r) : 'faltam ' + fDur(r)}</span>`; } });

const Foco = { ini: 0 };
function focar(c, q) {
  Foco.ini = Date.now(); Foco.id = c.id; U.cartao = '';
  Dlg.abrir(() => { const x = byId(S.cartoes, Foco.id); if (!x) return ''; const prox = vivos(q).filter(y => !y.feito && y.id !== x.id && y.lista === x.lista).sort((a, y) => a.ordem - y.ordem)[0];
    return `<div class="foco-t" style="position:static"><small>🎯 Modo foco · ${esc(q.nome)}</small><h1>${esc(x.titulo)}</h1><div class="relogio" id="foco-r">00:00</div>
      <div style="max-width:560px;text-align:left;width:100%">${(x.d.ck || []).flatMap(k => k.itens).map(i => `<label class="cx"><input type="checkbox" ${i.ok ? 'checked' : ''} ${onC(v => { i.ok = v; salvar(x); R(); })}> <span class="${i.ok ? 'risc' : ''}">${esc(i.t)}</span></label>`).join('')}</div>
      <div class="fl">${b('✓ Concluir', () => { marcarFeito(x, true); if (prox) { Foco.id = prox.id; Foco.ini = Date.now(); R(); } else Dlg.fechar(); }, 'pri')}${prox ? b('Pular ▶', () => { Foco.id = prox.id; Foco.ini = Date.now(); R(); }) : ''}${b('Abrir ficha', () => { Dlg.fechar(); abrirCartao(x); })}${b('Sair', () => Dlg.fechar())}</div></div>`; }, { classe: 'tela', vivo: true });
}
setInterval(() => { const e = $('#foco-r'); if (e) { const s = Math.floor((Date.now() - Foco.ini) / 1000); e.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60); } }, 1000);
PUP({ id: 'foco', cat: 'tempo', icone: '🎯', nome: 'Modo foco', desc: 'Um cartão só, em tela cheia, com relógio e checklist. Ao concluir, o próximo da lista entra sozinho.',
  lateral: (c, q) => lat('🎯 Focar', () => focar(c, q)),
  ferramentas: q => [['Focar no próximo cartão', () => { const ls = listasDe(q).filter(l => !l.feito), c = ls.slice(1).concat(ls.slice(0, 1)).map(l => daLista(l, q).find(x => !x.feito && passa(x, q))).find(Boolean); if (c) focar(c, q); else toast('Nada em aberto. 🎉'); }]] });

const doDia = () => S.cartoes.filter(c => !c.lixo && !c.arquivado && (c.d.dia === hoje() || (c.prazo === hoje() && !c.feito)) && byId(S.quadros, c.quadro) && !byId(S.quadros, c.quadro).arquivado);
PUP({ id: 'meu-dia', cat: 'tempo', icone: '☀️', nome: 'Meu dia', desc: 'Escolha de manhã o que entra no dia. Um botão no topo reúne os cartões marcados e os que vencem hoje, de todos os quadros.',
  selo: c => c.d.dia === hoje() ? '<span class="selo aviso">☀ hoje</span>' : '',
  lateral: c => lat(c.d.dia === hoje() ? '☀️ Tirar do meu dia' : '☀️ Pôr no meu dia', () => { c.d.dia = c.d.dia === hoje() ? '' : hoje(); salvar(c); R(); }),
  barra: () => { const l = doDia(); return `<button class="tb" ${on(() => mostrar('☀️ Meu dia · ' + fData(hoje()), () => { const d = doDia(), f = d.filter(c => c.feito).length; return `<div class="barra" style="margin-bottom:10px"><i class="ok" style="width:${d.length ? f / d.length * 100 : 0}%"></i></div><div class="linhas">${d.sort((a, x) => (a.feito ? 1 : 0) - (x.feito ? 1 : 0)).map(c => `<div class="linha"><input type="checkbox" ${c.feito ? 'checked' : ''} ${onC(v => { marcarFeito(c, v); R(); })}><b class="${c.feito ? 'risc' : ''}" style="cursor:pointer;flex:1" ${on(() => { Dlg.fechar(); abrirCartao(c); })}>${esc(c.titulo)}</b><small>${esc(byId(S.quadros, c.quadro).nome)}</small>${c.d.dia === hoje() ? b('✕', () => { c.d.dia = ''; salvar(c); R(); }, 'mini') : '<span class="selo hoje">vence hoje</span>'}</div>`).join('') || '<p class="vazio">Nada no dia ainda. Abra um cartão e clique em “Pôr no meu dia”.</p>'}</div>`; }, 'medio'))} title="Meu dia">☀️ <span>${l.filter(c => c.feito).length}/${l.length}</span></button>`; } });

function sequencia(q, meta) {
  const pd = grupo(S.cartoes.filter(c => c.quadro === q.id && c.feito && !c.lixo), c => ymd(new Date(c.feito)));
  let d = hoje(), n = 0;
  if ((pd[d] || []).length < meta) d = mais(d, -1);
  while ((pd[d] || []).length >= meta) { n++; d = mais(d, -1); }
  return [(pd[hoje()] || []).length, n];
}
PUP({ id: 'meta', cat: 'tempo', icone: '🏆', nome: 'Meta diária e sequência', desc: 'Defina quantos cartões quer concluir por dia. O topo do quadro mostra o placar de hoje e há quantos dias seguidos a meta é batida.',
  cfg: [{ k: 'meta', rot: 'Cartões concluídos por dia', tipo: 'numero', val: 3 }],
  barra(q) { const m = cfg('meta', q).meta || 3, [h, s] = sequencia(q, m); return `<span class="barra-w" title="Meta diária: ${m} · sequência de ${s} dia(s)">🏆 ${h}/${m}${s ? ' · 🔥 ' + s : ''}</span>`; } });

PUP({ id: 'adiar', cat: 'tempo', icone: '💤', nome: 'Adiar (soneca)', desc: 'Tire um cartão da frente até uma data. Ele some do quadro e volta sozinho no dia marcado.',
  filtro: c => V.adiados || !(c.d.dorme && c.d.dorme > hoje()),
  selo: c => c.d.dorme && c.d.dorme > hoje() ? `<span class="selo neutro">💤 até ${fData(c.d.dorme)}</span>` : '',
  lateral: c => lat(c.d.dorme > hoje() ? '💤 Adiado até ' + fData(c.d.dorme) : '💤 Adiar', el => { const set = n => () => { c.d.dorme = n ? mais(hoje(), n) : ''; log(c, n ? 'Adiado até ' + fData(c.d.dorme) : 'Acordado'); salvar(c); if (n) U.cartao = ''; R(); }; menu(el, [['Até amanhã', set(1)], ['Por 3 dias', set(3)], ['Por 1 semana', set(7)], ['Por 1 mês', set(30)], ['Escolher data…', async () => { const v = await pedir('Adiar até', [{ k: 'd', rot: 'Data', tipo: 'data', val: mais(hoje(), 7) }]); if (v && v.d) { c.d.dorme = v.d; salvar(c); U.cartao = ''; R(); } }], c.d.dorme > hoje() && ['☀ Acordar agora', set(0)]]); }),
  ferramentas: q => { const n = vivos(q).filter(c => c.d.dorme > hoje()).length; return [[(V.adiados ? 'Ocultar' : 'Mostrar') + ' os ' + n + ' cartões adiados', () => { V.adiados = !V.adiados; R(); }]]; } });

const REPS = { d: 'dia(s)', u: 'dia(s) úteis', s: 'semana(s)', m: 'mês(es)', a: 'ano(s)' };
function proximaData(base, r) { let d = dt(base); const n = Math.max(1, r.n || 1); if (r.t === 'd') d.setDate(d.getDate() + n); else if (r.t === 's') d.setDate(d.getDate() + 7 * n); else if (r.t === 'm') d.setMonth(d.getMonth() + n); else if (r.t === 'a') d.setFullYear(d.getFullYear() + n); else for (let i = 0; i < n;) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) i++; } return ymd(d); }
PUP({ id: 'recorrencia', cat: 'tempo', icone: '🔁', nome: 'Cartões recorrentes', desc: 'Tarefas que se repetem a cada tantos dias, dias úteis, semanas, meses ou anos. Ao concluir, a próxima nasce sozinha com o novo prazo e os checklists zerados.',
  selo: c => c.d.rep ? `<span class="selo neutro" title="Repete a cada ${c.d.rep.n} ${REPS[c.d.rep.t]}">🔁</span>` : '',
  lateral: c => lat(c.d.rep ? '🔁 A cada ' + c.d.rep.n + ' ' + REPS[c.d.rep.t] : '🔁 Repetir…', async () => { const r = c.d.rep || { t: 's', n: 1 }, v = await pedir('Repetir este cartão', [{ k: 'n', rot: 'A cada', tipo: 'numero', val: r.n }, { k: 't', rot: 'Unidade', tipo: 'lista', op: Object.entries(REPS), val: r.t }, { tipo: 'info', rot: 'Ao concluir, um cartão novo é criado na primeira lista, com o prazo contado a partir do prazo atual (ou de hoje).' }], c.d.rep ? { extra: 'Não repetir' } : {}); if (!v) return; if (v._extra) delete c.d.rep; else c.d.rep = { t: v.t, n: Math.max(1, Math.round(v.n)) }; salvar(c); R(); }),
  ao: { concluir(c, q) {
    if (!c.d.rep) return;
    const r = c.d.rep, l = listasDe(q).find(x => !x.feito) || byId(S.listas, c.lista), base = c.prazo && c.prazo >= hoje() ? c.prazo : hoje();
    const n = copiarCartao(c, l); n.prazo = proximaData(base, r); n.feito = 0; n.d.rep = r; (n.d.ck || []).forEach(k => k.itens.forEach(i => { i.ok = false; })); delete n.d.tt; delete n.d.pom; salvar(n, true);
    delete c.d.rep; salvar(c, true);
    toast('🔁 Próxima ocorrência criada para ' + fData(n.prazo));
  } } });

const LEMB = [['0', 'Na hora do prazo'], ['10', '10 minutos antes'], ['60', '1 hora antes'], ['1440', '1 dia antes'], ['2880', '2 dias antes'], ['10080', '1 semana antes']];
PUP({ id: 'lembretes', cat: 'tempo', icone: '🔔', nome: 'Lembretes', desc: 'Avisos antes do prazo: na hora, minutos, horas ou dias antes. Aparecem no app e, se você permitir, como notificação do sistema.',
  cfg: [{ k: 'padrao', rot: 'Lembrete automático em todo cartão com prazo', tipo: 'lista', op: [['', 'Nenhum']].concat(LEMB), val: '' }],
  selo: c => c.d.lemb != null && c.prazo && !c.feito ? '<span class="selo neutro" title="Tem lembrete">🔔</span>' : '',
  lateral: c => lat(c.d.lemb != null ? '🔔 ' + (LEMB.find(x => +x[0] === c.d.lemb) || ['', 'Lembrete'])[1] : '🔔 Lembrete…', async () => { if (!c.prazo) return toast('Defina um prazo primeiro.'); const v = await pedir('Lembrete', [{ k: 'm', rot: 'Avisar', tipo: 'lista', op: LEMB, val: String(c.d.lemb == null ? 60 : c.d.lemb) }, { tipo: 'info', rot: 'Sem hora definida, o prazo conta como 9h da manhã.' }], c.d.lemb != null ? { extra: 'Sem lembrete' } : {}); if (!v) return; if (v._extra) delete c.d.lemb; else { c.d.lemb = +v.m; pedirAviso(); } delete c.d.lembOk; salvar(c); R(); }),
  ao: { minuto(q) {
    const pad0 = cfg('lembretes', q).padrao, agora = Date.now();
    vivos(q).forEach(c => { const m = c.d.lemb != null ? c.d.lemb : pad0 !== '' ? +pad0 : null; if (m == null || !c.prazo || c.feito) return; const alvo = new Date(c.prazo + 'T' + (c.hora || '09:00')).getTime() - m * 60000; if (agora >= alvo && agora < alvo + 864e5 && c.d.lembOk !== alvo) { c.d.lembOk = alvo; salvar(c, true); DB.changed(); notificar('🔔 ' + c.titulo, 'Prazo: ' + fData(c.prazo) + (c.hora ? ' às ' + c.hora : '') + ' · ' + q.nome); } });
  } } });
