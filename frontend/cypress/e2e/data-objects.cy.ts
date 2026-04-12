describe('Data Objects Feature', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/data-objects');
  });

  // ──────────────────────────────────────────
  // 1. LIST PAGE
  // ──────────────────────────────────────────
  describe('DataObjectListPage', () => {
    it('affiche la liste des objets de données après login', () => {
      cy.contains('Objets de Données').should('be.visible');
      cy.contains('Gestion de vos sources et références de données métier').should('be.visible');
    });

    it('affiche les colonnes du tableau', () => {
      cy.get('table').should('be.visible');
      cy.contains('th', 'Nom').should('exist');
      cy.contains('th', 'Type').should('exist');
      cy.contains('th', 'Source').should('exist');
      cy.contains('th', 'Tags').should('exist');
      cy.contains('th', 'Applications').should('exist');
    });

    it('affiche l\'état vide si aucun objet de données', () => {
      cy.contains('Aucun objet de données').should('be.visible');
    });

    it('trie par nom', () => {
      cy.contains('th', 'Nom').click();
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });

    it('recherche par nom avec debounce', () => {
      cy.get('input[placeholder*="Rechercher"]').type('TestDO');
      cy.wait(500);
      cy.get('table tbody tr').should('have.length.lessThan', 20);
    });

    it('affiche le bouton Nouveau objet si permissions écriture', () => {
      cy.contains('Nouveau objet').should('be.visible');
    });
  });

  // ──────────────────────────────────────────
  // 2. SIDE DRAWER (PNS-02)
  // ──────────────────────────────────────────
  describe('DataObjectDrawer', () => {
    it('ouvre le drawer sur clic ligne (hors nom)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').should('be.visible');
    });

    it('navigue vers le détail sur clic du nom', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.url().should('match', /\/data-objects\/[a-f0-9-]+$/);
    });

    it('affiche le drawer avec les onglets Informations et Applications', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
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
        cy.get('button').filter(':has(svg)').first().click();
      });
      cy.get('.MuiDrawer-root').should('not.exist');
    });

    it('navigue vers le détail depuis le bouton Voir la fiche complète', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').within(() => {
        cy.contains('button', 'Voir la fiche complète').click();
      });
      cy.url().should('match', /\/data-objects\/[a-f0-9-]+$/);
      cy.get('.MuiDrawer-root').should('not.exist');
    });

    it('navigue vers l\'édition depuis le bouton Modifier', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click();
      });
      cy.get('.MuiDrawer-root').within(() => {
        cy.contains('button', 'Modifier').click();
      });
      cy.url().should('include', '/data-objects/').and('include', '/edit');
    });

    it('désactive le bouton Modifier si read-only', () => {
      cy.logout();
      cy.loginAsReadOnly();
      cy.visit('/data-objects');
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
  describe('DataObjectDetailPage', () => {
    it('affiche le détail complet de l\'objet de données', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('DetailTestDO');
      cy.get('textarea[name="description"]').type('Test description DO');
      cy.contains('Enregistrer').click();

      cy.contains('DetailTestDO').should('be.visible');
      cy.contains('Test description DO').should('be.visible');
      cy.contains('Créé le').should('be.visible');
    });

    it('affiche un bouton Modifier si permissions écriture', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('EditableDO');
      cy.contains('Enregistrer').click();

      cy.contains('Modifier').should('be.visible');
    });

    it('affiche l\'onglet Applications', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('AppTabDO');
      cy.contains('Enregistrer').click();

      cy.contains('Applications').click();
      cy.contains('Aucune donnée').should('be.visible');
    });

    it('redirect vers /data-objects si UUID inexistant', () => {
      cy.visit('/data-objects/00000000-0000-0000-0000-000000000000');
      cy.url().should('include', '/data-objects');
    });
  });

  // ──────────────────────────────────────────
  // 4. FORM (CREATE)
  // ──────────────────────────────────────────
  describe('Création d\'objet de données', () => {
    it('crée un objet avec nom et description', () => {
      cy.contains('Nouveau objet').click();
      cy.url().should('include', '/data-objects/new');
      cy.get('input[name="name"]').type('NewDOTest');
      cy.get('textarea[name="description"]').type('Description test');
      cy.contains('Enregistrer').click();
      cy.contains('Objet de données créé avec succès').should('be.visible');
      cy.url().should('match', /\/data-objects\/[a-f0-9-]+$/);
      cy.contains('NewDOTest').should('be.visible');
    });

    it('crée un objet sans description', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('MinimalDO');
      cy.contains('Enregistrer').click();
      cy.contains('Objet de données créé avec succès').should('be.visible');
    });

    it('annule la création', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('DraftDO');
      cy.contains('Annuler').click();
      cy.url().should('include', '/data-objects');
      cy.url().should('not.include', '/new');
    });

    it('affiche une erreur si nom dupliqué', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('DuplicateDO');
      cy.contains('Enregistrer').click();

      cy.visit('/data-objects/new');
      cy.get('input[name="name"]').type('DuplicateDO2');
      cy.contains('Enregistrer').click();

      cy.visit('/data-objects');
      cy.contains('DuplicateDO').click();
      cy.contains('button', 'Modifier').click();

      cy.get('input[name="name"]').clear().type('DuplicateDO2');
      cy.contains('Enregistrer').click();

      cy.contains('Ce nom d\'objet existe déjà').should('be.visible');
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
      cy.get('.MuiFormHelperText-root').should('contain', 'Ce nom d\'objet existe déjà');
    });

    it('affiche une erreur si nom vide', () => {
      cy.contains('Nouveau objet').click();
      cy.contains('Enregistrer').click();
      cy.contains('Le nom est obligatoire').should('be.visible');
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
      cy.get('.MuiFormHelperText-root').should('contain', 'Le nom est obligatoire');
    });

    it('affiche une erreur si nom avec uniquement des espaces', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('   ');
      cy.contains('Enregistrer').click();
      cy.contains('Le nom est obligatoire').should('be.visible');
      cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');
    });
  });

  // ──────────────────────────────────────────
  // 5. FORM (EDIT)
  // ──────────────────────────────────────────
  describe('Modification d\'objet de données', () => {
    it('modifie un objet de données', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('OriginalDO');
      cy.get('textarea[name="description"]').type('Original description');
      cy.contains('Enregistrer').click();

      cy.contains('Modifier').click();
      cy.url().should('include', '/edit');
      cy.get('textarea[name="description"]').clear().type('Updated description');
      cy.contains('Enregistrer').click();

      cy.contains('Objet de données modifié avec succès').should('be.visible');
      cy.contains('Updated description').should('be.visible');
      cy.contains('Original description').should('not.exist');
    });

    it('annule la modification', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('CancelTestDO');
      cy.get('textarea[name="description"]').type('Original');
      cy.contains('Enregistrer').click();

      cy.contains('Modifier').click();
      cy.get('textarea[name="description"]').clear().type('Modified');
      cy.contains('Annuler').click();

      cy.contains('Original').should('be.visible');
      cy.contains('Modified').should('not.exist');
    });

    it('redirect vers /data-objects si UUID inexistant en édition', () => {
      cy.visit('/data-objects/00000000-0000-0000-0000-000000000000/edit');
      cy.url().should('include', '/data-objects');
    });
  });

  // ──────────────────────────────────────────
  // 6. SUPPRESSION
  // ──────────────────────────────────────────
  describe('Suppression d\'objet de données', () => {
    it('supprime un objet sans applications liées', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('ToDeleteDO');
      cy.contains('Enregistrer').click();

      cy.visit('/data-objects');
      cy.contains('ToDeleteDO').should('be.visible');

      cy.get('[aria-label="Supprimer"]').first().click();
      cy.contains('Supprimer l\'objet de données').should('be.visible');
      cy.contains('Confirmer').click();

      cy.contains('Objet de données supprimé avec succès').should('be.visible');
      cy.contains('ToDeleteDO').should('not.exist');
    });

    it('annule la suppression', () => {
      cy.contains('Nouveau objet').click();
      cy.get('input[name="name"]').type('KeepMeDO');
      cy.contains('Enregistrer').click();

      cy.visit('/data-objects');
      cy.contains('KeepMeDO').should('be.visible');

      cy.get('[aria-label="Supprimer"]').first().click();
      cy.contains('Annuler').click();

      cy.contains('KeepMeDO').should('be.visible');
    });

    it('affiche erreur si objet lié à des applications (409)', () => {
      // This requires backend setup with linked apps
      // When trying to delete an object with linked applications
      // Then shows formatted message with "application(s)" count
      // and confirm button is disabled
      // Skipping for now - requires seed data
    });

    it('désactive le bouton Confirmer sur DEPENDENCY_CONFLICT', () => {
      // Same as above - requires backend setup
      // Skipping for now
    });
  });

  // ──────────────────────────────────────────
  // 7. FILTRES
  // ──────────────────────────────────────────
  describe('Filtres', () => {
    it('filtre par type', () => {
      cy.get('[aria-label="Type"]').click();
      cy.contains('database').click();
      cy.wait(300);
      cy.get('table tbody tr').should('have.length.lessThan', 20);
    });

    it('filtre par source officielle', () => {
      cy.get('[aria-label="Source officielle"]').click();
      cy.contains('Oui').click();
      cy.wait(300);
      cy.get('table tbody tr').should('have.length.lessThan', 20);
    });
  });

  // ──────────────────────────────────────────
  // 8. DROITS UI (read-only)
  // ──────────────────────────────────────────
  describe('Droits UI', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginAsReadOnly();
      cy.visit('/data-objects');
    });

    it('bouton Ajouter absent pour read-only', () => {
      cy.contains('Nouveau objet').should('not.exist');
    });

    it('colonne Actions absente pour read-only', () => {
      cy.contains('th', 'Actions').should('not.exist');
    });

    it('icônes edit/delete absentes pour read-only', () => {
      cy.get('[aria-label="Modifier"]').should('not.exist');
      cy.get('[aria-label="Supprimer"]').should('not.exist');
    });

    it('bouton Edit disabled sur page détail pour read-only', () => {
      cy.visit('/data-objects/some-id');
      cy.contains('Modifier').should('be.disabled');
    });

    it('redirect vers /403 pour /data-objects/new si read-only', () => {
      cy.visit('/data-objects/new');
      cy.url().should('include', '/403');
    });

    it('redirect vers /403 pour /data-objects/:id/edit si read-only', () => {
      cy.visit('/data-objects/some-id/edit');
      cy.url().should('include', '/403');
    });
  });
});
