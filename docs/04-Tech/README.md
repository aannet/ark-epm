# docs/04-Tech — Référence technique ARK-EPM

Ce dossier contient les documents de référence technique du projet ARK-EPM.

| Fichier | Contenu |
|---|---|
| `ARK-Architecture-Setup.md` | Stack, structure du projet, Docker Compose, points de modélisation critiques |
| `ARK-NFR.md` | Exigences non-fonctionnelles (performance, sécurité, disponibilité…) |
| `openapi.yaml` | Contrat API REST complet (OpenAPI 3.0) — source de vérité des endpoints |
| `schema.sql` | Schéma PostgreSQL complet (DDL) — à jour avec `backend/prisma/schema.prisma` |

---

## Modèle de données

Le modèle de données est organisé en cinq domaines fonctionnels :

- **RBAC** — Gestion des utilisateurs, rôles et permissions (`users`, `roles`, `permissions`, `refresh_tokens`)
- **Gouvernance** — Domaines métier (`domains`)
- **Méta-modèle applicatif** — Entités principales : applications, fournisseurs, capacités métier, interfaces, objets de données, composants IT
- **Système de tags** — Tags hiérarchiques multi-valeurs attachables à n'importe quelle entité (`tag_dimensions`, `tag_values`, `entity_tags`)
- **Audit** — Journal de toutes les modifications via trigger PostgreSQL (`audit_trail`)

La source de vérité du modèle est `backend/prisma/schema.prisma`. Le fichier `schema.sql` en est la traduction PostgreSQL documentaire.

### Enums

| Type PostgreSQL | Valeurs | Utilisé par |
|---|---|---|
| `"CriticalityLevel"` | `LOW` `MEDIUM` `HIGH` `CRITICAL` | `business_capabilities.criticality`, `interfaces.criticality` |
| `"TechnicalFitLevel"` | `ADEQUATE` `PARTIAL` `INADEQUATE` `LEGACY` | `business_capabilities.technical_fit` |
| `interface_type` | `REST` `SOAP` `FTP` `SFTP` `DATABASE` `MESSAGE_QUEUE` `BATCH_FILE` `EVENT_STREAM` `GRAPHQL` `GRPC` `OTHER` | `interfaces.type` |
| `interface_frequency` | `REALTIME` `NEAR_REALTIME` `HOURLY` `DAILY` `WEEKLY` `MONTHLY` `ON_DEMAND` | `interfaces.frequency` |

> Les enums `"CriticalityLevel"` et `"TechnicalFitLevel"` sont en PascalCase (pas de `@@map` dans schema.prisma — Prisma conserve le nom exact de l'enum).

### Diagramme

```mermaid
erDiagram
    Permission {
        uuid id PK
        string name
    }
    Role {
        uuid id PK
        string name
    }
    RolePermission {
        uuid role_id FK
        uuid permission_id FK
    }
    User {
        uuid id PK
        string email
        uuid role_id FK
        boolean is_active
    }
    RefreshToken {
        uuid id PK
        uuid user_id FK
    }
    Domain {
        uuid id PK
        string name
    }
    BusinessCapability {
        uuid id PK
        string name
        uuid parent_id FK
        uuid domain_id FK
        CriticalityLevel criticality
        TechnicalFitLevel technical_fit
    }
    Provider {
        uuid id PK
        string name
        string contract_type
        date expiry_date
    }
    Application {
        uuid id PK
        string name
        uuid owner_id FK
        uuid domain_id FK
        string criticality
        string lifecycle_status
    }
    AppProviderMap {
        uuid application_id FK
        uuid provider_id FK
        string provider_role
    }
    AppCapabilityMap {
        uuid application_id FK
        uuid capability_id FK
    }
    Interface {
        uuid id PK
        string name
        uuid source_app_id FK
        uuid target_app_id FK
        uuid middleware_app_id FK
        interface_type type
        interface_frequency frequency
        CriticalityLevel criticality
    }
    DataObject {
        uuid id PK
        string name
        string type
        boolean is_source_of_truth
    }
    AppDataObjectMap {
        uuid application_id FK
        uuid data_object_id FK
        string role
    }
    ItComponent {
        uuid id PK
        string name
        string technology
        string type
    }
    AppItComponentMap {
        uuid application_id FK
        uuid it_component_id FK
    }
    TagDimension {
        uuid id PK
        string name
        boolean multi_value
    }
    TagValue {
        uuid id PK
        uuid dimension_id FK
        string path
        uuid parent_id FK
    }
    EntityTag {
        string entity_type PK
        uuid entity_id PK
        uuid tag_value_id FK
    }
    AuditTrail {
        uuid id PK
        string entity_type
        uuid entity_id
        string action
        uuid changed_by FK
    }

    Role ||--o{ RolePermission : ""
    Permission ||--o{ RolePermission : ""
    Role ||--o{ User : ""
    User ||--o| RefreshToken : ""
    User ||--o{ AuditTrail : ""

    Domain ||--o{ Application : ""
    Domain ||--o{ BusinessCapability : ""
    User ||--o{ Application : "owner"

    BusinessCapability ||--o{ BusinessCapability : "parent"
    BusinessCapability ||--o{ AppCapabilityMap : ""
    Application ||--o{ AppCapabilityMap : ""

    Provider ||--o{ AppProviderMap : ""
    Application ||--o{ AppProviderMap : ""

    Application ||--o{ Interface : "source"
    Application ||--o{ Interface : "target"
    Application ||--o{ Interface : "middleware"

    DataObject ||--o{ AppDataObjectMap : ""
    Application ||--o{ AppDataObjectMap : ""

    ItComponent ||--o{ AppItComponentMap : ""
    Application ||--o{ AppItComponentMap : ""

    TagDimension ||--o{ TagValue : ""
    TagValue ||--o{ TagValue : "parent"
    TagValue ||--o{ EntityTag : ""
```
