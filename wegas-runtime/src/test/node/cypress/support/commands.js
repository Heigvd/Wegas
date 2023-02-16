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

Cypress.Commands.add("checkEnv", () => {
  const url = Cypress.env("WEGAS_URL");
  console.log(url);
  if (url == null) {
    throw "please set --env WEGAS_URL to start tests";
  }
  const username = Cypress.env("ADMIN_USERNAME");
  if (username == null) {
    throw "please set --env ADMIN_USERNAME to start tests";
  }
  const password = Cypress.env("ADMIN_PASSWORD");
  if (password == null) {
    throw "please set --env ADMIN_PASSWORD to start tests";
  }
});

Cypress.Commands.add("visitWegas", (path) => {
  const url = Cypress.env("WEGAS_URL");
  cy.checkEnv();
  cy.visit(url + (path ? path : ""));
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
  cy.react("SignInForm")
    .should("have.length", 1);
  cy.log("Logout working!");
});

Cypress.Commands.add("simulatePusher", () => {
  // Forced to reload without pusher
  cy.reload();
  cy.waitForReact();
});
