describe('Role & Permission Management', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/roles');
  });

  describe('View the roles list', () => {
    it('displays the roles list after login', () => {
      cy.contains('Roles').should('be.visible');
    });
  });

  describe('View an empty roles list', () => {
    it('shows seeded roles in the list', () => {
      cy.contains('Admin').should('be.visible');
    });
  });

  describe('Create a new role', () => {
    it('creates a role and shows it in the list', () => {
      cy.contains('Add Role').click();
      cy.url().should('include', '/roles/new');

      cy.get('input[name="name"]').type('Read Only');
      cy.get('input[name="description"]').type('Can only view data');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/roles');
      cy.contains('Read Only').should('be.visible');
    });
  });

  describe('Edit a role permissions', () => {
    it('adds a permission to a role', () => {
      cy.contains('Edit').first().click();
      cy.url().should('include', '/roles/');

      cy.contains('providers:write').parent().click();
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/roles');
    });
  });

  describe('Remove a permission from a role', () => {
    it('removes a permission from a role', () => {
      cy.contains('Edit').first().click();
      cy.contains('providers:write').parent().click();
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/roles');
    });
  });

  describe('Delete a role with no assigned users', () => {
    it('deletes an unassigned role', () => {
      cy.contains('Add Role').click();
      cy.get('input[name="name"]').type('Test Role');
      cy.get('button[type="submit"]').click();

      cy.contains('Delete').first().click();
      cy.contains('Are you sure').should('be.visible');
      cy.contains('Delete').click();

      cy.contains('Test Role').should('not.exist');
    });
  });

  describe('Cancel a role deletion', () => {
    it('cancels role deletion and keeps role in list', () => {
      cy.contains('Add Role').click();
      cy.get('input[name="name"]').type('Cancelable Role');
      cy.get('button[type="submit"]').click();

      cy.contains('Delete').first().click();
      cy.contains('Cancel').click();

      cy.contains('Cancelable Role').should('be.visible');
    });
  });

  describe('Error paths', () => {
    it('shows inline error on duplicate role name', () => {
      cy.contains('Add Role').click();
      cy.get('input[name="name"]').type('Admin');
      cy.get('button[type="submit"]').click();

      cy.contains('already in use').should('be.visible');
    });

    it('shows validation error when role name is empty', () => {
      cy.contains('Add Role').click();
      cy.get('button[type="submit"]').click();

      cy.contains('required').should('be.visible');
    });

    it('shows 409 error when deleting an assigned role', () => {
      cy.contains('Delete').first().click();
      cy.contains('Delete').click();

      cy.contains('assigned to').should('be.visible');
    });
  });

  describe('Access control paths', () => {
    it('redirects to /403 on /roles without permission', () => {
      cy.logout();
      cy.loginAsReadOnly();
      cy.visit('/roles');
      cy.url().should('include', '/403');
    });
  });
});
