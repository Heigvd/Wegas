import {TabPageObject} from "./TabPageObject";
import {CreateScenarioPageObject} from "./CreateScenarioPageObject";

export class ScenaristPageObject extends TabPageObject {

  name = 'scenarist';

  getCreateScenarioButton(){
    return cy.react('IconButton', {props: {title: 'Create scenario'}});
  }

  createScenarioPO = new CreateScenarioPageObject();

  createScenario(scenarioName: string, basedOn: string, model?: boolean) : void {
    this.getCreateScenarioButton().should('have.length', 1).click();
    this.createScenarioPO.createScenarioWindow(scenarioName, basedOn);

    cy.simulatePusher();
  }
}
