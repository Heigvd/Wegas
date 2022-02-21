// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("visitWegas", (path) => {
  const url = Cypress.env("WEGAS_URL");
  if (url) {
    cy.visit(url + (path ? path : ""));
  } else {
    throw "please set env WEGAS_URL to the test url";
  }
});

Cypress.Commands.add("login", (identifier, password) => {
  cy.log("Testing login...");
  cy.react("Input", {
    props: { type: "text", placeholder: "e-mail or username" },
  }).type(identifier);

  cy.react("Input", {
    props: { type: "password", placeholder: "password" },
  }).type(password);

  cy.react("Button", { props: { key: "submit", label: "login" } }).click({
    force: true,
  });
  cy.log("Login working!");
});

Cypress.Commands.add("logout", () => {
  cy.log("Testing logout...");
  cy.react("IconButton", {
    props: {
      icon: {
        iconName: "sign-out-alt",
      },
    },
  }).click({
    force: true,
  });
  cy.react("FontAwesomeIcon", {
    props: {},
  });
  cy.log("Logout working!");
});

Cypress.Commands.add("gotoPage", (page) => {
  cy.log("Going to " + page + " page...");
  cy.react("MainMenu").click({
    force: true,
  });
  cy.react("MainMenuLink", { props: { to: "/" + page } }).click({
    force: true,
  });
});

Cypress.Commands.add("createEmptyModel", (scenarioName, basedOn) => {
  cy.react("IconButton", {
    props: {
      icon: {
        iconName: "plus-circle",
      },
    },
  }).click({
    force: true,
  });
  cy.react("Input", {
    props: { placeholder: "Scenario name" },
  }).type(scenarioName);
  cy.react("Select", {
    props: { placeholder: "Select..." },
  }).type(basedOn);
  cy.react("Button", {
    props: { label: "create", className: "css-18b5fmi" },
  }).click({
    force: true,
  });
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
});

Cypress.Commands.add("inferModel", (modelName, basedOn) => {
  cy.react("IconButton", {
    props: {
      title: "Infer a model",
    },
  }).click();
  cy.react("Input", {
    props: { placeholder: "model name" },
  }).type(modelName);

  cy.react("Select", {
    props: { placeholder: "Select..." },
  }).type(basedOn);

  cy.react("DropdownIndicator").click();

  cy.react("Clickable", {
    props: { title: "create" },
  }).click();
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
