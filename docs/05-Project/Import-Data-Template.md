# ARK — Import Data Template

_Version 0.1 — Mars 2026_

> Ce document décrit le format du fichier Excel pour l'import de données.

---

## Structure du fichier

Le fichier d'import doit respecter le format suivant :

### Onglets requis

| Onglet | Description |
|--------|-------------|
| `Domains` | Liste des domaines métier |
| `Applications` | Liste des applications |
| `Providers` | Liste des fournisseurs |

### Format des colonnes

Chaque onglet doit contenir les colonnes suivantes :

**Domains**
- `name` (obligatoire) : Nom du domaine
- `description` : Description du domaine

**Applications**
- `name` (obligatoire) : Nom de l'application
- `criticality` : low | medium | high | mission-critical
- `lifecycle` : planned | active | deprecated | retired
- `domain` : Nom du domaine associé
- `provider` : Nom du fournisseur

**Providers**
- `name` (obligatoire) : Nom du fournisseur
- `contract_type` : Type de contrat
- `expiration_date` : Date d'expiration (format ISO)

---

## Règles de validation

1. Les noms obligatoires doivent être présents
2. Les domaines doivent exister avant d'être référencés
3. Les valeurs d'énumération doivent correspondre aux valeurs autorisées

---

_Document de travail v0.1 — Projet ARK_
