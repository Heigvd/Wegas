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
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
var task1 = Variable.findByName(self.getGameModel(), 'task1'),
        task2 = Variable.findByName(self.getGameModel(), 'task2'),
        task3 = Variable.findByName(self.getGameModel(), 'task3'),
        task4 = Variable.findByName(self.getGameModel(), 'task4'),
        task5 = Variable.findByName(self.getGameModel(), 'task5'),
        commercial1 = Variable.findByName(gameModel, 'commercial1'),
        commercial2 = Variable.findByName(gameModel, 'commercial2'),
        commercial3 = Variable.findByName(gameModel, 'commercial3'),
        commercial4 = Variable.findByName(gameModel, 'commercial4'),
        commercial5 = Variable.findByName(gameModel, 'commercial5'),
        informaticien1 = Variable.findByName(gameModel, 'informaticien1'),
        informaticien2 = Variable.findByName(gameModel, 'informaticien2'),
        informaticien3 = Variable.findByName(gameModel, 'informaticien3'),
        informaticien4 = Variable.findByName(gameModel, 'informaticien4'),
        informaticien5 = Variable.findByName(gameModel, 'informaticien5'),
        resourceController = lookupBean("ResourceController"),
        gameModelFacade = lookupBean("GameModelFacade"),
        quality = Variable.findByName(gameModel, 'quality').getInstance(self),
        cost = Variable.findByName(gameModel, 'costs').getInstance(self),
        delay = Variable.findByName(gameModel, 'delay').getInstance(self),
        currentPhase = Variable.findByName(gameModel, 'currentPhase').getInstance(self);

function testsimplepmg() {
    testSimplePMGNormalAssignment();
    testSimplePMGNotEnoughResources();
    testSimplePMGTooManyResources();
    testUnassignable();
}
function testSimplePMGNormalAssignment() {
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');
    //task2.getInstance(self).setProperty('bac', '1500');

    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task1.getInstance(self).id, 2);

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);

    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien1.instance.id, 2);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 2);

    nextPeriod();                                                               // Initiating -> Planning
    nextPeriod();                                                               // Planning -> Executing
    nextPeriod();                                                               // -> Executing week 2
    nextPeriod();                                                               // -> Executing week 3
    assertEquals(100, task1.instance.getProperty('completeness'), "testSimplePMGNormalAssignment(): task1 completness does not match");
    assertEquals(100, costs.value, "testSimplePMGNormalAssignment(): task1 completness does not match");
    assertEquals(100, delay.value, "testSimplePMGNormalAssignment(): task1 completness does not match");
    assertEquals(100, quality.value, "testSimplePMGNormalAssignment(): task1 completness does not match");                                                             // -> Closing
}
function testMotivationFactor() {
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1000');
    task2.getInstance(self).setProperty('bac', '1500');

    standardPlannification();
    informaticien1.setProperty('coef_moral', '1.3');
    informaticien2.setProperty('coef_moral', '1.3');
    informaticien1.instance.setMoral(10);
    informaticien2.instance.setMoral(10);

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);

    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien1.instance.id, 2);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 2);

    nextPeriod();
    nextPeriod();
    nextPeriod();
    assertEquals(60, task1.instance.getProperty('completeness'), "testMotivationFactor(): task1 completness does not match"); //ancien 60 %
    assertEquals(105, task1.instance.getProperty('quality'), "testMotivationFactor(): task1 quality does not match"); //ancien 104
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testMotivationFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task1.instance.getProperty('wages'), "testMotivationFactor(): task1 wages does not match"); //ancien 500
}
function testBonusProjectFactor() {
    var bonusRatio = Variable.findByName(gameModel, 'bonusRatio');

    reset();

    bonusRatio.instance.setValue(1.15);

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);

    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien1.instance.id, 2);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 2);

    nextPeriod();
    nextPeriod();
    nextPeriod();
    assertEquals(58, task1.instance.getProperty('completeness'), "testMotivationFactor(): task1 completness does not match");
}
function testActivityFactor() {
    reset();

    informaticien1.setProperty('coef_activity', '1.3');

    informaticien1.instance.setProperty('activityRate', '40');

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addReservation(informaticien1.instance.id, 1);

    nextPeriod();
    nextPeriod();
    nextPeriod();
    assertEquals(13, task1.instance.getProperty('completeness'), "testMotivationFactor(): task1 completness does not match"); //ancien 12
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testMotivationFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(100, task1.instance.getProperty('wages'), "testMotivationFactor(): task1 wages does not match"); //ancien 100
    assertEquals(100, task1.instance.getProperty('quality'), "testMotivationFactor(): task1 quality does not match"); //ancien 98
}
function testCoordinationRatioInf() {
    var requirements;

    reset();

    task1.setProperty('coordinationRatioInf', '2');

    requirements = task1.instance.getRequirements();
    requirements.get(0).quantity = 5;
    task1.instance.setRequirements(requirements);

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);
    resourceController.addAssignment(informaticien3.instance.id, task1);
    resourceController.addAssignment(informaticien4.instance.id, task1);
    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien3.instance.id, 1);
    resourceController.addReservation(informaticien4.instance.id, 1);

    nextPeriod();
    nextPeriod();
    nextPeriod();
    assertEquals(30, task1.instance.getProperty('completeness'), "testMotivationFactor(): task1 completness does not match"); //ancien 30%
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testMotivationFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(1000, task1.instance.getProperty('wages'), "testMotivationFactor(): task1 wages does not match"); //ancien 1000
    assertEquals(100, task1.instance.getProperty('quality'), "testMotivationFactor(): task1 quality does not match"); //ancien 100
}
function testCoordinationRatioInfDiffWorks() {
    reset();

    task2.setProperty('coordinationRatioInf', '2');
//    task2.setProperty('coordinationRatioSup', '1.5');

    resourceController.addAssignment(informaticien1.instance.id, task2);
    resourceController.addAssignment(informaticien2.instance.id, task2);
    resourceController.addAssignment(commercial1.instance.id, task2);
    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(commercial1.instance.id, 1);

    nextPeriod();
    nextPeriod();
    nextPeriod();
//    assertEquals(30, task1.instance.getProperty('completeness'), "testMotivationFactor(): task1 completness does not match"); //ancien 30%
//    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testMotivationFactor(): fixedCosts quality does not match"); //ancien 500
//    assertEquals(1000, task1.instance.getProperty('wages'), "testMotivationFactor(): task1 wages does not match"); //ancien 1000
//    assertEquals(100, task1.instance.getProperty('quality'), "testMotivationFactor(): task1 quality does not match"); //ancien 100
}
function testCoordinationRatioSup() {
    var requirements;

    reset();

    task1.setProperty('coordinationRatioSup', '2');
    task1.instance.setDuration(10);

    requirements = task1.instance.getRequirements();
    requirements.get(0).quantity = 1;
    task1.instance.setRequirements(requirements);

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);
    resourceController.addAssignment(informaticien3.instance.id, task1);
    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien3.instance.id, 1);

    nextPeriod();
    nextPeriod();
    nextPeriod();
    assertEquals(50, task1.instance.getProperty('completeness'), "testMotivationFactor(): task1 completness does not match"); //ancien 50%
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testMotivationFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(750, task1.instance.getProperty('wages'), "testMotivationFactor(): task1 wages does not match"); //ancien 750
    assertEquals(100, task1.instance.getProperty('quality'), "testMotivationFactor(): task1 quality does not match"); //ancien 100
}
function testCompetenceRatioInf() {

    reset();

    task2.setProperty('competenceRatioInf', '1.3');
    
    informaticien1.instance.setSkillset("Informaticien", 5);
    commercial1.instance.setSkillset("Commercial", 5);
    
    resourceController.addAssignment(informaticien1.instance.id, task2);
    resourceController.addAssignment(commercial1.instance.id, task2);
    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(commercial1.instance.id, 1);
    
    nextPeriod();
    nextPeriod();
    nextPeriod();
    assertEquals(40, task2.instance.getProperty('completeness'), "testMotivationFactor(): task2 completness does not match"); //ancien 42%
    assertEquals(500, task2.instance.getProperty('fixedCosts'), "testMotivationFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task2.instance.getProperty('wages'), "testMotivationFactor(): task2 wages does not match"); //ancien 500
    assertEquals(96, task2.instance.getProperty('quality'), "testMotivationFactor(): task2 quality does not match"); //ancien 96
}
function testCompetenceRatioSup() {
    reset();

    task2.setProperty('competenceRatioSup', '1.3');
    
    informaticien1.instance.setSkillset("Informaticien", 11);
    commercial1.instance.setSkillset("Commercial", 11);
    
    resourceController.addAssignment(informaticien1.instance.id, task2);
    resourceController.addAssignment(commercial1.instance.id, task2);
    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(commercial1.instance.id, 1);
    
    nextPeriod();
    nextPeriod();
    nextPeriod();
    assertEquals(60, task2.instance.getProperty('completeness'), "testMotivationFactor(): task2 completness does not match"); //ancien 60%
    assertEquals(500, task2.instance.getProperty('fixedCosts'), "testMotivationFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task2.instance.getProperty('wages'), "testMotivationFactor(): task2 wages does not match"); //ancien 500
    assertEquals(103, task2.instance.getProperty('quality'), "testMotivationFactor(): task2 quality does not match"); //ancien 103
}
function testRandomDurationInf() {
    reset();
    standardPlannification();
    task1.instance.setProperty('randomDurationInf', '1');

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);

    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien1.instance.id, 2);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 2);
    
    nextPeriod();
    nextPeriod();
    nextPeriod();
}
function testRandomDurationSup() {
    reset();
    standardPlannification();
    task1.instance.setProperty('randomDurationSup', '1');

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);

    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien1.instance.id, 2);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 2);
    
    nextPeriod();
    nextPeriod();
    nextPeriod();
}
function testSimplePMGNotEnoughResources() {
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');
    //task2.getInstance(self).setProperty('bac', '1500');

    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task1.getInstance(self).id, 2);

    resourceController.addAssignment(informaticien1.instance.id, task1);

    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien1.instance.id, 2);

    nextPeriod();                                                               // Initiating -> Planning
    nextPeriod();                                                               // Planning -> Executing
    nextPeriod();                                                               // -> Executing week 2
    nextPeriod();                                                               // -> Executing week 3
    assertEquals(100, task1.instance.getProperty('completeness'), "testSimplePMGNormalAssignment(): task1 completness does not match");                                                             // -> Closing
}

function testSimplePMGTooManyResources() {
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');

    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task1.getInstance(self).id, 2);

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);
    resourceController.addAssignment(informaticien3.instance.id, task1);

    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien1.instance.id, 2);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 2);
    resourceController.addReservation(informaticien3.instance.id, 1);
    resourceController.addReservation(informaticien3.instance.id, 2);

    nextPeriod();                                                               // Initiating -> Planning
    nextPeriod();                                                               // Planning -> Executing
    nextPeriod();                                                               // -> Executing week 2
    nextPeriod();                                                               // -> Executing week 3
    // assertEquals(100, task1.instance.getProperty('completeness'), "testSimplePMGNormalAssignment(): task1 completness does not match");                                                             // -> Closing
}
function testUnassignable() {
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');
    //task2.getInstance(self).setProperty('bac', '1500');

    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task1.getInstance(self).id, 2);

    resourceController.addAssignment(informaticien1.instance.id, task1);
    resourceController.addAssignment(informaticien2.instance.id, task1);

    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien1.instance.id, 2);
    resourceController.addReservation(informaticien2.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 2);
}

function testResourceChangeWithinTask() {
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '3000');
    task2.getInstance(self).setProperty('bac', '3000');

    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 1);

    resourceController.addAssignment(commercial1.instance.id, task1);
    resourceController.addAssignment(commercial1.instance.id, task2);

    resourceController.addReservation(commercial1.instance.id, 1);
    resourceController.addReservation(commercial2.instance.id, 2);
    resourceController.addReservation(commercial3.instance.id, 3);
    resourceController.addReservation(commercial4.instance.id, 4);

    nextPeriod();                                                               // Initiating -> Planning
    nextPeriod();                                                               // Planning -> Executing
    nextPeriod();                                                               // -> Executing week 2
    nextPeriod();                                                               // -> Executing week 3
    nextPeriod();                                                               // -> Executing week 4
    // assertEquals(100, task1.instance.getProperty('completeness'), "testSimplePMGNormalAssignment(): task1 completness does not match");                                                             // -> Closing
}
function assertEquals(val1, val2, msg) {
    if (val1 != val2) {
//        debug("ERROR: assert equals does not match");
        throw new Error(msg);
    }
}

/**
 * Debug function to create automatically some occupations and assignements in
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
function reset() {
    removePredecessor();
    addTestPredecessor();

    defaultTaskProperty(task1);
    defaultTaskProperty(task2);
    defaultTaskProperty(task3);
    defaultTaskProperty(task4);
    defaultTaskProperty(task5);

    defaultEmployee(commercial1);
    defaultEmployee(commercial2);
    defaultEmployee(commercial3);
    defaultEmployee(commercial4);
    defaultEmployee(commercial5);
    defaultEmployee(informaticien1);
    defaultEmployee(informaticien2);
    defaultEmployee(informaticien3);
    defaultEmployee(informaticien4);
    defaultEmployee(informaticien5);

    gameModelFacade.reset(gameModel);
}
function standardPlannification() {
    resourceController.addTaskPlannification(task1.instance.id, 1);
    resourceController.addTaskPlannification(task1.instance.id, 2);
    resourceController.addTaskPlannification(task2.instance.id, 1);
    resourceController.addTaskPlannification(task2.instance.id, 2);
    resourceController.addTaskPlannification(task3.instance.id, 3);
    resourceController.addTaskPlannification(task3.instance.id, 4);
    resourceController.addTaskPlannification(task4.instance.id, 1);
    resourceController.addTaskPlannification(task4.instance.id, 2);
    resourceController.addTaskPlannification(task5.instance.id, 10);
}
function defaultTaskProperty(task) {
    task.setProperty('competenceRatioInf', '1');
    task.setProperty('progressionOfNeeds', '0');
    task.setProperty('coordinationRatioInf', '1');
    task.setProperty('takeInHandDuration', '0');
    task.setProperty('competenceRatioSup', '1');
    task.setProperty('coordinationRatioSup', '1');
}

function defaultEmployee(emp) {
    emp.setProperty('coef_activity', '1');
    emp.setProperty('coef_moral', '1');
    emp.setProperty('maxBilledUnworkedHours', '0');
    emp.setProperty('planningAvailability', 'false');
    emp.setProperty('engagementDelay', '0');
}

function addTestPredecessor() {
    addPredecessor('task3', ['task1', 'task2']);
}

function removePredecessor() {
    var taskDescList = Variable.findByName(self.getGameModel(), 'tasks'), i,
            taskDesc;
    for (i = 0; i < taskDescList.items.size(); i++) {
        taskDesc = taskDescList.items.get(i);
        taskDesc.getPredecessors().clear();
    }
}
