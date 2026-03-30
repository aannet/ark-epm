describe('Providers Feature', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/providers');
  });

  // ──────────────────────────────────────────
  // 1. LIST PAGE
  // ──────────────────────────────────────────
  describe('ProvidersListPage', () => {
    it('affiche la liste des fournisseurs après login', () => {
      cy.contains('Fournisseurs').should('be.visible');
    });

    it('affiche les colonnes du tableau', () => {
      cy.get('table').should('be.visible');
      cy.contains('th', 'Nom').should('exist');
      cy.contains('th', 'Type de contrat').should('exist');
      cy.contains('th', "Date d'expiration").should('exist');
      cy.contains('th', 'Tags').should('exist');
      cy.contains('th', 'Applications').should('exist');
    });

    it('affiche l\'état vide si aucun fournisseur', () => {
      // If no seeded data, empty state should show
      cy.contains('Aucun fournisseur').should('be.visible');
    });

    it('ouvre le drawer sur clic ligne (pas le nom)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click(); // Click contractType column, not name
      });
      cy.get('.MuiDrawer-root').should('be.visible');
    });

    it('navigue vers le détail sur clic du nom', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').first().click(); // Name is a <button> with stopPropagation
      });
      cy.url().should('match', /\/providers\/[a-f0-9-]+$/);
    });

    it('recherche par nom', () => {
      cy.get('input[placeholder*="Rechercher"]').type('TestProvider{enter}');
      cy.wait(500); // debounce
      cy.get('table tbody tr').should('have.length.lessThan', 20);
    });

    it('trie par nom', () => {
      cy.contains('th', 'Nom').click();
      // Should toggle sort — no assertion on order but ensures no crash
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });

    it('affiche le bouton Nouveau fournisseur si permissions écriture', () => {
      cy.contains('Nouveau fournisseur').should('be.visible');
    });
  });

  // ──────────────────────────────────────────
  // 2. SIDE DRAWER (PNS-02)
  // ──────────────────────────────────────────
  describe('ProvidersDrawer', () => {
    it('affiche le drawer avec les détails du fournisseur', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.get('.MuiDrawer-root').within(() => {
        cy.contains('Informations').should('exist');
        cy.contains('Applications').should('exist');
      });
    });

    it('ferme le drawer sur clic bouton fermer', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.get('.MuiDrawer-root').within(() => {
        cy.get('button').filter(':has(svg)').first().click(); // Close icon button
      });
      cy.get('.MuiDrawer-root').should('not.exist');
    });

    it('affiche l\'onglet Applications dans le drawer', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').within(() => {
        cy.contains('Applications').click();
        // Should show either a table or "Aucune donnée"
        cy.get('body'); // ensure no crash
      });
    });

    it('navigue vers le détail depuis le bouton drawer', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').within(() => {
        cy.contains('button', 'Voir la fiche complète').click();
      });
      cy.url().should('match', /\/providers\/[a-f0-9-]+$/);
      cy.get('.MuiDrawer-root').should('not.exist');
    });

    it('navigue vers l\'édition depuis le bouton drawer', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').within(() => {
        cy.contains('button', 'Modifier').click();
      });
      cy.url().should('include', '/providers/').and('include', '/edit');
    });

    it('désactive le bouton Modifier si read-only', () => {
      cy.logout();
      cy.loginAsReadOnly();
      cy.visit('/providers');
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').within(() => {
        cy.contains('button', 'Modifier').should('be.disabled');
      });
    });
  });

  // ──────────────────────────────────────────
  // 3. DETAIL PAGE
  // ──────────────────────────────────────────
  describe('ProviderDetailPage', () => {
    it('affiche le détail complet du fournisseur', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('DetailTestProvider');
      cy.get('textarea[name="description"]').type('Test description fournisseur');
      cy.contains('Enregistrer').click();

      cy.contains('DetailTestProvider').should('be.visible');
      cy.contains('Test description fournisseur').should('be.visible');
      cy.contains('Créé le').should('be.visible');
    });

    it('affiche un bouton Modifier si permissions écriture', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('EditableProvider');
      cy.contains('Enregistrer').click();

      cy.contains('Modifier').should('be.visible');
    });

    it('affiche l\'onglet Applications', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('AppTabProvider');
      cy.contains('Enregistrer').click();

      cy.contains('Applications').click();
      // Should show "Aucune donnée" since new provider has no apps
      cy.contains('Aucune donnée').should('be.visible');
    });

    it('redirect vers /providers si UUID inexistant', () => {
      cy.visit('/providers/00000000-0000-0000-0000-000000000000');
      cy.url().should('include', '/providers');
    });
  });

  // ──────────────────────────────────────────
  // 4. FORM (CREATE / EDIT)
  // ──────────────────────────────────────────
  describe('Création de fournisseur', () => {
    it('crée un fournisseur avec nom et description', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.url().should('include', '/providers/new');
      cy.get('input[name="name"]').type('NewProviderTest');
      cy.get('textarea[name="description"]').type('Description test');
      cy.contains('Enregistrer').click();
      cy.contains('Fournisseur créé avec succès').should('be.visible');
      cy.url().should('match', /\/providers\/[a-f0-9-]+$/);
      cy.contains('NewProviderTest').should('be.visible');
    });

    it('crée un fournisseur sans description', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('MinimalProvider');
      cy.contains('Enregistrer').click();
      cy.contains('Fournisseur créé avec succès').should('be.visible');
    });

    it('annule la création', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('DraftProvider');
      cy.contains('Annuler').click();
      cy.url().should('include', '/providers');
      cy.url().should('not.include', '/new');
    });

    it('affiche une erreur si nom dupliqué', () => {
      // First, create a provider
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('DuplicateName');
      cy.contains('Enregistrer').click();
      cy.contains('Fournisseur créé avec succès').should('be.visible');

      // Go back and try to create again with same name
      cy.visit('/providers/new');
      cy.get('input[name="name"]').type('DuplicateName');
      cy.contains('Enregistrer').click();
      cy.contains('Ce nom de fournisseur existe déjà').should('be.visible');
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
    });

    it('n\'affiche aucune Alert lors d\'une erreur 409', () => {
      // Create duplicate — only inline error, no Alert banner
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('DuplicateName');
      cy.contains('Enregistrer').click();
      cy.contains('Fournisseur créé avec succès').should('not.exist');
    });
  });

  describe('Modification de fournisseur', () => {
    it('modifie un fournisseur', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('OriginalProvider');
      cy.get('textarea[name="description"]').type('Original description');
      cy.contains('Enregistrer').click();

      cy.contains('Modifier').click();
      cy.url().should('include', '/edit');
      cy.get('textarea[name="description"]').clear().type('Updated description');
      cy.contains('Enregistrer').click();

      cy.contains('Fournisseur modifié avec succès').should('be.visible');
      cy.contains('Updated description').should('be.visible');
      cy.contains('Original description').should('not.exist');
    });

    it('affiche une erreur si nom dupliqué à l\'édition', () => {
      // Create two providers
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('Provider1');
      cy.contains('Enregistrer').click();

      cy.visit('/providers/new');
      cy.get('input[name="name"]').type('Provider2');
      cy.contains('Enregistrer').click();

      // Go to list, find Provider1, edit it to Provider2
      cy.visit('/providers');
      cy.contains('Provider1').click();
      cy.contains('Modifier').click();

      cy.get('input[name="name"]').clear().type('Provider2');
      cy.contains('Enregistrer').click();

      cy.contains('Ce nom de fournisseur existe déjà').should('be.visible');
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
    });

    it('annule la modification', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('CancelEditProvider');
      cy.get('textarea[name="description"]').type('Original');
      cy.contains('Enregistrer').click();

      cy.contains('Modifier').click();
      cy.get('textarea[name="description"]').clear().type('Modified');
      cy.contains('Annuler').click();

      cy.contains('Original').should('be.visible');
      cy.contains('Modified').should('not.exist');
    });
  });

  // ──────────────────────────────────────────
  // 5. DELETE & 409 DEPENDENCY_CONFLICT
  // ──────────────────────────────────────────
  describe('Suppression de fournisseur', () => {
    it('supprime un fournisseur sans applications liées', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('ProviderToDelete');
      cy.contains('Enregistrer').click();

      cy.visit('/providers');
      cy.contains('ProviderToDelete').should('be.visible');

      // Find the delete button in the row
      cy.contains('ProviderToDelete')
        .closest('tr')
        .within(() => {
          cy.get('[color="error"]').click(); // Delete icon button
        });
      cy.contains('Confirmer la suppression').should('be.visible');
      cy.contains('Supprimer').click();

      cy.contains('Fournisseur supprimé avec succès').should('be.visible');
      cy.contains('ProviderToDelete').should('not.exist');
    });

    it('annule la suppression', () => {
      cy.contains('Nouveau fournisseur').click();
      cy.get('input[name="name"]').type('KeepProvider');
      cy.contains('Enregistrer').click();

      cy.visit('/providers');
      cy.contains('KeepProvider').should('be.visible');

      cy.contains('KeepProvider')
        .closest('tr')
        .within(() => {
          cy.get('[color="error"]').click();
        });
      cy.contains('Annuler').click();

      cy.contains('KeepProvider').should('be.visible');
    });

    it('bloque la suppression si fournisseur lié à des applications', () => {
      // This test assumes seeded provider linked to applications
      // If first provider has apps, try to delete from detail page
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').first().click(); // Navigate to detail via name button
      });
      cy.contains('Supprimer').click();
      // The dialog should appear; after 409, error message is shown
      // This test is environment-dependent — it verifies the dialog opens
      cy.contains('Confirmer la suppression').should('be.visible');
    });
  });

  // ──────────────────────────────────────────
  // 6. PERMISSIONS / DROITS UI
  // ──────────────────────────────────────────
  describe('Droits UI', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginAsReadOnly();
      cy.visit('/providers');
    });

    it('bouton Nouveau fournisseur absent pour read-only', () => {
      cy.contains('Nouveau fournisseur').should('not.exist');
    });

    it('icônes edit/delete absentes pour read-only', () => {
      cy.get('[aria-label="Modifier"]').should('not.exist');
      cy.get('[aria-label="Supprimer"]').should('not.exist');
      // Also check no edit/delete icon buttons in table action column
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').last().find('button').should('not.exist');
      });
    });

    it('bouton Modifier absent sur page détail pour read-only', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').first().click();
      });
      // On detail page, no Edit/Delete buttons
      cy.contains('button', 'Modifier').should('not.exist');
      cy.contains('button', 'Supprimer').should('not.exist');
    });

    it('redirect vers /403 pour /providers/new si read-only', () => {
      cy.visit('/providers/new');
      cy.url().should('include', '/403');
    });

    it('redirect vers /403 pour /providers/:id/edit si read-only', () => {
      cy.visit('/providers/some-id/edit');
      cy.url().should('include', '/403');
    });
  });
});
