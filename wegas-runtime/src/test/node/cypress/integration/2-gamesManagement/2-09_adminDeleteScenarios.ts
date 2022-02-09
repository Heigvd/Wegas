describe("ch.wegas.client.tests.e2e.DeleteScenario", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("DeleteScenario", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.gotoPage("scenarist");
    ////////////////////////////////////////////////////////////////////////////////////////////////////7
    cy.removeScenario("Test scenario");
    cy.removeScenario("Test react scenario");

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
