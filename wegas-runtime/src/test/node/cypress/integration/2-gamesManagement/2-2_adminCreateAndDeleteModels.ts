describe("ch.wegas.client.tests.e2e.CreateAndDeleteModels", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("CreateAndDeleteModels", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.gotoPage("modeler");
    ////////////////////////////////////////////////////////////////////////////////////////////////////7
    // const tst = cy.react("IconButton_IconButton", {
    //   // props: {
    //   //   children: "Create a model",
    //   //   // icon: {
    //   //   //   icon: [
    //   //   //     512,
    //   //   //     512,
    //   //   //     [],
    //   //   //     "f055",
    //   //   //     "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z",
    //   //   //   ],
    //   //   //   iconName: "plus-circle",
    //   //   //   prefix: "fas",
    //   //   // },
    //   // },
    // });
    // debugger;
    // tst.getProps("children");

    cy.createScenario("Test model", "_EmptyModel\n", true);
    cy.wait(1000);
    cy.createScenario("Test react model", "_EmptyReactModel\n", true);
    cy.wait(1000);
    cy.removeScenario("Test model");
    cy.wait(1000);
    cy.removeScenario("Test react model");
    cy.logout();
  });
});
