# ARK — User Scenarios FS-02 : Domains

_Version 0.4 — Mars 2026_

> **Changelog v0.4 :**
> - Précision i18n ajoutée dans le bloc OpenCode Injection : les assertions Cypress doivent utiliser les valeurs FR de `fr.json`, pas les strings anglaises du Gherkin
> - Note ajoutée : les textes Gherkin restent en anglais (spec fonctionnelle) — la traduction est dans `fr.json`
> - Mapping table inchangé — les labels Cypress it() restent en anglais pour cohérence avec le Gherkin

> **Changelog v0.3 :**
> - Route `/domains/:id` ajoutée (DomainDetailPage) — conséquence du comportement post-save
> - Scénarios "Create" et "Edit" mis à jour : redirect vers `/domains/:id` après sauvegarde réussie
> - Scénario "Cancel editing" mis à jour : retour vers `/domains/:id` (pas `/domains`)
> - Scénario "Cancel creating" : retour vers `/domains` (pas d'id encore)
> - Messages 409 : compteur à 0 affiché comme "no" (ex: "no business capability(ies)")
> - ConfirmDialog : message dynamique avec type d'objet + nom ("the domain 'Finance'")
> - Scénarios read-only : cy.loginAsReadOnly() utilisé (helper dédié dans commands.ts)
> - DomainDetailPage : bouton Edit conditionnel sur hasPermission('domains:write')
> - Scénario ajouté : "View a domain detail page"
> - Scénario ajouté : "Access the detail page for a non-existent domain"
> - Scénario ajouté : "Read-only user sees no edit button on the domain detail page"

> **Changelog v0.2 :**
> - Scénario ajouté : "Attempt to edit a domain with a duplicate name" (PATCH 409)
> - Scénarios ajoutés : 3 variantes de suppression avec entités liées (apps only / BC only / both)
> - Scénario ajouté : "Cancel creating a domain"
> - Scénario ajouté : "View domains list with no pagination"
> - Scénarios ajoutés : 3 scénarios droits UI write (RM-06)
> - Mapping table complété

> **Usage:** User journey specifications for the Domains module. Written in Gherkin format for
> readability and user-centric thinking. Not executed automatically — used as the source of truth
> for Cypress test generation (inject into OpenCode alongside FS-02).
>
> **Language note (v0.4) :** Gherkin scenarios are written in English for readability. The displayed
> UI text is defined in `src/i18n/locales/fr.json` (F-02). Cypress assertions must use the FR values
> from `fr.json` — **not** the English strings in these scenarios. See the OpenCode Injection Block
> at the bottom of this file for the exact FR strings to assert.
>
> **Traceability:** Each `Scenario` maps directly to a `[Cypress]` or `[Manuel]` test case in
> FS-02 section 7. OpenCode should name `describe/it` blocks using the exact Scenario labels.

---

## ⚠️ Route ajoutée — Impact sur FS-02

> Ce fichier introduit une route `/domains/:id` (`DomainDetailPage`) absente de FS-02 v0.5.
> Cette décision découle du comportement post-save : après création ou édition, l'utilisateur
> reste sur la fiche du domaine plutôt que d'être redirigé vers la liste.
>
> **Routes React résultantes (à mettre à jour dans FS-02 §6 et App.tsx) :**
>
> | Route | Composant | Guard |
> |---|---|---|
> | `/domains` | `DomainsListPage` | `PrivateRoute` (token seul) |
> | `/domains/new` | `DomainNewPage` | `PrivateRoute permission="domains:write"` |
> | `/domains/:id` | `DomainDetailPage` | `PrivateRoute` (token seul) |
> | `/domains/:id/edit` | `DomainEditPage` | `PrivateRoute permission="domains:write"` |
>
> **Comportement de `DomainDetailPage` :**
> - Affiche `name`, `description`, `createdAt` en lecture seule
> - Bouton "Edit" visible uniquement si `hasPermission('domains:write')`
> - Si `GET /domains/:id` → `404` : redirection vers `/domains`
>
> **Cypress :** `cy.loginAsReadOnly()` est un helper dédié à créer dans
> `cypress/support/commands.ts` — distinct de `cy.login()`.

---

## Feature: Business Domain Management

```gherkin
Feature: Business Domain Management
  As an Enterprise Architect
  I want to manage business domains
  So that I can structure my organization's application portfolio

  Background:
    Given I am logged in as an Enterprise Architect
    And I am on the "/domains" page

  #
  # ── NOMINAL PATHS ────────────────────────────────────────────────────────────
  #

  Scenario: View the domains list
    Then I see a table listing all existing domains
    And each row displays the domain name, description, and creation date
    And an "Add Domain" button is visible in the page header

  Scenario: View an empty domains list
    Given no domain has been created yet
    Then I see an empty state with the message "No domain created yet"
    And a call-to-action button "Create your first domain" is visible

  Scenario: View domains list with no pagination
    Given 15 domains have been created
    When I navigate to "/domains"
    Then all 15 domains are displayed in the table
    And no pagination control is visible

  Scenario: Create a new domain
    When I click "Add Domain"
    Then I am redirected to "/domains/new"
    When I fill in the name field with "Finance"
    And I fill in the description field with "Financial and accounting domain"
    And I click "Save"
    Then I see a success snackbar "Domain created successfully"
    And I am redirected to "/domains/<new-id>"
    And the page displays the domain name "Finance"
    And the page displays the description "Financial and accounting domain"

  Scenario: Create a domain with name only (description optional)
    When I click "Add Domain"
    And I fill in the name field with "HR"
    And I leave the description field empty
    And I click "Save"
    Then I see a success snackbar "Domain created successfully"
    And I am redirected to "/domains/<new-id>"
    And the page displays the domain name "HR"
    And no description is displayed

  Scenario: Cancel creating a domain
    When I click "Add Domain"
    And I fill in the name field with "Draft"
    And I click "Cancel"
    Then I am redirected to "/domains"
    And no domain "Draft" appears in the list

  Scenario: View a domain detail page
    Given the domain "Finance" exists
    When I click on the "Finance" row in the list
    Then I am redirected to "/domains/<id>"
    And the page displays the domain name "Finance"
    And the page displays the creation date
    And an "Edit" button is visible

  Scenario: Edit an existing domain
    Given the domain "Finance" exists
    When I click the edit icon on the "Finance" row
    Then I am redirected to "/domains/<id>/edit"
    And the name field is pre-filled with "Finance"
    When I update the description to "Finance, HR and Legal domain"
    And I click "Save"
    Then I see a success snackbar "Domain updated successfully"
    And I remain on "/domains/<id>"
    And the page displays the updated description "Finance, HR and Legal domain"

  Scenario: Cancel editing a domain
    Given the domain "Finance" exists
    When I click the edit icon on the "Finance" row
    And I modify the name to "Finance Modified"
    And I click "Cancel"
    Then I am redirected to "/domains/<id>"
    And the page displays the domain name "Finance" unchanged

  Scenario: Delete a domain with no linked entities
    Given the domain "Sandbox" exists with no linked applications or business capabilities
    When I click the delete icon on the "Sandbox" row
    Then a confirmation dialog appears with the message "Are you sure you want to delete the domain 'Sandbox'?"
    When I click "Delete" in the dialog
    Then I see a success snackbar "Domain deleted successfully"
    And the domain "Sandbox" no longer appears in the list

  Scenario: Cancel a domain deletion
    Given the domain "Finance" exists
    When I click the delete icon on the "Finance" row
    And a confirmation dialog appears
    When I click "Cancel" in the dialog
    Then the dialog closes
    And the domain "Finance" remains in the list

  #
  # ── ERROR PATHS ──────────────────────────────────────────────────────────────
  #

  Scenario: Attempt to create a domain with a duplicate name
    Given the domain "Finance" already exists
    When I click "Add Domain"
    And I fill in the name field with "Finance"
    And I click "Save"
    Then I see an inline error "This domain name is already in use"
    And no duplicate domain is created
    And I remain on the "/domains/new" page

  Scenario: Attempt to create a domain with an empty name
    When I click "Add Domain"
    And I leave the name field empty
    And I click "Save"
    Then I see a validation error "Name is required" below the name field
    And the form is not submitted

  Scenario: Attempt to edit a domain with a duplicate name
    Given the domains "Finance" and "IT" exist
    When I click the edit icon on the "Finance" row
    And I change the name to "IT"
    And I click "Save"
    Then I see an inline error "This domain name is already in use"
    And I remain on the "/domains/<id>/edit" page
    And the domain "Finance" is unchanged

  Scenario: Attempt to delete a domain linked to applications only
    Given the domain "Finance" is linked to 3 applications and 0 business capabilities
    When I click the delete icon on the "Finance" row
    And I confirm the deletion in the dialog
    Then I see an error message "This domain is used by 3 application(s) and no business capability(ies) and cannot be deleted"
    And the domain "Finance" remains in the list

  Scenario: Attempt to delete a domain linked to business capabilities only
    Given the domain "Finance" is linked to 0 applications and 4 business capabilities
    When I click the delete icon on the "Finance" row
    And I confirm the deletion in the dialog
    Then I see an error message "This domain is used by no application(s) and 4 business capability(ies) and cannot be deleted"
    And the domain "Finance" remains in the list

  Scenario: Attempt to delete a domain linked to both applications and business capabilities
    Given the domain "Finance" is linked to 2 applications and 4 business capabilities
    When I click the delete icon on the "Finance" row
    And I confirm the deletion in the dialog
    Then I see an error message "This domain is used by 2 application(s) and 4 business capability(ies) and cannot be deleted"
    And the domain "Finance" remains in the list

  Scenario: Access the edit page for a non-existent domain
    When I navigate directly to "/domains/non-existent-uuid/edit"
    Then I am redirected to "/domains"

  Scenario: Access the detail page for a non-existent domain
    When I navigate directly to "/domains/non-existent-uuid"
    Then I am redirected to "/domains"

  #
  # ── ACCESS CONTROL PATHS ─────────────────────────────────────────────────────
  #

  Scenario: Access the domains list without being authenticated
    Given I am not logged in
    When I navigate to "/domains"
    Then I am redirected to "/401"

  Scenario: Read-only user sees no write actions on the domains list
    Given I am logged in as a read-only user via cy.loginAsReadOnly()
    When I navigate to "/domains"
    Then the "Add Domain" button is not visible
    And no edit icon is visible on any domain row
    And no delete icon is visible on any domain row

  Scenario: Read-only user sees no edit button on the domain detail page
    Given I am logged in as a read-only user via cy.loginAsReadOnly()
    And the domain "Finance" exists
    When I navigate to "/domains/<id>"
    Then the "Edit" button is not visible

  Scenario: Read-only user navigates directly to the new domain page
    Given I am logged in as a read-only user via cy.loginAsReadOnly()
    When I navigate directly to "/domains/new"
    Then I am redirected to "/403"

  Scenario: Read-only user navigates directly to the edit domain page
    Given I am logged in as a read-only user via cy.loginAsReadOnly()
    When I navigate directly to "/domains/<id>/edit"
    Then I am redirected to "/403"
```

---

## Mapping to Cypress Tests

| Scenario | Cypress `it()` label | FS-02 §7 ref |
|---|---|---|
| View the domains list | `displays the domains list after login` | `[Cypress]` |
| View an empty domains list | `displays empty state when no domains exist` | `[Cypress]` |
| View domains list with no pagination | `displays all domains with no pagination control` | `[Cypress]` |
| Create a new domain | `creates a domain and redirects to detail page` | `[Cypress]` |
| Create a domain with name only | `creates a domain without description and redirects to detail page` | `[Cypress]` |
| Cancel creating a domain | `cancels domain creation and returns to list` | `[Cypress]` |
| View a domain detail page | `displays domain detail page with edit button` | `[Cypress]` |
| Edit an existing domain | `edits a domain and stays on detail page with updated data` | `[Cypress]` |
| Cancel editing a domain | `cancels domain edit and returns to detail page unchanged` | `[Cypress]` |
| Delete a domain with no linked entities | `deletes an unlinked domain` | `[Cypress]` |
| Cancel a domain deletion | `cancels domain deletion and keeps domain in list` | `[Cypress]` |
| Attempt to create a domain with a duplicate name | `shows inline error on duplicate name at creation` | `[Cypress]` |
| Attempt to create a domain with an empty name | `shows validation error when name is empty` | `[Cypress]` |
| Attempt to edit a domain with a duplicate name | `shows inline error on duplicate name at edit` | `[Cypress]` |
| Attempt to delete a domain linked to applications only | `shows 409 error when deleting a domain linked to applications` | `[Cypress]` |
| Attempt to delete a domain linked to business capabilities only | `shows 409 error when deleting a domain linked to business capabilities` | `[Cypress]` |
| Attempt to delete a domain linked to both applications and business capabilities | `shows 409 error when deleting a domain linked to both entity types` | `[Cypress]` |
| Access the edit page for a non-existent domain | `redirects to /domains on unknown UUID edit` | `[Cypress]` |
| Access the detail page for a non-existent domain | `redirects to /domains on unknown UUID detail` | `[Cypress]` |
| Access the domains list without being authenticated | `redirects to /401 when unauthenticated` | `[Manuel]` |
| Read-only user sees no write actions on the domains list | `hides write actions for read-only users on list` | `[Cypress]` |
| Read-only user sees no edit button on the domain detail page | `hides edit button for read-only users on detail page` | `[Cypress]` |
| Read-only user navigates directly to the new domain page | `redirects to /403 on /domains/new without permission` | `[Cypress]` |
| Read-only user navigates directly to the edit domain page | `redirects to /403 on /domains/:id/edit without permission` | `[Cypress]` |

---

## OpenCode Injection Block

> Add this block to the OpenCode command in FS-02 §9 when generating Cypress tests:

```
User scenarios are defined in FS-02-domains-scenarios.md (v0.4).
Generate Cypress tests in cypress/e2e/domains.cy.ts using:
- cy.login() from cypress/support/commands.ts in beforeEach for authenticated scenarios
- cy.loginAsReadOnly() from cypress/support/commands.ts for read-only user scenarios
  (dedicated helper — do not use cy.login() for read-only scenarios)
- describe() labels matching Feature names
- it() labels matching the exact Cypress it() labels from the mapping table above
- Do NOT generate tests marked [Manuel] in the mapping table
- After successful create: assert redirect to /domains/<new-id> and presence of domain name on page
- After successful edit: assert URL remains /domains/<id> and updated data is visible on page
- After successful delete: assert domain no longer appears in DomainsListPage

i18n — IMPORTANT: UI text assertions must use FR values from fr.json, NOT the English strings in Gherkin scenarios:
- Success snackbars  : "Domaine créé avec succès" / "Domaine mis à jour avec succès" / "Domaine supprimé avec succès"
- Inline form errors : "Ce nom de domaine est déjà utilisé" / "Le nom est obligatoire"
- 409 delete errors  : use format409Message(t, appCount, bcCount) output from fr.json interpolation
  ex: 3 apps, 0 BC  → "Ce domaine est utilisé par 3 application(s) et no capacité(s) métier et ne peut pas être supprimé"
  ex: 0 apps, 4 BC  → "Ce domaine est utilisé par no application(s) et 4 capacité(s) métier et ne peut pas être supprimé"
- Empty state title  : "Aucun domaine créé"
- Confirm dialog    : uses t('domains.delete.confirmMessage', { name }) interpolation
- The Gherkin scenarios are written in English for readability — they are NOT the source of truth for UI text
```