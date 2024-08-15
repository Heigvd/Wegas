import {TrainerPageObject} from "./pageObjects/TrainerPageObject";
import {ScenaristPageObject} from './pageObjects/ScenaristPageObject';

const trainerPage = new TrainerPageObject();
const scenaristPage = new ScenaristPageObject();

describe('ch.wegas.client.tests.e2e.SearchScenarios', () => {
  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
    cy.login(Cypress.env("ADMIN_USERNAME"), Cypress.env("ADMIN_PASSWORD"));
  });
  afterEach(() => {
    //cy.logout();
  });

  it('TrainerPaginatedResults', () => {
    const gameName = "The_Game!";
    trainerPage.open();
    trainerPage.createEmptyModel();
    trainerPage.createGame(gameName, "_EmptyReactModel\n");
    trainerPage.setSearchTerm(gameName);
    const url = Cypress.env("WEGAS_URL");
    cy.intercept('POST', url+'/rest/Lobby/GameModel/Game/status/LIVE/Paginated').as("searchCall");
    cy.get('@searchCall').its('response').should(response => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.pageContent).to.length(1);
      expect(response.body.total).to.eq(1);
      expect(response.body.page).to.eq(1);
      expect(response.body.pageSize).to.exist;
    });
    cy.react('GameCard').should('have.length', 1)
  });

  it('ScenaristPaginatedResults', () => {
    const gameModelName = 'paginatedScenario-test-1'
    scenaristPage.open();
    scenaristPage.createEmptyModel();
    scenaristPage.createScenario(gameModelName, '_EmptyReactModel\n');
    scenaristPage.setSearchTerm(gameModelName);
    const url = Cypress.env('WEGAS_URL');
    cy.intercept('POST', url + '/rest/Lobby/GameModel/type/SCENARIO/status/LIVE/Paginated').as('searchCall');
    cy.get('@searchCall')
      .its('response')
      .should(response => {
        expect(response.statusCode).to.eq(200);
        expect(response.body.pageContent).to.length(1);
        expect(response.body.total).to.eq(1);
        expect(response.body.page).to.eq(1);
        expect(response.body.pageSize).to.exist;
      });
    cy.react('GameModelCard').should('have.length', 1)
  });
});