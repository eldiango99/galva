# Steel Galvanizing Control Pro

Application web (PWA) de gestion des expéditions et retours de galvanisation des pièces de pylônes électriques.

## Fichiers
- `index.html` — application (structure + styles)
- `i18n.js` — textes FR / AR
- `db.js` — stockage local (IndexedDB, fonctionne hors-ligne)
- `app.js` — logique de l'application
- `manifest.json`, `sw.js` — configuration PWA (installation sur téléphone, mode hors-ligne)

## Comment l'ouvrir
Le scan par caméra (OCR) et le mode PWA installable ont besoin d'un serveur (http/https) — pas d'un simple double-clic sur le fichier. Deux options simples :

**Sur ordinateur (test rapide) :**
1. Ouvrez un terminal dans le dossier de l'application.
2. Lancez : `python3 -m http.server 8000`
3. Ouvrez `http://localhost:8000` dans le navigateur.

**Sur téléphone (usage réel) :**
Déposez le dossier sur un hébergement simple (GitHub Pages, Netlify, ou un petit serveur sur le réseau de l'usine), puis ouvrez l'adresse sur le téléphone. Le navigateur proposera alors "Ajouter à l'écran d'accueil" pour l'installer comme une vraie application.

## Fonctionnalités incluses
- Tableau de bord (statistiques, graphiques mensuels)
- Création d'expédition avec saisie des Repérés (manuelle ou par photo/OCR), jauge de charge à 26 000 kg
- Retour de galvanisation avec comparaison automatique (Conforme / Manquant / Excédent / Repéré inconnu) et scan caméra pour incrémenter les quantités reçues
- Historique des expéditions, recherche par repéré/date/expédition/bon
- Historique des erreurs avec notes et photos
- Statistiques (repérés les plus problématiques, tendance de conformité)
- Export PDF et Excel par expédition
- Mode sombre, bilingue Français / Arabe (RTL)

## Notes techniques
- Toutes les données restent **sur l'appareil** (IndexedDB) — rien n'est envoyé sur un serveur.
- La reconnaissance OCR utilise Tesseract.js (chargé depuis Internet) — une connexion est donc nécessaire lors du scan, mais pas pour le reste de l'application une fois chargée.
- Pour réinitialiser les données : effacer les données de site du navigateur pour cette page.
