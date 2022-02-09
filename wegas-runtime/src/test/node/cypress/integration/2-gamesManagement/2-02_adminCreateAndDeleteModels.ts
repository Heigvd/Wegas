describe("ch.wegas.client.tests.e2e.CreateAndDeleteModels", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("CreateAndDeleteModels", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.gotoPage("modeler");
    cy.createScenario("Test model", "_EmptyModel\n", true);
    cy.wait(1000);
    cy.createScenario("Test react model", "_EmptyReactModel\n", true);
    cy.visitWegas("/#/modeler");
    cy.removeScenario("Test model");
    cy.wait(1000);
    cy.removeScenario("Test react model");
    cy.logout();
  });
});
