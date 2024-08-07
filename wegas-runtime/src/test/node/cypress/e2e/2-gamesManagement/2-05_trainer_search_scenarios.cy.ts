import {TrainerPageObject} from "./pageObjects/TrainerPageObject";

describe("ch.wegas.client.tests.e2e.TrainerSearchScenarios", () => {
  before(() => {
    cy.visitWegas();
    cy.waitForReact();
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
  });
  after(() => {
    cy.logout();
  });

  it("TrainerSearchScenarios", () => {
    const trainerPage = new TrainerPageObject();
    trainerPage.open().setSearchTerm("inexistentScenario inexistentScenario");
    const url = Cypress.env("WEGAS_URL");
    cy.intercept('POST', url+'/rest/Lobby/GameModel/Game/status/LIVE/Paginated').as("searchCall");
    cy.get('@searchCall').its('response').should(response => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.pageContent).to.length(0);
      expect(response.body.total).to.eq(0);
      expect(response.body.page).to.eq(1);
      expect(response.body.pageSize).to.exist;
    });
  });
});