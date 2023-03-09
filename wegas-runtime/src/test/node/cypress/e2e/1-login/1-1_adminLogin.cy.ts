describe("ch.wegas.client.tests.e2e.Login", () => {
  beforeEach(() => {
    cy.visitWegas();
  });

  it("LoginAsAdminAndLogout", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.logout();
  });
});
