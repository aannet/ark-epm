describe('User Management', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/users');
  });

  describe('View the users list', () => {
    it('displays the users list after login', () => {
      cy.contains('Users').should('be.visible');
    });
  });

  describe('Create a new user', () => {
    it('creates a user and redirects to list', () => {
      cy.contains('Add User').click();
      cy.url().should('include', '/users/new');

      cy.get('input[type="email"]').type('newuser@ark.io');
      cy.get('input[type="password"]').type('SecurePass1!');
      cy.get('input[name="firstName"]').type('Alice');
      cy.get('input[name="lastName"]').type('Martin');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/users');
      cy.contains('newuser@ark.io').should('be.visible');
    });
  });

  describe('Create a user without optional fields', () => {
    it('creates a user without optional fields', () => {
      cy.contains('Add User').click();
      cy.get('input[type="email"]').type('minimal@ark.io');
      cy.get('input[type="password"]').type('SecurePass1!');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/users');
      cy.contains('minimal@ark.io').should('be.visible');
    });
  });

  describe('Edit an existing user', () => {
    it('edits a user and updates the list', () => {
      cy.contains('Edit').first().click();
      cy.url().should('include', '/edit');

      cy.get('input[name="firstName"]').clear().type('Alicia');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/users');
      cy.contains('Alicia').should('be.visible');
    });
  });

  describe('Deactivate a user', () => {
    it('deactivates a user and shows inactive badge', () => {
      cy.contains('Deactivate').first().click();
      cy.contains('Are you sure').should('be.visible');
      cy.contains('Deactivate').click();

      cy.contains('Inactive').should('be.visible');
    });
  });

  describe('Reactivate a user', () => {
    it('reactivates an inactive user', () => {
      cy.contains('Activate').first().click();
      cy.contains('Active').should('be.visible');
    });
  });

  describe('Assign a role to a user', () => {
    it('assigns a role to a user', () => {
      cy.contains('Edit').first().click();
      cy.get('select[name="roleId"]').select('Business Owner');
      cy.get('button[type="submit"]').click();

      cy.contains('Business Owner').should('be.visible');
    });
  });

  describe('Error paths', () => {
    it('shows inline error on duplicate email', () => {
      cy.contains('Add User').click();
      cy.get('input[type="email"]').type('admin@ark.io');
      cy.get('input[type="password"]').type('SecurePass1!');
      cy.get('button[type="submit"]').click();

      cy.contains('Email already in use').should('be.visible');
      cy.url().should('include', '/users/new');
    });

    it('shows validation error on invalid email format', () => {
      cy.contains('Add User').click();
      cy.get('input[type="email"]').type('not-an-email');
      cy.get('input[type="password"]').type('SecurePass1!');
      cy.get('button[type="submit"]').click();

      cy.contains('invalid').should('be.visible');
    });

    it('shows validation error on short password', () => {
      cy.contains('Add User').click();
      cy.get('input[type="email"]').type('short@ark.io');
      cy.get('input[type="password"]').type('short');
      cy.get('button[type="submit"]').click();

      cy.contains('at least 8 characters').should('be.visible');
    });

    it('redirects to /users on unknown UUID edit', () => {
      cy.visit('/users/00000000-0000-0000-0000-000000000000/edit');
      cy.url().should('include', '/users');
    });
  });

  describe('Access control paths', () => {
    it('redirects to /403 on /users without permission', () => {
      cy.logout();
      cy.loginAsReadOnly();
      cy.visit('/users');
      cy.url().should('include', '/403');
    });

    it('redirects to /403 on /users/new without permission', () => {
      cy.logout();
      cy.loginAsReadOnly();
      cy.visit('/users/new');
      cy.url().should('include', '/403');
    });
  });
});
