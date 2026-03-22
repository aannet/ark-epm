# Révocation des Refresh Tokens - Procédure CLI

> **Date**: Mars 2026  
> **Version**: 1.0  
> **Contexte**: Procédures pour révoquer des refresh tokens en ligne de commande (administration, sécurité)

---

## Vue d'ensemble

Le système de refresh token utilise une table `refresh_tokens` en base de données. Chaque utilisateur peut avoir **un seul refresh token actif** à la fois (stratégie "un seul appareil"). Les tokens expirés ne sont pas automatiquement purgés (P2).

---

## Procédures

### 1. Révoquer tous les refresh tokens d'un utilisateur spécifique

Force la déconnexion de l'utilisateur sur tous ses appareils. L'utilisateur devra se reconnecter avec email/password.

```bash
# Se connecter au conteneur PostgreSQL
docker exec -it ark-epm-db-1 psql -U ark_user -d arkepm

# Récupérer l'ID de l'utilisateur (par email)
SELECT id FROM users WHERE email = 'user@ark.io';

# Révoquer le refresh token
DELETE FROM refresh_tokens WHERE user_id = '<UUID_UTILISATEUR>';
```

**Ou en une seule commande**:
```sql
DELETE FROM refresh_tokens 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@ark.io');
```

---

### 2. Révoquer tous les refresh tokens (déconnexion globale)

**⚠️ Danger**: Force la déconnexion de **tous** les utilisateurs connectés. À utiliser en cas d'incident de sécurité majeur.

```bash
docker exec -it ark-epm-db-1 psql -U ark_user -d arkepm -c "TRUNCATE TABLE refresh_tokens;"
```

**Impact**:
- Tous les utilisateurs seront déconnectés au prochain refresh (max 15 minutes)
- Chaque utilisateur devra se reconnecter avec email/password
- Les access tokens existants continueront de fonctionner jusqu'à expiration (15 minutes max)

---

### 3. Lister les utilisateurs avec sessions actives

```sql
SELECT u.email, u.first_name, u.last_name, rt.created_at, rt.expires_at
FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
ORDER BY rt.created_at DESC;
```

---

### 4. Purger les tokens expirés (maintenance)

```sql
DELETE FROM refresh_tokens 
WHERE expires_at < NOW();
```

---

## Cas d'usage

| Scénario | Commande | Impact utilisateur |
|----------|----------|-------------------|
| Compte compromis | Révocation utilisateur spécifique (procédure 1) | Déconnexion immédiate au prochain refresh |
| Licenciement | Révocation utilisateur spécifique (procédure 1) | Déconnexion dans 15 min max |
| Incident sécurité | Révocation globale (procédure 2) | Tous les utilisateurs reconnectés |
| Maintenance | Purge tokens expirés (procédure 4) | Aucun - tokens déjà inutilisables |

---

## Notes techniques

- Les refresh tokens sont stockés **hashés** (bcrypt) - impossible de récupérer le token en clair
- La révocation est **immédiate** côté base mais le client ne le saura qu'au prochain refresh (silencieux)
- Un utilisateur sans refresh token valide recevra une 401 sur `/auth/refresh` et sera redirigé vers le login

---

## Futur évolutions (P2)

- [ ] Interface admin pour révoquer visuellement
- [ ] Historique des révocations (table `refresh_token_revocations`)
- [ ] Cron automatique pour purge des tokens expirés
- [ ] Multi-device (plusieurs refresh tokens par utilisateur)
