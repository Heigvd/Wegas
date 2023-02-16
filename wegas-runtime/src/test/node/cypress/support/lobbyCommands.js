Cypress.Commands.add("gotoPage", (page) => {
  cy.log("Going to " + page + " page...");
  cy.react("MainMenu").click({
    force: true,
  });
  cy.react("MainMenuLink", { props: { to: "/" + page } }).click({
    force: true,
  });
});

Cypress.Commands.add("createEmptyModel", () => {
  cy.gotoPage("admin");
  cy.react("ConfirmIconButton", {
    props: {
      title: "Create an empty Model",
    },
  })
    .should("have.length", 1)
    .click();

  cy.react("Clickable", {
    props: {
      title: "confirm Create an empty Model",
    },
  })
    .should("have.length", 1)
    .click();

  cy.react("ConfirmIconButton", {
    props: {
      title: "Create an empty React Model",
    },
  })
    .should("have.length", 1)
    .click();
  cy.react("Clickable", {
    props: {
      title: "confirm Create an empty React Model",
    },
  })
    .should("have.length", 1)
    .click();
  cy.simulatePusher();
});

Cypress.Commands.add("deleteEmptyModel", () => {
  cy.gotoPage("modeler");
  cy.removeScenario("_EmptyModel (en)");
  cy.wait(1000);
  cy.removeScenario("_EmptyReactModel (en)");
  cy.wait(1000);
});

Cypress.Commands.add("createScenario", (scenarioName, basedOn, model) => {
  cy.react("IconButton", {
    props: {
      title: model ? "Create a model" : "Create scenario",
    },
  }).click();
  cy.react("Input", {
    props: { placeholder: "Scenario name" },
  }).type(scenarioName);

  cy.react("SelectContainer", {}).type(basedOn);

  cy.react("Clickable", {
    props: { title: "create" },
  }).click();

  cy.simulatePusher();
});

Cypress.Commands.add("createTestModel", () => {
  cy.gotoPage("modeler");
  cy.createScenario("Test model", "_EmptyModel\n", true);
  cy.createScenario("Test react model", "_EmptyReactModel\n", true);
});

Cypress.Commands.add("createTestScenario", () => {
  cy.gotoPage("scenarist");
  cy.createScenario("Test scenario", "_EmptyModel\n");
  cy.createScenario("Test react scenario", "_EmptyReactModel\n");
});

Cypress.Commands.add("removeScenario", (scenarioName) => {
  cy.react("GameModelCard", {
    props: {
      gameModel: {
        "@class": "GameModel",
        name: scenarioName,
      },
    },
  })
    .nthNode(0)
    .find("div[title='move to archives']")
    .click();

  cy.react("Clickable", {
    props: {
      title: "confirm move to archives",
    },
  }).click();
});

Cypress.Commands.add("removeTestModel", () => {
  cy.visitWegas("/#/modeler");
  cy.removeScenario("Test model");
  cy.wait(1000);
  cy.removeScenario("Test react model");
  cy.wait(1000);
});

Cypress.Commands.add("removeTestScenario", () => {
  cy.gotoPage("scenarist");
  cy.removeScenario("Test scenario");
  cy.wait(1000);
  cy.removeScenario("Test react scenario");
  cy.wait(1000);
});

Cypress.Commands.add("editScenario", (gameName) => {
  cy.gotoPage("scenarist");
  cy.react("GameModelCard", {
    props: {
      gameModel: {
        name: gameName,
      },
    },
  })
    .nthNode(0)
    .find("a[title='Edit scenario']")
    .invoke("removeAttr", "target")
    .click();
  cy.waitForReact();
});
