# ARK — User Scenarios FS-01 : Auth & RBAC

_Version 0.1 — Février 2026_

> **Changelog v0.1 :** Version initiale — scénarios Login, UnauthorizedPage (401), ForbiddenPage (403),
> gestion des utilisateurs, gestion des rôles & permissions, PrivateRoute, intercepteur Axios.

> **Usage:** User journey specifications for the Auth & RBAC module. Written in Gherkin format for
> readability and user-centric thinking. Not executed automatically — used as the source of truth
> for Cypress test generation (inject into OpenCode alongside FS-01).
>
> **Traceability:** Each `Scenario` maps directly to a `[Cypress]` or `[Manuel]` test case in
> FS-01 section 7. OpenCode should name `describe/it` blocks using the exact Scenario labels.

---

## Feature: Authentication

```gherkin
Feature: Authentication
  As a user of the ARK platform
  I want to log in with my email and password
  So that I can access the application securely

  Background:
    Given the user "admin@ark.io" exists with role "Admin" and is active

  #
  # ── NOMINAL PATHS ────────────────────────────────────────────────────────────
  #

  Scenario: Successful login redirects to home
    Given I am on the "/login" page
    When I fill in the email field with "admin@ark.io"
    And I fill in the password field with a valid password
    And I click "Sign in"
    Then I am redirected to "/"
    And the JWT token is stored in memory
    And no token is stored in localStorage or sessionStorage

  Scenario: Login page is accessible without authentication
    Given I am not logged in
    When I navigate to "/login"
    Then I see the login form
    And I am not redirected to "/401"

  Scenario: Authenticated user is redirected away from login page
    Given I am logged in
    When I navigate to "/login"
    Then I am redirected to "/"

  Scenario: Auth/me returns the current user profile
    Given I am logged in as "admin@ark.io"
    When the application calls "GET /auth/me"
    Then the response contains the user's email, firstName, lastName, role, and isActive
    And the response does not contain "passwordHash"

  Scenario: Logout clears the session
    Given I am logged in
    When I click the logout button
    Then the JWT token is purged from memory
    And I am redirected to "/login"

  #
  # ── ERROR PATHS ──────────────────────────────────────────────────────────────
  #

  Scenario: Login with an unknown email shows an inline error
    Given I am on the "/login" page
    When I fill in the email field with "unknown@ark.io"
    And I fill in the password field with "anyPassword"
    And I click "Sign in"
    Then I see an inline error "Invalid email or password"
    And I remain on the "/login" page
    And I am not redirected to "/401"

  Scenario: Login with a wrong password shows an inline error
    Given I am on the "/login" page
    When I fill in the email field with "admin@ark.io"
    And I fill in the password field with "wrongPassword"
    And I click "Sign in"
    Then I see an inline error "Invalid email or password"
    And I remain on the "/login" page
    And I am not redirected to "/401"

  Scenario: Login with a disabled account shows an inline error
    Given the user "disabled@ark.io" exists with isActive set to false
    When I fill in the email field with "disabled@ark.io"
    And I fill in the password field with a valid password
    And I click "Sign in"
    Then I see an inline error "Account disabled"
    And I remain on the "/login" page

  Scenario: Login with an empty email shows a validation error
    Given I am on the "/login" page
    When I leave the email field empty
    And I fill in the password field with "anyPassword"
    And I click "Sign in"
    Then I see a validation error "Email is required" below the email field
    And the form is not submitted

  Scenario: Login with an empty password shows a validation error
    Given I am on the "/login" page
    When I fill in the email field with "admin@ark.io"
    And I leave the password field empty
    And I click "Sign in"
    Then I see a validation error "Password is required" below the password field
    And the form is not submitted
```

---

## Feature: Session Expiry & Access Control Pages

```gherkin
Feature: Session Expiry & Access Control Pages
  As a user of the ARK platform
  I want to be clearly informed when my session has expired or when I lack access
  So that I can take the appropriate action without confusion

  #
  # ── UNAUTHORIZED PAGE (401) ──────────────────────────────────────────────────
  #

  Scenario: Unauthenticated user accessing a protected route is redirected to /401
    Given I am not logged in
    When I navigate to "/domains"
    Then I am redirected to "/401"
    And the page title reads "Session expirée"
    And a "Se connecter" button is visible

  Scenario: UnauthorizedPage redirects to login
    Given I am on the "/401" page
    When I click "Se connecter"
    Then I am redirected to "/login"

  Scenario: Expired token triggers redirect to /401
    Given I am logged in with a token that has expired
    When the application makes an authenticated API call
    Then the interceptor purges the token from memory
    And I am redirected to "/401"
    And the token is no longer present in memory

  Scenario: /401 page is accessible without authentication
    Given I am not logged in
    When I navigate to "/401"
    Then I see the UnauthorizedPage
    And I am not redirected further

  #
  # ── FORBIDDEN PAGE (403) ─────────────────────────────────────────────────────
  #

  Scenario: Authenticated user without permission is redirected to /403
    Given I am logged in as a user without "domains:write" permission
    When I navigate directly to "/domains/new"
    Then I am redirected to "/403"
    And the page title reads "Accès refusé"
    And a "Retour à l'accueil" button is visible

  Scenario: ForbiddenPage redirects to home
    Given I am on the "/403" page
    When I click "Retour à l'accueil"
    Then I am redirected to "/"

  Scenario: API 403 response triggers redirect to /403
    Given I am logged in as a user without "users:write" permission
    When the application receives a 403 response from the API
    Then I am redirected to "/403"

  Scenario: /403 page is accessible without authentication
    Given I am not logged in
    When I navigate to "/403"
    Then I see the ForbiddenPage
    And I am not redirected to "/401"
```

---

## Feature: User Management

```gherkin
Feature: User Management
  As an Administrator
  I want to manage users of the ARK platform
  So that I can control who has access and with which role

  Background:
    Given I am logged in as an Administrator with "users:write" permission
    And I am on the "/users" page

  #
  # ── NOMINAL PATHS ────────────────────────────────────────────────────────────
  #

  Scenario: View the users list
    Then I see a table listing all existing users
    And each row displays the user's email, first name, last name, role, and active status
    And an "Add User" button is visible in the page header

  Scenario: View an empty users list
    Given no user other than myself has been created
    Then I see the users list with only my own account

  Scenario: Create a new user
    When I click "Add User"
    Then I am redirected to "/users/new"
    When I fill in the email field with "newuser@ark.io"
    And I fill in the password field with "SecurePass1!"
    And I fill in the first name with "Alice"
    And I fill in the last name with "Martin"
    And I select the role "Architect"
    And I click "Save"
    Then I see a success snackbar "User created successfully"
    And I am redirected to "/users"
    And "newuser@ark.io" appears in the users list

  Scenario: Create a user without optional fields
    When I click "Add User"
    And I fill in the email field with "minimal@ark.io"
    And I fill in the password field with "SecurePass1!"
    And I click "Save"
    Then I see a success snackbar "User created successfully"
    And "minimal@ark.io" appears in the users list

  Scenario: Edit an existing user
    Given the user "alice@ark.io" exists
    When I click the edit icon on the "alice@ark.io" row
    Then I am redirected to "/users/<id>/edit"
    And the email field is pre-filled with "alice@ark.io"
    When I update the first name to "Alicia"
    And I click "Save"
    Then I see a success snackbar "User updated successfully"
    And I am redirected to "/users"
    And the first name "Alicia" is displayed in the users list

  Scenario: Deactivate a user
    Given the user "alice@ark.io" is active
    When I click the deactivate icon on the "alice@ark.io" row
    Then a confirmation dialog appears with the message "Are you sure you want to deactivate 'alice@ark.io'?"
    When I click "Deactivate" in the dialog
    Then I see a success snackbar "User deactivated successfully"
    And the status badge for "alice@ark.io" displays "Inactive"
    And the row is visually dimmed

  Scenario: Reactivate a user
    Given the user "alice@ark.io" is inactive
    When I click the activate icon on the "alice@ark.io" row
    Then I see a success snackbar "User activated successfully"
    And the status badge for "alice@ark.io" displays "Active"

  Scenario: Assign a role to a user
    Given the user "bob@ark.io" has no role assigned
    When I click the edit icon on the "bob@ark.io" row
    And I select the role "Business Owner"
    And I click "Save"
    Then I see a success snackbar "User updated successfully"
    And "Business Owner" is displayed in the role column for "bob@ark.io"

  #
  # ── ERROR PATHS ──────────────────────────────────────────────────────────────
  #

  Scenario: Attempt to create a user with a duplicate email
    Given the user "alice@ark.io" already exists
    When I click "Add User"
    And I fill in the email field with "alice@ark.io"
    And I fill in the password field with "SecurePass1!"
    And I click "Save"
    Then I see an inline error "This email is already in use"
    And I remain on the "/users/new" page
    And no duplicate user is created

  Scenario: Attempt to create a user with an invalid email format
    When I click "Add User"
    And I fill in the email field with "not-an-email"
    And I fill in the password field with "SecurePass1!"
    And I click "Save"
    Then I see a validation error "Invalid email format" below the email field
    And the form is not submitted

  Scenario: Attempt to create a user with a password shorter than 8 characters
    When I click "Add User"
    And I fill in the email field with "short@ark.io"
    And I fill in the password field with "short"
    And I click "Save"
    Then I see a validation error "Password must be at least 8 characters" below the password field
    And the form is not submitted

  Scenario: Access the edit page for a non-existent user
    When I navigate directly to "/users/non-existent-uuid/edit"
    Then I am redirected to "/users"

  #
  # ── ACCESS CONTROL PATHS ─────────────────────────────────────────────────────
  #

  Scenario: Non-admin user cannot access the users list
    Given I am logged in as a user without "users:write" permission
    When I navigate directly to "/users"
    Then I am redirected to "/403"

  Scenario: Non-admin user cannot access the user creation page
    Given I am logged in as a user without "users:write" permission
    When I navigate directly to "/users/new"
    Then I am redirected to "/403"
```

---

## Feature: Role & Permission Management

```gherkin
Feature: Role & Permission Management
  As an Administrator
  I want to manage roles and their associated permissions
  So that I can control what each type of user can do in ARK

  Background:
    Given I am logged in as an Administrator with "roles:write" permission
    And I am on the "/roles" page

  #
  # ── NOMINAL PATHS ────────────────────────────────────────────────────────────
  #

  Scenario: View the roles list
    Then I see a table listing all existing roles
    And each row displays the role name, description, and the number of associated permissions
    And an "Add Role" button is visible in the page header

  Scenario: View an empty roles list
    Given no custom role has been created
    Then I see the seeded roles ("Admin", "Architect", etc.) in the list

  Scenario: Create a new role
    When I click "Add Role"
    And I fill in the name field with "Read Only"
    And I fill in the description field with "Can only view data"
    And I click "Save"
    Then I see a success snackbar "Role created successfully"
    And "Read Only" appears in the roles list

  Scenario: Edit a role's permissions
    Given the role "Architect" exists
    When I click the edit icon on the "Architect" row
    Then I am redirected to "/roles/<id>/edit"
    And the current permissions for "Architect" are pre-selected
    When I add the permission "providers:write"
    And I click "Save"
    Then I see a success snackbar "Role updated successfully"
    And "providers:write" is included in "Architect"'s permissions

  Scenario: Remove a permission from a role
    Given the role "Architect" has the permission "providers:write"
    When I click the edit icon on the "Architect" row
    And I deselect the permission "providers:write"
    And I click "Save"
    Then I see a success snackbar "Role updated successfully"
    And "providers:write" is no longer listed for "Architect"

  Scenario: Delete a role with no assigned users
    Given the role "Obsolete Role" exists and has no users assigned
    When I click the delete icon on the "Obsolete Role" row
    Then a confirmation dialog appears with the message "Are you sure you want to delete the role 'Obsolete Role'?"
    When I click "Delete" in the dialog
    Then I see a success snackbar "Role deleted successfully"
    And "Obsolete Role" no longer appears in the list

  Scenario: Cancel a role deletion
    Given the role "Architect" exists
    When I click the delete icon on the "Architect" row
    And a confirmation dialog appears
    When I click "Cancel" in the dialog
    Then the dialog closes
    And "Architect" remains in the roles list

  #
  # ── ERROR PATHS ──────────────────────────────────────────────────────────────
  #

  Scenario: Attempt to create a role with a duplicate name
    Given the role "Admin" already exists
    When I click "Add Role"
    And I fill in the name field with "Admin"
    And I click "Save"
    Then I see an inline error "This role name is already in use"
    And I remain on the "/roles/new" page
    And no duplicate role is created

  Scenario: Attempt to create a role with an empty name
    When I click "Add Role"
    And I leave the name field empty
    And I click "Save"
    Then I see a validation error "Name is required" below the name field
    And the form is not submitted

  Scenario: Attempt to delete a role assigned to users
    Given the role "Architect" is assigned to 2 users
    When I click the delete icon on the "Architect" row
    And I confirm the deletion in the dialog
    Then I see an error message "This role is assigned to 2 user(s) and cannot be deleted"
    And the role "Architect" remains in the list

  #
  # ── ACCESS CONTROL PATHS ─────────────────────────────────────────────────────
  #

  Scenario: Non-admin user cannot access the roles list
    Given I am logged in as a user without "roles:write" permission
    When I navigate directly to "/roles"
    Then I am redirected to "/403"
```

---

## Feature: PrivateRoute Guard

```gherkin
Feature: PrivateRoute Guard
  As the ARK frontend application
  I want to protect routes based on authentication and permissions
  So that unauthenticated or unauthorized users cannot access restricted pages

  Scenario: Unauthenticated user is redirected to /401
    Given the user has no JWT token in memory
    When the user navigates to any protected route (e.g. "/domains")
    Then they are redirected to "/401"
    And the protected page content is never rendered

  Scenario: Authenticated user without required permission is redirected to /403
    Given the user has a valid JWT token in memory
    And the user does not have the "users:write" permission
    When the user navigates to "/users"
    Then they are redirected to "/403"
    And the users list is never rendered

  Scenario: Authenticated user with required permission can access the route
    Given the user has a valid JWT token in memory
    And the user has the "users:write" permission
    When the user navigates to "/users"
    Then the users list page is rendered

  Scenario: Route with no permission requirement only checks authentication
    Given the user has a valid JWT token in memory
    When the user navigates to "/domains"
    Then the domains list page is rendered regardless of specific permissions
```

---

## Mapping to Cypress Tests

| Scenario | Cypress `it()` label | FS-01 §7 ref |
|---|---|---|
| Successful login redirects to home | `logs in and redirects to home` | `[Cypress]` |
| Login page is accessible without authentication | `renders login page when unauthenticated` | `[Cypress]` |
| Authenticated user is redirected away from login page | `redirects authenticated user away from /login` | `[Cypress]` |
| Logout clears the session | `logout purges token and redirects to /login` | `[Cypress]` |
| Login with an unknown email shows an inline error | `shows inline error on unknown email` | `[Cypress]` |
| Login with a wrong password shows an inline error | `shows inline error on wrong password` | `[Cypress]` |
| Login with a disabled account shows an inline error | `shows inline error on disabled account` | `[Cypress]` |
| Login with an empty email shows a validation error | `shows validation error when email is empty` | `[Cypress]` |
| Login with an empty password shows a validation error | `shows validation error when password is empty` | `[Cypress]` |
| Unauthenticated user accessing a protected route is redirected to /401 | `redirects to /401 when unauthenticated` | `[Manuel]` |
| UnauthorizedPage redirects to login | `redirects to /login from UnauthorizedPage` | `[Cypress]` |
| Expired token triggers redirect to /401 | `purges token and redirects to /401 on 401 API response` | `[Cypress]` |
| /401 page is accessible without authentication | `renders UnauthorizedPage without authentication` | `[Cypress]` |
| Authenticated user without permission is redirected to /403 | `redirects to /403 when permission is missing` | `[Cypress]` |
| ForbiddenPage redirects to home | `redirects to / from ForbiddenPage` | `[Cypress]` |
| API 403 response triggers redirect to /403 | `redirects to /403 on 403 API response` | `[Cypress]` |
| /403 page is accessible without authentication | `renders ForbiddenPage without authentication` | `[Cypress]` |
| View the users list | `displays the users list after login` | `[Cypress]` |
| Create a new user | `creates a user and redirects to list` | `[Cypress]` |
| Create a user without optional fields | `creates a user without optional fields` | `[Cypress]` |
| Edit an existing user | `edits a user and updates the list` | `[Cypress]` |
| Deactivate a user | `deactivates a user and shows inactive badge` | `[Cypress]` |
| Reactivate a user | `reactivates an inactive user` | `[Cypress]` |
| Assign a role to a user | `assigns a role to a user` | `[Cypress]` |
| Attempt to create a user with a duplicate email | `shows inline error on duplicate email` | `[Cypress]` |
| Attempt to create a user with an invalid email format | `shows validation error on invalid email format` | `[Cypress]` |
| Attempt to create a user with a password shorter than 8 characters | `shows validation error on short password` | `[Cypress]` |
| Access the edit page for a non-existent user | `redirects to /users on unknown UUID edit` | `[Cypress]` |
| Non-admin user cannot access the users list | `redirects to /403 on /users without permission` | `[Cypress]` |
| Non-admin user cannot access the user creation page | `redirects to /403 on /users/new without permission` | `[Cypress]` |
| View the roles list | `displays the roles list after login` | `[Cypress]` |
| Create a new role | `creates a role and shows it in the list` | `[Cypress]` |
| Edit a role's permissions | `adds a permission to a role` | `[Cypress]` |
| Remove a permission from a role | `removes a permission from a role` | `[Cypress]` |
| Delete a role with no assigned users | `deletes an unassigned role` | `[Cypress]` |
| Cancel a role deletion | `cancels role deletion and keeps role in list` | `[Cypress]` |
| Attempt to create a role with a duplicate name | `shows inline error on duplicate role name` | `[Cypress]` |
| Attempt to create a role with an empty name | `shows validation error when role name is empty` | `[Cypress]` |
| Attempt to delete a role assigned to users | `shows 409 error when deleting an assigned role` | `[Cypress]` |
| Non-admin user cannot access the roles list | `redirects to /403 on /roles without permission` | `[Cypress]` |
| Unauthenticated user is redirected to /401 | `PrivateRoute redirects to /401 when no token` | `[Cypress]` |
| Authenticated user without required permission is redirected to /403 | `PrivateRoute redirects to /403 when permission missing` | `[Cypress]` |
| Authenticated user with required permission can access the route | `PrivateRoute renders page when permission is satisfied` | `[Cypress]` |
| Route with no permission requirement only checks authentication | `PrivateRoute renders page for authenticated user with no permission requirement` | `[Cypress]` |

---

## OpenCode Injection Block

> Add this block to the OpenCode command in FS-01 §9 when generating Cypress tests:

```
User scenarios are defined in FS-01-auth-rbac-scenarios.md (v0.1).
Generate Cypress tests in cypress/e2e/login.cy.ts and cypress/e2e/users.cy.ts using:
- cy.login() from cypress/support/commands.ts in beforeEach for authenticated scenarios
- cy.loginAsReadOnly() for scenarios involving users without write permissions
- describe() labels matching Feature names
- it() labels matching the exact Cypress it() labels from the mapping table above
- Do NOT generate tests marked [Manuel] in the mapping table

Key assertions to enforce:
- Login success: assert JWT token in memory (not in localStorage/sessionStorage), redirect to "/"
- Login failure (wrong credentials, disabled account): assert inline error on LoginPage, NOT redirect to /401
- 401 Axios interceptor: assert token is purged from memory AND window.location is /401
- 403 Axios interceptor: assert redirect to /403 (not /401)
- PrivateRoute (no token): assert redirect to /401, not /403
- PrivateRoute (token + missing permission): assert redirect to /403, not /401
- User deactivation: assert isActive badge changes to "Inactive" and row is visually dimmed
- Role deletion blocked: assert error message text matches exactly "This role is assigned to X user(s) and cannot be deleted"
- Inline errors: assert user remains on the current page (not redirected)
```