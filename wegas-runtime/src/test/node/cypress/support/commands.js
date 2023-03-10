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
  cy.waitForReact();

});

Cypress.Commands.add("login", (identifier, password) => {
  cy.log("Testing login...");
  cy.react("Input", {
    props: { type: "text", placeholder: "e-mail or username" },
  })
  .should("have.length", 1)
  .type(identifier);

  cy.react("Input", {
    props: { type: "password", placeholder: "password" },
  })
  .should("have.length", 1)
  .type(password);

  cy.react("Button", { props: { key: "submit", label: "login" } })
  .should("have.length", 1)
  .click();

  cy.intercept('GET', '/Wegas/rest/User/Account/Current').as('load-account');
  cy.intercept('GET', '/Wegas/rest/Editor/User/Current').as('load-user');
  cy.wait(['@load-user', '@load-account']).then((interception) => {
    cy.log('loaded user & account');
  });

  cy.react("IconButton", {props: {icon: {iconName: 'sign-out-alt'}}})
  .should("have.length", 1);

  cy.log("Login working!");
});

Cypress.Commands.add("logout", () => {
  cy.log("Testing logout...");
  cy.intercept('GET', '/Wegas/rest/User/Logout').as('logout');

  cy.react("IconButton", {
    props: {
      icon: {
        iconName: "sign-out-alt",
      },
    },
  })
  .should("have.length", 1)
  .click();
  cy.wait('@logout').then((it) => {
    cy.log('Logout api call returned');
  })
  
  cy.react("SignInForm")
    .should("have.length", 1);
  cy.log("Logout working!");
});

Cypress.Commands.add("simulatePusher", () => {
  // Forced to reload without pusher
  cy.log('Simulate pusher (reload) ...')
  cy.reload();
  cy.waitForReact();
  cy.react("MainMenu")
  .should("have.length", 1);
});
