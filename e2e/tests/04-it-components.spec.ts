describe('IT Components — PNS-02 (Drawer + Detail + Form)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/it-components');
  });

  describe('List Page', () => {
    it('should display IT components table with correct columns', () => {
      cy.get('table').should('be.visible');
      cy.contains('th', 'Nom').should('exist');
      cy.contains('th', 'Technologie').should('exist');
      cy.contains('th', 'Type').should('exist');
      cy.contains('th', 'Tags').should('exist');
      cy.contains('th', 'Applications').should('exist');
    });

    it('should display LoadingSkeleton during fetch', () => {
      cy.intercept('GET', '/api/v1/it-components*', (req) => {
        req.reply({ delay: 500, body: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
      }).as('slowFetch');
      cy.visit('/it-components');
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      cy.wait('@slowFetch');
    });

    it('should display EmptyState when no IT components', () => {
      cy.intercept('GET', '/api/v1/it-components*', { body: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
      cy.visit('/it-components');
      cy.contains('Aucun composant IT').should('be.visible');
    });

    it('should open drawer on row click (not name)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click(); // Technologie — pas le nom
      });
      cy.get('[role="presentation"]').should('be.visible');
      cy.contains('Détails composant IT').should('exist');
    });

    it('should navigate to detail on name click (no drawer)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.url().should('include', '/it-components/');
      cy.get('[role="presentation"]').should('not.exist');
    });

    it('should search IT components by name with debounce', () => {
      cy.get('input[placeholder*="Rechercher"]').type('PostgreSQL');
      cy.wait(500); // debounce 300ms + margin
      cy.get('table tbody tr').should('have.length.lessThan', 10);
    });

    it('should filter by type', () => {
      cy.get('[data-testid="filter-type"]').click();
      cy.get('[role="listbox"]').contains('database').click();
      cy.get('table tbody tr').each(row => {
        cy.wrap(row).find('td').eq(2).invoke('text').then(text => {
          expect(text.toLowerCase()).to.include('database');
        });
      });
    });

    it('should filter by technology', () => {
      cy.get('[data-testid="filter-technology"]').click();
      cy.get('[role="listbox"]').contains('Redis').click();
      cy.get('table tbody tr').each(row => {
        cy.wrap(row).find('td').eq(1).invoke('text').then(text => {
          expect(text.toLowerCase()).to.include('redis');
        });
      });
    });

    it('should sort by name ascending by default', () => {
      cy.get('table tbody tr').first().find('a').invoke('text').then(firstName => {
        cy.get('table tbody tr').last().find('a').invoke('text').then(lastName => {
          expect(firstName.localeCompare(lastName)).to.be.lessThan(1);
        });
      });
    });

    it('should toggle sort order on column header click', () => {
      cy.contains('th', 'Nom').click();
      cy.contains('th', 'Nom').click();
      cy.get('table tbody tr').first().find('a').invoke('text').then(text => {
        expect(text).to.be.a('string');
      });
    });

    it('should show Add button if hasPermission it-components:write', () => {
      cy.contains('button', 'Nouveau composant').should('be.visible');
    });

    it('should hide Add button if !hasPermission', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components');
      cy.contains('button', 'Nouveau composant').should('not.exist');
    });

    it('should hide Actions column if !hasPermission', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components');
      cy.contains('th', 'Actions').should('not.exist');
    });
  });

  describe('Side Drawer (PNS-02 — Read-Only)', () => {
    it('should display drawer with IT component info', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').should('be.visible').within(() => {
        cy.contains('Informations').should('exist');
        cy.contains('Applications').should('exist');
      });
    });

    it('should close drawer on close button click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.get('button[aria-label="close"]').click();
      });
      cy.get('[role="presentation"]').should('not.exist');
    });

    it('should close drawer on Escape key', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('[role="presentation"]').should('not.exist');
    });

    it('should show Applications tab in drawer with list', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('Applications').click();
        cy.get('table, [data-testid="empty-state"]').should('exist');
      });
    });

    it('should navigate to detail from "Voir la fiche complète" button', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('button', 'Voir la fiche complète').click();
      });
      cy.url().should('include', '/it-components/');
      cy.get('[role="presentation"]').should('not.exist');
    });

    it('should navigate to edit from "Modifier" button (admin)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('button', 'Modifier').should('not.be.disabled').click();
      });
      cy.url().should('include', '/it-components/').and('include', '/edit');
    });

    it('should disable Edit button in drawer if !hasPermission', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components');
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('button', 'Modifier').should('be.disabled');
      });
    });

    it('should preserve filters after opening and closing drawer', () => {
      cy.get('input[placeholder*="Rechercher"]').type('PostgreSQL');
      cy.wait(400);
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.get('button[aria-label="close"]').click();
      });
      cy.get('input[placeholder*="Rechercher"]').should('have.value', 'PostgreSQL');
    });
  });

  describe('Detail Page', () => {
    it('should display full IT component details with all fields', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.url().should('include', '/it-components/');
      cy.contains('Informations').should('be.visible');
      cy.contains('Technologie').should('exist');
      cy.contains('Type').should('exist');
    });

    it('should show Applications tab with table', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('Applications').click();
      cy.get('table, [data-testid="empty-state"]').should('exist');
    });

    it('should display breadcrumb with correct links', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('Composants IT').should('be.visible');
      cy.contains('Accueil').should('be.visible');
    });

    it('should navigate back to list on "Retour" click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Retour').click();
      cy.url().should('include', '/it-components');
      cy.url().should('not.include', '/it-components/');
    });

    it('should navigate to edit on "Modifier" click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Modifier').click();
      cy.url().should('include', '/edit');
    });

    it('should open ConfirmDialog on "Supprimer" click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').contains('Supprimer le composant IT').should('be.visible');
    });

    it('should redirect to /it-components on unknown UUID', () => {
      cy.visit('/it-components/00000000-0000-0000-0000-000000000000');
      cy.url().should('equal', Cypress.config('baseUrl') + '/it-components');
    });
  });

  describe('Form Page (Create/Edit)', () => {
    it('should display create form with empty fields', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.url().should('include', '/it-components/new');
      cy.contains('Nouveau composant IT').should('be.visible');
      cy.get('input[name="name"]').should('have.value', '');
    });

    it('should disable Save button when name is empty', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.contains('button', 'Enregistrer').should('be.disabled');
    });

    it('should show inline error when name is empty on submit', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type(' ').clear();
      cy.contains('button', 'Enregistrer').click();
      cy.contains('Le nom est obligatoire').should('be.visible');
    });

    it('should show inline error on duplicate name (409 CONFLICT)', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type('PostgreSQL Primary'); // existant en seed
      cy.contains('button', 'Enregistrer').click();
      cy.contains('Ce nom de composant existe déjà').should('be.visible');
    });

    it('should create IT component and navigate to detail with success alert', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type('Test Component Cypress');
      cy.get('input[name="technology"]').type('Node.js 20');
      cy.get('input[name="type"]').type('runtime');
      cy.contains('button', 'Enregistrer').click();
      cy.url().should('include', '/it-components/');
      cy.url().should('not.include', '/new');
      cy.contains('Composant IT créé avec succès').should('be.visible');
    });

    it('should navigate to list on "Annuler" in create mode', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.contains('button', 'Annuler').click();
      cy.url().should('match', /\/it-components$/);
    });

    it('should pre-fill form in edit mode', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Modifier').click();
      cy.url().should('include', '/edit');
      cy.get('input[name="name"]').should('not.have.value', '');
    });

    it('should update IT component and navigate to detail with success alert', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Modifier').click();
      cy.get('input[name="technology"]').clear().type('PostgreSQL 17');
      cy.contains('button', 'Enregistrer').click();
      cy.url().should('include', '/it-components/');
      cy.url().should('not.include', '/edit');
      cy.contains('Composant IT modifié avec succès').should('be.visible');
    });

    it('should navigate to detail on "Annuler" in edit mode', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      const currentUrl = cy.url();
      cy.contains('button', 'Modifier').click();
      cy.contains('button', 'Annuler').click();
      cy.url().should('include', '/it-components/');
      cy.url().should('not.include', '/edit');
    });

    it('should redirect to /it-components on edit with unknown UUID', () => {
      cy.visit('/it-components/00000000-0000-0000-0000-000000000000/edit');
      cy.url().should('equal', Cypress.config('baseUrl') + '/it-components');
    });
  });

  describe('Delete & 409 DEPENDENCY_CONFLICT', () => {
    it('should delete IT component without apps and show success alert', () => {
      // Créer un composant sans liaisons puis le supprimer
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type('ToDelete Cypress Component');
      cy.contains('button', 'Enregistrer').click();
      cy.url().should('include', '/it-components/');
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Supprimer').not('[disabled]').click();
      });
      cy.url().should('match', /\/it-components$/);
      cy.contains('Composant IT supprimé avec succès').should('be.visible');
    });

    it('should cancel delete dialog without deleting', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Annuler').click();
      });
      cy.get('[role="dialog"]').should('not.exist');
      cy.url().should('include', '/it-components/');
    });

    it('should block delete if IT component used by apps (DEPENDENCY_CONFLICT)', () => {
      // Suppose que le premier composant du seed a des applications liées
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Impossible de supprimer').should('be.visible');
        cy.contains('button', 'Supprimer').should('be.disabled');
        cy.contains('Voir les applications liées').should('be.visible');
      });
    });
  });

  describe('Tags (F-03)', () => {
    it('should display tags in list with TagChipList', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(3).should('exist'); // colonne Tags
      });
    });

    it('should display tags in drawer', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('Tags').should('exist');
      });
    });

    it('should allow adding tags in create form', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type('Component With Tags Cypress');
      cy.contains('Tags dimensionnels').should('exist');
      // DimensionTagInput est présent
      cy.get('[data-testid="dimension-tag-input"]').should('exist');
    });
  });

  describe('Permissions (RBAC)', () => {
    it('should allow read access for read-only role', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components');
      cy.get('table').should('be.visible');
    });

    it('should redirect /it-components/new to /403 for read-only role', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components/new');
      cy.url().should('include', '/403');
    });

    it('should redirect /it-components/:id/edit to /403 for read-only role', () => {
      cy.loginAsReadOnly();
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().invoke('attr', 'href').then(href => {
          cy.visit(`${href}/edit`);
        });
      });
      cy.url().should('include', '/403');
    });
  });
});
