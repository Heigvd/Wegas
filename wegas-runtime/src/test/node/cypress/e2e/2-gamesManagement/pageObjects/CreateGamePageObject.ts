import {TabPageObject} from "./TabPageObject";

export class CreateGamePageObject extends TabPageObject {

  getGameNameInput() {
    return cy.react('Input', {props: { placeholder: 'Session name' }});
  }
  getGameNameSelect() {
    return cy.react('SelectContainer', {});
  }
  getGameCreateConfirmButton() {
    return cy.react('Clickable', {props: { title: 'create' }});
  }

  createGameWindow(gameName: string, basedOn: string) : void {
    this.getGameNameInput().type(gameName);
    this.getGameNameSelect().type(basedOn);

    const url = Cypress.env("WEGAS_URL");
    cy.intercept('POST', url+'/rest/Lobby/GameModel/Game/**').as('create-game');

    this.getGameCreateConfirmButton().should('have.length', 1).click();

    cy.get('@create-game').its('response').should(response => {
      expect(response.statusCode).to.eq(200);
    });
  }
}