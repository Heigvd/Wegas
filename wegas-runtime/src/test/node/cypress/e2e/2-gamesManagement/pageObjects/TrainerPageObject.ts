import {TabPageObject} from "./TabPageObject";
import {CreateGamePageObject} from "./CreateGamePageObject";

export class TrainerPageObject extends TabPageObject {

  name = 'trainer';
  getAddGameButton(){
    return cy.react('IconButton', {props: {icon:{iconName: "plus-circle"}}});
  }

  createGamePO = new CreateGamePageObject();

  createGame(gameName: string, basedOn: string) {
    this.getAddGameButton().should('have.length', 1).click();
    this.createGamePO.createGameWindow(gameName, basedOn);

    cy.simulatePusher();
  }

}