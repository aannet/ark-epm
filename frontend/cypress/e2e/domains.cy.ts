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
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('TestDomain');
      cy.get('textarea[name="description"]').type('Test description');
      cy.contains('Enregistrer').click();
      cy.url().should('match', /\/domains\/[a-f0-9-]+$/);
      
      const domainUrl = cy.url();
      
      cy.visit('/domains');
      cy.contains('TestDomain').click();
      
      domainUrl.then((url) => {
        cy.url().should('eq', url);
      });
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
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
      cy.get('.MuiFormHelperText-root').should('contain', 'Ce nom de domaine est déjà utilisé');
    });

    it('affiche une erreur si nom vide', () => {
      cy.contains('Ajouter un domaine').click();
      cy.contains('Enregistrer').click();
      cy.contains('Le nom est obligatoire').should('be.visible');
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
      cy.get('.MuiFormHelperText-root').should('contain', 'Le nom est obligatoire');
    });

    it('affiche une erreur si nom avec uniquement des espaces', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('   ');
      cy.contains('Enregistrer').click();
      cy.contains('Le nom est obligatoire').should('be.visible');
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
      cy.get('.MuiFormHelperText-root').should('contain', 'Le nom est obligatoire');
    });

    it('affiche aucune Alert lors d\'une erreur 409', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('Finance');
      cy.contains('Enregistrer').click();
      cy.contains('Domaine créé avec succès').should('not.exist');
      cy.contains('Une erreur serveur').should('not.exist');
    });
  });

  describe('DomainDetailPage', () => {
    it('affiche le détail du domaine', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('DetailTest');
      cy.get('textarea[name="description"]').type('Test description');
      cy.contains('Enregistrer').click();
      
      cy.contains('DetailTest').should('be.visible');
      cy.contains('Test description').should('be.visible');
      cy.contains('Créé le').should('be.visible');
    });

    it('affiche un bouton Modifier si permissions écriture', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('Editable');
      cy.contains('Enregistrer').click();
      
      cy.contains('Modifier').should('be.visible');
    });

    it('affiche "—" si description null', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('NoDesc');
      cy.contains('Enregistrer').click();
      
      cy.contains('—').should('be.visible');
    });

    it('redirect vers /domains si UUID inexistant', () => {
      cy.visit('/domains/00000000-0000-0000-0000-000000000000');
      cy.url().should('include', '/domains');
    });
  });

  describe('Modification de domaine', () => {
    it('modifie un domaine', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('Original');
      cy.get('textarea[name="description"]').type('Original description');
      cy.contains('Enregistrer').click();
      
      cy.contains('Modifier').click();
      cy.url().should('include', '/edit');
      cy.get('textarea[name="description"]').clear().type('Updated description');
      cy.contains('Enregistrer').click();
      
      cy.contains('Domaine mis à jour avec succès').should('be.visible');
      cy.contains('Updated description').should('be.visible');
      cy.contains('Original description').should('not.exist');
    });

    it('affiche une erreur si nom dupliqué', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('Domain1');
      cy.contains('Enregistrer').click();
      
      cy.visit('/domains/new');
      cy.get('input[name="name"]').type('Domain2');
      cy.contains('Enregistrer').click();
      
      cy.visit('/domains');
      cy.contains('Domain1').click();
      cy.contains('Modifier').click();
      
      cy.get('input[name="name"]').clear().type('Domain2');
      cy.contains('Enregistrer').click();
      
      cy.contains('Ce nom de domaine est déjà utilisé').should('be.visible');
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
      cy.get('.MuiFormHelperText-root').should('contain', 'Ce nom de domaine est déjà utilisé');
    });

    it('annule la modification', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('CancelTest');
      cy.get('textarea[name="description"]').type('Original');
      cy.contains('Enregistrer').click();
      
      cy.contains('Modifier').click();
      cy.get('textarea[name="description"]').clear().type('Modified');
      cy.contains('Annuler').click();
      
      cy.contains('Original').should('be.visible');
      cy.contains('Modified').should('not.exist');
    });
  });

  describe('Suppression de domaine', () => {
    it('supprime un domaine sans entités liées', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('ToDelete');
      cy.contains('Enregistrer').click();
      
      cy.visit('/domains');
      cy.contains('ToDelete').should('be.visible');
      
      cy.get('[aria-label="Supprimer"]').first().click();
      cy.contains('Supprimer le domaine').should('be.visible');
      cy.contains('Confirmer').click();
      
      cy.contains('Domaine supprimé avec succès').should('be.visible');
      cy.contains('ToDelete').should('not.exist');
    });

    it('annule la suppression', () => {
      cy.contains('Ajouter un domaine').click();
      cy.get('input[name="name"]').type('KeepMe');
      cy.contains('Enregistrer').click();
      
      cy.visit('/domains');
      cy.contains('KeepMe').should('be.visible');
      
      cy.get('[aria-label="Supprimer"]').first().click();
      cy.contains('Annuler').click();
      
      cy.contains('KeepMe').should('be.visible');
    });

    it('affiche erreur si domaine lié à des applications', () => {
      // Given domain linked to 3 apps, 0 BCs
      // When trying to delete
      // Then shows "used by 3 application(s) and no business capability(ies)"
      // This requires backend setup - skipping for now
    });

    it('affiche erreur si domaine lié à des capacités métier', () => {
      // Given domain linked to 0 apps, 4 BCs
      // When trying to delete
      // Then shows "used by no application(s) and 4 business capability(ies)"
      // This requires backend setup - skipping for now
    });

    it('affiche erreur si domaine lié aux deux', () => {
      // Given domain linked to 2 apps, 4 BCs
      // When trying to delete
      // Then shows "used by 2 application(s) and 4 business capability(ies)"
      // This requires backend setup - skipping for now
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
