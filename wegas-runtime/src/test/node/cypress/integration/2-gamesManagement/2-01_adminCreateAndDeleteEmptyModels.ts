describe("ch.wegas.client.tests.e2e.CreateAndDeleteEmptyModels", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("CreateAndDeleteEmptyModels", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.createEmptyModel();
    cy.deleteEmptyModel();
    cy.logout();
  });
});
