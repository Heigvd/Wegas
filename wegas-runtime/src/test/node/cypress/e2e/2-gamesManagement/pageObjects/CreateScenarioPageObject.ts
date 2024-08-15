import {TabPageObject} from "./TabPageObject";

export class CreateScenarioPageObject extends TabPageObject {

  getCreateScenarioInput() {
    return cy.react('Input', {props: {placeholder: 'Scenario name'}});;
  }
  getCreateScenarioSelectModel() {
    return cy.react('SelectContainer', {});
  }
  getCreateScenarioConfirmButton() {
    return cy.react('Clickable', {props: {title: 'create'}});
  }

  createScenarioWindow(scenarioName: string, basedOn: string) : void {
    this.getCreateScenarioInput().type(scenarioName);
    this.getCreateScenarioSelectModel().type(basedOn);

    const url = Cypress.env("WEGAS_URL");
    cy.intercept('POST', url+'/rest/Lobby/GameModel/**').as('create-scenario');

    this.getCreateScenarioConfirmButton().should('have.length', 1).click();

    cy.get('@create-scenario').its('response').should(response => {
      expect(response.statusCode).to.eq(200);
    });
  }
}