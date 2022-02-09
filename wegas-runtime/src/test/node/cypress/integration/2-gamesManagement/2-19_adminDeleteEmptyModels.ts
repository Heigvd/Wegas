describe("ch.wegas.client.tests.e2e.DeleteEmptyModels", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("DeleteEmptyModels", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.gotoPage("modeler");
    ////////////////////////////////////////////////////////////////////////////////////////////////////7
    cy.removeScenario("_EmptyModel (en)");
    cy.wait(1000);
    cy.removeScenario("_EmptyReactModel (en)");

    ////////////////// JOIN SCENARIO
    // cy.react("GameModelCard", {
    //   props: {
    //     gameModel: {
    //       "@class": "GameModel",
    //       name: "Test scenario",
    //     },
    //   },
    // })
    //   .nthNode(0)
    //   .find("a[title='Edit scenario']")
    //   // .react("CardMainAction")
    //   .click();

    ////////////////////////////////////////////////////////////////////////////////////////////////////7
    cy.logout();
  });
});
