describe("ch.wegas.client.tests.e2e.ManageGames", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("LoginAsAdminCreateGameAndDeleteGame", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.gotoPage("scenarist");
    ////////////////////////////////////////////////////////////////////////////////////////////////////7
    cy.createScenario("Test scenario", "_Empty React Scenario [EN]\n");
    cy.removeScenario("Test scenario");

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
