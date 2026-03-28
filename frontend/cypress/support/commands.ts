/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      loginAsReadOnly(): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

const API_URL = Cypress.env('API_URL') || 'http://localhost:3001';

Cypress.Commands.add('login', (email = 'admin@ark.io', password = 'admin123456') => {
  cy.request('POST', `${API_URL}/auth/login`, { email, password }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('accessToken');
    expect(response.body).to.have.property('user');

    cy.window().then((win) => {
      (win as any).__ARK_TOKEN__ = response.body.accessToken;
      (win as any).__ARK_USER__ = response.body.user;
    });

    cy.visit('/');
  });
});

Cypress.Commands.add('loginAsReadOnly', () => {
  cy.request('POST', `${API_URL}/auth/login`, {
    email: 'readonly@ark.io',
    password: 'readonly123456',
  }).then((response) => {
    cy.window().then((win) => {
      (win as any).__ARK_TOKEN__ = response.body.accessToken;
      (win as any).__ARK_USER__ = response.body.user;
    });

    cy.visit('/');
  });
});

Cypress.Commands.add('logout', () => {
  // Call POST /auth/logout (best-effort - ignore errors)
  cy.request({
    method: 'POST',
    url: `${API_URL}/auth/logout`,
    failOnStatusCode: false,
  }).catch(() => {
    // Ignore errors - best-effort
  });

  // Clear in-memory token
  cy.window().then((win) => {
    (win as any).__ARK_TOKEN__ = null;
    (win as any).__ARK_USER__ = null;
  });

  cy.visit('/login');
});

export {};
