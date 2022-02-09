describe("ch.wegas.client.tests.e2e.CreateScenario", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("CreateScenario", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.gotoPage("scenarist");
    ////////////////////////////////////////////////////////////////////////////////////////////////////7
    cy.createScenario("Test scenario", "_EmptyModel\n");
    cy.createScenario("Test react scenario", "_EmptyReactModel\n");

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
