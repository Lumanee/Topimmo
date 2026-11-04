(() => {
const KEY = 'immo-pro-demo-v4';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const num = n => new Intl.NumberFormat('fr-FR').format(n);
const today = () => new Date().toISOString().slice(0, 10);
const days = iso => Math.round((new Date(iso) - new Date(today())) / 864e5);
const fmtDate = iso => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const TV = ['Location', 'Fonds de commerce', 'Murs commerciaux', 'Cession de droit au bail', "Cession d'entreprise"];
const ACT = ['Restaurant', 'Bar', 'Boulangerie', 'Prêt-à-porter', 'Coiffure', 'Pharmacie', 'Bureaux / services', 'Autre'];
const ETAPES = ['Contact', 'Visite', 'Offre', 'Compromis', 'Signé'];
const ROLE = { direction: 'Direction', negociateur: 'Négociateur', agent: 'Agent commercial' };
const EMPL = ['Non précisé', 'Très bon', 'Bon', 'Moyen', 'Secondaire'];
const ETATS = ['Oui', 'Non', 'Possible', 'Inconnu'];
const dTypes = d => d.types || [d.typeVente];
const hasExt = b => b.extraction === true || b.extraction === 'Oui';
const etat = v => v === true ? 'Oui' : v === false ? 'Non' : (v || '—');
const stars = n => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));
const FIELDS = {
  titre: ['Titre', b => b.titre], adresse: ['Adresse publique', b => b.adressePublique], surface: ['Surface', b => b.surface],
  prix: ['Prix ou loyer', b => b.prix], activite: ['Activité', b => b.activite], descriptif: ['Descriptif', b => b.descriptif],
  photos: ['3 photos minimum', b => b.photos >= 3], diag: ['Diagnostics', b => b.diag],
  licence: ['Licence', b => b.typeVente !== 'Fonds de commerce' || b.licence], ca: ["Chiffre d'affaires", b => b.typeVente !== 'Fonds de commerce' || b.ca]
};
const PORTAILS = [
  { nom: 'SeLoger Bureaux Commerce', j1: true, champs: ['titre', 'adresse', 'surface', 'prix', 'activite', 'descriptif', 'photos', 'diag'] },
  { nom: 'Coppten (ex CessionPlus)', j1: true, champs: ['titre', 'surface', 'prix', 'descriptif', 'photos'] },
  { nom: 'Place du Commerce', j1: true, champs: ['titre', 'adresse', 'surface', 'prix', 'activite', 'descriptif', 'photos', 'licence', 'ca'] },
  { nom: "Site de l'agence", j1: true, champs: ['titre', 'adresse', 'surface', 'prix', 'descriptif', 'photos'] },
  { nom: 'ParuVendu', champs: ['titre', 'surface', 'prix', 'photos'] },
  { nom: 'LocauxRama', champs: ['titre', 'adresse', 'surface', 'prix', 'photos'] },
  { nom: 'CessionPME', champs: ['titre', 'prix', 'activite', 'ca', 'descriptif'] },
  { nom: 'LeBonCoin', champs: ['titre', 'surface', 'prix', 'descriptif', 'photos'] },
  { nom: 'BureauxLocaux', champs: ['titre', 'adresse', 'surface', 'prix', 'photos'] },
  { nom: 'Almo', champs: ['titre', 'surface', 'prix', 'descriptif'] }
];

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.biens && s.journal) return s; } catch (e) {}
  return JSON.parse(JSON.stringify(window.DEMO));
}
let db = load();
let me = db.users[0];
const isMobile = () => window.innerWidth < 860;
let ui = { tv: '', statut: '', dept: '', q: '', vue: isMobile() ? 'cartes' : 'table', dem: '', tpl: 'mandat-simple', docBien: '', docDem: '' };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
const user = id => db.users.find(u => u.id === id) || { nom: '?', initiales: '?', email: 'x' };
const bien = id => db.biens.find(b => b.id === id);
const dem = id => db.demandeurs.find(d => d.id === id);
const mand = id => db.mandants.find(m => m.id === id) || { nom: '—', contact: '', tel: '', email: '' };
const isDir = () => me.role === 'direction';
const DR = () => me.droits || {};
const canDel = b => DR().suppr === 'tout' || (DR().suppr === 'siens' && b.agent === me.id);
const canMod = b => DR().modif === 'tout' || (DR().modif === 'siens' && b.agent === me.id);
const canOff = b => DR().desact === 'tout' || (DR().desact === 'siens' && b.agent === me.id);
const seeD = d => DR().voir === 'tout' || d.agent === me.id;
const canXls = () => !!DR().excel;
const lim = () => DR().limite || 1e9;
const lblPrix = b => b.typeVente === 'Location' ? 'Loyer annuel' : 'Prix';
const prixTxt = b => eur(b.prix) + (b.typeVente === 'Location' ? ' par an' : '');
const digits = t => String(t).replace(/\D/g, '');
const intl = t => { const d = digits(t); return d.startsWith('0') ? '33' + d.slice(1) : d; };
function log(txt) {
  const t = today() + ' ' + new Date().toTimeString().slice(0, 5);
  db.journal.unshift({ t, qui: me.id, action: txt });
  db.activites.unshift({ qui: me.id, texte: txt, quand: "à l'instant" });
  if (db.offline) db.queue = (db.queue || 0) + 1;
}

// ---------- correspondance ----------
function match(b, d) {
  if (!dTypes(d).includes(b.typeVente)) return { s: 0, ok: false, bad: ['Autre type de vente'] };
  if (b.statut === 'Inactif') return { s: 0, ok: false, bad: ['Bien inactif'] };
  if (b.prix > d.budget) return { s: 0, ok: false, bad: ['Prix au-dessus du budget'] };
  if (b.surface < d.surfMin || b.surface > d.surfMax) return { s: 0, ok: false, bad: ['Surface hors critères'] };
  const why = ['Prix et surface dans les critères'], bad = []; let s = 40;
  if (!d.activite || d.activite === 'Toutes' || d.activite.split('/').includes(b.activite)) { s += 20; why.push('Activité adaptée'); } else bad.push('Activité différente');
  if (d.licence && d.licence !== 'Aucune') { if (b.licence === d.licence) { s += 8; why.push('Licence disponible'); } else bad.push('Licence demandée absente'); } else s += 8;
  if (d.extraction) { if (hasExt(b)) { s += 7; why.push('Extraction présente'); } else bad.push('Extraction absente'); } else s += 7;
  if (d.quartiersEviter.includes(b.quartier)) { s -= 40; bad.push('Quartier à éviter'); }
  else if (d.quartiersVoulus.includes(b.quartier)) { s += 10; why.push('Quartier recherché'); }
  if (d.dept === b.dept) s += 5; else bad.push('Autre département');
  if (b.typeVente === 'Location' || d.apport >= b.prix * 0.25) { s += 10; if (b.typeVente !== 'Location') why.push('Apport suffisant'); } else bad.push('Apport à vérifier');
  return { s: Math.max(0, Math.min(100, s)), ok: true, why, bad, fav: s >= 85 && bad.length === 0 };
}
const sCls = s => s >= 80 ? 's-hi' : s >= 55 ? 's-mid' : 's-lo';
const statutPill = s => `<span class="pill ${s === 'Disponible' ? 'ok' : s === 'Sous option' ? 'warn' : ''}">${esc(s)}</span>`;
const mandatPill = m => { const j = days(m.fin); const c = j < 0 ? 'bad' : j <= 7 ? 'bad' : j <= 30 ? 'warn' : 'ok'; return `<span class="pill ${c}">${esc(m.type)} · ${j < 0 ? 'expiré' : 'encore ' + j + ' j'}</span>`; };
const missing = (b, p) => p.champs.filter(k => !FIELDS[k][1](b)).map(k => FIELDS[k][0]);

const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8v10H3z"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V3h10v18M14 9h6v12M8 7h2M8 11h2M8 15h2"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M17 5a3.5 3.5 0 010 7M22 20c0-3-2-5-5-5.5"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
  flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="6" rx="1"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>'
};
const ROUTES = [
  ['dashboard', 'Accueil', 'home', "Votre journée en un coup d'œil : ce qu'il faut faire aujourd'hui."],
  ['biens', 'Offres', 'building', "Toutes vos offres en portefeuille. Cliquez sur une ligne pour ouvrir la fiche."],
  ['contacts', 'Contacts', 'key', "Un seul annuaire : propriétaires et demandeurs, avec leur rôle."],
  ['demandeurs', 'Recherches', 'users', 'Les demandes des acquéreurs et locataires, avec leurs critères et leur dernière note.'],
  ['matching', 'Correspondances', 'link', "Pour chaque demande, les offres qui conviennent. Le prix et la surface sont éliminatoires."],
  ['pipeline', 'Dossiers', 'flow', 'Suivi des transactions, du premier contact à la signature.'],
  ['stats', 'Statistiques', 'chart', 'Mandats, visites, signatures et honoraires, par négociateur et agent.', 1],
  ['documents', 'Documents', 'doc', 'Mandats, avenants et bons de visite remplis automatiquement.', 1],
  ['equipe', 'Équipe et droits', 'team', "Les collaborateurs, leurs droits un par un et, pour la direction, le journal des modifications.", 1],
  ['avis', 'Votre avis', 'list', "Comparez avec la première maquette : dites ce qui est en trop, utile ou indispensable.", 1],
  ['avancement', 'Avancement', 'list', 'Ce qui est prêt, ce qui est simulé et ce qui reste à construire.', 1]
];

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2800); }
function copy(text, ok) {
  const fail = () => toast('Copie impossible ici : sélectionnez le texte à la main');
  try { navigator.clipboard.writeText(text).then(() => toast(ok), fail); } catch (e) { fail(); }
}
const q = () => ui.q.trim().toLowerCase();
const hit = (...v) => !q() || v.join(' ').toLowerCase().includes(q());

// ---------- tâches ----------
function tasks() {
  const t = [];
  db.biens.filter(b => b.statut !== 'Inactif' && days(b.mandat.fin) <= 7).forEach(b => { const j = days(b.mandat.fin);
    t.push({ u: true, titre: `Renouveler le mandat ${b.mandatNum}`, detail: `${b.titre} · ${j < 0 ? 'expiré' : 'expire dans ' + j + ' jours'}`, btn: 'Renouveler (+90 j)', attr: `data-renew="${b.id}"` }); });
  db.biens.filter(b => b.statut !== 'Inactif').forEach(b => {
    const ev = [['fin de la période triennale', b.bail.triennale], ['fin du bail', b.bail.fin]].filter(e => days(e[1]) >= 0 && days(e[1]) <= 240).sort((a, c) => days(a[1]) - days(c[1]))[0];
    if (ev) t.push({ u: false, titre: `Prévenir ${mand(b.mandant).nom} : ${ev[0]}`, detail: `${b.mandatNum} · ${b.ville} · le ${fmtDate(ev[1])} (dans ${Math.round(days(ev[1]) / 30)} mois)`, btn: 'Ouvrir le bien', attr: `data-open="${b.id}"` });
  });
  db.demandeurs.filter(d => d.active && d.mandatFin && days(d.mandatFin) <= 7 && seeD(d)).forEach(d => { const j = days(d.mandatFin);
    t.push({ u: true, titre: `Renouveler le mandat de recherche de ${d.nom}`, detail: `${j < 0 ? 'expiré' : 'expire dans ' + j + ' jours'}`, btn: 'Renouveler (+90 j)', attr: `data-renewd="${d.id}"` }); });
  db.biens.filter(b => b.statut !== 'Inactif' && b.verif && -days(b.verif) > 30).forEach(b => {
    t.push({ u: false, p: 1, titre: `Vérifier que l'offre ${b.mandatNum} est toujours valable`, detail: `${b.titre} · dernière vérification il y a ${-days(b.verif)} jours`, btn: 'Toujours valable', attr: `data-verif="${b.id}"` }); });
  db.demandeurs.filter(d => d.active && seeD(d)).forEach(d => {
    const best = db.biens.filter(b => b.statut === 'Disponible' && !db.deals.some(x => x.bien === b.id && x.dem === d.id)).map(b => ({ b, m: match(b, d) })).filter(x => x.m.ok && x.m.fav).sort((a, c) => c.m.s - a.m.s)[0];
    if (best) t.push({ u: false, titre: `Proposer ${best.b.mandatNum} à ${d.nom}`, detail: `Toutes les conditions sont favorables (${best.m.s}/100) · ${best.b.titre}`, btn: 'Proposer', attr: `data-send="${best.b.id}|${d.id}"`, extra: `<button class="btn sm" data-rem="${d.id}|${best.b.id}">Rappel demain</button>` });
  });
  return t.sort((a, c) => (c.u ? 2 : c.p || 0) - (a.u ? 2 : a.p || 0));
}

// ---------- vues ----------
const views = {
  dashboard() {
    const list = tasks();
    const dispo = db.biens.filter(b => b.statut === 'Disponible').length;
    const act = db.demandeurs.filter(d => d.active && seeD(d)).length;
    const enc = db.deals.filter(x => x.etape !== 'Signé');
    const due = db.rappels.filter(r => !r.fait && r.date <= today());
    const guide = db.onboarded ? '' : `<div class="card guide" style="margin-bottom:14px"><h2>Version 2 : ce qui change</h2>
      <ol><li>Un seul annuaire dans <a href="#contacts">Contacts</a> : propriétaires et demandeurs au même endroit.</li>
      <li>Ouvrez <a href="#biens">Offres</a> puis une fiche : la diffusion se fait sur 10 sites, avec le suivi de chacun.</li>
      <li>Dans <a href="#equipe">Équipe et droits</a>, chaque personne a ses droits réglés un par un.</li>
      <li>Quand vous avez fini, ouvrez <a href="#avis">Votre avis</a> : trois clics par fonction pour dire ce qui est en trop ou en moins.</li></ol>
      <button class="btn sm" id="hideGuide">J'ai compris, masquer</button></div>`;
    return `${guide}<div class="grid kpis">
      <div class="card kpi"><b>${dispo}</b><span>Biens disponibles</span></div>
      <div class="card kpi"><b>${act}</b><span>Demandeurs actifs</span></div>
      <div class="card kpi"><b>${enc.length}</b><span>Dossiers en cours</span></div>
      <div class="card kpi"><b>${eur(enc.reduce((s, x) => s + x.honoraires, 0))}</b><span>Honoraires attendus</span></div></div>
    <div class="grid two">
      <div class="card"><h2>À faire (${list.length})</h2>
        ${list.slice(0, 10).map(x => `<div class="row"><div class="grow"><div class="t">${esc(x.titre)} ${x.u ? '<span class="pill bad">Urgent</span>' : ''}</div><div class="small muted">${esc(x.detail)}</div></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" ${x.attr}>${esc(x.btn)}</button>${x.extra || ''}</div></div>`).join('') || '<div class="empty">Tout est à jour.</div>'}</div>
      <div class="grid" style="align-content:start">
        <div class="card"><h2>Rappels (${due.length})</h2>
          ${due.map(r => `<div class="row"><div class="grow">${esc(r.texte)}<div class="small muted">${fmtDate(r.date)}</div></div><button class="btn sm" data-fait="${r.id}">Fait</button></div>`).join('') || '<div class="empty">Aucun rappel aujourd\'hui.</div>'}</div>
        <div class="card"><h2>Sélection du jour</h2>
          ${db.biens.filter(b => b.sel && b.statut !== 'Inactif').map(b => `<div class="row" data-open="${b.id}" style="cursor:pointer"><div class="grow"><div class="t">${esc(b.mandatNum)} · ${esc(b.titre)}</div><div class="small muted">${esc(b.ville)} · ${prixTxt(b)} · <span class="stars">${stars(b.etoiles)}</span></div></div></div>`).join('') || '<div class="empty">Aucune offre mise en avant aujourd\'hui. Ouvrez une offre pour la mettre en avant.</div>'}</div>
        <div class="card"><h2>Activité de l'équipe</h2>
          ${db.activites.slice(0, 5).map(a => `<div class="row"><span class="avatar">${esc(user(a.qui).initiales)}</span><div class="grow"><b>${esc(user(a.qui).nom)}</b> ${esc(a.texte)}<div class="small muted">${esc(a.quand)}</div></div></div>`).join('')}</div>
      </div></div>`;
  },

  biens() {
    const list = db.biens.filter(b => (!ui.tv || b.typeVente === ui.tv) && (!ui.statut || b.statut === ui.statut) && (!ui.dept || b.dept === ui.dept) && (!ui.sel || b.sel) && hit(b.mandatNum, b.titre, b.ville, b.activite, b.quartier, b.typeVente, mand(b.mandant).nom, (b.motsCles || []).join(' ')));
    const chips = (arr, key) => arr.map(v => `<button class="chip ${ui[key] === v ? 'on' : ''}" data-f="${key}|${esc(v)}">${esc(v)}</button>`).join('');
    const tool = `<div class="toolbar"><button class="chip ${!ui.tv ? 'on' : ''}" data-f="tv|">Tous</button>${chips(TV, 'tv')}</div>
      <div class="toolbar">${chips(['Disponible', 'Sous option', 'Inactif'], 'statut')}<button class="chip ${ui.sel ? 'on' : ''}" data-f="sel|1">★ Sélection du jour</button><span class="sp"></span>${chips(['33', '64', '40'], 'dept')}</div>
      <div class="toolbar"><span class="muted">${list.length} bien${list.length > 1 ? 's' : ''}</span><span class="sp"></span>
      <button class="chip ${ui.vue === 'table' ? 'on' : ''}" data-vue="table">Tableau</button><button class="chip ${ui.vue === 'cartes' ? 'on' : ''}" data-vue="cartes">Cartes</button>
      <button class="btn sm" id="copyBiens" ${canXls() ? '' : 'disabled title="Export non autorisé pour votre profil"'}>Copier pour Excel</button></div>`;
    if (ui.vue === 'cartes') return tool + `<div class="grid cards">${list.map(b => `<button class="card bien" data-open="${b.id}"><div class="img" style="background:linear-gradient(135deg,hsl(${b.hue} 35% 40%),hsl(${b.hue + 30} 40% 28%))">${statutPill(b.statut)}</div>
      <div class="body"><div><b>${esc(b.titre)}</b></div><div class="small muted">${esc(b.mandatNum)} · ${esc(b.typeVente)} · ${esc(b.ville)}</div><div style="margin:8px 0"><b>${prixTxt(b)}</b> · ${num(b.surface)} m²</div>${mandatPill(b.mandat)}</div></button>`).join('') || '<div class="empty card">Aucun bien.</div>'}</div>`;
    return tool + `<div class="card tablewrap"><table><thead><tr><th>N° mandat</th><th>Bien</th><th class="num">Prix ou loyer</th><th class="num hide-m">Surface</th><th>Statut</th><th>Mandat</th><th class="hide-m">Diffusion</th></tr></thead><tbody>
      ${list.map(b => `<tr class="click" data-open="${b.id}" tabindex="0"><td>${esc(b.mandatNum)}</td><td><b>${esc(b.titre)}</b><div class="small muted">${esc(b.typeVente)} · ${esc(b.activite)} · ${esc(b.ville)} · <span class="stars">${stars(b.etoiles)}</span></div></td><td class="num">${prixTxt(b)}</td><td class="num hide-m">${num(b.surface)} m²</td><td>${statutPill(b.statut)}</td><td>${mandatPill(b.mandat)}</td><td class="hide-m">${b.portails.length ? b.portails.length + ' site' + (b.portails.length > 1 ? 's' : '') : '—'}${Object.keys(b.avert || {}).length ? ' <span class="pill warn">⚠</span>' : ''}</td></tr>`).join('')}
      </tbody></table>${list.length ? '' : '<div class="empty">Aucun bien ne correspond.</div>'}</div>`;
  },

  demandeurs() {
    const list = db.demandeurs.filter(seeD).filter(d => hit(d.nom, d.activite, dTypes(d).join(' '), d.dept, d.tel, d.notes.map(n => n.texte).join(' ')));
    const SC = ['Toutes', 'Actives', 'Terminées', 'Mandat à renouveler'];
    const chips = SC.map(v => `<button class="chip ${(ui.dstat === v || (!ui.dstat && v === 'Toutes')) ? 'on' : ''}" data-f="dstat|${v === 'Toutes' ? '' : v}">${v}</button>`).join('');
    const shown = list.filter(d => ui.dstat === 'Actives' ? d.active : ui.dstat === 'Terminées' ? !d.active : ui.dstat === 'Mandat à renouveler' ? (d.mandatFin && days(d.mandatFin) <= 30) : true);
    const colonnes = ui.dvue === 'colonnes';
    const tool = `<div class="toolbar">${chips}</div><div class="toolbar"><span class="muted">${shown.length} recherche${shown.length > 1 ? 's' : ''}${DR().voir === 'siens' ? ' (les vôtres)' : ''}</span><span class="sp"></span>
      <button class="chip ${!colonnes ? 'on' : ''}" data-dvue="liste">Liste</button><button class="chip ${colonnes ? 'on' : ''}" data-dvue="colonnes">Colonnes par type</button>
      <button class="btn sm" id="listDemPdf">Liste PDF</button><button class="btn sm" id="copyDem" ${canXls() ? '' : 'disabled title="Export non autorisé pour votre profil"'}>Copier pour Excel</button></div>`;
    if (colonnes) return tool + `<div class="kanban">${TV.map(t => { const ds = shown.filter(d => dTypes(d).includes(t));
      return `<div class="col"><h3><span>${esc(t)}</span><span class="muted">${ds.length}</span></h3>${ds.map(d => `<div class="deal" data-dem="${d.id}" tabindex="0" style="cursor:pointer"><b>${esc(d.nom)}</b><div class="small muted">${eur(d.budget)} · ${esc(user(d.agent).nom)}</div>${d.mandatFin ? mandatPill({ type: 'Recherche', fin: d.mandatFin }) : ''}</div>`).join('') || '<div class="small muted">Aucune</div>'}</div>`; }).join('')}</div>`;
    return tool + `<div class="card tablewrap"><table><thead><tr><th>Demandeur</th><th>Recherche</th><th class="num">Budget</th><th class="hide-m">Dernière note</th><th>Mandat de recherche</th><th class="hide-m">Suivi par</th></tr></thead><tbody>
    ${shown.map(d => `<tr class="click" data-dem="${d.id}" tabindex="0"><td><b>${esc(d.nom)}</b><div class="small muted">${esc(d.tel)}${d.active ? '' : ' · terminée'}</div></td>
      <td>${esc(dTypes(d).join(' + '))}<div class="small muted">${esc(d.activite)} · ${num(d.surfMin)} à ${num(d.surfMax)} m² · dép. ${esc(d.dept)}</div></td><td class="num">${eur(d.budget)}</td>
      <td class="hide-m">${d.notes[0] ? `<div class="small"><span class="muted">${fmtDate(d.notes[0].date)} :</span> ${esc(d.notes[0].texte)}</div>` : '<div class="small muted">Aucune note</div>'}</td>
      <td>${d.mandatFin ? mandatPill({ type: 'Recherche', fin: d.mandatFin }) : '<span class="small muted">Aucun</span>'}</td><td class="hide-m">${esc(user(d.agent).nom)}</td></tr>`).join('')}
    </tbody></table>${shown.length ? '' : '<div class="empty">Aucune recherche ne correspond.</div>'}</div>`;
  },

  contacts() {
    const rows = [
      ...db.mandants.map(m => ({ attr: `data-owner="${m.id}"`, nom: m.nom, qui: m.contact, tel: m.tel, role: 'Propriétaire', cat: 'prop', cls: '', suivi: db.biens.filter(b => b.mandant === m.id && b.statut !== 'Inactif').length + ' offre(s)' })),
      ...db.demandeurs.filter(seeD).map(d => ({ attr: `data-dem="${d.id}"`, nom: d.nom, qui: '', tel: d.tel, role: d.active ? 'Demandeur actif' : 'Demandeur inactif', cat: d.active ? 'dem' : 'inactif', cls: d.active ? 'ok' : '', suivi: user(d.agent).nom }))
    ].filter(r => hit(r.nom, r.qui, r.tel) && (!ui.role || ui.role === r.cat)).sort((a, c) => a.nom.localeCompare(c.nom, 'fr'));
    const CH = [['', 'Tous'], ['prop', 'Propriétaires'], ['dem', 'Demandeurs actifs'], ['inactif', 'Inactifs']];
    return `<div class="toolbar">${CH.map(([v, l]) => `<button class="chip ${(ui.role || '') === v ? 'on' : ''}" data-f="role|${v}">${l}</button>`).join('')}</div>
    <div class="toolbar"><span class="muted">${rows.length} contact${rows.length > 1 ? 's' : ''}${DR().voir === 'siens' ? ' (vos contacts et les propriétaires)' : ''}</span><span class="sp"></span></div>
    <div class="card tablewrap"><table><thead><tr><th>Nom</th><th>Rôle</th><th class="hide-m">Téléphone</th><th class="hide-m">Offres ou suivi</th></tr></thead><tbody>
    ${rows.slice(0, 100).map(r => `<tr class="click" ${r.attr} tabindex="0"><td><b>${esc(r.nom)}</b>${r.qui ? `<div class="small muted">${esc(r.qui)}</div>` : ''}</td><td><span class="pill ${r.cls}">${esc(r.role)}</span></td><td class="hide-m">${esc(r.tel)}</td><td class="hide-m">${esc(r.suivi)}</td></tr>`).join('')}
    </tbody></table>${rows.length ? '' : '<div class="empty">Aucun contact.</div>'}</div>
    <div class="small muted" style="margin-top:8px">${rows.length > 100 ? 'Les 100 premiers sont affichés : affinez avec la recherche. ' : ''}Pensé pour plusieurs milliers de contacts : la recherche en haut de page cherche dans le nom, le contact et le téléphone.</div>`;
  },

  matching() {
    const actifs = db.demandeurs.filter(d => d.active && seeD(d));
    if (!actifs.length) return '<div class="empty card">Aucune recherche active à afficher pour votre profil.</div>';
    const id = ui.dem && dem(ui.dem) && seeD(dem(ui.dem)) ? ui.dem : actifs[0].id; const d = dem(id);
    const all = db.biens.filter(b => dTypes(d).includes(b.typeVente) && b.statut !== 'Inactif').map(b => ({ b, m: match(b, d) }));
    const res = all.filter(x => x.m.ok).sort((a, c) => c.m.s - a.m.s), out = all.filter(x => !x.m.ok);
    return `<div class="card" style="margin-bottom:14px"><label class="small muted" for="demSel">Choisir un demandeur</label>
      <select id="demSel">${db.demandeurs.filter(seeD).map(x => `<option value="${x.id}" ${x.id === id ? 'selected' : ''}>${esc(x.nom)} · ${esc(dTypes(x).join(' + '))}${x.active ? '' : ' (terminée)'}</option>`).join('')}</select>
      <div class="small muted" style="margin-top:8px">${esc(dTypes(d).join(' + '))}, ${esc(d.activite)}, ${num(d.surfMin)} à ${num(d.surfMax)} m², budget ${eur(d.budget)}, apport ${eur(d.apport)}, département ${esc(d.dept)}${d.quartiersVoulus.length ? ', quartiers voulus : ' + esc(d.quartiersVoulus.join(', ')) : ''}${d.quartiersEviter.length ? ', à éviter : ' + esc(d.quartiersEviter.join(', ')) : ''}.</div></div>
    <div class="card"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px"><h2 style="margin:0;flex:1">${res.length} bien${res.length > 1 ? 's' : ''} adapté${res.length > 1 ? 's' : ''}</h2>
      <button class="btn sm" data-mailsel="${d.id}" ${res.length ? '' : 'disabled'}>Envoyer la sélection</button></div>
    ${res.map(x => `<div class="row"><div class="score ${sCls(x.m.s)}">${x.m.s}</div><div class="grow"><div class="t">${esc(x.b.mandatNum)} · ${esc(x.b.titre)}</div><div class="small muted">${esc(x.b.ville)} · ${prixTxt(x.b)} · ${num(x.b.surface)} m²</div>
      <div class="small" style="color:var(--ok)">${esc(x.m.why.slice(1).join(' · '))}</div>${x.m.bad.length ? `<div class="small" style="color:var(--warn)">À vérifier : ${esc(x.m.bad.join(' · '))}</div>` : ''}</div>
      ${statutPill(x.b.statut)}<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-send="${x.b.id}|${d.id}">Ajouter aux dossiers</button><button class="btn sm" data-mailbd="${x.b.id}|${d.id}">Écrire</button></div></div>`).join('') || '<div class="empty">Aucun bien ne passe les critères éliminatoires.</div>'}
    ${out.length ? `<div class="small muted" style="margin-top:10px">Écartés (${out.length}) : ${out.map(x => esc(x.b.mandatNum) + ' (' + esc(x.m.bad[0].toLowerCase()) + ')').join(', ')}.</div>` : ''}</div>`;
  },

  pipeline() {
    return `<div class="kanban">${ETAPES.map(e => { const ds = db.deals.filter(x => x.etape === e);
      return `<div class="col"><h3><span>${e}</span><span class="muted">${ds.length} · ${eur(ds.reduce((s, x) => s + x.honoraires, 0))}</span></h3>
      ${ds.map(x => { const b = bien(x.bien), d = dem(x.dem); if (!b || !d) return ''; return `<div class="deal"><b>${esc(d.nom)}</b><div class="small muted">${esc(b.mandatNum)} · ${esc(b.ville)} · ${esc(user(x.agent).nom)}</div><div>${eur(x.honoraires)} d'honoraires</div>
        <select data-deal="${x.id}" aria-label="Étape du dossier">${ETAPES.map(s => `<option ${s === x.etape ? 'selected' : ''}>${s}</option>`).join('')}</select></div>`; }).join('')}</div>`; }).join('')}</div>`;
  },

  stats() {
    const rows = db.users.filter(u => DR().stats !== 'siennes' || u.id === me.id).map(u => ({ u, mandats: db.biens.filter(b => b.agent === u.id && b.statut !== 'Inactif').length,
      visites: db.deals.filter(x => x.agent === u.id && x.etape !== 'Contact').length, signes: db.deals.filter(x => x.agent === u.id && x.etape === 'Signé').length,
      hono: db.deals.filter(x => x.agent === u.id && x.etape === 'Signé').reduce((s, x) => s + x.honoraires, 0), prevu: db.deals.filter(x => x.agent === u.id && x.etape !== 'Signé').reduce((s, x) => s + x.honoraires, 0) }))
      .sort((a, c) => (c.hono + c.prevu) - (a.hono + a.prevu));
    const max = Math.max(1, ...rows.map(r => r.hono + r.prevu));
    return `<div class="grid kpis">
      <div class="card kpi"><b>${rows.reduce((s, r) => s + r.mandats, 0)}</b><span>Mandats en portefeuille</span></div>
      <div class="card kpi"><b>${rows.reduce((s, r) => s + r.visites, 0)}</b><span>Dossiers au stade visite ou plus</span></div>
      <div class="card kpi"><b>${rows.reduce((s, r) => s + r.signes, 0)}</b><span>Biens signés</span></div>
      <div class="card kpi"><b>${eur(rows.reduce((s, r) => s + r.hono, 0))}</b><span>Honoraires signés</span></div></div>
    <div class="card tablewrap"><table><thead><tr><th>Collaborateur</th><th class="num">Mandats</th><th class="num">Visites</th><th class="num">Signés</th><th class="num">Honoraires signés</th><th style="min-width:200px">Signés et attendus</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${esc(r.u.nom)}</b><div class="small muted">${ROLE[r.u.role]}</div></td><td class="num">${r.mandats}</td><td class="num">${r.visites}</td><td class="num">${r.signes}</td><td class="num">${eur(r.hono)}</td>
      <td><div class="bar"><span class="a" style="width:${(r.hono / max) * 100}%"></span><span class="b" style="width:${(r.prevu / max) * 100}%"></span></div></td></tr>`).join('')}</tbody></table></div>
    <div class="small muted" style="margin-top:8px">${DR().stats === 'siennes' ? 'Votre profil voit uniquement vos propres statistiques. ' : ''}Barre foncée : honoraires signés. Barre claire : honoraires attendus sur les dossiers en cours.</div>`;
  },

  documents() {
    const biens = db.biens.filter(b => b.statut !== 'Inactif'); const b = bien(ui.docBien) || biens[0]; const d = dem(ui.docDem) || db.demandeurs[0];
    const tpl = TEMPLATES.find(t => t.id === ui.tpl) || TEMPLATES[0];
    const texte = tpl.corps(b, mand(b.mandant), d);
    return `<div class="card"><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      <div><label class="small muted" for="docTpl">Modèle</label><select id="docTpl">${TEMPLATES.map(t => `<option value="${t.id}" ${t.id === tpl.id ? 'selected' : ''}>${esc(t.nom)}</option>`).join('')}</select></div>
      <div><label class="small muted" for="docBien">Bien</label><select id="docBien">${biens.map(x => `<option value="${x.id}" ${x.id === b.id ? 'selected' : ''}>${esc(x.mandatNum)} · ${esc(x.titre)}</option>`).join('')}</select></div>
      ${tpl.dem ? `<div><label class="small muted" for="docDem">Demandeur</label><select id="docDem">${db.demandeurs.map(x => `<option value="${x.id}" ${x.id === d.id ? 'selected' : ''}>${esc(x.nom)}</option>`).join('')}</select></div>` : ''}</div>
      <div class="pre">${esc(texte)}</div>
      <div class="actions"><button class="btn primary" id="docPdf">Aperçu PDF avec filigrane</button><button class="btn" id="docCopy">Copier le texte</button></div>
      <div class="small muted" style="margin-top:8px">Modèles d'exemple : ceux de l'agence seront repris tels quels, avec leurs champs remplis automatiquement.</div></div>`;
  },

  equipe() {
    const ed = !!DR().params;
    const T3 = [['tout', 'Toutes les fiches'], ['siens', 'Ses fiches'], ['non', 'Interdit']];
    const sel = (u, k, opts) => `<select data-droit="${u.id}|${k}" ${ed ? '' : 'disabled'} aria-label="${k} de ${esc(u.nom)}">${opts.map(([v, l]) => `<option value="${v}" ${String(u.droits[k]) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    const YN = [['true', 'Oui'], ['false', 'Non']];
    return `<div class="card tablewrap"><h2 style="padding:14px 16px 0">Droits, personne par personne</h2>
      <div class="small muted" style="padding:0 16px 8px">${ed ? 'Modifiez un droit : il s\'applique tout de suite. Changez d\'utilisateur dans le menu pour voir la différence.' : 'Seule la direction peut modifier ces droits.'}</div>
      <table><thead><tr><th>Collaborateur</th><th>Voir les demandes et contacts</th><th>Supprimer</th><th>Modifier</th><th>Désactiver</th><th>PDF</th><th>Excel</th><th>Statistiques</th><th>Paramètres</th><th>Limite d'export</th></tr></thead><tbody>
      ${db.users.map(u => `<tr><td><b>${esc(u.nom)}</b> ${u.actif === false ? '<span class="pill bad">Désactivé</span>' : ''}<div class="small muted">${ROLE[u.role]} · ${esc(u.email)}@${esc(db.agence.domaine)}</div>${ed && u.id !== me.id ? `<button class="btn sm" data-act="toggle|${u.id}" style="margin-top:4px">${u.actif === false ? 'Réactiver l\'accès' : 'Désactiver l\'accès'}</button>` : ''}</td>
        <td>${sel(u, 'voir', [['tout', 'Tous'], ['siens', 'Les siens']])}</td><td>${sel(u, 'suppr', T3)}</td><td>${sel(u, 'modif', T3)}</td><td>${sel(u, 'desact', T3)}</td>
        <td>${sel(u, 'pdf', YN)}</td><td>${sel(u, 'excel', YN)}</td><td>${sel(u, 'stats', [['toutes', 'Toutes'], ['siennes', 'Les siennes']])}</td><td>${sel(u, 'params', YN)}</td>
        <td><input type="number" min="0" data-droit="${u.id}|limite" value="${u.droits.limite || 0}" ${ed ? '' : 'disabled'} style="width:80px" aria-label="Limite d'export"><div class="small muted">0 = sans limite</div></td></tr>`).join('')}</tbody></table>
      <div class="actions" style="padding:0 16px 14px"><button class="btn" id="invite" ${ed ? '' : 'disabled title="Réservé à la direction"'}>Inviter un collaborateur</button></div></div>
    <div class="card" style="margin-top:14px"><h2>Invitations en attente</h2>
      <div class="small muted" style="margin-bottom:6px">La personne reçoit un e-mail avec un lien valable 7 jours, puis choisit son mot de passe. Une personne désactivée perd l'accès, mais ses fiches restent dans le logiciel.</div>
      ${(db.invites || []).length ? db.invites.map(i => `<div class="row"><div class="grow"><b>${esc(i.nom)}</b> · ${esc(i.email)} · ${ROLE[i.role]}<div class="small muted">Envoyée le ${fmtDate(i.date)} · expire dans ${Math.max(0, 7 + days(i.date))} jours</div></div>${ed ? `<button class="btn sm" data-act="resend|${i.id}">Renvoyer</button><button class="btn sm" data-act="viewmail|${i.id}">Voir l'e-mail (démo)</button><button class="btn sm" data-act="cancel|${i.id}">Annuler</button>` : ''}</div>`).join('') : '<div class="empty">Aucune invitation en attente.</div>'}</div>
    <div class="card" style="margin-top:14px"><h2>Journal des modifications</h2>
      ${isDir() ? db.journal.slice(0, 25).map(j => `<div class="row"><div class="small muted" style="min-width:120px">${esc(j.t)}</div><div class="grow"><b>${esc(user(j.qui).nom)}</b> ${esc(j.action)}</div></div>`).join('') : '<div class="empty">Le journal est visible par la direction uniquement. Changez d\'utilisateur (Claire Aubry) pour le voir.</div>'}</div>`;
  },

  avis() {
    db.avis = db.avis || {};
    const L = [['ess', 'Indispensable'], ['utile', 'Utile'], ['trop', 'En trop']];
    return `<div class="card" style="margin-bottom:12px">Pour chaque fonction, cliquez sur <b>Indispensable</b>, <b>Utile</b> ou <b>En trop</b>. En bas, écrivez ce qui manque. Puis cliquez sur « Copier mon retour » et collez-le dans un message.</div>
    ${AVIS_GROUPES.map(([g, items]) => `<div class="sec">${esc(g)}</div><div class="card">${items.map(n => `<div class="row"><div class="grow">${esc(n)}</div><div style="display:flex;gap:6px;flex-wrap:wrap">${L.map(([v, l]) => `<button class="chip ${db.avis[n] === v ? 'on' : ''}" data-avis="${esc(n)}|${v}">${l}</button>`).join('')}</div></div>`).join('')}</div>`).join('')}
    <div class="sec">Ce qui manque</div><div class="card"><textarea id="avisManque" rows="4" placeholder="Une fonction que vous utilisez dans l'autre logiciel et qui n'est pas ici, ou toute remarque sur l'écran." style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--card);font:inherit">${esc(db.avisManque || '')}</textarea>
    <div class="actions"><button class="btn primary" id="avisCopy">Copier mon retour</button></div></div>`;
  },

  avancement() {
    const T = { on: '<span class="tag on">Dans la maquette</span>', sim: '<span class="tag sim">Simulé</span>', todo: '<span class="tag">À construire</span>' };
    const G = [
      ['Premier jour', [
        ['Offres par type de vente', 'Fonds, murs, droit au bail, location, cession. Création en formulaire court, détails facultatifs.', 'on'],
        ['Fiche d\'offre complète', 'Emplacement, terrasse, extraction, logement, charges, taxe foncière, droit au bail, honoraires, accroche, notes confidentielles.', 'on'],
        ['Adresse publique et confidentielle, n° de mandat', 'Deux adresses par offre, le n° de mandat sert de référence.', 'on'],
        ['Statut sous option', 'Option liée à un demandeur, avec sa date.', 'on'],
        ['Annuaire de contacts unique', 'Propriétaires et demandeurs au même endroit, avec leur rôle.', 'on'],
        ['Recherches à plusieurs types de transaction', 'Liste avec dernière note datée, vue en colonnes, liste PDF.', 'on'],
        ['Correspondances', 'Prix et surface éliminatoires, puis activité, licence, extraction, quartiers, apport.', 'on'],
        ['Alertes mandat, bail et mandat de recherche', 'Mandat 7 jours avant, bail 8 mois avant, mandat de recherche à renouveler.', 'on'],
        ['Vérification périodique des offres', 'Rappel si une offre n\'a pas été confirmée depuis 30 jours.', 'on'],
        ['Étoiles, sélection du jour, mots-clés', 'Pour retrouver et mettre en avant vos meilleures offres.', 'on'],
        ['Droits par personne', 'Voir, supprimer, modifier, désactiver, PDF, Excel, statistiques, paramètres, limite d\'export.', 'on'],
        ['Rôles et journal (direction)', 'Journal visible de la direction seule.', 'on'],
        ['Diffusion sur 10 sites : suivi par site', 'Cochée, présente dans le dernier envoi, avertissement du site.', 'on'],
        ['Diffusion réelle sur les sites', 'Dépend des accords et du format de chaque site.', 'todo'],
        ['E-mail avec modèle et choix des informations', 'Aperçu et envoi depuis l\'adresse de l\'agence.', 'sim'],
        ['PDF avec filigrane et fiche vitrine', 'Aperçu à l\'écran, vrai PDF à venir.', 'sim'],
        ['Appeler, SMS, WhatsApp, e-mail', 'Boutons sur chaque fiche.', 'on'],
        ['Reprise complète de VisualQie', 'Fiches, historique, photos, documents : dépend de l\'export.', 'todo'],
        ['Connexion, invitations et gestion de l\'équipe', 'E-mail + mot de passe, double vérification pour la Direction, invitation par e-mail.', 'sim'],
        ['Base de données et stockage en ligne', 'Version en ligne.', 'todo']]],
      ['Juste après', [
        ['Modèles de mandats et avenants', 'Remplis automatiquement.', 'sim'],
        ['Notes de visite vocales avec transcription', 'Enregistrement d\'abord.', 'sim'],
        ['Mode hors ligne avec envoi différé', 'Simulation avec le bouton du menu.', 'sim'],
        ['Statistiques par négociateur', 'Classement, honoraires, filtrées selon les droits.', 'on'],
        ['Recherche d\'entreprise par nom ou SIREN', 'Une seule recherche à la création du propriétaire.', 'sim'],
        ['Mini-site de l\'agence', 'Vitrine publique des offres disponibles.', 'todo']]],
      ['Plus tard', [['Veille législative', 'Besoin à préciser.', 'todo'], ['Intelligence artificielle', 'Reportée.', 'todo']]]
    ];
    return `<div class="card" style="margin-bottom:6px">Cette page permet au client de suivre l'avancement. « Simulé » se voit à l'écran mais ne fait rien de réel.</div>
      ${G.map(([t, items]) => `<div class="sec">${esc(t)}</div><div class="grid feat">${items.map(([n, dd, st]) => `<div class="card"><h3>${esc(n)}</h3><p>${esc(dd)}</p>${T[st]}</div>`).join('')}</div>`).join('')}`;
  }
};

const AVIS_GROUPES = [
  ['Offres', ['Création d\'une offre en formulaire court', 'Fiche d\'offre détaillée', 'Adresse publique et adresse confidentielle', 'Statut sous option', 'Étoiles et sélection du jour', 'Mots-clés', 'Vérification périodique des offres']],
  ['Diffusion', ['Suivi de la diffusion sur 10 sites', 'Avertissements des sites', 'Fiche vitrine PDF avec filigrane']],
  ['Contacts et recherches', ['Annuaire de contacts unique', 'Recherches à plusieurs types de transaction', 'Dernière note datée dans la liste', 'Vue en colonnes des recherches', 'Liste PDF des recherches', 'Mandat de recherche à renouveler']],
  ['Correspondances', ['Correspondances avec score et explication', 'Envoi d\'une sélection par e-mail']],
  ['Équipe', ['Droits réglés personne par personne', 'Journal des modifications (direction)', 'Statistiques par collaborateur']],
  ['Outils', ['Modèles de mandats et bons de visite', 'Boutons appeler, SMS, WhatsApp', 'Notes vocales', 'Mode hors ligne', 'Recherche d\'entreprise par SIREN']]
];

const TEMPLATES = [
  { id: 'mandat-simple', nom: 'Mandat de vente simple', corps: (b, m) => `MANDAT DE VENTE SIMPLE\nN° ${b.mandatNum}\n\nEntre ${m.nom} (le mandant)\net ${db.agence.nom} (le mandataire).\n\nObjet : ${b.typeVente.toLowerCase()}, ${b.titre}, ${b.ville} (${b.cp}).\nPrix de présentation : ${prixTxt(b)}.\nDurée : jusqu'au ${fmtDate(b.mandat.fin)}.\n\nFait à ${b.ville}, le ${fmtDate(today())}.\n\nSignature du mandant        Signature du mandataire` },
  { id: 'mandat-excl', nom: 'Mandat de vente exclusif', corps: (b, m) => `MANDAT DE VENTE EXCLUSIF\nN° ${b.mandatNum}\n\nEntre ${m.nom} (le mandant)\net ${db.agence.nom} (le mandataire).\n\nLe mandant confie au mandataire l'exclusivité de la commercialisation de : ${b.titre}, ${b.ville} (${b.cp}).\nPrix de présentation : ${prixTxt(b)}.\nDurée : jusqu'au ${fmtDate(b.mandat.fin)}.\n\nFait à ${b.ville}, le ${fmtDate(today())}.\n\nSignature du mandant        Signature du mandataire` },
  { id: 'avenant', nom: 'Avenant de prolongation', corps: (b, m) => `AVENANT AU MANDAT N° ${b.mandatNum}\n\nEntre ${m.nom} et ${db.agence.nom}.\n\nLes parties conviennent de prolonger le mandat portant sur ${b.titre} (${b.ville}) jusqu'au ${fmtDate(addDays(days(b.mandat.fin) + 90))}.\nLes autres conditions restent inchangées.\n\nFait le ${fmtDate(today())}.\n\nSignatures` },
  { id: 'bon-visite', nom: 'Bon de visite', dem: true, corps: (b, m, d) => `BON DE VISITE\n\nJe soussigné(e) ${d.nom} reconnais avoir visité, par l'intermédiaire de ${db.agence.nom}, le bien suivant :\n${b.typeVente} : ${b.titre}\nAdresse : ${b.adresseSecrete}, ${b.cp} ${b.ville}\nN° de mandat : ${b.mandatNum}\n\nJe m'engage à ne pas traiter directement avec le propriétaire sans passer par l'agence.\n\nFait le ${fmtDate(today())}.\n\nSignature du visiteur` },
  { id: 'denonce', nom: 'Lettre de dénonciation au propriétaire', dem: true, corps: (b, m, d) => `Objet : dénonciation d'acquéreur, mandat ${b.mandatNum}\n\nMadame, Monsieur ${m.contact},\n\nNous vous informons que ${d.nom} a visité ${b.titre} (${b.ville}) le ${fmtDate(today())} par notre intermédiaire.\n\nCe contact est ainsi dénoncé au titre de notre mandat.\n\nCordialement,\n${me.nom}\n${db.agence.nom}` }
];

// ---------- tiroirs ----------
function drawer(html) { const dr = $('#drawer'); dr.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${html}</div>`; dr.hidden = false; }
function closeDr() { $('#drawer').hidden = true; }
$('#drawer').addEventListener('click', e => { if (e.target.id === 'drawer' || e.target.closest('[data-close]')) closeDr(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDr(); if (e.key === 'Enter' && e.target.matches('tr.click')) e.target.click(); });
const contactBtns = (tel, nom, mail) => `<div class="actions" style="margin-top:6px"><a class="btn sm" href="tel:${digits(tel)}">Appeler</a><a class="btn sm" href="sms:${digits(tel)}">SMS</a><a class="btn sm" href="https://wa.me/${intl(tel)}" target="_blank" rel="noopener">WhatsApp</a>${mail || ''}</div><div class="small muted" style="margin-top:4px">${esc(tel)}</div>`;
function addRappel(texte, date) { db.rappels.push({ id: 'r' + Date.now(), texte, date, fait: false }); log('a ajouté un rappel : ' + texte); save(); toast('Rappel ajouté pour demain'); render(); }
function renew(id) { const b = bien(id); b.mandat.fin = addDays(Math.max(0, days(b.mandat.fin)) + 90); log(`a renouvelé le mandat ${b.mandatNum} jusqu'au ${fmtDate(b.mandat.fin)}`); save(); toast('Mandat prolongé de 90 jours'); render(); }
function renewD(id) { const d = dem(id); d.mandatFin = addDays(Math.max(0, days(d.mandatFin)) + 90); log(`a renouvelé le mandat de recherche de ${d.nom}`); save(); toast('Mandat de recherche prolongé de 90 jours'); render(); }
function newContact() {
  drawer(`<h2>Nouveau contact</h2><div class="small muted">Quel est son rôle ?</div>
    <div class="actions"><button class="btn primary" id="nc-o">Propriétaire (confie une offre)</button><button class="btn primary" id="nc-d">Demandeur (cherche un bien)</button><button class="btn ghost" data-close>Annuler</button></div>`);
  $('#nc-o').onclick = () => newOwner(); $('#nc-d').onclick = () => newDem();
}
function send(bId, dId) {
  const b = bien(bId), d = dem(dId);
  if (!db.deals.some(x => x.bien === bId && x.dem === dId)) { db.deals.push({ id: 't' + Date.now(), bien: bId, dem: dId, etape: 'Contact', honoraires: Math.round(b.prix * (b.typeVente === 'Location' ? 0.2 : 0.06)), agent: me.id }); log(`a ajouté ${b.mandatNum} aux dossiers de ${d.nom}`); save(); toast('Ajouté aux dossiers'); } else toast('Déjà dans les dossiers');
  render();
}

function pdfPreview(titre, texte) {
  if (!DR().pdf) return toast('Création de PDF non autorisée pour votre profil');
  drawer(`<h2>${esc(titre)}</h2><div class="paper" data-wm="${esc(db.agence.nom.toUpperCase())}"><div class="pre" style="background:none;border:0;padding:0;color:#111">${esc(texte)}</div></div>
    <div class="small muted" style="margin-top:8px">Aperçu : le filigrane de l'agence est ajouté à chaque PDF. Dans la version en ligne, ce bouton télécharge le vrai fichier. <span class="sim">Simulation</span></div>
    <div class="actions"><button class="btn" id="cpPdf">Copier le texte</button><button class="btn ghost" data-close>Fermer</button></div>`);
  $('#cpPdf').onclick = () => copy(texte, 'Texte copié');
}
function ficheTexte(bs) {
  return bs.map(b => [`${b.typeVente.toUpperCase()} : ${b.titre}`, `${b.ville} (${b.cp}), ${b.adressePublique}`, `${b.activite}, ${num(b.surface)} m²`, `${lblPrix(b)} : ${prixTxt(b)}`, b.loyerBail ? `Loyer du bail : ${eur(b.loyerBail)} par an` : '', b.ca ? `Chiffre d'affaires : ${eur(b.ca)}` : '', b.licence !== 'Aucune' ? `Licence : ${b.licence}` : '', hasExt(b) ? 'Extraction : oui' : '', b.terrasse === 'Oui' ? 'Terrasse : oui' : '', b.accroche, b.dispo ? 'Disponibilité : ' + b.dispo : '', b.descriptif, `Réf. ${b.mandatNum}`].filter(Boolean).join('\n')).join('\n\n----------\n\n');
}

function openMail(o) {
  const sender = `${me.email}@${db.agence.domaine}`; let tpl = o.tpl || 'prop';
  const inc = { adresse: true, prix: true, surface: true, loyerBail: false, ca: false, licence: true, photos: true };
  const lines = () => (o.biens || []).map(b => [`- ${b.titre} à ${b.ville}`, inc.adresse ? `  Secteur : ${b.adressePublique}` : '', inc.surface ? `  Surface : ${num(b.surface)} m²` : '', inc.prix ? `  ${lblPrix(b)} : ${prixTxt(b)}` : '', inc.loyerBail && b.loyerBail ? `  Loyer du bail : ${eur(b.loyerBail)} par an` : '', inc.ca && b.ca ? `  Chiffre d'affaires : ${eur(b.ca)}` : '', inc.licence && b.licence !== 'Aucune' ? `  Licence : ${b.licence}` : '', inc.photos ? `  ${b.photos} photos disponibles` : ''].filter(Boolean).join('\n')).join('\n\n');
  const sign = `\n\nCordialement,\n${me.nom}\n${db.agence.nom}`;
  const body = () => tpl === 'prop' ? `Bonjour,\n\nSuite à votre recherche, je vous propose ${o.biens && o.biens.length > 1 ? 'les biens suivants' : 'le bien suivant'} :\n\n${lines()}\n\nJe reste à votre disposition pour organiser une visite.${sign}`
    : tpl === 'relance' ? `Bonjour,\n\nJe reviens vers vous au sujet de votre projet. Avez-vous eu le temps d'y réfléchir ? Je peux vous présenter de nouvelles opportunités cette semaine.${sign}`
    : `Bonjour,\n\nJe vous confirme la visite${o.biens && o.biens[0] ? ' de ' + o.biens[0].titre + ' (' + o.biens[0].ville + ')' : ''} le [date et heure].\nMerci de vous munir d'une pièce d'identité.${sign}`;
  const obj = () => tpl === 'prop' ? 'Proposition de bien' + (o.biens && o.biens[0] ? ' : ' + o.biens[0].titre : '') : tpl === 'relance' ? 'Votre recherche' : 'Confirmation de visite';
  const checks = o.biens && o.biens.length ? `<h3>Informations à montrer</h3><div style="display:flex;gap:6px;flex-wrap:wrap">${[['adresse', 'Secteur'], ['surface', 'Surface'], ['prix', 'Prix'], ['loyerBail', 'Loyer du bail'], ['ca', "Chiffre d'affaires"], ['licence', 'Licence'], ['photos', 'Photos']].map(([k, l]) => `<label class="chip" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-inc="${k}" ${inc[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div>` : '';
  drawer(`<h2>Écrire à ${esc(o.nom)}</h2><div class="small muted">De : ${esc(sender)} · À : ${esc(o.email)}</div>
    <label class="small muted" for="mTpl" style="display:block;margin-top:10px">Modèle</label><select id="mTpl"><option value="prop">Proposition de bien</option><option value="relance">Relance</option><option value="visite">Confirmation de visite</option></select>
    ${checks}<label class="small muted" for="mObj" style="display:block;margin-top:10px">Objet</label><input type="text" id="mObj">
    <label class="small muted" for="mBody" style="display:block;margin-top:10px">Message</label><textarea id="mBody" rows="12" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--card);font:inherit"></textarea>
    <div class="actions"><button class="btn primary" id="mSend">Envoyer depuis ${esc(sender)}</button><button class="btn" id="mCopy">Copier</button>${o.biens && o.biens.length ? '<button class="btn" id="mPdf">Aperçu PDF</button>' : ''}<button class="btn ghost" data-close>Fermer</button></div>
    <div class="small muted" style="margin-top:6px">L'envoi est simulé dans la maquette. <span class="sim">Simulation</span></div>`);
  const fill = () => { $('#mObj').value = obj(); $('#mBody').value = body(); };
  $('#mTpl').value = tpl; fill();
  $('#mTpl').onchange = e => { tpl = e.target.value; fill(); };
  document.querySelectorAll('[data-inc]').forEach(c => c.onchange = () => { inc[c.dataset.inc] = c.checked; fill(); });
  $('#mSend').onclick = () => { log(`a envoyé un e-mail à ${o.nom} (${obj()})`); save(); closeDr(); toast('E-mail envoyé (simulation) et noté dans l\'historique'); render(); };
  $('#mCopy').onclick = () => copy($('#mBody').value, 'Message copié');
  if ($('#mPdf')) $('#mPdf').onclick = () => pdfPreview('Sélection pour ' + o.nom, ficheTexte(o.biens));
}

const dlRow = (l, v) => (v || v === 0) ? `<dt>${l}</dt><dd>${v}</dd>` : '';
function extraBien(b) {
  const m2 = b.surface ? Math.round(b.prix / b.surface) : 0, loc = b.typeVente === 'Location', conf = isDir() || b.agent === me.id;
  return [dlRow('Emplacement', esc(b.emplacement)), dlRow('Terrasse', esc(etat(b.terrasse))), dlRow('Logement', esc(etat(b.logement))), b.invest ? dlRow('Spécial investisseur', 'Oui') : '',
    dlRow('Disponibilité', esc(b.dispo)), dlRow(loc ? 'Loyer au m² par an' : 'Prix au m²', eur(m2)),
    b.droitAuBail ? dlRow('Droit au bail', eur(b.droitAuBail)) : '', b.droitEntree ? dlRow("Droit d'entrée", eur(b.droitEntree)) : '',
    b.charges ? dlRow('Charges', eur(b.charges) + ' par an') : '', b.tf ? dlRow('Taxe foncière', eur(b.tf) + ' par an') : '',
    b.honPreneur ? dlRow(loc ? 'Honoraires preneur' : 'Honoraires acquéreur', eur(b.honPreneur)) : '', b.honBailleur ? dlRow(loc ? 'Honoraires bailleur' : 'Honoraires vendeur', eur(b.honBailleur)) : '',
    dlRow('Accroche commerciale', esc(b.accroche)), dlRow('Dernière vérification', b.verif ? fmtDate(b.verif) : ''),
    b.conf ? dlRow('Notes confidentielles', conf ? esc(b.conf) : '<span class="muted">Réservées au responsable et à la direction</span>') : ''].join('');
}

function openBien(id) {
  const b = bien(id); if (!b) return; const m = mand(b.mandant);
  const cand = db.demandeurs.filter(d => d.active && seeD(d)).map(d => ({ d, m: match(b, d) })).filter(x => x.m.ok && x.m.s >= 55).sort((a, c) => c.m.s - a.m.s);
  const optDem = b.option ? dem(b.option.dem) : null;
  drawer(`<h2>${esc(b.titre)}</h2><div>${statutPill(b.statut)} ${mandatPill(b.mandat)}</div>
    <div class="actions" style="margin-top:8px;align-items:center"><span>${[1, 2, 3, 4, 5].map(n => `<button class="star ${n <= (b.etoiles || 0) ? 'on' : ''}" data-star="${b.id}|${n}" aria-label="${n} étoile${n > 1 ? 's' : ''}">★</button>`).join('')}</span>
      <button class="chip ${b.sel ? 'on' : ''}" data-sel="${b.id}">★ Sélection du jour</button><button class="btn sm" data-verif="${b.id}">Offre toujours valable</button></div>
    <dl class="dl"><dt>N° de mandat</dt><dd>${esc(b.mandatNum)}</dd><dt>Type de vente</dt><dd>${esc(b.typeVente)} · ${esc(b.activite)}</dd>
    <dt>Localisation</dt><dd>${esc(b.ville)} ${esc(b.cp)} · ${esc(b.quartier)}</dd><dt>Adresse publiée</dt><dd>${esc(b.adressePublique)}</dd>
    <dt>Adresse confidentielle</dt><dd>${esc(b.adresseSecrete)} <span class="small muted">(jamais publiée)</span></dd>
    <dt>Surface</dt><dd>${num(b.surface)} m²</dd><dt>${lblPrix(b)}</dt><dd>${prixTxt(b)}</dd>
    ${b.loyerBail ? `<dt>Loyer du bail</dt><dd>${eur(b.loyerBail)} par an</dd>` : ''}${b.ca ? `<dt>Chiffre d'affaires</dt><dd>${eur(b.ca)}</dd>` : ''}
    ${b.typeVente === 'Fonds de commerce' ? `<dt>Licence</dt><dd>${esc(b.licence)}</dd><dt>Extraction</dt><dd>${esc(etat(b.extraction))}</dd>` : ''}
    <dt>Origine du vendeur</dt><dd>${esc(b.origine)}</dd><dt>Propriétaire</dt><dd>${esc(m.nom)}<div class="small muted">${esc(m.contact)} · ${esc(m.tel)}</div></dd><dt>Responsable</dt><dd>${esc(user(b.agent).nom)}</dd>
    <dt>Fin du mandat</dt><dd>${fmtDate(b.mandat.fin)}</dd><dt>Bail</dt><dd>Triennale : ${fmtDate(b.bail.triennale)}<br>Fin : ${fmtDate(b.bail.fin)}</dd>${extraBien(b)}</dl>
    <h3>Option</h3>
    ${optDem ? `<div class="row"><div class="grow">Option posée par <b>${esc(optDem.nom)}</b> le ${fmtDate(b.option.date)}</div><button class="btn sm" id="lift">Lever l'option</button></div>`
      : `<div class="actions" style="margin-top:0"><select id="optSel" style="width:auto;flex:1" aria-label="Demandeur">${db.demandeurs.filter(d => d.active).map(d => `<option value="${d.id}">${esc(d.nom)}</option>`).join('')}</select><button class="btn sm" id="setOpt" ${b.statut === 'Inactif' || !canMod(b) ? 'disabled' : ''}>Poser une option</button></div>`}
    <h3>Documents et photos</h3>
    <div class="row"><div class="grow">${b.photos} photos</div></div>${b.docs.map(x => `<div class="row"><div class="grow">${esc(x)}</div></div>`).join('')}
    <div class="actions" style="margin-top:8px"><button class="btn sm" id="addDoc">Ajouter un document</button><span class="sim">Simulation</span></div>
    <h3>Diffusion sur les ${PORTAILS.length} sites d'annonces</h3>
    ${PORTAILS.map(p => { const mi = missing(b, p), on = b.portails.includes(p.nom), sent = (b.envoi || []).includes(p.nom), av = (b.avert || {})[p.nom];
      const st = !on ? 'Non cochée' : sent ? 'Cochée · présente dans le dernier envoi' : 'Cochée · partira au prochain envoi';
      return `<div class="check"><input type="checkbox" data-portail="${esc(p.nom)}" id="pt-${esc(p.nom)}" ${on ? 'checked' : ''} ${mi.length && !on ? 'disabled' : ''} aria-label="${esc(p.nom)}"><div class="grow"><label for="pt-${esc(p.nom)}">${esc(p.nom)}${p.j1 ? ' <span class="tag ai">Jour 1</span>' : ''}</label>${mi.length ? `<div class="small" style="color:var(--warn)">À compléter : ${esc(mi.join(', '))}</div>` : `<div class="small muted">${st}</div>`}${av ? `<div class="small" style="color:var(--warn)">⚠ Avertissement du site : ${esc(av)}</div>` : ''}</div><span class="pill ${mi.length ? 'warn' : 'ok'}">${p.champs.length - mi.length}/${p.champs.length}</span></div>`; }).join('')}
    <div class="actions" style="margin-top:6px"><button class="btn sm" id="pushNow">Envoyer maintenant aux sites cochés</button><span class="sim">Simulation</span></div>
    <div class="small muted" style="margin-top:4px">Le compteur montre combien de champs obligatoires sont remplis pour chaque site. L'envoi est simulé.</div>
    <h3>Demandeurs adaptés</h3>
    ${cand.map(x => `<div class="row"><div class="score ${sCls(x.m.s)}">${x.m.s}</div><div class="grow"><div class="t">${esc(x.d.nom)}</div><div class="small muted">${esc(x.m.why.slice(1).join(' · '))}</div></div><button class="btn sm" data-mailbd="${b.id}|${x.d.id}">Écrire</button></div>`).join('') || '<div class="small muted">Aucun demandeur actif pour l\'instant.</div>'}
    <h3>Mots-clés</h3><div class="actions" style="margin-top:0"><input type="text" id="kwTxt" value="${esc((b.motsCles || []).join(', '))}" placeholder="Ex. terrasse, port, angle" style="flex:1" aria-label="Mots-clés"><button class="btn sm" id="kwSave">Enregistrer</button></div>
    <h3>Notes</h3>${b.notes.map(n => `<div class="row"><div class="grow">${esc(n.texte)}<div class="small muted">${esc(user(n.qui).nom)} · ${fmtDate(n.date)}</div></div></div>`).join('') || '<div class="small muted">Aucune note.</div>'}
    <textarea id="noteTxt" rows="2" placeholder="Note de visite ou d'échange" style="width:100%;margin-top:8px;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--card);font:inherit"></textarea>
    <div class="actions" style="margin-top:6px"><button class="btn sm" id="addNote">Ajouter la note</button><button class="btn sm" id="addVoice">Note vocale</button><span class="sim">Vocale : simulation</span></div>
    <div class="actions"><button class="btn" id="renew" ${canMod(b) ? '' : 'disabled title="Vous ne pouvez modifier que vos fiches"'}>Renouveler le mandat (+90 jours)</button><button class="btn" id="fichePdf">Fiche vitrine (PDF)</button>
      <select id="stSel" style="width:auto" aria-label="Statut" ${canOff(b) ? '' : 'disabled title="Vous ne pouvez désactiver que vos fiches"'}><option ${b.statut === 'Disponible' ? 'selected' : ''}>Disponible</option><option ${b.statut === 'Inactif' ? 'selected' : ''}>Inactif</option>${b.statut === 'Sous option' ? '<option selected>Sous option</option>' : ''}</select>
      <button class="btn" id="del" ${canDel(b) ? '' : 'disabled title="Suppression non autorisée pour votre profil"'}>Supprimer</button><button class="btn ghost" data-close>Fermer</button></div>`);
  const redo = () => { save(); openBien(id); render(); };
  if ($('#lift')) $('#lift').onclick = () => { b.statut = 'Disponible'; delete b.option; log(`a levé l'option sur ${b.mandatNum}`); toast('Option levée'); redo(); };
  if ($('#setOpt')) $('#setOpt').onclick = () => { const d = dem($('#optSel').value); b.statut = 'Sous option'; b.option = { dem: d.id, date: today() }; log(`a posé une option sur ${b.mandatNum} pour ${d.nom}`); toast('Option posée'); redo(); };
  $('#pushNow').onclick = () => { b.envoi = [...b.portails]; b.avert = {}; log(`a envoyé ${b.mandatNum} vers ${b.portails.length} site(s)`); toast(b.portails.length ? 'Envoi effectué (simulation)' : 'Aucun site coché'); redo(); };
  $('#kwSave').onclick = () => { b.motsCles = $('#kwTxt').value.split(',').map(x => x.trim()).filter(Boolean); log(`a modifié les mots-clés de ${b.mandatNum}`); toast('Mots-clés enregistrés'); redo(); };
  $('#addDoc').onclick = () => { b.docs.push('Nouveau document ' + (b.docs.length + 1) + '.pdf'); log(`a ajouté un document à ${b.mandatNum}`); toast('Document ajouté (simulation)'); redo(); };
  document.querySelectorAll('[data-portail]').forEach(c => c.onchange = () => { const p = c.dataset.portail; b.portails = c.checked ? [...b.portails, p] : b.portails.filter(x => x !== p); if (!c.checked) { b.envoi = (b.envoi || []).filter(x => x !== p); if (b.avert) delete b.avert[p]; } log(`${c.checked ? 'a publié' : 'a retiré'} ${b.mandatNum} ${c.checked ? 'sur' : 'de'} ${p}`); toast(c.checked ? 'Publié sur ' + p + ' (simulation)' : 'Retiré de ' + p); redo(); });
  $('#addNote').onclick = () => { const t = $('#noteTxt').value.trim(); if (!t) return toast("Écrivez d'abord la note"); b.notes.unshift({ qui: me.id, date: today(), texte: t }); log(`a ajouté une note sur ${b.mandatNum}`); toast('Note ajoutée'); redo(); };
  $('#addVoice').onclick = () => { b.notes.unshift({ qui: me.id, date: today(), texte: 'Note vocale de 0:23 (transcription à venir)' }); log(`a ajouté une note vocale sur ${b.mandatNum}`); toast('Note vocale ajoutée (simulation)'); redo(); };
  $('#renew').onclick = () => { renew(id); openBien(id); };
  $('#fichePdf').onclick = () => pdfPreview('Fiche commerciale ' + b.mandatNum, ficheTexte([b]));
  $('#stSel').onchange = e => { b.statut = e.target.value; if (b.statut === 'Inactif') { b.portails = []; delete b.option; } log(`a passé ${b.mandatNum} en « ${b.statut} »`); toast('Statut mis à jour'); redo(); };
  $('#del').onclick = e => { if (!e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = 'Confirmer la suppression'; return; } db.biens = db.biens.filter(x => x.id !== id); db.deals = db.deals.filter(x => x.bien !== id); log(`a supprimé le bien ${b.mandatNum}`); save(); closeDr(); toast('Bien supprimé'); render(); };
}

function openDem(id) {
  const d = dem(id); if (!d) return;
  const res = db.biens.filter(b => b.statut !== 'Inactif').map(b => ({ b, m: match(b, d) })).filter(x => x.m.ok && x.m.s >= 55).sort((a, c) => c.m.s - a.m.s).slice(0, 5);
  drawer(`<h2>${esc(d.nom)}</h2><div>${d.active ? '<span class="pill ok">Recherche active</span>' : '<span class="pill">Recherche terminée</span>'}</div>
    ${contactBtns(d.tel, d.nom, `<button class="btn sm" data-maild="${d.id}">Écrire</button>`)}
    <dl class="dl"><dt>Recherche</dt><dd>${esc(dTypes(d).join(' + '))} · ${esc(d.activite)}</dd><dt>Surface</dt><dd>${num(d.surfMin)} à ${num(d.surfMax)} m²</dd><dt>Budget</dt><dd>${eur(d.budget)}</dd><dt>Apport</dt><dd>${eur(d.apport)}</dd>
    <dt>Licence</dt><dd>${esc(d.licence)}</dd><dt>Extraction</dt><dd>${d.extraction ? 'Oui' : 'Non'}</dd><dt>Département</dt><dd>${esc(d.dept)}</dd>
    <dt>Quartiers voulus</dt><dd>${esc(d.quartiersVoulus.join(', ') || '—')}</dd><dt>Quartiers à éviter</dt><dd>${esc(d.quartiersEviter.join(', ') || '—')}</dd><dt>Origine</dt><dd>${esc(d.origine)}</dd><dt>Suivi par</dt><dd>${esc(user(d.agent).nom)}</dd>${d.mandatFin ? `<dt>Mandat de recherche</dt><dd>jusqu'au ${fmtDate(d.mandatFin)}</dd>` : ''}</dl>
    <h3>Biens adaptés</h3>
    ${res.map(x => `<div class="row"><div class="score ${sCls(x.m.s)}">${x.m.s}</div><div class="grow"><div class="t">${esc(x.b.mandatNum)} · ${esc(x.b.titre)}</div><div class="small muted">${esc(x.b.ville)} · ${prixTxt(x.b)}</div></div><button class="btn sm" data-mailbd="${x.b.id}|${d.id}">Écrire</button></div>`).join('') || '<div class="small muted">Aucun bien pour l\'instant.</div>'}
    <h3>Notes d'échange</h3>${d.notes.map(n => `<div class="row"><div class="grow">${esc(n.texte)}<div class="small muted">${esc(user(n.qui).nom)} · ${fmtDate(n.date)}</div></div></div>`).join('') || '<div class="small muted">Aucune note.</div>'}
    <textarea id="noteTxt" rows="2" placeholder="Note d'échange" style="width:100%;margin-top:8px;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--card);font:inherit"></textarea>
    <div class="actions" style="margin-top:6px"><button class="btn sm" id="addNote">Ajouter la note</button><button class="btn sm" id="addVoice">Note vocale</button><span class="sim">Vocale : simulation</span></div>
    <div class="actions"><button class="btn" id="remD">Rappel demain</button>${d.mandatFin ? '<button class="btn" id="renewD">Renouveler le mandat de recherche</button>' : ''}<button class="btn" id="toggleAct">${d.active ? 'Arrêter la recherche' : 'Réactiver la recherche'}</button><button class="btn ghost" data-close>Fermer</button></div>`);
  const redo = () => { save(); openDem(id); render(); };
  if ($('#renewD')) $('#renewD').onclick = () => { renewD(id); openDem(id); };
  $('#addNote').onclick = () => { const t = $('#noteTxt').value.trim(); if (!t) return toast("Écrivez d'abord la note"); d.notes.unshift({ qui: me.id, date: today(), texte: t }); d.dernier = today(); log(`a ajouté une note sur ${d.nom}`); toast('Note ajoutée'); redo(); };
  $('#addVoice').onclick = () => { d.notes.unshift({ qui: me.id, date: today(), texte: 'Note vocale de 0:41 (transcription à venir)' }); log(`a ajouté une note vocale sur ${d.nom}`); toast('Note vocale ajoutée (simulation)'); redo(); };
  $('#remD').onclick = () => { addRappel(`Rappeler ${d.nom}`, addDays(1)); };
  $('#toggleAct').onclick = () => { d.active = !d.active; log(`a ${d.active ? 'réactivé' : 'arrêté'} la recherche de ${d.nom}`); toast(d.active ? 'Recherche réactivée' : 'Recherche arrêtée'); redo(); };
}

const LOOKUP = [
  { nom: 'SARL LES TERRASSES DU PORT', siret: '000 000 111 00019', adresse: '4 quai du Port, 64100 Bayonne', dirigeant: 'Marie Larrieu' },
  { nom: 'SAS OCEAN BOULANGERIE', siret: '000 000 222 00028', adresse: '18 rue Thiers, 40100 Dax', dirigeant: 'Julien Casaux' },
  { nom: 'SCI DES ARCADES', siret: '000 000 333 00037', adresse: '2 place Jean Jaurès, 33000 Bordeaux', dirigeant: 'Paul Duval' }
];
function openOwner(id) {
  const m = mand(id); const bs = db.biens.filter(b => b.mandant === id);
  const hist = db.journal.filter(j => bs.some(b => j.action.includes(b.mandatNum)));
  const rapport = `Rapport d'activité pour ${m.nom}\nDate : ${fmtDate(today())}\n\nBiens sous mandat : ${bs.filter(b => b.statut !== 'Inactif').length}\n${bs.map(b => `- ${b.mandatNum} ${b.titre} (${b.ville}) : ${b.statut.toLowerCase()}, mandat jusqu'au ${fmtDate(b.mandat.fin)}`).join('\n')}\n\nDossiers en cours : ${db.deals.filter(x => bs.some(b => b.id === x.bien) && x.etape !== 'Signé').length}\nDiffusion : ${bs.reduce((s, b) => s + b.portails.length, 0)} annonces en ligne\n\nHistorique des actions :\n${hist.map(j => `- ${j.t} : ${user(j.qui).nom} ${j.action}`).join('\n') || '- Aucune action enregistrée'}\n\nCordialement,\n${me.nom}\n${db.agence.nom}`;
  drawer(`<h2>${esc(m.nom)}</h2><div class="muted">${esc(m.contact)} · ${esc(m.email)}</div>
    ${contactBtns(m.tel, m.nom, `<button class="btn sm" data-mailm="${m.id}">Écrire</button>`)}
    <dl class="dl"><dt>SIRET</dt><dd>${esc(m.siret || '—')}</dd><dt>Acte d'acquisition</dt><dd>${m.acte ? 'Reçu' : 'À récupérer'}</dd></dl>
    <h3>Biens confiés</h3>${bs.map(b => `<div class="row"><div class="grow"><div class="t">${esc(b.mandatNum)} · ${esc(b.titre)}</div><div class="small muted">${esc(b.ville)}</div></div>${statutPill(b.statut)}</div>`).join('')}
    <h3>Rapport de mandant</h3><div class="pre">${esc(rapport)}</div>
    <div class="actions"><button class="btn primary" id="cpRap">Copier le rapport</button><button class="btn" id="pdfRap">Aperçu PDF</button><button class="btn ghost" data-close>Fermer</button></div>`);
  $('#cpRap').onclick = () => copy(rapport, 'Rapport copié');
  $('#pdfRap').onclick = () => pdfPreview('Rapport de mandant', rapport);
}
function newOwner() {
  drawer(`<div class="form"><h2>Nouveau propriétaire</h2>
    <label for="o-q">Rechercher une entreprise (nom ou SIREN)</label><div class="ask" style="display:flex;gap:8px"><input type="text" id="o-q" placeholder="Ex. Terrasses du Port"><button class="btn" id="o-go">Rechercher</button></div>
    <div id="o-res" class="small muted" style="margin-top:6px">Une seule recherche suffit pour pré-remplir la fiche. <span class="sim">Simulation</span></div>
    <label for="o-nom">Nom ou société</label><input type="text" id="o-nom"><label for="o-contact">Contact</label><input type="text" id="o-contact">
    <label for="o-tel">Téléphone</label><input type="text" id="o-tel"><label for="o-mail">E-mail</label><input type="text" id="o-mail"><label for="o-siret">SIRET</label><input type="text" id="o-siret">
    <div class="actions"><button class="btn primary" id="o-ok">Créer</button><button class="btn ghost" data-close>Annuler</button></div></div>`);
  $('#o-go').onclick = () => { const t = $('#o-q').value.trim().toLowerCase(); const r = LOOKUP.filter(x => !t || x.nom.toLowerCase().includes(t) || x.siret.replace(/\s/g, '').includes(t.replace(/\s/g, ''))); $('#o-res').innerHTML = r.length ? r.map((x, i) => `<div class="row"><div class="grow"><b>${esc(x.nom)}</b><div class="small muted">${esc(x.adresse)} · ${esc(x.dirigeant)}</div></div><button class="btn sm" data-pick="${i}">Choisir</button></div>`).join('') : 'Aucun résultat.'; document.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { const x = LOOKUP[+b.dataset.pick]; $('#o-nom').value = x.nom; $('#o-contact').value = x.dirigeant; $('#o-siret').value = x.siret; toast('Fiche pré-remplie'); }); };
  $('#o-ok').onclick = () => { const nom = $('#o-nom').value.trim(); if (!nom) return toast('Le nom est obligatoire'); db.mandants.push({ id: 'm' + Date.now(), nom, contact: $('#o-contact').value.trim() || nom, tel: $('#o-tel').value.trim(), email: $('#o-mail').value.trim(), siret: $('#o-siret').value.trim(), acte: false }); log(`a créé le propriétaire ${nom}`); save(); closeDr(); toast('Propriétaire créé'); render(); };
}

function newBien() {
  const opts = a => a.map(x => `<option>${esc(x)}</option>`).join('');
  drawer(`<div class="form"><h2>Nouvelle offre</h2><div class="small muted">Six champs suffisent pour créer l'offre. Le reste est facultatif.</div>
    <label for="f-tv">Type de vente</label><select id="f-tv">${opts(TV)}</select>
    <label for="f-act">Activité</label><select id="f-act">${opts(ACT)}</select>
    <label for="f-titre">Titre</label><input type="text" id="f-titre" placeholder="Ex. Restaurant avec terrasse">
    <label for="f-ville">Ville</label><input type="text" id="f-ville"><label for="f-cp">Code postal</label><input type="text" id="f-cp" maxlength="5">
    <label for="f-surf">Surface (m²)</label><input type="number" id="f-surf" min="1"><label for="f-prix" id="f-prixl">Prix (€)</label><input type="number" id="f-prix" min="1">
    <label for="f-mand">Propriétaire</label><select id="f-mand">${db.mandants.map(m => `<option value="${m.id}">${esc(m.nom)}</option>`).join('')}</select>
    <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Plus de détails (facultatif)</summary>
    <label for="f-quartier">Quartier</label><input type="text" id="f-quartier">
    <label for="f-adr">Adresse publiée</label><input type="text" id="f-adr" placeholder="Ex. Centre-ville, proche de la place">
    <label for="f-adrs">Adresse confidentielle</label><input type="text" id="f-adrs">
    <label for="f-emp">Emplacement</label><select id="f-emp">${opts(EMPL)}</select>
    <label for="f-terr">Terrasse</label><select id="f-terr">${opts(ETATS)}</select>
    <label for="f-logt">Logement</label><select id="f-logt">${opts(ETATS)}</select>
    <label for="f-dispo">Disponibilité</label><input type="text" id="f-dispo" placeholder="Ex. Immédiate">
    <div data-tv="Fonds de commerce|Cession de droit au bail|Murs commerciaux|Cession d'entreprise"><label for="f-bail">Loyer annuel du bail (€)</label><input type="number" id="f-bail" min="0"></div>
    <div data-tv="Cession de droit au bail"><label for="f-dab">Droit au bail (€)</label><input type="number" id="f-dab" min="0"></div>
    <div data-tv="Location"><label for="f-entree">Droit d'entrée (€)</label><input type="number" id="f-entree" min="0"></div>
    <div data-tv="Fonds de commerce|Cession d'entreprise"><label for="f-ca">Chiffre d'affaires (€)</label><input type="number" id="f-ca" min="0"></div>
    <div data-tv="Fonds de commerce"><label for="f-lic">Licence</label><select id="f-lic">${opts(['Aucune', 'Licence IV', 'Licence restaurant'])}</select><label for="f-ext">Extraction</label><select id="f-ext">${opts(ETATS)}</select></div>
    <label for="f-chg">Charges annuelles (€)</label><input type="number" id="f-chg" min="0"><label for="f-tf">Taxe foncière annuelle (€)</label><input type="number" id="f-tf" min="0">
    <label for="f-honp">Honoraires preneur ou acquéreur (€)</label><input type="number" id="f-honp" min="0"><label for="f-honb">Honoraires bailleur ou vendeur (€)</label><input type="number" id="f-honb" min="0">
    <label for="f-mtype">Type de mandat</label><select id="f-mtype"><option>Simple</option><option>Exclusif</option></select>
    <label for="f-accr">Accroche commerciale</label><input type="text" id="f-accr">
    <label for="f-kw">Mots-clés (séparés par des virgules)</label><input type="text" id="f-kw">
    <label for="f-conf">Notes confidentielles</label><input type="text" id="f-conf">
    <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="f-inv"> Spécial investisseur</label></details>
    <div class="actions"><button class="btn primary" id="f-ok">Créer l'offre</button><button class="btn ghost" data-close>Annuler</button></div></div>`);
  const upd = () => { const tv = $('#f-tv').value; document.querySelectorAll('[data-tv]').forEach(x => x.hidden = !x.dataset.tv.split('|').includes(tv)); $('#f-prixl').textContent = tv === 'Location' ? 'Loyer annuel (€)' : 'Prix (€)'; };
  $('#f-tv').onchange = upd; upd(); $('#f-titre').focus();
  const v = k => $('#' + k).value.trim(), n = k => +$('#' + k).value || 0;
  $('#f-ok').onclick = () => {
    const titre = v('f-titre'), surface = n('f-surf'), prix = n('f-prix');
    if (!titre || !surface || !prix) return toast('Titre, surface et prix sont obligatoires');
    const nn = Math.max(...db.biens.map(x => +x.mandatNum.slice(-4) || 0)) + 1, cp = v('f-cp');
    const b = { id: 'b' + Date.now(), mandatNum: 'M-' + new Date().getFullYear() + '-' + String(nn).padStart(4, '0'), typeVente: v('f-tv'), activite: v('f-act'), titre, ville: v('f-ville') || '—', cp, dept: cp.slice(0, 2), quartier: v('f-quartier'), adressePublique: v('f-adr'), adresseSecrete: v('f-adrs'), surface, prix, loyerBail: n('f-bail'), ca: n('f-ca'), licence: v('f-lic') || 'Aucune', extraction: v('f-ext') || 'Non', statut: 'Disponible', mandat: { type: v('f-mtype'), fin: addDays(180) }, bail: { triennale: addDays(400), fin: addDays(1000) }, origine: 'Relation', mandant: v('f-mand'), agent: me.id, hue: Math.floor(Math.random() * 360), photos: 0, diag: false, descriptif: '', docs: [], portails: [], notes: [],
      emplacement: v('f-emp'), terrasse: v('f-terr'), logement: v('f-logt'), dispo: v('f-dispo'), droitAuBail: n('f-dab'), droitEntree: n('f-entree'), charges: n('f-chg'), tf: n('f-tf'), honPreneur: n('f-honp'), honBailleur: n('f-honb'), accroche: v('f-accr'), conf: v('f-conf'), motsCles: v('f-kw').split(',').map(x => x.trim()).filter(Boolean), invest: $('#f-inv').checked, etoiles: 0, sel: false, verif: today(), envoi: [], avert: {} };
    db.biens.unshift(b); log(`a créé l'offre ${b.mandatNum} « ${titre} »`); save(); closeDr(); toast('Offre créée : complétez la fiche pour la diffusion'); go('biens'); setTimeout(() => openBien(b.id), 50);
  };
}
function newDem() {
  const opts = a => a.map(x => `<option>${esc(x)}</option>`).join('');
  drawer(`<div class="form"><h2>Nouveau demandeur</h2>
    <label for="n-nom">Nom ou société</label><input type="text" id="n-nom"><label for="n-tel">Téléphone</label><input type="text" id="n-tel"><label for="n-mail">E-mail</label><input type="text" id="n-mail">
    <label>Types de transaction recherchés (un ou plusieurs)</label><div style="display:flex;gap:6px;flex-wrap:wrap">${TV.map(t => `<label class="chip" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-ntv value="${esc(t)}"> ${esc(t)}</label>`).join('')}</div><label for="n-act">Activité</label><input type="text" id="n-act" placeholder="Ex. Restaurant, Toutes">
    <label for="n-smin">Surface min (m²)</label><input type="number" id="n-smin"><label for="n-smax">Surface max (m²)</label><input type="number" id="n-smax">
    <label for="n-bud">Budget maximum (€)</label><input type="number" id="n-bud"><label for="n-app">Apport (€)</label><input type="number" id="n-app">
    <label for="n-dept">Département</label><select id="n-dept"><option>33</option><option>64</option><option>40</option></select>
    <label for="n-qv">Quartiers voulus (séparés par des virgules)</label><input type="text" id="n-qv"><label for="n-qe">Quartiers à éviter</label><input type="text" id="n-qe">
    <label for="n-or">Origine</label><select id="n-or">${opts(['Relation', 'Internet', 'Annonce'])}</select>
    <div class="actions"><button class="btn primary" id="n-ok">Créer</button><button class="btn ghost" data-close>Annuler</button></div></div>`);
  const lst = v => v.split(',').map(x => x.trim()).filter(Boolean);
  $('#n-ok').onclick = () => { const nom = $('#n-nom').value.trim(), budget = +$('#n-bud').value, types = [...document.querySelectorAll('[data-ntv]:checked')].map(c => c.value); if (!nom || !budget || !types.length) return toast('Nom, budget et au moins un type de transaction sont obligatoires');
    db.demandeurs.unshift({ id: 'd' + Date.now(), nom, tel: $('#n-tel').value.trim(), email: $('#n-mail').value.trim(), typeVente: types[0], types, activite: $('#n-act').value.trim() || 'Toutes', mandatFin: addDays(90), licence: 'Aucune', extraction: false, surfMin: +$('#n-smin').value || 0, surfMax: +$('#n-smax').value || 99999, budget, apport: +$('#n-app').value || 0, dept: $('#n-dept').value, quartiersVoulus: lst($('#n-qv').value), quartiersEviter: lst($('#n-qe').value), origine: $('#n-or').value, active: true, agent: me.id, dernier: today(), notes: [] });
    log(`a créé le demandeur ${nom}`); save(); closeDr(); toast('Demandeur créé'); render(); };
}

// ---------- rendu ----------
let current = 'dashboard';
try { const h = location.hash.replace('#', ''); if (views[h]) current = h; } catch (e) {}
const route = () => views[current] ? current : 'dashboard';
function go(name) { if (!views[name]) return; current = name; closeDr(); try { if (location.hash.replace('#', '') !== name) location.hash = name; } catch (e) {} render(); try { window.scrollTo(0, 0); } catch (e) {} }
const MOBILE = ['dashboard', 'biens', 'demandeurs', 'matching'];
function openMore() {
  drawer(`<h2>Menu</h2><div class="more">${ROUTES.map(x => `<a href="#${x[0]}">${ICON[x[2]]}<span>${x[1]}</span></a>`).join('')}</div>
    <label class="small muted" for="userSel2" style="display:block;margin-top:14px">Connecté en tant que</label><select id="userSel2">${db.users.map(u => `<option value="${u.id}" ${u.id === me.id ? 'selected' : ''}>${esc(u.nom)} (${ROLE[u.role]})</option>`).join('')}</select>
    <div class="actions"><button class="btn" id="offBtn2">${db.offline ? 'Retour du réseau' : 'Simuler une perte de réseau'}</button><button class="btn" id="resetBtn2">Réinitialiser la démo</button><button class="btn ghost" data-close>Fermer</button></div>`);
  $('#userSel2').onchange = e => { me = db.users.find(u => u.id === e.target.value); $('#userSel').value = me.id; closeDr(); toast('Connecté : ' + me.nom); render(); };
  $('#offBtn2').onclick = () => { closeDr(); toggleOffline(); };
  $('#resetBtn2').onclick = () => { closeDr(); $('#resetBtn').click(); };
}
function toggleOffline() {
  if (!db.offline) { db.offline = true; db.queue = 0; toast('Réseau coupé (simulation) : vos modifications sont gardées'); }
  else { const n = db.queue || 0; db.offline = false; db.queue = 0; toast(n ? `Réseau revenu : ${n} modification${n > 1 ? 's' : ''} envoyée${n > 1 ? 's' : ''}` : 'Réseau revenu'); }
  save(); render();
}
function render() {
  const r = route(), cur = ROUTES.find(x => x[0] === r);
  $('#title').textContent = cur[1]; $('#lead').textContent = cur[3]; $('#view').innerHTML = views[r]();
  const nb = tasks().length;
  const link = x => `<a href="#${x[0]}" class="${x[0] === r ? 'on' : ''}" ${x[0] === r ? 'aria-current="page"' : ''}>${ICON[x[2]]}<span>${x[1]}</span>${x[0] === 'dashboard' && nb ? `<span class="badge">${nb}</span>` : ''}</a>`;
  $('#nav').innerHTML = ROUTES.map((x, i) => (x[4] && !ROUTES[i - 1][4] ? '<div class="navsep">Autres</div>' : '') + link(x)).join('');
  $('#bottom').innerHTML = ROUTES.filter(x => MOBILE.includes(x[0])).map(link).join('') + `<button class="tab" id="moreBtn">${ICON.list}<span>Plus</span></button>`;
  const add = { dashboard: '+ Nouvelle offre', biens: '+ Nouvelle offre', demandeurs: '+ Nouveau demandeur', contacts: '+ Nouveau contact' }[r];
  $('#addBtn').style.display = add ? '' : 'none'; if (add) $('#addBtn').textContent = add;
  $('#roleInfo').textContent = 'Profil : ' + ROLE[me.role];
  $('#offBtn').textContent = db.offline ? 'Retour du réseau' : 'Simuler une perte de réseau';
  const bn = $('#banner'); bn.hidden = !db.offline; if (db.offline) bn.textContent = `Hors ligne : ${db.queue || 0} modification${(db.queue || 0) > 1 ? 's' : ''} en attente d'envoi. Elles partiront au retour du réseau.`;
  document.documentElement.classList.toggle('lay-top', db.layout === 'haut');
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (a) { e.preventDefault(); return go(a.getAttribute('href').slice(1)); }
  if (e.target.closest('#moreBtn')) return openMore();
  if (e.target.closest('#layBtn')) { db.layout = db.layout === 'haut' ? 'lateral' : 'haut'; save(); toast(db.layout === 'haut' ? 'Disposition : menu en haut' : 'Disposition : menu latéral'); return render(); }
  if (e.target.id === 'offBtn') return toggleOffline();
  if (e.target.id === 'hideGuide') { db.onboarded = true; save(); return render(); }
  if (e.target.id === 'invite') return inviteForm();
  const act = e.target.closest('[data-act]'); if (act) return teamAct(...act.dataset.act.split('|'));
  if (e.target.id === 'listDemPdf') return pdfPreview('Liste des recherches', db.demandeurs.filter(d => d.active && seeD(d)).map(d => `${d.nom} · ${dTypes(d).join(' + ')} · ${d.activite} · budget ${eur(d.budget)}${d.mandatFin ? ' · mandat jusqu\'au ' + fmtDate(d.mandatFin) : ''}${d.notes[0] ? '\n   Dernière note (' + fmtDate(d.notes[0].date) + ') : ' + d.notes[0].texte : ''}`).join('\n\n'));
  if (e.target.id === 'avisCopy') { const A = db.avis || {}, G = { ess: 'Indispensable', utile: 'Utile', trop: 'En trop' }; const out = Object.keys(G).map(k => `${G[k]} :\n` + (Object.keys(A).filter(n => A[n] === k).map(n => '- ' + n).join('\n') || '- (rien)')).join('\n\n'); return copy(out + `\n\nCe qui manque :\n${db.avisManque || '-'}`, 'Retour copié : collez-le dans un message'); }
  if (e.target.id === 'copyBiens' && canXls()) return copy(['N° mandat\tTitre\tType de vente\tActivité\tVille\tSurface\tPrix\tStatut\tPropriétaire\tFin de mandat', ...db.biens.slice(0, lim()).map(b => [b.mandatNum, b.titre, b.typeVente, b.activite, b.ville, b.surface, b.prix, b.statut, mand(b.mandant).nom, b.mandat.fin].join('\t'))].join('\n'), 'Tableau copié : collez-le dans Excel');
  if (e.target.id === 'copyDem' && canXls()) return copy(['Nom\tTéléphone\tType de vente\tActivité\tSurface min\tSurface max\tBudget\tApport\tDépartement\tActive', ...db.demandeurs.filter(seeD).slice(0, lim()).map(d => [d.nom, d.tel, dTypes(d).join(' + '), d.activite, d.surfMin, d.surfMax, d.budget, d.apport, d.dept, d.active ? 'oui' : 'non'].join('\t'))].join('\n'), 'Tableau copié : collez-le dans Excel');
  if (e.target.id === 'docPdf') { const b = bien(ui.docBien) || db.biens.filter(x => x.statut !== 'Inactif')[0], t = TEMPLATES.find(x => x.id === ui.tpl) || TEMPLATES[0]; return pdfPreview(t.nom, t.corps(b, mand(b.mandant), dem(ui.docDem) || db.demandeurs[0])); }
  if (e.target.id === 'docCopy') { const b = bien(ui.docBien) || db.biens.filter(x => x.statut !== 'Inactif')[0], t = TEMPLATES.find(x => x.id === ui.tpl) || TEMPLATES[0]; return copy(t.corps(b, mand(b.mandant), dem(ui.docDem) || db.demandeurs[0]), 'Texte copié'); }
  const t = e.target.closest('[data-open],[data-dem],[data-owner],[data-f],[data-vue],[data-send],[data-renew],[data-rem],[data-fait],[data-mailbd],[data-maild],[data-mailm],[data-mailsel],[data-dvue],[data-renewd],[data-verif],[data-sel],[data-star],[data-avis]');
  if (!t) return; const d = t.dataset;
  if (d.open) openBien(d.open); else if (d.dem) openDem(d.dem); else if (d.owner) openOwner(d.owner);
  else if (d.vue) { ui.vue = d.vue; render(); }
  else if (d.f) { const [k, v] = d.f.split('|'); ui[k] = ui[k] === v ? '' : v; render(); }
  else if (d.send) { const [b, dm] = d.send.split('|'); send(b, dm); }
  else if (d.renew) renew(d.renew);
  else if (d.rem) { const [dm, b] = d.rem.split('|'); addRappel(`Appeler ${dem(dm).nom} au sujet de ${bien(b).mandatNum}`, addDays(1)); }
  else if (d.fait) { const r = db.rappels.find(x => x.id === d.fait); r.fait = true; save(); toast('Rappel terminé'); render(); }
  else if (d.mailbd) { const [b, dm] = d.mailbd.split('|'); openMail({ nom: dem(dm).nom, email: dem(dm).email, biens: [bien(b)] }); }
  else if (d.maild) { const x = dem(d.maild); openMail({ nom: x.nom, email: x.email, tpl: 'relance', biens: [] }); }
  else if (d.mailm) { const x = mand(d.mailm); openMail({ nom: x.nom, email: x.email, tpl: 'relance', biens: [] }); }
  else if (d.dvue) { ui.dvue = d.dvue; render(); }
  else if (d.renewd) renewD(d.renewd);
  else if (d.verif) { const b = bien(d.verif); b.verif = today(); log(`a confirmé que l'offre ${b.mandatNum} est toujours valable`); save(); toast('Offre confirmée'); render(); if (!$('#drawer').hidden) openBien(b.id); }
  else if (d.sel) { const b = bien(d.sel); b.sel = !b.sel; log(`a ${b.sel ? 'ajouté' : 'retiré'} ${b.mandatNum} ${b.sel ? 'à' : 'de'} la sélection du jour`); save(); render(); openBien(b.id); }
  else if (d.star) { const [i, k] = d.star.split('|'), b = bien(i); b.etoiles = b.etoiles === +k ? 0 : +k; save(); render(); openBien(b.id); }
  else if (d.avis) { const [nm, val] = d.avis.split('|'); db.avis = db.avis || {}; db.avis[nm] = db.avis[nm] === val ? undefined : val; save(); render(); }
  else if (d.mailsel) { const x = dem(d.mailsel); const top = db.biens.map(b => ({ b, m: match(b, x) })).filter(y => y.m.ok).sort((p, q) => q.m.s - p.m.s).slice(0, 3).map(y => y.b); openMail({ nom: x.nom, email: x.email, biens: top }); }
});
document.addEventListener('change', e => {
  const id = e.target.id;
  if (id === 'demSel') { ui.dem = e.target.value; render(); }
  if (id === 'docTpl') { ui.tpl = e.target.value; render(); } if (id === 'docBien') { ui.docBien = e.target.value; render(); } if (id === 'docDem') { ui.docDem = e.target.value; render(); }
  if (e.target.dataset.deal) { const x = db.deals.find(z => z.id === e.target.dataset.deal); x.etape = e.target.value; log(`a passé le dossier ${bien(x.bien).mandatNum} / ${dem(x.dem).nom} à l'étape « ${x.etape} »`); save(); toast('Étape mise à jour'); render(); }
  if (e.target.dataset.droit) { const [uid, k] = e.target.dataset.droit.split('|'), u = user(uid); let val = e.target.value; if (['pdf', 'excel', 'params'].includes(k)) val = val === 'true'; else if (k === 'limite') val = Math.max(0, +val || 0); u.droits[k] = val; log(`a modifié les droits de ${u.nom} (${k})`); save(); toast('Droits mis à jour'); render(); }
  if (id === 'avisManque') { db.avisManque = e.target.value; save(); }
  if (id === 'userSel') { me = db.users.find(u => u.id === e.target.value); toast('Connecté : ' + me.nom); render(); }
});
$('#search').addEventListener('input', e => { ui.q = e.target.value; if (!['biens', 'demandeurs', 'contacts'].includes(route())) go('biens'); else render(); });
$('#addBtn').addEventListener('click', () => { const r = route(); if (r === 'demandeurs') newDem(); else if (r === 'contacts') newContact(); else newBien(); });
$('#resetBtn').addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch (e) {} db = JSON.parse(JSON.stringify(window.DEMO)); me = db.users[0]; $('#userSel').value = me.id; ui = { tv: '', statut: '', dept: '', q: '', vue: isMobile() ? 'cartes' : 'table', dem: '', tpl: 'mandat-simple', docBien: '', docDem: '' }; $('#search').value = ''; toast('Démo réinitialisée'); render(); });
window.addEventListener('hashchange', () => { const h = location.hash.replace('#', ''); if (views[h] && h !== current) go(h); });

$('#userSel').innerHTML = db.users.map(u => `<option value="${u.id}">${esc(u.nom)} (${ROLE[u.role]})</option>`).join('');

// ---------- connexion et invitations (simulation) ----------
db.invites = db.invites || [{ id: 'i1', nom: 'Marc Lafitte', email: 'marc.lafitte@' + db.agence.domaine, role: 'agent', date: addDays(-2) }];
const DOM = () => db.agence.domaine;
let authCtx = {};
const MIN_PW = 10;
function showAuth(step, msg) {
  authCtx.step = step; const a = $('#auth'); a.hidden = false;
  const head = `<div class="brandrow"><img src="icon.svg" alt="" width="28" height="28">Atelier Immo Pro</div>`;
  const err = `<div class="err" id="authErr" role="alert">${esc(msg || '')}</div>`;
  const lk = (id, t) => `<button type="button" id="${id}">${t}</button>`;
  let h;
  if (step === 'login') h = `${head}<h2>Connexion</h2><div class="small muted">Entrez l'adresse e-mail et le mot de passe de votre compte.</div>
    <label for="aMail">Adresse e-mail</label><input id="aMail" type="email" autocomplete="username" placeholder="prenom.nom@${esc(DOM())}" value="${esc(authCtx.mail || '')}">
    <label for="aPw">Mot de passe</label><input id="aPw" type="password" autocomplete="current-password">${err}
    <button class="btn primary" id="aGo">Se connecter</button>
    <div class="links">${lk('aForgot', 'Mot de passe oublié')}${lk('aOtp', 'Me connecter avec un code reçu par e-mail')}${lk('aInv', 'J\'ai reçu une invitation')}</div>
    <div class="demo"><b>Démonstration.</b> Utilisez par exemple <b>claire.aubry@${esc(DOM())}</b> (Direction) ou <b>hugo.lasserre@${esc(DOM())}</b>, avec n'importe quel mot de passe. La Direction doit en plus saisir le code de son application d'authentification (6 chiffres au choix). Pas encore de compte ? L'agence est créée par nos soins à l'achat, puis la Direction invite son équipe.</div>`;
  else if (step === 'code') h = `${head}<h2>${authCtx.kind === 'mail' ? 'Code reçu par e-mail' : 'Double vérification'}</h2><div class="small muted">${authCtx.kind === 'mail' ? 'Nous venons d\'envoyer un code à 6 chiffres à ' + esc(authCtx.u.email) + '@' + esc(DOM()) + '. Il est valable 10 minutes.' : 'Ouvrez votre application d\'authentification et saisissez le code à 6 chiffres.'}</div>
    <label for="aCode">Code à 6 chiffres</label><input id="aCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code">${err}
    <button class="btn primary" id="aCodeGo">Valider</button><div class="links">${lk('aBack', 'Retour')}</div>`;
  else if (step === 'otp') h = `${head}<h2>Connexion par code</h2><div class="small muted">Saisissez votre adresse e-mail : nous vous envoyons un code à usage unique.</div>
    <label for="aMail">Adresse e-mail</label><input id="aMail" type="email" placeholder="prenom.nom@${esc(DOM())}">${err}
    <button class="btn primary" id="aOtpGo">Recevoir le code</button><div class="links">${lk('aBack', 'Retour')}</div>`;
  else if (step === 'forgot') h = `${head}<h2>Mot de passe oublié</h2><div class="small muted">Saisissez votre adresse e-mail. Si elle correspond à un compte, vous recevez un lien pour choisir un nouveau mot de passe.</div>
    <label for="aMail">Adresse e-mail</label><input id="aMail" type="email">${err}
    <button class="btn primary" id="aForgotGo">Envoyer le lien</button><div class="links">${lk('aBack', 'Retour')}</div>`;
  else if (step === 'forgotok') h = `${head}<h2>Vérifiez votre boîte mail</h2><div class="small muted">Si cette adresse correspond à un compte, un e-mail vient d'être envoyé. Le lien est valable 1 heure.</div><div class="links">${lk('aBack', 'Retour à la connexion')}</div>`;
  else if (step === 'invite') { const i = authCtx.inv; h = `${head}<h2>Bienvenue, ${esc(i.nom)}</h2><div class="small muted">Vous êtes invité(e) à rejoindre <b>${esc(db.agence.nom || 'votre agence')}</b> avec le profil <b>${ROLE[i.role]}</b>. Choisissez votre mot de passe (${MIN_PW} caractères minimum).</div>
    <label>Adresse e-mail</label><input value="${esc(i.email)}" disabled>
    <label for="aPw">Mot de passe</label><input id="aPw" type="password" autocomplete="new-password">
    <label for="aPw2">Confirmer le mot de passe</label><input id="aPw2" type="password" autocomplete="new-password">${err}
    <button class="btn primary" id="aInvGo">Créer mon accès</button><div class="links">${lk('aBack', 'Retour')}</div>`; }
  else if (step === 'mail') { const i = authCtx.inv; h = `<h2>E-mail reçu par ${esc(i.nom)} (démo)</h2><div class="demo" style="margin-top:8px"><b>De :</b> Atelier Immo Pro<br><b>Objet :</b> ${esc(db.agence.nom || 'Votre agence')} vous invite à rejoindre le logiciel<br><br>Bonjour ${esc(i.nom)}, la Direction vous a ouvert un accès avec le profil ${ROLE[i.role]}. Ce lien est valable 7 jours.<br><br><button class="btn primary" id="aOpenInv">Accepter l'invitation</button></div><div class="links">${lk('aClose', 'Fermer')}</div>`; }
  a.innerHTML = `<div class="box">${h}</div>`;
  const f = a.querySelector('input:not([disabled])'); if (f) try { f.focus(); } catch (e) {}
}
function authErr(m) { const e = $('#authErr'); if (e) e.textContent = m; }
function enter(u) { me = u; $('#userSel').value = u.id; $('#auth').hidden = true; authCtx = {}; log('s\'est connecté(e)'); save(); toast('Bienvenue ' + u.nom); render(); }
function findUser(mail) { const m = String(mail || '').trim().toLowerCase(); return db.users.find(u => (u.email + '@' + DOM()).toLowerCase() === m); }
function inviteForm() {
  drawer(`<h2>Inviter un collaborateur</h2><div class="small muted">La personne reçoit un e-mail avec un lien personnel valable 7 jours.</div>
    <label class="small" for="ivNom" style="display:block;margin-top:12px">Nom et prénom</label><input id="ivNom" style="width:100%;padding:9px">
    <label class="small" for="ivMail" style="display:block;margin-top:12px">Adresse e-mail</label><input id="ivMail" type="email" placeholder="prenom.nom@${esc(DOM())}" style="width:100%;padding:9px">
    <label class="small" for="ivRole" style="display:block;margin-top:12px">Profil</label><select id="ivRole" style="width:100%;padding:9px">${Object.entries(ROLE).map(([k, v]) => `<option value="${k}" ${k === 'agent' ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <div class="small muted" id="ivErr" style="color:var(--bad);margin-top:8px"></div>
    <div class="actions"><button class="btn primary" id="ivGo">Envoyer l'invitation</button><button class="btn ghost" data-close>Annuler</button></div>`);
  $('#ivGo').onclick = () => {
    const nom = $('#ivNom').value.trim(), mail = $('#ivMail').value.trim().toLowerCase(), role = $('#ivRole').value;
    if (!nom || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return $('#ivErr').textContent = 'Indiquez un nom et une adresse e-mail valide.';
    if (findUser(mail) || db.invites.some(i => i.email === mail)) return $('#ivErr').textContent = 'Cette adresse a déjà un accès ou une invitation en attente.';
    db.invites.push({ id: 'i' + Date.now(), nom, email: mail, role, date: today() }); log(`a invité ${nom} (${ROLE[role]})`); save(); closeDr(); toast('Invitation envoyée à ' + mail); render();
  };
}
function teamAct(a, id) {
  if (a === 'toggle') { const u = user(id); const dirs = db.users.filter(x => x.role === 'direction' && x.actif !== false);
    if (u.actif !== false && u.role === 'direction' && dirs.length < 2) return toast('Il faut toujours au moins une personne de la Direction active');
    u.actif = u.actif === false; log(`a ${u.actif === false ? 'désactivé' : 'réactivé'} l'accès de ${u.nom}`); save(); toast(u.actif === false ? 'Accès désactivé' : 'Accès réactivé'); return render(); }
  const i = db.invites.find(x => x.id === id); if (!i) return;
  if (a === 'cancel') { db.invites = db.invites.filter(x => x !== i); log(`a annulé l'invitation de ${i.nom}`); save(); toast('Invitation annulée'); render(); }
  else if (a === 'resend') { i.date = today(); log(`a renvoyé l'invitation de ${i.nom}`); save(); toast('Invitation renvoyée'); render(); }
  else if (a === 'viewmail') { authCtx = { inv: i, fromTeam: true }; showAuth('mail'); }
}
document.addEventListener('click', e => {
  const id = e.target.id; if (!id || !e.target.closest('#auth')) return;
  if (id === 'aGo') { const u = findUser($('#aMail').value); authCtx.mail = $('#aMail').value;
    if (!u || u.actif === false || !$('#aPw').value) return authErr('Adresse e-mail ou mot de passe incorrect.');
    if (u.role === 'direction') { authCtx = { u, kind: 'totp' }; return showAuth('code'); } return enter(u); }
  if (id === 'aForgot') return showAuth('forgot'); if (id === 'aOtp') return showAuth('otp');
  if (id === 'aForgotGo') return showAuth('forgotok');
  if (id === 'aOtpGo') { const u = findUser($('#aMail').value); if (!u || u.actif === false) return authErr('Aucun accès actif pour cette adresse.'); authCtx = { u, kind: 'mail' }; return showAuth('code'); }
  if (id === 'aCodeGo') { if (!/^\d{6}$/.test($('#aCode').value.trim())) return authErr('Le code comporte 6 chiffres.'); return enter(authCtx.u); }
  if (id === 'aInv') { authCtx = { inv: db.invites[0] }; return authCtx.inv ? showAuth('mail') : authErr('Aucune invitation en attente dans cette démo.'); }
  if (id === 'aOpenInv') return showAuth('invite');
  if (id === 'aInvGo') { const p = $('#aPw').value; if (p.length < MIN_PW) return authErr(`Le mot de passe doit comporter au moins ${MIN_PW} caractères.`); if (p !== $('#aPw2').value) return authErr('Les deux mots de passe ne sont pas identiques.');
    const i = authCtx.inv, ini = i.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), nu = { id: 'u' + Date.now(), nom: i.nom, role: i.role, initiales: ini, email: i.email.split('@')[0] };
    const tpl = db.users.find(x => x.role === i.role); nu.droits = Object.assign({}, tpl ? tpl.droits : {}); db.users.push(nu); db.invites = db.invites.filter(x => x !== i);
    $('#userSel').innerHTML = db.users.map(u => `<option value="${u.id}">${esc(u.nom)} (${ROLE[u.role]})</option>`).join(''); me = nu; log('a accepté l\'invitation et créé son accès'); return enter(nu); }
  if (id === 'aClose') { $('#auth').hidden = true; return; }
  if (id === 'aBack') { authCtx = {}; return showAuth('login'); }
});
$('#logoutBtn').addEventListener('click', () => { authCtx = {}; showAuth('login'); });
showAuth('login');
render();
// Bouton « Installer l'application » : Chrome/Edge/Android proposent l'installation, iPhone/iPad/Safari demandent un geste manuel.
let installEvt = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function showInstall() { const b = $('#installBtn'); if (b) b.hidden = isStandalone() || !(installEvt || isIOS()); }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; showInstall(); });
window.addEventListener('appinstalled', () => { installEvt = null; showInstall(); toast('Application installée'); });
$('#installBtn').addEventListener('click', async () => {
  if (installEvt) { installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; return showInstall(); }
  toast('Sur iPhone/iPad : bouton Partager de Safari, puis « Sur l\'écran d\'accueil ».');
});
showInstall();
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.__NO_SW) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
