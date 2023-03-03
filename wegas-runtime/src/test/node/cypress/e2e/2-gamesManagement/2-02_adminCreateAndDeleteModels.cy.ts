describe("ch.wegas.client.tests.e2e.CreateAndDeleteModels", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("CreateAndDeleteModels", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.createEmptyModel();
    cy.createTestModel();
    cy.removeTestModel();
    cy.deleteEmptyModel();
    cy.logout();
  });
});
