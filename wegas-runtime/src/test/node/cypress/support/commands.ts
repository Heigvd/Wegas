/// <reference types="cypress" />
/// <reference types="cypress-react-selector" />

// Custom Cypress commands for the Wegas frontend tests.

// ---------------------------------------------------------------------------
// 1. Type declarations
//
// This block makes the custom commands type-safe.
// ---------------------------------------------------------------------------
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /** Validate that the required `--env` variables are set; returns them typed. */
      checkEnv(): Chainable<WegasEnv>;

      /** Visit the Wegas app at an optional sub-path and wait for React to mount. */
      visitWegas(path?: string): Chainable<void>;

      /** Log in through the UI and assert that the authenticated session started. */
      login(identifier: string, password: string): Chainable<void>;

      /** Log out through the UI and assert we are back on the sign-in form. */
      logout(): Chainable<void>;

      /** Reload the page to emulate a Pusher-driven refresh. */
      simulatePusher(): Chainable<void>;
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Shared helper
// ---------------------------------------------------------------------------
interface WegasEnv {
  url: string;
  adminUsername: string;
  adminPassword: string;
}

// Reads and checks all env var at once
function readEnv(): WegasEnv {
  const rawByName = {
    WEGAS_URL: Cypress.env("WEGAS_URL"),
    ADMIN_USERNAME: Cypress.env("ADMIN_USERNAME"),
    ADMIN_PASSWORD: Cypress.env("ADMIN_PASSWORD"),
  };

  const missing = Object.entries(rawByName)
    .filter(([, value]) => value == null)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing Cypress env variable(s): ${missing.join(", ")}.`);
  }

  return {
    url: rawByName.WEGAS_URL,
    adminUsername: rawByName.ADMIN_USERNAME,
    adminPassword: rawByName.ADMIN_PASSWORD,
  };
}

// ---------------------------------------------------------------------------
// 3. Commands
// ---------------------------------------------------------------------------

Cypress.Commands.add("checkEnv", () => {
  // `cy.wrap` turns the plain object into a chainable subject.
  return cy.wrap(readEnv(), { log: false });
});

Cypress.Commands.add("visitWegas", (path?: string) => {
  const { url } = readEnv();
  cy.visit(url + (path ?? ""));
  cy.waitForReact();
});

Cypress.Commands.add("login", (identifier: string, password: string) => {
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
    .type(password, { log: false });

  cy.intercept("GET", "/Wegas/rest/Editor/User/Current").as("loadUser");
  cy.intercept("GET", "/Wegas/rest/User/Account/Current").as("loadAccount");

  cy.react("Button", { props: { key: "submit", label: "login" } })
    .should("have.length", 1)
    .click();

  cy.wait(["@loadUser", "@loadAccount"]);

  cy.react("IconButton", { props: { icon: { iconName: "sign-out-alt" } } })
    .should("have.length", 1);

  cy.log("Login working!");
});

Cypress.Commands.add("logout", () => {
  cy.log("Testing logout...");

  cy.intercept("GET", "/Wegas/rest/User/Logout").as("logout");

  cy.react("IconButton", { props: { icon: { iconName: "sign-out-alt" } } })
    .should("have.length", 1)
    .click();

  cy.wait("@logout");
  cy.log('Logout api call returned');

  cy.react("SignInForm").should("have.length", 1);

  cy.log("Logout working!");
});

Cypress.Commands.add("simulatePusher", () => {
  cy.log("Simulate pusher (reload) ...");
  cy.reload();
  cy.waitForReact();
  cy.react("MainMenu").should("have.length", 1);
});

// Marks this file as a module so the `declare global` block at the top is valid.
export {};
