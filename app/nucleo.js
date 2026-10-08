'use strict';
/* Kanban — núcleo: utilitários, camadas da tela (principal, cartão, diálogo, menu), arrastar e o registro de power-ups. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hoje = () => ymd(new Date());
const dt = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const mais = (s, n) => { const d = dt(s); d.setDate(d.getDate() + n); return ymd(d); };
const difDias = (a, b) => Math.round((dt(a) - dt(b)) / 864e5);
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESESL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const fData = s => { if (!s) return ''; const d = dt(s); return d.getDate() + ' ' + MESES[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + String(d.getFullYear()).slice(2) : ''); };
const fQuando = t => { const d = new Date(t); return ymd(d) === hoje() ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : fData(ymd(d)) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const fDur = ms => { const m = Math.round(ms / 60000); return m < 60 ? m + 'min' : m < 1440 ? Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + pad(m % 60) : '') : (ms / 864e5).toFixed(ms < 10 * 864e5 ? 1 : 0).replace('.', ',') + 'd'; };
const fNum = n => (Math.round(n * 100) / 100).toLocaleString('pt-BR');
const fBRL = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const lst = s => s ? String(s).split(',').filter(Boolean) : [];
const soma = (l, f) => l.reduce((n, x) => n + (Number(f(x)) || 0), 0);
const grupo = (l, f) => l.reduce((m, x) => { const k = f(x); (m[k] = m[k] || []).push(x); return m; }, {});
const semAcento = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const claro = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 160; };
const baixar = (nome, texto, tipo) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: tipo || 'text/plain' })); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
const copiar = async t => { try { await navigator.clipboard.writeText(t); toast('Copiado'); } catch (e) { pedir('Copie o texto', [{ k: 't', tipo: 'area', val: t }]); } };
const lerArquivo = (aceita, como) => new Promise(res => { const i = $('#filepick'); i.accept = aceita; i.value = ''; i.onchange = () => { const f = i.files[0]; if (!f) return res(null); const r = new FileReader(); r.onload = () => res({ nome: f.name, dados: r.result, tam: f.size }); if (como === 'url') r.readAsDataURL(f); else r.readAsText(f); }; i.click(); });

/* ---------- Markdown enxuto ---------- */
function mdLinha(s) {
  return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>').replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
}
// `marcar(n)` é chamado ao clicar na n-ésima caixinha "- [ ]" do texto.
function md(t, marcar) {
  let out = '', lista = '', n = 0;
  const fecha = () => { if (lista) { out += '</' + lista + '>'; lista = ''; } };
  for (const l of String(t || '').split('\n')) {
    let m;
    if ((m = l.match(/^\s*[-*] \[( |x)\] (.*)$/i))) { if (lista !== 'ul') { fecha(); out += '<ul class="mdck">'; lista = 'ul'; } const i = n++; out += `<li><input type="checkbox" ${m[1] !== ' ' ? 'checked' : ''} ${marcar ? onC(() => marcar(i)) : 'disabled'}> ${mdLinha(m[2])}</li>`; }
    else if ((m = l.match(/^\s*[-*] (.*)$/))) { if (lista !== 'ul') { fecha(); out += '<ul>'; lista = 'ul'; } out += '<li>' + mdLinha(m[1]) + '</li>'; }
    else if ((m = l.match(/^\s*\d+[.)] (.*)$/))) { if (lista !== 'ol') { fecha(); out += '<ol>'; lista = 'ol'; } out += '<li>' + mdLinha(m[1]) + '</li>'; }
    else { fecha(); if ((m = l.match(/^(#{1,3}) (.*)$/))) out += `<h${m[1].length + 2}>${mdLinha(m[2])}</h${m[1].length + 2}>`; else if (/^---+$/.test(l.trim())) out += '<hr>'; else if ((m = l.match(/^> ?(.*)$/))) out += '<blockquote>' + mdLinha(m[1]) + '</blockquote>'; else if (l.trim()) out += '<p>' + mdLinha(l) + '</p>'; }
  }
  fecha();
  return out;
}
const mdAlterna = (t, i) => { let n = 0; return t.split('\n').map(l => { const m = l.match(/^(\s*[-*] \[)( |x)(\] .*)$/i); return m && n++ === i ? m[1] + (m[2] === ' ' ? 'x' : ' ') + m[3] : l; }).join('\n'); };

/* ---------- Camadas e eventos ----------
   Cada camada (m: principal, s: cartão, d: diálogo, p: menu) guarda as funções dos seus botões; ao repintar, as antigas somem. */
const FNS = { m: new Map(), l: new Map(), s: new Map(), d: new Map(), p: new Map() };
let CAM = 'm', fnN = 0;
const reg = f => { const k = CAM + (++fnN); FNS[CAM].set(k, f); return k; };
const on = f => `data-a="${reg(f)}"`;       // clique
const onC = f => `data-c="${reg(f)}"`;      // mudança de valor: f(valor, elemento)
const onE = f => `data-e="${reg(f)}"`;      // Enter num campo: f(valor, elemento)
const achaFn = k => k && FNS[k[0]] && FNS[k[0]].get(k);
function pintar(cam, el, f) {
  const ant = CAM, rol = {}, ae = document.activeElement, foco = ae && el.contains(ae) && ae.dataset.k ? { k: ae.dataset.k, v: ae.value, a: ae.selectionStart, b: ae.selectionEnd } : null;
  $$('[data-rol]', el).forEach(e => rol[e.dataset.rol] = [e.scrollLeft, e.scrollTop]);
  if (el.dataset.rol) rol[el.dataset.rol] = [el.scrollLeft, el.scrollTop];
  CAM = cam; FNS[cam].clear();
  try { el.innerHTML = f(); } catch (e) { console.error(e); el.innerHTML = `<div class="vazio">Algo deu errado ao desenhar esta tela.<br><small>${esc(e.message)}</small></div>`; }
  CAM = ant;
  $$('[data-rol]', el).concat(el.dataset.rol ? [el] : []).forEach(e => { const p = rol[e.dataset.rol]; if (p) { e.scrollLeft = p[0]; e.scrollTop = p[1]; } });
  const fk = U.foco || (foco && foco.k);
  if (fk) { const n = $(`[data-k="${fk}"]`, el); if (n) { if (!U.foco && foco.v != null && 'value' in n && n.type !== 'checkbox') { n.value = foco.v; } n.focus({ preventScroll: true }); try { if (!U.foco) n.setSelectionRange(foco.a, foco.b); } catch (e) {} if (U.foco) U.foco = ''; } }
}

const U = { tela: 'inicio', quadro: '', vista: 'quadro', cartao: '', filtro: null, sel: new Set(), foco: '', add: '', buscaG: '', cat: '', pq: '' };
const filtroVazio = () => ({ q: '', et: [], mb: [], prazo: '', feito: '' });
U.filtro = filtroVazio();

function toast(msg, acao, fn) {
  const t = $('#toast');
  t.innerHTML = esc(msg) + (acao ? ` <button>${esc(acao)}</button>` : '');
  if (acao) t.querySelector('button').onclick = () => { t.classList.remove('on'); fn(); };
  t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), acao ? 6000 : 2600);
}

const Dlg = {
  pilha: [],
  abrir(f, opt = {}) { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); Pop.fechar(); Dlg.pilha.push({ f, opt }); Dlg.r(); },
  fechar(v) { const d = Dlg.pilha.pop(); if (d && d.opt.aoFechar) d.opt.aoFechar(v); Dlg.r(); },
  r() {
    const w = $('#dlgw'), d = Dlg.pilha[Dlg.pilha.length - 1];
    w.classList.toggle('on', !!d);
    if (!d) { FNS.d.clear(); $('#dlg').innerHTML = ''; return; }
    $('#dlg').className = d.opt.classe || '';
    pintar('d', $('#dlg'), () => `<button class="x" ${on(() => Dlg.fechar())} aria-label="Fechar">✕</button>` + d.f());
  },
};
const Pop = {
  f: null, el: null,
  abrir(el, f) { Pop.f = f; Pop.el = el; Pop.r(); },
  fechar() { if (!Pop.f) return; Pop.f = null; $('#pop').classList.remove('on'); FNS.p.clear(); },
  r() {
    if (!Pop.f) return;
    const p = $('#pop');
    pintar('p', p, Pop.f); p.classList.add('on');
    const a = (Pop.el && document.contains(Pop.el) ? Pop.el : document.body).getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
    p.style.left = Math.max(8, Math.min(a.left, innerWidth - w - 8)) + 'px';
    p.style.top = Math.max(8, a.bottom + 4 + h > innerHeight ? Math.max(8, Math.min(a.top - h - 4, innerHeight - h - 8)) : a.bottom + 4) + 'px';
  },
};
// Menu simples: itens [rótulo, função] ou '-' para separar.
function menu(el, itens, titulo) {
  Pop.abrir(el, () => (titulo ? `<div class="pop-t">${esc(titulo)}</div>` : '') + itens.filter(Boolean).map(i => i === '-' ? '<hr>' : `<button class="item${i[2] ? ' ' + i[2] : ''}" ${on(e => { Pop.fechar(); i[1](e); })}>${i[0]}</button>`).join(''));
}
/* Formulário genérico. Campo: { k, rot, tipo, val, op, ph, dica }.
   Tipos: texto, area, numero, data, hora, lista, caixa, cor, multi, info. Devolve um objeto com os valores, ou null. */
function pedir(titulo, campos, opt = {}) {
  return new Promise(res => {
    let ok = false;
    const ops = c => (c.op || []).map(o => Array.isArray(o) ? o : [o, o]);
    const campo = c => {
      const v = c.val == null ? '' : c.val, n = `name="${c.k}"`;
      const corpo = c.tipo === 'info' ? `<p class="dica">${c.rot}</p>`
        : c.tipo === 'area' ? `<textarea ${n} rows="${c.linhas || 5}" placeholder="${esc(c.ph || '')}">${esc(v)}</textarea>`
        : c.tipo === 'lista' ? `<select ${n}>${ops(c).map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`
        : c.tipo === 'caixa' ? `<label class="cx"><input type="checkbox" ${n} ${v ? 'checked' : ''}> ${esc(c.rot)}</label>`
        : c.tipo === 'cor' ? `<div class="cores">${(c.op || CORES).map(k => `<label><input type="radio" ${n} value="${k}" ${k === v ? 'checked' : ''}><i style="background:${k}"></i></label>`).join('')}</div>`
        : c.tipo === 'multi' ? `<div class="multi">${ops(c).map(o => `<label class="cx"><input type="checkbox" ${n} value="${esc(o[0])}" ${(v || []).includes(o[0]) ? 'checked' : ''}> ${esc(o[1])}</label>`).join('') || '<span class="dica">Nada para escolher.</span>'}</div>`
        : `<input ${n} type="${{ numero: 'number', data: 'date', hora: 'time' }[c.tipo] || 'text'}" ${c.tipo === 'numero' ? 'step="any"' : ''} value="${esc(v)}" placeholder="${esc(c.ph || '')}">`;
      return c.tipo === 'info' || c.tipo === 'caixa' ? corpo + (c.dica ? `<p class="dica">${c.dica}</p>` : '') : `<label class="campo"><span>${esc(c.rot || '')}</span>${corpo}${c.dica ? `<small class="dica">${c.dica}</small>` : ''}</label>`;
    };
    const ler = form => { const o = {}; campos.forEach(c => { if (c.tipo === 'info') return; const els = $$(`[name="${c.k}"]`, form); if (!els.length) return; o[c.k] = c.tipo === 'caixa' ? els[0].checked : c.tipo === 'multi' ? els.filter(e => e.checked).map(e => e.value) : c.tipo === 'cor' ? (els.find(e => e.checked) || {}).value || '' : c.tipo === 'numero' ? Number(els[0].value) || 0 : els[0].value.trim(); }); return o; };
    Dlg.abrir(() => `<form class="form" data-s="${reg(f => { ok = true; const v = ler(f); Dlg.fechar(); res(v); })}"><h2>${esc(titulo)}</h2>${campos.map(campo).join('')}
      <div class="botoes">${opt.extra ? `<button type="button" class="b" ${on(() => { ok = true; Dlg.fechar(); res({ _extra: true }); })}>${esc(opt.extra)}</button>` : ''}<span class="esp"></span><button type="button" class="b" ${on(() => Dlg.fechar())}>Cancelar</button><button class="b pri">${esc(opt.ok || 'Salvar')}</button></div></form>`,
      { classe: opt.classe, aoFechar: () => { if (!ok) res(null); } });
    const i = $('#dlg input:not([type=checkbox]):not([type=radio]),#dlg textarea,#dlg select');
    if (i) { i.focus(); if (i.select && !opt.semSel) i.select(); }
  });
}
const confirmar = (msg, ok) => pedir(msg, [], { ok: ok || 'Confirmar' }).then(v => !!v);
// Diálogo de leitura: título e conteúdo livre (função que devolve HTML, para poder ter botões vivos).
const mostrar = (titulo, f, classe) => Dlg.abrir(() => `<h2>${esc(titulo)}</h2>` + f(), { classe: classe || 'largo', vivo: true });

document.addEventListener('click', e => {
  if (Date.now() - Arr.soltou < 350) { e.preventDefault(); e.stopPropagation(); return; }
  const pop = $('#pop');
  if (Pop.f && !pop.contains(e.target) && !(Pop.el && Pop.el.contains(e.target))) Pop.fechar();
  const el = e.target.closest('[data-a]');
  if (!el) return;
  if (e.target.closest('a[href]') && !el.matches('a')) return;
  const inner = e.target.closest('input,select,textarea,label');
  if (inner && el !== inner && el.contains(inner) && !inner.dataset.a) return;
  const f = achaFn(el.dataset.a);
  if (f) f(el, e);
}, true);
document.addEventListener('change', e => { const f = achaFn(e.target.dataset.c); if (f) f(e.target.type === 'checkbox' ? e.target.checked : e.target.value, e.target); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && e.target.dataset.e && !e.isComposing) { const f = achaFn(e.target.dataset.e); if (f) { e.preventDefault(); const v = e.target.value; f(v, e.target); } }
});
document.addEventListener('submit', e => { e.preventDefault(); const f = achaFn(e.target.dataset.s); if (f) f(e.target); });

/* ---------- Arrastar (mouse e toque) ----------
   Quem arrasta: data-arr="tipo:id". Onde solta: data-solta="nome" (+ data-aceita="tipo"); com data-ord="v|h" a posição entre os itens conta. */
const Solta = {};
const Arr = {
  s: null, soltou: 0,
  ini() {
    document.addEventListener('mousedown', e => { if (e.button === 0) Arr.pega(e.target, e.clientX, e.clientY, false); });
    document.addEventListener('mousemove', e => { if (Arr.s) Arr.mexe(e.clientX, e.clientY, e); });
    document.addEventListener('mouseup', () => { if (Arr.s) Arr.solta(); });
    document.addEventListener('touchstart', e => { if (e.touches.length === 1) Arr.pega(e.target, e.touches[0].clientX, e.touches[0].clientY, true); else if (Arr.s) Arr.cancela(); }, { passive: true });
    document.addEventListener('touchmove', e => { if (!Arr.s) return; if (Arr.s.vivo) e.preventDefault(); Arr.mexe(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.addEventListener('touchend', () => { if (Arr.s) Arr.solta(); });
    document.addEventListener('touchcancel', () => { if (Arr.s) Arr.cancela(); });
    document.addEventListener('contextmenu', e => { if (Arr.s && Arr.s.toque) e.preventDefault(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && Arr.s) Arr.cancela(); });
  },
  pega(alvo, x, y, toque) {
    if (Arr.s || !alvo.closest || alvo.closest('input,textarea,select,button,a,.semarr')) return;
    const el = alvo.closest('[data-arr]');
    if (!el || (el.dataset.alca && !alvo.closest(el.dataset.alca))) return;
    const [tipo, id] = el.dataset.arr.split(':');
    Arr.s = { el, tipo, id, x0: x, y0: y, x, y, toque, vivo: false };
    if (toque) Arr.s.timer = setTimeout(() => { if (Arr.s) Arr.comeca(); }, 330);
  },
  mexe(x, y, e) {
    const s = Arr.s; s.x = x; s.y = y;
    if (!s.vivo) {
      const d = Math.hypot(x - s.x0, y - s.y0);
      if (s.toque) { if (d > 10) Arr.cancela(); return; }
      if (d < 6) return;
      Arr.comeca();
    }
    if (e) e.preventDefault();
    s.fant.style.transform = `translate(${x - s.dx}px,${y - s.dy}px) rotate(2.5deg)`;
    Arr.alvo();
  },
  comeca() {
    const s = Arr.s, r = s.el.getBoundingClientRect();
    s.vivo = true; s.dx = s.x0 - r.left; s.dy = s.y0 - r.top; s.w = r.width; s.h = r.height;
    s.fant = s.el.cloneNode(true); s.fant.classList.add('fantasma'); s.fant.removeAttribute('data-arr');
    s.fant.style.width = r.width + 'px'; s.fant.style.height = r.height + 'px';
    s.fant.style.transform = `translate(${s.x - s.dx}px,${s.y - s.dy}px) rotate(2.5deg)`;
    document.body.appendChild(s.fant);
    s.marca = document.createElement('div'); s.marca.className = 'marca'; s.marca.style.height = r.height + 'px';
    s.el.classList.add('arrastando'); document.body.classList.add('arrastando-algo');
    Pop.fechar();
    if (s.toque && navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
    Arr.alvo();
    s.laco = setInterval(() => { if (Arr.s === s) Arr.rola(); }, 16);
  },
  alvo() {
    const s = Arr.s, sob = document.elementFromPoint(s.x, s.y);
    let z = sob && sob.closest('[data-solta]');
    while (z && z.dataset.aceita && !z.dataset.aceita.split(' ').includes(s.tipo)) z = z.parentElement && z.parentElement.closest('[data-solta]');
    if (s.zona && s.zona !== z) s.zona.classList.remove('sobre');
    s.zona = z || null; s.idx = null;
    if (!z || !z.dataset.ord) { s.marca.remove(); s.el.classList.remove('sumido'); if (z) z.classList.add('sobre'); return; }
    z.classList.add('sobre');
    const h = z.dataset.ord === 'h', its = [...z.children].filter(c => c !== s.el && c.dataset.arr && c.dataset.arr.startsWith(s.tipo + ':'));
    let i = its.findIndex(c => { const r = c.getBoundingClientRect(); return h ? s.x < r.left + r.width / 2 : s.y < r.top + r.height / 2; });
    if (i < 0) i = its.length;
    s.idx = i; s.marca.style.width = h ? s.w + 'px' : ''; s.marca.classList.toggle('h', h);
    if (its[i]) { if (its[i].previousSibling !== s.marca) z.insertBefore(s.marca, its[i]); }
    else if (its.length) { if (its[its.length - 1].nextSibling !== s.marca) its[its.length - 1].after(s.marca); }
    else if (s.marca.parentNode !== z) z.prepend(s.marca);
    s.el.classList.add('sumido');
  },
  rola() {
    const s = Arr.s, m = 56, v = 16;
    const qh = $('.rolah'); let mexeu = false;
    if (qh) { const r = qh.getBoundingClientRect(); if (s.x < r.left + m && qh.scrollLeft > 0) { qh.scrollLeft -= v; mexeu = true; } else if (s.x > r.right - m && qh.scrollLeft < qh.scrollWidth - qh.clientWidth) { qh.scrollLeft += v; mexeu = true; } }
    const zv = s.zona && (s.zona.scrollHeight > s.zona.clientHeight + 2 ? s.zona : s.zona.closest('.rolav'));
    if (zv) { const r = zv.getBoundingClientRect(); if (s.y < r.top + m) { zv.scrollTop -= v; mexeu = true; } else if (s.y > r.bottom - m) { zv.scrollTop += v; mexeu = true; } }
    if (mexeu) Arr.alvo();
  },
  limpa(s) {
    clearTimeout(s.timer); clearInterval(s.laco);
    if (s.fant) s.fant.remove();
    if (s.marca) s.marca.remove();
    if (s.zona) s.zona.classList.remove('sobre');
    s.el.classList.remove('arrastando', 'sumido'); document.body.classList.remove('arrastando-algo');
  },
  solta() {
    const s = Arr.s; Arr.s = null; Arr.limpa(s);
    if (!s.vivo) return;
    Arr.soltou = Date.now();
    const f = s.zona && Solta[s.zona.dataset.solta];
    if (f) f({ tipo: s.tipo, id: s.id }, s.zona.dataset, s.idx, s.zona);
    R();
  },
  cancela() { const s = Arr.s; Arr.s = null; Arr.limpa(s); if (s.vivo) Arr.soltou = Date.now(); },
};

/* ---------- Power-ups ----------
   PUP({ id, nome, cat, icone, desc, cfg, ... ganchos }). Ganchos (todos opcionais; `q` é o quadro):
   No cartão: selo(c,q)  frente(c,q)  classeCartao(c,q)
   Na ficha:  meta(c,q)  secao(c,q)  lateral(c,q)  ckItem(c,checklist,item,q)  comentario(comentario,c,q)
   Na lista:  cabLista(l,cs,q)  rodLista(l,cs,q)  ordenar(l,cs,q)
   No quadro: barra(q)  ferramentas(q) → [[rótulo, função]]  vista: { nome, icone, render(q, cs) }  classe  filtro(c,q)
   Ajustes:   cfg: [campos do formulário]  ou  config(q) para uma tela própria
   ao: { criar(c,q) antesMover(c,de,para,q) mover(c,de,para,q) concluir(c,q) reabrir(c,q) checklist(c,k,q) comentar(c,texto,q)
         abrir(q) minuto(q) ligar(q) } */
const PUPS = [];
const PUP = p => { PUPS.push(p); };
const CATS = { vistas: ['🪟', 'Vistas'], cartao: ['🃏', 'Cartão turbinado'], tempo: ['⏱️', 'Tempo e foco'], fluxo: ['🌊', 'Fluxo e limites'], processo: ['🧪', 'Processos'], auto: ['🤖', 'Automação'], metricas: ['📈', 'Relatórios e métricas'], equipe: ['👥', 'Equipe e reuniões'], dados: ['🔁', 'Importar, exportar e integrar'], visual: ['🎨', 'Aparência e conforto'] };
const pup = id => PUPS.find(p => p.id === id);
const _at = new Map();
function ativos(q) {
  const c = _at.get(q.id);
  if (c && c.mod === q.mod && c.n === PUPS.length) return c.l;
  const l = PUPS.filter(p => q.pups[p.id]);
  _at.set(q.id, { mod: q.mod, n: PUPS.length, l });
  return l;
}
const ativo = (id, q) => !!(q && q.pups[id]);
// Ajustes do power-up neste quadro, já com os valores padrão.
function cfg(id, q) { const p = pup(id), o = {}; (p.cfg || []).forEach(c => { if (c.k) o[c.k] = c.val; }); return Object.assign(o, typeof q.pups[id] === 'object' ? q.pups[id] : null); }
const gancho = (nome, q, ...a) => { let h = ''; for (const p of ativos(q)) if (p[nome]) { const r = p[nome](...a, q); if (r) h += r; } return h; };
let _prof = 0;
// Avisa os power-ups ligados. Em "antesMover", devolver um texto (ou false) impede o movimento.
function evento(nome, q, ...a) {
  if (_prof > 6) return;
  _prof++;
  let veto;
  try { for (const p of ativos(q)) if (p.ao && p.ao[nome]) { const r = p.ao[nome](...a, q); if (veto === undefined && (r === false || typeof r === 'string')) veto = r || 'Movimento não permitido.'; } }
  catch (e) { console.error(e); }
  _prof--;
  return veto;
}

/* ---------- Domínio ---------- */
const Q = () => byId(S.quadros, U.quadro);
const quadrosVivos = () => S.quadros.filter(q => !q.arquivado).sort((a, b) => (b.fav - a.fav) || a.ordem - b.ordem);
const listasDe = q => S.listas.filter(l => l.quadro === q.id && !l.arquivada).sort((a, b) => a.ordem - b.ordem);
const vivos = q => S.cartoes.filter(c => c.quadro === q.id && !c.arquivado && !c.lixo);
const cruDaLista = l => S.cartoes.filter(c => c.lista === l.id && !c.arquivado && !c.lixo).sort((a, b) => a.ordem - b.ordem);
function daLista(l, q) { let cs = cruDaLista(l); for (const p of ativos(q)) if (p.ordenar) cs = p.ordenar(l, cs, q) || cs; return cs; }
const etiquetasDe = q => S.etiquetas.filter(e => e.quadro === q.id).sort((a, b) => a.ordem - b.ordem);
const etq = c => lst(c.etiquetas).map(id => byId(S.etiquetas, id)).filter(Boolean);
const mbs = c => lst(c.membros).map(id => byId(S.membros, id)).filter(Boolean);
const membros = () => S.membros.slice().sort((a, b) => a.ordem - b.ordem);
const eu = () => byId(S.membros, S.set.eu) || null;
const comentariosDe = c => S.comentarios.filter(x => x.cartao === c.id).sort((a, b) => a.criado - b.criado);
const ckTotal = c => { let n = 0, ok = 0; (c.d.ck || []).forEach(k => k.itens.forEach(i => { n++; if (i.ok) ok++; })); return [ok, n]; };
const filhosDe = c => S.cartoes.filter(x => x.pai === c.id && !x.lixo);
const salvar = (c, quieto) => Data.put('cartoes', c, quieto);
const salvarQ = (q, quieto) => Data.put('quadros', q, quieto);
const campos = q => q.d.campos || [];
const iniciais = n => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
const avatar = (m, cls) => `<span class="av ${cls || ''}" style="background:${m.cor};color:${claro(m.cor) ? '#111' : '#fff'}" title="${esc(m.nome)}">${esc(iniciais(m.nome))}</span>`;
const chip = e => `<span class="et" style="background:${e.cor};color:${claro(e.cor) ? '#111' : '#fff'}" title="${esc(e.nome)}"><b>${esc(e.nome)}</b></span>`;
const atrasado = c => !!c.prazo && !c.feito && c.prazo < hoje();

function log(c, txt) { const h = c.d.h = c.d.h || []; h.push({ t: Date.now(), x: txt }); if (h.length > 40) h.splice(0, h.length - 40); }
function filtroAtivo() { const f = U.filtro; return !!(f.q || f.et.length || f.mb.length || f.prazo || f.feito); }
function passa(c, q) {
  const f = U.filtro;
  if (f.q) { const t = semAcento(f.q); if (!semAcento(c.titulo + ' ' + c.texto + ' #' + c.num + ' ' + Object.values(c.d.cf || {}).join(' ')).includes(t)) return false; }
  if (f.et.length && !f.et.some(e => e === '-' ? !c.etiquetas : lst(c.etiquetas).includes(e))) return false;
  if (f.mb.length && !f.mb.some(m => m === '-' ? !c.membros : lst(c.membros).includes(m))) return false;
  if (f.prazo) { const h = hoje(); if (f.prazo === 'sem' ? c.prazo : f.prazo === 'venc' ? !atrasado(c) : f.prazo === 'hoje' ? c.prazo !== h : !(c.prazo && c.prazo >= h && c.prazo <= mais(h, f.prazo === 'sem7' ? 7 : 30))) return false; }
  if (f.feito && (f.feito === 's') !== !!c.feito) return false;
  for (const p of ativos(q)) if (p.filtro && p.filtro(c, q) === false) return false;
  return true;
}
const visiveis = q => vivos(q).filter(c => passa(c, q));

function criarCartao(q, l, titulo, extra, noTopo) {
  const irm = cruDaLista(l), now = Date.now();
  q.d.seq = (q.d.seq || 0) + 1;
  salvarQ(q, true);
  const c = Object.assign({ quadro: q.id, lista: l.id, titulo: String(titulo).trim().slice(0, 500), ordem: noTopo ? Math.min(0, ...irm.map(x => x.ordem)) - 1 : Math.max(-1, ...irm.map(x => x.ordem)) + 1, criado: now, entrou: now, feito: l.feito ? now : 0, num: q.d.seq, d: {} }, extra);
  salvar(c, true);
  log(c, 'Criado em ' + l.nome);
  evento('criar', q, c);
  salvar(c, true);
  DB.changed();
  return c;
}
function marcarFeito(c, sim, quieto) {
  if (!!c.feito === !!sim) return;
  const q = byId(S.quadros, c.quadro);
  c.feito = sim ? Date.now() : 0;
  log(c, sim ? 'Concluído' : 'Reaberto');
  salvar(c, true);
  evento(sim ? 'concluir' : 'reabrir', q, c);
  if (!quieto) DB.changed();
}
// Move o cartão para a lista `dest`, na posição `idx` (fim da lista se omitido). Devolve false se algum power-up impedir.
function moverCartao(c, dest, idx, forca) {
  const q = byId(S.quadros, dest.quadro), de = byId(S.listas, c.lista), mudou = dest.id !== c.lista, now = Date.now();
  if (mudou && !forca) { const v = evento('antesMover', q, c, de, dest); if (v !== undefined) { toast(v); return false; } }
  const irm = cruDaLista(dest).filter(x => x.id !== c.id);
  if (idx == null || idx > irm.length) idx = irm.length;
  irm.splice(idx, 0, c);
  if (mudou) {
    const tl = c.d.tl = c.d.tl || {};
    if (de) tl[de.id] = (tl[de.id] || 0) + Math.max(0, now - (c.entrou || c.criado || now));
    if (!c.d.ini) c.d.ini = now;
    c.lista = dest.id; c.entrou = now;
    if (c.quadro !== dest.quadro) { c.quadro = dest.quadro; c.etiquetas = ''; q.d.seq = (q.d.seq || 0) + 1; c.num = q.d.seq; salvarQ(q, true); }
    log(c, 'Movido' + (de ? ' de ' + de.nome : '') + ' para ' + dest.nome);
  }
  irm.forEach((x, i) => { if (x.ordem !== i || x === c) { x.ordem = i; salvar(x, true); } });
  if (mudou) {
    if (dest.feito) marcarFeito(c, true, true); else if (de && de.feito) marcarFeito(c, false, true);
    evento('mover', q, c, de, dest);
  }
  DB.changed();
  return true;
}
function excluirCartao(c) { c.lixo = Date.now(); salvar(c); if (U.cartao === c.id) U.cartao = ''; toast('Cartão na lixeira', 'Desfazer', () => { c.lixo = 0; salvar(c); R(); }); }
function copiarCartao(c, l) {
  const q = byId(S.quadros, (l || c).quadro), d = JSON.parse(JSON.stringify(c.d));
  delete d.h; delete d.tl; delete d.ini;
  return criarCartao(q, l || byId(S.listas, c.lista), c.titulo, { texto: c.texto, etiquetas: q.id === c.quadro ? c.etiquetas : '', membros: c.membros, prazo: c.prazo, hora: c.hora, inicio: c.inicio, prio: c.prio, capa: c.capa, d });
}
function novoQuadro(m, nome) { const q = Data.montar(m, nome); Data.adopt(); salvarQ(q); return q; }
function excluirQuadro(q) {
  S.cartoes.filter(c => c.quadro === q.id).forEach(c => { S.comentarios.filter(x => x.cartao === c.id).forEach(x => Data.del('comentarios', x.id, true)); Data.del('cartoes', c.id, true); });
  ['listas', 'etiquetas', 'regras'].forEach(s => S[s].filter(r => r.quadro === q.id).forEach(r => Data.del(s, r.id, true)));
  Data.del('quadros', q.id);
}
function alternarPup(q, id, liga) {
  if (liga) q.pups[id] = q.pups[id] || true; else delete q.pups[id];
  salvarQ(q);
  const p = pup(id);
  if (liga && p && p.ao && p.ao.ligar) p.ao.ligar(q);
  if (!liga && p && p.vista && U.vista === id) U.vista = 'quadro';
}

/* ---------- Gráficos em SVG ---------- */
const G = {
  // barras: [[rótulo, valor, cor?]]
  barras(d, opt = {}) {
    const W = opt.w || 520, H = opt.h || 200, mx = Math.max(1, ...d.map(x => x[1])), bw = (W - 30) / Math.max(1, d.length);
    return `<svg class="graf" viewBox="0 0 ${W} ${H + 34}">` + d.map((x, i) => { const h = x[1] / mx * (H - 20); return `<rect x="${30 + i * bw + bw * .15}" y="${H - h}" width="${bw * .7}" height="${Math.max(0, h)}" rx="3" fill="${x[2] || 'var(--pri)'}"><title>${esc(x[0])}: ${fNum(x[1])}</title></rect><text x="${30 + i * bw + bw / 2}" y="${H - h - 4}" text-anchor="middle" class="gv">${x[1] ? fNum(x[1]) : ''}</text><text x="${30 + i * bw + bw / 2}" y="${H + 14}" text-anchor="middle" class="gr">${esc(String(x[0]).slice(0, Math.max(3, Math.floor(bw / 6.5))))}</text>`; }).join('') + `<line x1="28" y1="${H}" x2="${W}" y2="${H}" class="ge"/></svg>`;
  },
  // linhas: séries [{ nome, cor, pts: [n] }], rótulos no eixo x; `area` empilha
  linhas(series, rot, opt = {}) {
    const W = opt.w || 560, H = opt.h || 220, n = Math.max(2, rot.length);
    let ss = series.map(s => Object.assign({}, s, { pts: s.pts.slice() }));
    if (opt.area) for (let i = 1; i < ss.length; i++) ss[i].pts = ss[i].pts.map((v, j) => v + ss[i - 1].pts[j]);
    const mx = Math.max(1, ...ss.flatMap(s => s.pts)), X = i => 34 + i * (W - 44) / (n - 1), Y = v => H - v / mx * (H - 16);
    const caminho = s => s.pts.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const passo = Math.ceil(n / 8);
    return `<svg class="graf" viewBox="0 0 ${W} ${H + 30}">` + [0, .5, 1].map(f => `<line x1="34" x2="${W - 10}" y1="${Y(mx * f)}" y2="${Y(mx * f)}" class="gg"/><text x="30" y="${Y(mx * f) + 4}" text-anchor="end" class="gr">${fNum(mx * f)}</text>`).join('')
      + (opt.area ? ss.slice().reverse().map(s => `<path d="${caminho(s)} L${X(s.pts.length - 1)} ${H} L${X(0)} ${H} Z" fill="${s.cor}" opacity=".85"><title>${esc(s.nome)}</title></path>`).join('') : ss.map(s => `<path d="${caminho(s)}" fill="none" stroke="${s.cor}" stroke-width="2.5" ${s.trac ? 'stroke-dasharray="6 5"' : ''}><title>${esc(s.nome)}</title></path>`).join(''))
      + rot.map((r, i) => i % passo ? '' : `<text x="${X(i)}" y="${H + 16}" text-anchor="middle" class="gr">${esc(r)}</text>`).join('') + '</svg>'
      + `<div class="leg">${series.map(s => `<span><i style="background:${s.cor}"></i>${esc(s.nome)}</span>`).join('')}</div>`;
  },
  rosca(d) {
    const tot = soma(d, x => x[1]) || 1; let a = -Math.PI / 2;
    const arcos = d.filter(x => x[1] > 0).map(x => { const f = x[1] / tot, b = a + f * Math.PI * 2, g = f > .5 ? 1 : 0, p = (r, t) => (60 + r * Math.cos(t)).toFixed(2) + ' ' + (60 + r * Math.sin(t)).toFixed(2); const s = f >= .999 ? `<circle cx="60" cy="60" r="42" fill="none" stroke="${x[2]}" stroke-width="20"/>` : `<path d="M${p(52, a)} A52 52 0 ${g} 1 ${p(52, b)} L${p(32, b)} A32 32 0 ${g} 0 ${p(32, a)} Z" fill="${x[2]}"><title>${esc(x[0])}: ${x[1]}</title></path>`; a = b; return s; }).join('');
    return `<div class="rosca"><svg viewBox="0 0 120 120">${arcos}<text x="60" y="65" text-anchor="middle" class="gt">${fNum(soma(d, x => x[1]))}</text></svg><div class="leg col">${d.map(x => `<span><i style="background:${x[2]}"></i>${esc(x[0])} <b>${x[1]}</b></span>`).join('')}</div></div>`;
  },
};
