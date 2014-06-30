/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
var task1 = Variable.findByName(gameModel, 'task 1'),
    task2 = Variable.findByName(gameModel, 'task2'),
    commercial1 = Variable.findByName(gameModel, 'commercial1').getInstance(self),
    commercial2 = Variable.findByName(gameModel, 'commercial2').getInstance(self),
    commercial3 = Variable.findByName(gameModel, 'commercial3').getInstance(self),
    informaticien1 = Variable.findByName(gameModel, 'informaticien1').getInstance(self),
    informaticien2 = Variable.findByName(gameModel, 'informaticien2').getInstance(self),
    informaticien3 = Variable.findByName(gameModel, 'informaticien3').getInstance(self),
    resourceController = lookupBean("ResourceController"),
    gameModelFacade = lookupBean("GameModelFacade"),
    quality = Variable.findByName(gameModel, 'quality').getInstance(self),
    cost = Variable.findByName(gameModel, 'costs').getInstance(self),
    delay = Variable.findByName(gameModel, 'delay').getInstance(self),
    currentPhase = Variable.findByName(gameModel, 'currentPhase').getInstance(self);

function testsimplepmg() {
    testSimplePMGNormalAssignment();
    testSimplePMGNotEnoughResources();
}
function testSimplePMGNormalAssignment() {
    gameModelFacade.reset(gameModel);                                           // Reset current game model

    task1.getInstance(self).setProperty('bac', '1000');
    task2.getInstance(self).setProperty('bac', '1500');

    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 2);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 3);

    resourceController.addAssignment(informaticien1.id, task1);
    resourceController.addAssignment(informaticien2.id, task1);

    resourceController.addAssignment(informaticien1.id, task2);
    resourceController.addAssignment(commercial1.id, task2);

    resourceController.addReservation(informaticien1.id, 1);
    resourceController.addReservation(informaticien1.id, 2);
    resourceController.addReservation(informaticien1.id, 3);
    resourceController.addReservation(informaticien2.id, 1);
    resourceController.addReservation(commercial1.id, 2);
    resourceController.addReservation(commercial1.id, 3);

    nextPeriod();                                                               // Initiating -> Planning
    nextPeriod();                                                               // Planning -> Executing
    nextPeriod();                                                               // -> Executing week 2
    nextPeriod();                                                               // -> Executing week 3
    nextPeriod();                                                               // -> Closing
    assertEquals(2, currentPhase.value, "testSimplePMGNormalAssignment(): currentPhase does not match"); // Ensure the project is finished (i.e. 
    assertEquals(100, cost.value, "testSimplePMGNormalAssignment(): cost does not match");
    assertEquals(100, quality.value, "testSimplePMGNormalAssignment(): quality does not match");
    assertEquals(100, delay.value, "testSimplePMGNormalAssignment(): delay does not match");
}
function testSimplePMGNotEnoughResources() {

}
function assertEquals(val1, val2, msg) {
    if (val1 != val2) {
//        debug("ERROR: assert equals does not match");
        throw new Error(msg);
    }
}

/**
 * Debbug function to create automatically some occupations and assignements in
 *  some employees.
 */
function tempInit() {
    var occupation, employees = flattenList(Variable.findByName(gm, 'employees')),
        tasks = Variable.findByName(gm, 'tasks');

    occupation = employees[0].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = employees[0].getInstance(self).addOccupation();
    occupation.setTime(2.0);
    occupation = employees[1].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = employees[2].getInstance(self).addOccupation();
    occupation.setTime(2.0);
    occupation = employees[2].getInstance(self).addOccupation();
    occupation.setTime(3.0);
    occupation.setEditable(false);

    //tasks.items.get(0).getPredecessors().add(tasks.items.get(1));

    employees[1].getInstance(self).assign(tasks.items.get(0));
    employees[0].getInstance(self).assign(tasks.items.get(1));

    return 'is initialized';
}
