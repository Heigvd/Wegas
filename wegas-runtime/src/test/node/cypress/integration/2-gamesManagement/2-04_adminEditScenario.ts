describe("ch.wegas.client.tests.e2e.EditScenario", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("JoinGame", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.createEmptyModel();
    cy.createTestScenario();

    cy.editScenario("Test react scenario");
    cy.waitForReact();
    cy.get("svg.svg-inline--fa.fa-user.fa-w-14").should("have.length", 1);
    cy.visitWegas();
    cy.waitForReact();

    cy.removeTestScenario();
    cy.deleteEmptyModel();
    cy.logout();
  });
});
