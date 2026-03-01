# ARK — Guide de Style des Composants (UI Kit)

_Version 0.1 — Février 2026_

## 1. Mise en page (Layout)

L'application utilise une structure à deux zones de contraste pour séparer la navigation de la zone de travail.

* **Sidebar (Navigation) :**
* **Couleur :** `Primary.main` (#1A237E).
* **Comportement :** Navigation verticale fixe.
* **Style des items :** Texte blanc (80% opacité). Icône `Secondary.main` (#007FFF) uniquement pour l'item **actif**.


* **Main Content (Zone de travail) :**
* **Couleur :** `Background.default` (#F8FAFC).
* **Structure :** Utilisation de `Container` MUI avec un padding standard de `24px` (spacing 3).



---

## 2. Actions & Boutons

Nous limitons les styles pour garantir une hiérarchie visuelle claire.

| Type | Composant MUI | Usage |
| --- | --- | --- |
| **Primaire** | `Button variant="contained"` | Action principale de la page (ex: "Ajouter un Domaine"). |
| **Secondaire** | `Button variant="outlined"` | Actions secondaires ou annulations. |
| **Danger** | `Button color="error"` | Suppressions (toujours avec confirmation). |
| **Table** | `IconButton` | Actions de ligne (Edit/Delete) dans les tableaux. |

---

## 3. Saisie de Données (Forms)

* **Style :** `TextField variant="outlined"`.
* **Densité :** `size="small"` pour les formulaires complexes (Applications/Interfaces).
* **Radius :** `6px` (Action Radius).
* **Validation :** Les erreurs s'affichent en rouge (`error.main`) avec un message d'aide descriptif sous le champ.

---

## 4. Tableaux de Données (DataGrid)

Le cœur de l'analyse ARK.

* **Header :** Fond gris neutre (`#F1F5F9`), texte en majuscules, gras, taille réduite (`0.75rem`).
* **Lignes :** Bordure inférieure simple `1px solid #E2E8F0`. Pas de rayures (zebra-striping) pour garder un aspect épuré.
* **Typographie technique :** Les IDs (ex: `APP-204`) utilisent `JetBrains Mono`.

---

## 5. Cartes & Conteneurs (Surface)

* **Style :** `elevation={0}`, bordure `1px solid #E2E8F0`.
* **Radius :** `4px` (Standard Radius).
* **Usage :** Pour regrouper les informations logiques (ex: "Propriétaire du domaine" dans la fiche détail).

---

## 6. Feedback & États

* **Skeleton :** Toujours privilégier les `Skeleton` lors du chargement des listes plutôt qu'un spinner central.
* **Empty State :** Un message centré avec une icône grise et un bouton d'action pour "Commencer".

---