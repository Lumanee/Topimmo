// Données 100 % fictives pour la démonstration (agence imaginaire, sud-ouest).
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const P1 = 'SeLoger Bureaux Commerce', P2 = 'Place du Commerce', P3 = 'Coppten (ex CessionPlus)', P4 = "Site de l'agence";
const P5 = 'ParuVendu', P6 = 'CessionPME', P7 = 'BureauxLocaux', P8 = 'Almo', P9 = 'LocauxRama', P10 = 'LeBonCoin';

window.DEMO = {
  agence: { nom: 'Agence Exemple', domaine: 'agence-exemple.fr' },
  users: [
    { id: 'u1', nom: 'Claire Aubry', role: 'direction', initiales: 'CA', email: 'claire.aubry' },
    { id: 'u2', nom: 'Hugo Lasserre', role: 'negociateur', initiales: 'HL', email: 'hugo.lasserre' },
    { id: 'u3', nom: 'Sofia Marty', role: 'agent', initiales: 'SM', email: 'sofia.marty' },
    { id: 'u4', nom: 'Théo Dufau', role: 'agent', initiales: 'TD', email: 'theo.dufau' }
  ],
  mandants: [
    { id: 'm1', nom: 'SARL Les Quais', contact: 'Marc Peyrot', tel: '05 00 00 00 01', email: 'm.peyrot@exemple.fr', siret: '000 000 001 00011', acte: true },
    { id: 'm2', nom: 'Hélène Carrère', contact: 'Hélène Carrère', tel: '05 00 00 00 02', email: 'h.carrere@exemple.fr', siret: '', acte: true },
    { id: 'm3', nom: 'SCI Bordeaux Rive Droite', contact: 'Paul Sabathier', tel: '05 00 00 00 03', email: 'p.sabathier@exemple.fr', siret: '000 000 003 00013', acte: false },
    { id: 'm4', nom: 'Jean-Marc Lalanne', contact: 'Jean-Marc Lalanne', tel: '05 00 00 00 04', email: 'jm.lalanne@exemple.fr', siret: '', acte: true },
    { id: 'm5', nom: 'SAS Océane Restauration', contact: 'Nadia Bernès', tel: '05 00 00 00 05', email: 'n.bernes@exemple.fr', siret: '000 000 005 00015', acte: true },
    { id: 'm6', nom: 'Indivision Dupouy', contact: 'Alain Dupouy', tel: '05 00 00 00 06', email: 'a.dupouy@exemple.fr', siret: '', acte: false }
  ],
  biens: [
    { id: 'b1', mandatNum: 'M-2026-0101', typeVente: 'Fonds de commerce', activite: 'Restaurant', titre: 'Restaurant 60 couverts avec terrasse', ville: 'Biarritz', cp: '64200', dept: '64', quartier: 'Port-Vieux', adressePublique: 'Centre de Biarritz, proche du port', adresseSecrete: '12 rue des Tonneliers', surface: 140, prix: 285000, loyerBail: 36000, ca: 520000, licence: 'Licence IV', extraction: true, statut: 'Disponible', mandat: { type: 'Exclusif', fin: day(6) }, bail: { triennale: day(200), fin: day(900) }, origine: 'Annonce', mandant: 'm5', agent: 'u2', hue: 20, photos: 12, diag: true, descriptif: 'Restaurant sur deux niveaux, cuisine équipée, terrasse de 25 places.', docs: ['Diagnostics.pdf', 'Plan des locaux.pdf', 'Conditions de vente.pdf', 'Bilans 3 ans.pdf'], portails: [P1, P2, P4], notes: [{ qui: 'u2', date: day(-5), texte: 'Visite avec les Etcheverry, très intéressés par la terrasse.' }] },
    { id: 'b2', mandatNum: 'M-2026-0102', typeVente: 'Cession de droit au bail', activite: 'Prêt-à-porter', titre: "Boutique d'angle, rue piétonne", ville: 'Bordeaux', cp: '33000', dept: '33', quartier: 'Saint-Pierre', adressePublique: 'Hypercentre de Bordeaux', adresseSecrete: '8 rue du Parlement', surface: 85, prix: 120000, loyerBail: 28800, ca: 0, licence: 'Aucune', extraction: false, statut: 'Disponible', mandat: { type: 'Simple', fin: day(40) }, bail: { triennale: day(150), fin: day(600) }, origine: 'Internet', mandant: 'm3', agent: 'u3', hue: 330, photos: 8, diag: true, descriptif: '', docs: ['Bail commercial.pdf', 'Diagnostics.pdf'], portails: [P4], notes: [] },
    { id: 'b3', mandatNum: 'M-2026-0103', typeVente: 'Murs commerciaux', activite: 'Pharmacie', titre: 'Murs loués à une pharmacie', ville: 'Mérignac', cp: '33700', dept: '33', quartier: 'Centre', adressePublique: 'Mérignac centre, avenue principale', adresseSecrete: '40 avenue de la Libération', surface: 210, prix: 640000, loyerBail: 48000, ca: 0, licence: 'Aucune', extraction: false, statut: 'Disponible', mandat: { type: 'Exclusif', fin: day(85) }, bail: { triennale: day(500), fin: day(1100) }, origine: 'Relation', mandant: 'm1', agent: 'u2', hue: 150, photos: 6, diag: true, descriptif: 'Murs commerciaux loués, rendement brut de 7,5 %.', docs: ['Bail.pdf', 'Diagnostics.pdf'], portails: [P1, P2, P3, P4], notes: [] },
    { id: 'b4', mandatNum: 'M-2026-0104', typeVente: 'Location', activite: 'Prêt-à-porter', titre: 'Local commercial en rue passante', ville: 'Pau', cp: '64000', dept: '64', quartier: 'Centre', adressePublique: 'Centre-ville de Pau', adresseSecrete: '5 rue Serviez', surface: 95, prix: 24000, loyerBail: 0, ca: 0, licence: 'Aucune', extraction: false, statut: 'Disponible', mandat: { type: 'Simple', fin: day(20) }, bail: { triennale: day(300), fin: day(1000) }, origine: 'Internet', mandant: 'm2', agent: 'u4', hue: 200, photos: 5, diag: false, descriptif: 'Local avec vitrine de 7 mètres.', docs: ['Plan des locaux.pdf'], portails: [P4, P7], notes: [] },
    { id: 'b5', mandatNum: 'M-2026-0105', typeVente: 'Fonds de commerce', activite: 'Bar', titre: 'Bar licence IV, clientèle fidèle', ville: 'Bayonne', cp: '64100', dept: '64', quartier: 'Petit Bayonne', adressePublique: 'Petit Bayonne, rue animée', adresseSecrete: '3 rue Pannecau', surface: 70, prix: 175000, loyerBail: 18000, ca: 310000, licence: 'Licence IV', extraction: false, statut: 'Sous option', option: { dem: 'd1', date: day(-2) }, mandat: { type: 'Exclusif', fin: day(60) }, bail: { triennale: day(300), fin: day(800) }, origine: 'Annonce', mandant: 'm5', agent: 'u3', hue: 280, photos: 14, diag: true, descriptif: 'Bar historique, ouvert 7 jours sur 7.', docs: ['Diagnostics.pdf', 'Bilans 3 ans.pdf', 'Licence IV.pdf'], portails: [P1, P2, P4, P6], notes: [] },
    { id: 'b6', mandatNum: 'M-2026-0106', typeVente: 'Fonds de commerce', activite: 'Boulangerie', titre: 'Boulangerie avec laboratoire', ville: 'Dax', cp: '40100', dept: '40', quartier: 'Centre', adressePublique: 'Dax, quartier commerçant', adresseSecrete: '17 rue Cazade', surface: 110, prix: 230000, loyerBail: 21600, ca: 480000, licence: 'Aucune', extraction: true, statut: 'Disponible', mandat: { type: 'Exclusif', fin: day(120) }, bail: { triennale: day(100), fin: day(700) }, origine: 'Relation', mandant: 'm4', agent: 'u2', hue: 40, photos: 10, diag: true, descriptif: 'Laboratoire équipé, four à sole, logement non inclus.', docs: ['Diagnostics.pdf', 'Bilans 3 ans.pdf'], portails: [P1, P2, P4, P6], notes: [] },
    { id: 'b7', mandatNum: 'M-2026-0107', typeVente: 'Cession de droit au bail', activite: 'Coiffure', titre: 'Salon de coiffure 4 postes', ville: 'Mont-de-Marsan', cp: '40000', dept: '40', quartier: 'Centre', adressePublique: 'Centre de Mont-de-Marsan', adresseSecrete: '22 rue Léon Gambetta', surface: 60, prix: 45000, loyerBail: 12000, ca: 0, licence: 'Aucune', extraction: false, statut: 'Disponible', mandat: { type: 'Simple', fin: day(5) }, bail: { triennale: day(90), fin: day(400) }, origine: 'Internet', mandant: 'm6', agent: 'u4', hue: 310, photos: 4, diag: true, descriptif: '', docs: ['Bail commercial.pdf'], portails: [P4], notes: [] },
    { id: 'b8', mandatNum: 'M-2026-0108', typeVente: 'Murs commerciaux', activite: 'Bureaux / services', titre: 'Local professionnel libre', ville: 'Capbreton', cp: '40130', dept: '40', quartier: 'Port', adressePublique: 'Capbreton, près du port', adresseSecrete: '9 avenue Georges Pompidou', surface: 130, prix: 395000, loyerBail: 0, ca: 0, licence: 'Aucune', extraction: false, statut: 'Disponible', mandat: { type: 'Simple', fin: day(150) }, bail: { triennale: day(400), fin: day(1200) }, origine: 'Relation', mandant: 'm3', agent: 'u3', hue: 190, photos: 7, diag: true, descriptif: 'Local libre de toute occupation, deux entrées.', docs: ['Diagnostics.pdf', 'Plan des locaux.pdf'], portails: [P1, P4], notes: [] },
    { id: 'b9', mandatNum: 'M-2026-0109', typeVente: 'Fonds de commerce', activite: 'Restaurant', titre: 'Brasserie vue bassin', ville: 'Arcachon', cp: '33120', dept: '33', quartier: 'Front de mer', adressePublique: 'Arcachon, face au bassin', adresseSecrete: '2 boulevard de la Plage', surface: 180, prix: 350000, loyerBail: 42000, ca: 690000, licence: 'Licence restaurant', extraction: true, statut: 'Disponible', mandat: { type: 'Exclusif', fin: day(30) }, bail: { triennale: day(220), fin: day(700) }, origine: 'Annonce', mandant: 'm1', agent: 'u2', hue: 10, photos: 15, diag: true, descriptif: 'Brasserie de 90 couverts, terrasse plein sud.', docs: ['Diagnostics.pdf', 'Bilans 3 ans.pdf', 'Plan des locaux.pdf'], portails: [P1, P2, P3, P4], notes: [] },
    { id: 'b10', mandatNum: 'M-2026-0110', typeVente: 'Location', activite: 'Prêt-à-porter', titre: 'Boutique en centre commercial', ville: 'Mérignac', cp: '33700', dept: '33', quartier: 'Zone commerciale', adressePublique: 'Centre commercial de Mérignac', adresseSecrete: 'Cellule 24, centre commercial', surface: 140, prix: 38000, loyerBail: 0, ca: 0, licence: 'Aucune', extraction: false, statut: 'Sous option', option: { dem: 'd7', date: day(-4) }, mandat: { type: 'Simple', fin: day(75) }, bail: { triennale: day(400), fin: day(1000) }, origine: 'Internet', mandant: 'm2', agent: 'u4', hue: 340, photos: 6, diag: true, descriptif: "Cellule d'angle, forte visibilité.", docs: ['Plan des locaux.pdf'], portails: [P4, P7], notes: [] },
    { id: 'b11', mandatNum: 'M-2026-0111', typeVente: 'Fonds de commerce', activite: 'Restaurant', titre: 'Salon de thé et restauration légère', ville: 'Bordeaux', cp: '33800', dept: '33', quartier: 'Bastide', adressePublique: 'Bordeaux rive droite', adresseSecrete: '14 rue Lucien Faure', surface: 55, prix: 98000, loyerBail: 14400, ca: 190000, licence: 'Licence restaurant', extraction: false, statut: 'Disponible', mandat: { type: 'Simple', fin: day(45) }, bail: { triennale: day(60), fin: day(500) }, origine: 'Annonce', mandant: 'm6', agent: 'u3', hue: 90, photos: 9, diag: true, descriptif: 'Salon de thé convivial, clientèle de quartier.', docs: ['Diagnostics.pdf', 'Bilans 3 ans.pdf'], portails: [P2, P4], notes: [] },
    { id: 'b12', mandatNum: 'M-2026-0112', typeVente: "Cession d'entreprise", activite: 'Autre', titre: 'Pressing avec 3 salariés', ville: 'Pau', cp: '64000', dept: '64', quartier: 'Centre', adressePublique: 'Pau, quartier résidentiel', adresseSecrete: '31 rue Latapie', surface: 90, prix: 160000, loyerBail: 15600, ca: 260000, licence: 'Aucune', extraction: false, statut: 'Disponible', mandat: { type: 'Exclusif', fin: day(100) }, bail: { triennale: day(250), fin: day(900) }, origine: 'Annonce', mandant: 'm4', agent: 'u2', hue: 230, photos: 5, diag: true, descriptif: 'Pressing historique, matériel récent.', docs: ['Bilans 3 ans.pdf'], portails: [P4, P6], notes: [] },
    { id: 'b13', mandatNum: 'M-2025-0098', typeVente: 'Fonds de commerce', activite: 'Restaurant', titre: 'Pizzeria (vendue)', ville: 'Bayonne', cp: '64100', dept: '64', quartier: 'Centre', adressePublique: 'Bayonne centre', adresseSecrete: '6 rue Orbe', surface: 80, prix: 140000, loyerBail: 16800, ca: 280000, licence: 'Licence restaurant', extraction: true, statut: 'Inactif', mandat: { type: 'Exclusif', fin: day(-30) }, bail: { triennale: day(-100), fin: day(300) }, origine: 'Annonce', mandant: 'm5', agent: 'u3', hue: 0, photos: 8, diag: true, descriptif: 'Vendue.', docs: [], portails: [], notes: [] }
  ],
  demandeurs: [
    { id: 'd1', nom: 'M. et Mme Etcheverry', tel: '06 00 00 00 11', email: 'etcheverry@exemple.fr', typeVente: 'Fonds de commerce', activite: 'Bar/Restaurant', licence: 'Licence IV', extraction: false, surfMin: 50, surfMax: 120, budget: 200000, apport: 60000, dept: '64', quartiersVoulus: ['Petit Bayonne', 'Port-Vieux'], quartiersEviter: [], origine: 'Internet', active: true, agent: 'u3', dernier: day(-3), notes: [{ qui: 'u3', date: day(-3), texte: 'Cherchent un lieu avec ambiance, budget ferme.' }] },
    { id: 'd2', nom: 'SAS Gourmandises du Sud', tel: '06 00 00 00 12', email: 'contact@gourmandises.exemple.fr', typeVente: 'Fonds de commerce', activite: 'Boulangerie', licence: 'Aucune', extraction: true, surfMin: 80, surfMax: 150, budget: 260000, apport: 80000, dept: '40', quartiersVoulus: ['Centre'], quartiersEviter: [], origine: 'Relation', active: true, agent: 'u2', dernier: day(-1), notes: [] },
    { id: 'd3', nom: 'Camille Lefèvre', tel: '06 00 00 00 13', email: 'c.lefevre@exemple.fr', typeVente: 'Cession de droit au bail', activite: 'Prêt-à-porter', licence: 'Aucune', extraction: false, surfMin: 60, surfMax: 100, budget: 130000, apport: 40000, dept: '33', quartiersVoulus: ['Saint-Pierre', 'Chartrons'], quartiersEviter: ['Bastide'], origine: 'Internet', active: true, agent: 'u3', dernier: day(-9), notes: [] },
    { id: 'd4', nom: 'Groupe Investir Sud', tel: '06 00 00 00 14', email: 'invest@exemple.fr', typeVente: 'Murs commerciaux', activite: 'Toutes', licence: 'Aucune', extraction: false, surfMin: 100, surfMax: 250, budget: 700000, apport: 250000, dept: '33', quartiersVoulus: [], quartiersEviter: [], origine: 'Relation', active: true, agent: 'u2', dernier: day(-2), notes: [] },
    { id: 'd5', nom: 'Léa Marty, coiffeuse', tel: '06 00 00 00 15', email: 'lea.marty@exemple.fr', typeVente: 'Cession de droit au bail', activite: 'Coiffure', licence: 'Aucune', extraction: false, surfMin: 40, surfMax: 80, budget: 55000, apport: 15000, dept: '40', quartiersVoulus: ['Centre'], quartiersEviter: [], origine: 'Annonce', active: true, agent: 'u4', dernier: day(-1), notes: [] },
    { id: 'd6', nom: 'Restaurant Le Fanal', tel: '06 00 00 00 16', email: 'lefanal@exemple.fr', typeVente: 'Fonds de commerce', activite: 'Restaurant', licence: 'Licence restaurant', extraction: true, surfMin: 120, surfMax: 200, budget: 400000, apport: 120000, dept: '33', quartiersVoulus: ['Front de mer'], quartiersEviter: [], origine: 'Annonce', active: true, agent: 'u2', dernier: day(-6), notes: [] },
    { id: 'd7', nom: 'Boutique Atlantique', tel: '06 00 00 00 17', email: 'atlantique@exemple.fr', typeVente: 'Location', activite: 'Prêt-à-porter', licence: 'Aucune', extraction: false, surfMin: 80, surfMax: 150, budget: 40000, apport: 0, dept: '33', quartiersVoulus: [], quartiersEviter: [], origine: 'Internet', active: true, agent: 'u4', dernier: day(-4), notes: [] },
    { id: 'd8', nom: 'SARL Nova Santé', tel: '06 00 00 00 18', email: 'nova.sante@exemple.fr', typeVente: 'Murs commerciaux', activite: 'Toutes', licence: 'Aucune', extraction: false, surfMin: 150, surfMax: 250, budget: 700000, apport: 200000, dept: '33', quartiersVoulus: [], quartiersEviter: [], origine: 'Relation', active: true, agent: 'u2', dernier: day(-7), notes: [] },
    { id: 'd9', nom: 'M. Garbay', tel: '06 00 00 00 19', email: 'garbay@exemple.fr', typeVente: 'Fonds de commerce', activite: 'Bar/Restaurant', licence: 'Licence IV', extraction: false, surfMin: 50, surfMax: 100, budget: 150000, apport: 40000, dept: '64', quartiersVoulus: [], quartiersEviter: [], origine: 'Internet', active: false, agent: 'u3', dernier: day(-60), notes: [{ qui: 'u3', date: day(-60), texte: 'A trouvé un local ailleurs. Recherche arrêtée.' }] }
  ],
  deals: [
    { id: 't1', bien: 'b5', dem: 'd1', etape: 'Offre', honoraires: 14000, agent: 'u3' },
    { id: 't2', bien: 'b1', dem: 'd1', etape: 'Visite', honoraires: 21000, agent: 'u2' },
    { id: 't3', bien: 'b10', dem: 'd7', etape: 'Compromis', honoraires: 7600, agent: 'u4' },
    { id: 't4', bien: 'b3', dem: 'd8', etape: 'Contact', honoraires: 38000, agent: 'u2' },
    { id: 't5', bien: 'b9', dem: 'd6', etape: 'Visite', honoraires: 24500, agent: 'u2' },
    { id: 't6', bien: 'b13', dem: 'd9', etape: 'Signé', honoraires: 11200, agent: 'u3' },
    { id: 't7', bien: 'b7', dem: 'd5', etape: 'Contact', honoraires: 4500, agent: 'u4' }
  ],
  rappels: [
    { id: 'r1', texte: 'Rappeler SAS Gourmandises du Sud au sujet de la boulangerie de Dax', date: day(0), fait: false }
  ],
  activites: [
    { qui: 'u3', texte: 'a posé une option sur M-2026-0105 pour M. et Mme Etcheverry', quand: 'il y a 2 jours' },
    { qui: 'u2', texte: 'a fait visiter M-2026-0101', quand: 'il y a 5 jours' },
    { qui: 'u4', texte: 'a ajouté 6 photos à M-2026-0104', quand: 'hier' }
  ],
  journal: [
    { t: day(-1) + ' 17:42', qui: 'u4', action: 'Photos ajoutées sur M-2026-0104' },
    { t: day(-2) + ' 10:15', qui: 'u3', action: 'Option posée sur M-2026-0105 (M. et Mme Etcheverry)' },
    { t: day(-3) + ' 14:08', qui: 'u1', action: 'Utilisateur Théo Dufau créé (agent commercial)' },
    { t: day(-5) + ' 09:30', qui: 'u2', action: 'Prix modifié sur M-2026-0101 : 295 000 € vers 285 000 €' }
  ]
};

// ---- Version 2 : compléments de données fictives ----
(function () {
  const D = window.DEMO;
  const full = { voir: 'tout', suppr: 'tout', modif: 'tout', desact: 'tout', pdf: true, excel: true, stats: 'toutes', params: true, limite: 0 };
  const nego = { voir: 'tout', suppr: 'siens', modif: 'tout', desact: 'tout', pdf: true, excel: true, stats: 'toutes', params: false, limite: 100 };
  const agent = { voir: 'siens', suppr: 'non', modif: 'siens', desact: 'siens', pdf: true, excel: false, stats: 'siennes', params: false, limite: 0 };
  D.users.forEach(u => { u.droits = Object.assign({}, u.role === 'direction' ? full : u.role === 'negociateur' ? nego : agent); });
  const EMP = ['Très bon', 'Bon', 'Bon', 'Moyen', 'Très bon'];
  D.biens.forEach((b, i) => {
    b.emplacement = EMP[i % 5];
    b.terrasse = ['Restaurant', 'Bar'].includes(b.activite) ? 'Possible' : 'Non';
    b.logement = 'Non';
    b.invest = b.typeVente === 'Murs commerciaux';
    b.dispo = 'Immédiate';
    b.droitAuBail = b.typeVente === 'Cession de droit au bail' ? b.prix : 0;
    b.droitEntree = 0;
    b.charges = Math.round(b.surface * 18);
    b.tf = Math.round(b.surface * 12);
    if (b.typeVente === 'Location') { b.honPreneur = Math.round(b.prix * 0.1); b.honBailleur = Math.round(b.prix * 0.1); }
    else { b.honPreneur = Math.round(b.prix * 0.06); b.honBailleur = 0; }
    b.accroche = b.titre + ' à ' + b.ville + '.';
    b.conf = '';
    b.motsCles = [b.activite.toLowerCase(), b.quartier.toLowerCase()];
    b.etoiles = (i % 5) + 1;
    b.sel = false;
    b.verif = day(-10);
    b.envoi = b.portails.slice(0, Math.max(0, b.portails.length - 1));
    b.avert = {};
  });
  const B = id => D.biens.find(b => b.id === id);
  ['b1', 'b9', 'b3'].forEach(id => { B(id).sel = true; });
  B('b1').terrasse = 'Oui'; B('b9').terrasse = 'Oui'; B('b5').terrasse = 'Non';
  B('b2').logement = 'Oui'; B('b2').dispo = 'Sous 3 mois';
  B('b1').conf = 'Vendeur pressé de conclure, marge de négociation possible sur le prix.';
  B('b1').motsCles = ['restaurant', 'terrasse', 'port', 'biarritz'];
  B('b4').verif = day(-45); B('b11').verif = day(-38);
  B('b1').portails.push(P9); B('b3').portails.push(P9); B('b9').portails.push(P10);
  B('b1').envoi = B('b1').portails.filter(x => x !== P9);
  B('b9').envoi = B('b9').portails.filter(x => x !== P10);
  B('b1').avert[P2] = "Activité non reconnue par le site : choisir « Restauration traditionnelle »";
  B('b3').avert[P3] = 'Photo principale trop petite : minimum 800 pixels de large';
  const Dm = id => D.demandeurs.find(d => d.id === id);
  Dm('d4').types = ['Murs commerciaux', 'Location'];
  Dm('d1').mandatFin = day(5); Dm('d6').mandatFin = day(40); Dm('d3').mandatFin = day(3);
  Dm('d2').notes = [{ qui: 'u2', date: day(-4), texte: 'Souhaite visiter la boulangerie de Dax la semaine prochaine.' }];
  Dm('d6').notes = [{ qui: 'u2', date: day(-8), texte: 'Veut voir un restaurant avec terrasse, décision rapide.' }];
  Dm('d4').notes = [{ qui: 'u2', date: day(-12), texte: 'Cherche aussi des locaux à louer pour ses sociétés.' }];
})();
