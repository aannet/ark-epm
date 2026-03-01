describe('Session Expiry & Access Control Pages', () => {
  describe('UnauthorizedPage (401)', () => {
    it('redirects to /401 when unauthenticated', () => {
      cy.visit('/domains');
      cy.url().should('include', '/401');
    });

    it('redirects to /login from UnauthorizedPage', () => {
      cy.visit('/401');
      cy.contains('Se connecter').click();
      cy.url().should('include', '/login');
    });

    it('purges token and redirects to /401 on 401 API response', () => {
      cy.login();
      cy.intercept('GET', '/api/domains', { statusCode: 401, body: { message: 'Unauthorized' } });
      cy.visit('/domains');
      cy.url().should('include', '/401');
    });

    it('renders UnauthorizedPage without authentication', () => {
      cy.visit('/401');
      cy.contains('Session expirée').should('be.visible');
      cy.contains('Se connecter').should('be.visible');
    });
  });

  describe('ForbiddenPage (403)', () => {
    it('redirects to /403 when permission is missing', () => {
      cy.visit('/users');
      cy.url().should('include', '/403');
    });

    it('redirects to / from ForbiddenPage', () => {
      cy.visit('/403');
      cy.contains('Retour à l\'accueil').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('redirects to /403 on 403 API response', () => {
      cy.login();
      cy.intercept('GET', '/api/users', { statusCode: 403, body: { message: 'Forbidden' } });
      cy.visit('/users');
      cy.url().should('include', '/403');
    });

    it('renders ForbiddenPage without authentication', () => {
      cy.visit('/403');
      cy.contains('Accès refusé').should('be.visible');
      cy.contains('Retour à l\'accueil').should('be.visible');
    });
  });
});

describe('PrivateRoute Guard', () => {
  it('PrivateRoute redirects to /401 when no token', () => {
    cy.visit('/domains');
    cy.url().should('include', '/401');
  });

  it('PrivateRoute redirects to /403 when permission missing', () => {
    cy.loginAsReadOnly();
    cy.visit('/users');
    cy.url().should('include', '/403');
  });

  it('PrivateRoute renders page when permission is satisfied', () => {
    cy.login();
    cy.visit('/domains');
    cy.url().should('include', '/domains');
  });

  it('PrivateRoute renders page for authenticated user with no permission requirement', () => {
    cy.login();
    cy.visit('/domains');
    cy.url().should('include', '/domains');
  });
});
