describe("ch.colabproject.colab.tests.e2e.Login", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("LoginAsAdminAndLogout", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.logout();
  });
  // it("Logout", () => {
  // });
});