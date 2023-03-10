Cypress.Commands.add('gotoPage', page => {
  cy.log('Going to ' + page + ' page...');
  cy.react('MainMenu').should('have.length', 1).click();

  cy.react('MainMenu').within(() => {
    cy.react('MainMenuLink', { props: { to: '/' + page } })
      .should('have.length', 1)
      .click();
  });
});

Cypress.Commands.add('createEmptyModel', () => {
  cy.gotoPage('admin');

  // Create a model
  cy.log('Create a model!');
  cy.get('div[title="Create an empty Model"]').should('have.length', 1).click();

  cy.log('Create a model: confirm!');
  cy.intercept('POST', '/Wegas/rest/Lobby/Update/CreateEmpty*Model').as('create-empty');

  cy.get('div[title="Create an empty Model"]')
    .should('have.length', 1)
    .get('span[title="confirm Create an empty Model"]')
    .should('have.length', 1)
    .click();

  cy.log('Create a model: wait');
  cy.wait('@create-empty').then(interception => {
    cy.log('intercepted create-empty');
  });

  cy.get('div[title="Create an empty Model"]').should('have.length', 1);

  // Create a react model
  cy.log('Create a model!');
  cy.get('div[title="Create an empty React Model"]').should('have.length', 1).click();

  cy.log('Create a model: confirm!');
  cy.get('div[title="Create an empty React Model"]')
    .should('have.length', 1)
    .get('span[title="confirm Create an empty React Model"]')
    .should('have.length', 1)
    .click();

  cy.log('Create react a model: wait');
  cy.wait('@create-empty').then(interception => {
    cy.log('intercepted create-empty (react)');
  });
  cy.get('div[title="Create an empty React Model"]').should('have.length', 1);

  cy.simulatePusher();
});

Cypress.Commands.add('deleteEmptyModel', () => {
  cy.gotoPage('modeler');
  cy.removeScenario('_EmptyModel (en)');
  cy.removeScenario('_EmptyReactModel (en)');
});

Cypress.Commands.add('createScenario', (scenarioName, basedOn, model) => {
  cy.log('Create scenario....');
  cy.react('IconButton', {
    props: {
      title: model ? 'Create a model' : 'Create scenario',
    },
  })
    .should('have.length', 1)
    .click();
  cy.react('Input', {
    props: { placeholder: 'Scenario name' },
  }).type(scenarioName);

  cy.react('SelectContainer', {}).type(basedOn);

  cy.intercept('POST', '/Wegas/rest/Lobby/GameModel/**').as('create-scenario');
  cy.react('Clickable', {
    props: { title: 'create' },
  })
    .should('have.length', 1)
    .click();

  cy.wait('@create-scenario').then(interception => {
    cy.log('intercepted create');
  });

  cy.simulatePusher();
});

Cypress.Commands.add('createTestModel', () => {
  cy.gotoPage('modeler');
  cy.createScenario('Test model', '_EmptyModel\n', true);
  cy.createScenario('Test react model', '_EmptyReactModel\n', true);
});

Cypress.Commands.add('createTestScenario', () => {
  cy.gotoPage('scenarist');
  cy.createScenario('Test scenario', '_EmptyModel\n');
  cy.createScenario('Test react scenario', '_EmptyReactModel\n');
});

Cypress.Commands.add('removeScenario', scenarioName => {
  cy.react('DebouncedInput', {
    props: {
      placeholder: 'search...',
    },
  })
    .get('input')
    .clear()
    .type(scenarioName);

  cy.wait(650); // wait input to be debounced
  cy.react('GameModelCard', {
    props: {
      gameModel: {
        '@class': 'GameModel',
        name: scenarioName,
      },
    },
  })
    .nthNode(0)
    .find("div[title='move to archives']")
    .should('have.length', 1)
    .click();

  cy.log('clicked on move to archive');

  cy.intercept('PUT', '/Wegas/rest/Lobby/GameModel/**').as('remove-scenario');

  cy.get('span[title="confirm move to archives"]').should('have.length', 1).click();
  cy.log('click on confirmation');

  cy.wait('@remove-scenario').then(interception => {
    cy.log('intercepted remove');
  });
});

Cypress.Commands.add('removeTestModel', () => {
  cy.visitWegas('/#/modeler');
  cy.removeScenario('Test model');
  cy.removeScenario('Test react model');
});

Cypress.Commands.add('removeTestScenario', () => {
  cy.gotoPage('scenarist');
  cy.removeScenario('Test scenario');
  cy.removeScenario('Test react scenario');
});

Cypress.Commands.add('editScenario', gameName => {
  cy.gotoPage('scenarist');
  cy.react('GameModelCard', {
    props: {
      gameModel: {
        name: gameName,
      },
    },
  })
    .nthNode(0)
    .find("a[title='Edit scenario']")
    .invoke('removeAttr', 'target')
    .should('have.length', 1)
    .click();
  cy.waitForReact();
});
