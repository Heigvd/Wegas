describe("ch.wegas.client.tests.e2e.ManageGames", () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("LoginAsAdminCreateCreateModel", () => {
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
    cy.gotoPage("admin");
    cy.react("ConfirmIconButton", {
      props: {
        title: "Create an empty Model",
      },
    }).click();
    cy.react("Clickable", {
      props: {
        title: "confirm Create an empty Model",
      },
    }).click();
    cy.react("ConfirmIconButton", {
      props: {
        title: "Create an empty React Model",
      },
    }).click();
    cy.react("Clickable", {
      props: {
        title: "confirm Create an empty React Model",
      },
    }).click();
    cy.logout();
  });
});
