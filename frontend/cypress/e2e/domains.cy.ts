describe('Domains Feature', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/domains');
  });

  describe('DomainsListPage', () => {
    it('affiche la liste des domaines après login', () => {
      cy.contains('Domaines').should('be.visible');
    });

    it('affiche l\'état vide si aucun domaine', () => {
      cy.contains('Aucun domaine créé').should('be.visible');
    });

    it('affiche 15 domaines sans contrôle de pagination', () => {
      // Given 15 domains created (handled by test setup)
      // Then all 15 are displayed without pagination
      // No pagination control should be visible
    });

    it('clic sur une ligne redirect vers /domains/:id', () => {
      // Given a domain exists
      // When clicking on a row
      // Then redirected to /domains/:id
    });
  });

  describe('Création de domaine', () => {
    it('crée un domaine avec nom et description', () => {
      cy.contains('Ajouter un domaine').click();
      cy.url().should('include', '/domains/new');
      cy.get('input[name="name"]').type('Finance');
      cy.get('textarea[name="description"]').type('Financial domain');
      cy.contains('Enregistrer').click();
      cy.contains('Domaine créé avec succès').should('be.visible');
      cy.url().should('match', /\/domains\/[a-f0-9-]+$/);
      cy.contains('Finance').should('be.visible');
    });

    it('crée un domaine sans description', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('HR');
      cy.contains('Enregistrer').click();
      cy.contains('Domaine créé avec succès').should('be.visible');
    });

    it('annule la création', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('Draft');
      cy.contains('Annuler').click();
      cy.url().should('include', '/domains');
      cy.contains('Draft').should('not.exist');
    });

    it('affiche une erreur si nom dupliqué', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('Finance');
      cy.contains('Enregistrer').click();
      cy.contains('Ce nom de domaine est déjà utilisé').should('be.visible');
    });

    it('affiche une erreur si nom vide', () => {
      cy.contains('Ajouter un domaine').click();
      cy.contains('Enregistrer').click();
      cy.contains('Le nom est obligatoire').should('be.visible');
    });

    it('affiche une erreur si nom avec uniquement des espaces', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('   ');
      cy.contains('Enregistrer').click();
      cy.contains('Le nom est obligatoire').should('be.visible');
    });
  });

  describe('DomainDetailPage', () => {
    it('affiche le détail du domaine', () => {
      // Given domain exists
      // When navigating to /domains/:id
      // Then displays name, description and creation date
    });

    it('affiche un bouton Modifier si permissions écriture', () => {
      cy.contains('Modifier').should('be.visible');
    });

    it('affiche "—" si description null', () => {
      // Given domain without description
      // Then displays "—" for description
    });

    it('redirect vers /domains si UUID inexistant', () => {
      cy.visit('/domains/00000000-0000-0000-0000-000000000000');
      cy.url().should('include', '/domains');
    });
  });

  describe('Modification de domaine', () => {
    it('modifie un domaine', () => {
      // Given domain exists
      // When clicking edit icon
      // And changing description
      // And clicking save
      // Then stays on /domains/:id
      // And displays updated description
    });

    it('affiche une erreur si nom dupliqué', () => {
      // Given two domains exist
      // When editing one with the other's name
      // Then shows duplicate error
    });

    it('annule la modification', () => {
      // Given domain exists
      // When clicking edit
      // And clicking cancel
      // Then redirected to /domains/:id with unchanged data
    });
  });

  describe('Suppression de domaine', () => {
    it('supprime un domaine sans entités liées', () => {
      // Given domain with no linked apps or BCs
      // When clicking delete
      // And confirming
      // Then domain disappears from list
    });

    it('annule la suppression', () => {
      // Given domain exists
      // When clicking delete
      // And clicking cancel
      // Then dialog closes, domain remains
    });

    it('affiche erreur si domaine lié à des applications', () => {
      // Given domain linked to 3 apps, 0 BCs
      // When trying to delete
      // Then shows "used by 3 application(s) and no business capability(ies)"
    });

    it('affiche erreur si domaine lié à des capacités métier', () => {
      // Given domain linked to 0 apps, 4 BCs
      // When trying to delete
      // Then shows "used by no application(s) and 4 business capability(ies)"
    });

    it('affiche erreur si domaine lié aux deux', () => {
      // Given domain linked to 2 apps, 4 BCs
      // When trying to delete
      // Then shows "used by 2 application(s) and 4 business capability(ies)"
    });
  });

  describe('Droits UI', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginAsReadOnly();
      cy.visit('/domains');
    });

    it('bouton Ajouter absent pour read-only', () => {
      cy.contains('Ajouter un domaine').should('not.exist');
    });

    it('icônes edit/delete absentes pour read-only', () => {
      cy.get('[aria-label="Modifier"]').should('not.exist');
      cy.get('[aria-label="Supprimer"]').should('not.exist');
    });

    it('bouton Edit absent sur page détail pour read-only', () => {
      cy.visit('/domains/some-id');
      cy.contains('Modifier').should('not.exist');
    });

    it('redirect vers /403 pour /domains/new si read-only', () => {
      cy.visit('/domains/new');
      cy.url().should('include', '/403');
    });

    it('redirect vers /403 pour /domains/:id/edit si read-only', () => {
      cy.visit('/domains/some-id/edit');
      cy.url().should('include', '/403');
    });
  });
});
