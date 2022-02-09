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
  cy.react("Input", {
    props: { type: "text", placeholder: "e-mail or username" },
  }).type(identifier);

  cy.react("Input", {
    props: { type: "password", placeholder: "password" },
  }).type(password);

  cy.react("Button", { props: { key: "submit", label: "login" } }).click({
    force: true,
  });
});

Cypress.Commands.add("logout", () => {
  cy.react("IconButton_IconButton", {
    props: {
      icon: {
        iconName: "sign-out-alt",
        prefix: "fas",
        icon: [
          512,
          512,
          [],
          "f2f5",
          "M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z",
        ],
      },
    },
  }).click({
    force: true,
  });
});

Cypress.Commands.add("gotoPage", (page) => {
  cy.react("MainMenu").click({
    force: true,
  });
  cy.react("MainMenuLink", { props: { to: "/" + page } }).click({
    force: true,
  });
});

Cypress.Commands.add("createEmptyModel", (scenarioName, basedOn) => {
  cy.react("IconButton_IconButton", {
    props: {
      icon: {
        icon: [
          512,
          512,
          [],
          "f055",
          "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z",
        ],
        iconName: "plus-circle",
        prefix: "fas",
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
  cy.react("IconButton_IconButton", {
    props: {
      title: model ? "Create a model" : "Create scenario",
    },
  }).click();
  cy.react("Input", {
    props: { placeholder: "Scenario name" },
  }).type(scenarioName);

  cy.react("Select", {
    props: { placeholder: "Select..." },
  }).type(basedOn);

  cy.react("Clickable", {
    props: { title: "create" },
  }).click();
});

Cypress.Commands.add("inferModel", (modelName, basedOn) => {
  cy.react("IconButton_IconButton", {
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
