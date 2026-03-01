describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Successful login redirects to home', () => {
    it('logs in and redirects to home', () => {
      cy.get('input[type="email"]').type('admin@ark.io');
      cy.get('input[type="password"]').type('admin123456');
      cy.get('button[type="submit"]').click();

      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Login page is accessible without authentication', () => {
    it('renders login page when unauthenticated', () => {
      cy.url().should('include', '/login');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });
  });

  describe('Authenticated user is redirected away from login page', () => {
    it('redirects authenticated user away from /login', () => {
      cy.login();
      cy.visit('/login');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Auth/me returns the current user profile', () => {
    it('returns user profile without passwordHash', () => {
      cy.login();
      cy.request('GET', '/auth/me').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('email', 'admin@ark.io');
        expect(response.body).to.have.property('firstName');
        expect(response.body).to.have.property('lastName');
        expect(response.body).to.have.property('role');
        expect(response.body).to.have.property('isActive');
        expect(response.body).to.not.have.property('passwordHash');
      });
    });
  });

  describe('Logout clears the session', () => {
    it('logout purges token and redirects to /login', () => {
      cy.login();
      cy.logout();
      cy.url().should('include', '/login');
    });
  });

  describe('Error paths', () => {
    it('shows inline error on unknown email', () => {
      cy.get('input[type="email"]').type('unknown@ark.io');
      cy.get('input[type="password"]').type('anyPassword');
      cy.get('button[type="submit"]').click();

      cy.contains('Invalid credentials').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('shows inline error on wrong password', () => {
      cy.get('input[type="email"]').type('admin@ark.io');
      cy.get('input[type="password"]').type('wrongPassword');
      cy.get('button[type="submit"]').click();

      cy.contains('Invalid credentials').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('shows inline error on disabled account', () => {
      cy.get('input[type="email"]').type('disabled@ark.io');
      cy.get('input[type="password"]').type('anyPassword');
      cy.get('button[type="submit"]').click();

      cy.contains('Account disabled').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('shows validation error when email is empty', () => {
      cy.get('input[type="password"]').type('anyPassword');
      cy.get('button[type="submit"]').click();

      cy.get('input[type="email"]').should('have.attr', 'required');
    });

    it('shows validation error when password is empty', () => {
      cy.get('input[type="email"]').type('admin@ark.io');
      cy.get('button[type="submit"]').click();

      cy.get('input[type="password"]').should('have.attr', 'required');
    });
  });
});
