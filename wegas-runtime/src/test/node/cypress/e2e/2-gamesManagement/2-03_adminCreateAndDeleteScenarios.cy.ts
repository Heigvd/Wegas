describe("ch.wegas.client.tests.e2e.CreateAndDeleteScenarios", () => {
  beforeEach(() => {
    cy.visitWegas();
  });

  it("CreateAndDeleteScenarios", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.createEmptyModel();
    cy.createTestScenario();
    cy.removeTestScenario();
    cy.deleteEmptyModel();
    cy.logout();
  });
});
