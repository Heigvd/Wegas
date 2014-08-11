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
var gameModelFacade = lookupBean("GameModelFacade"),
    task1 = Variable.findByName(self.getGameModel(), 'task1'),
    task2 = Variable.findByName(self.getGameModel(), 'task2'),
    task3 = Variable.findByName(self.getGameModel(), 'task3'),
    task4 = Variable.findByName(self.getGameModel(), 'task4'),
    task5 = Variable.findByName(self.getGameModel(), 'task5'),
    task6 = Variable.findByName(self.getGameModel(), 'task6'),
    task7 = Variable.findByName(self.getGameModel(), 'task7'),
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
    designer1 = Variable.findByName(gameModel, 'designer1'),
    designer2 = Variable.findByName(gameModel, 'designer2'),
    designer3 = Variable.findByName(gameModel, 'designer3'),
    designer4 = Variable.findByName(gameModel, 'designer4'),
    quality = Variable.findByName(gameModel, 'quality').getInstance(self),
    costs = Variable.findByName(gameModel, 'costs').getInstance(self),
    delay = Variable.findByName(gameModel, 'delay').getInstance(self),
    currentPhase = Variable.findByName(gameModel, 'currentPhase').getInstance(self);

function testsimplepmg() {
    debug(arguments.callee.name);
    testNormalAssignment();
    testMultipleWork();
    testTooManyResources();
    testNotEnoughResources();

    testActivityFactor();
    testBonusProjectFactor();
    testCompetenceRatioInf();
    testCompetenceRatioSup();
    testCoordinationRatioInf();
    testCoordinationRatioSup();
    testCoordinationRatioDiffLevel();
    testCoordinationRatioInfDiffWorks();
    testCoordinationRatioInfDiffWorks2();
    testCoordinationRatioInfDiffWorks3();
    testLearnFactor();
    testMotivationFactor();
    testOtherWorkFactor();
    testPredecessorFactor();
    testRandomDurationInf();
    testRandomDurationSup();
    testRequirementLimit();
    testUnassignable();
    testremoveassign();
    testUnworkedReq();

    //testResourceChangeWithinTask();
}
function testNormalAssignment() {
    debug(arguments.callee.name);
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');

    plan(task1, 1, 2)

    assign(informaticien1, task1);
    assign(informaticien2, task1);

    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(50, task1.instance.getProperty('completeness'), "testNormalAssignment(): task1 completness does not match");
    nextPeriod();                                                               // -> Executing week 3
    assertEquals(100, task1.instance.getProperty('completeness'), "testNormalAssignment(): task1 completness does not match");
    assertEquals(100, costs.value, "testNormalAssignment(): task1 costs does not match");
    assertEquals(100, delay.value, "testNormalAssignment(): task1 delay does not match");
    assertEquals(100, quality.value, "testNormalAssignment(): task1 quality does not match");                                                             // -> Closing
}
function testMultipleWork() {
    debug(arguments.callee.name);
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');

    plan(task2, 1, 2);

    assign(informaticien1, task2);
    reserve(informaticien1, 1, 2);
    assign(commercial1, task2);
    reserve(commercial1, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(50, task2.instance.getProperty('completeness'), "testMultipleWork(): task1 completness does not match");
    nextPeriod();                                                               // -> Executing week 3
    assertEquals(100, task2.instance.getProperty('completeness'), "testMultipleWork(): task1 completness does not match");                                                           // -> Closing
}
function testNotEnoughResources() {
    debug(arguments.callee.name);
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');

    plan(task1, 1);

    assign(informaticien1, task1);
    reserve(informaticien1, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(25, task1.instance.getProperty('completeness'), "testTooManyResources(): task1 completness does not match");
}

function testTooManyResources() {
    debug(arguments.callee.name);
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');

    plan(task1, 1, 2);

    assign(informaticien1, task1);
    assign(informaticien2, task1);
    assign(informaticien3, task1);
    reserve(informaticien1, 1);
    reserve(informaticien2, 1);
    reserve(informaticien3, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(75, task1.instance.getProperty('completeness'), "testTooManyResources(): task1 completness does not match");                                                             // -> Closing
}
function testMotivationFactor() {
    debug(arguments.callee.name);
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1000');
    task2.getInstance(self).setProperty('bac', '1500');

    standardPlannification();
    informaticien1.setProperty('coef_moral', '1.3');
    informaticien2.setProperty('coef_moral', '1.3');
    informaticien1.instance.setMoral(10);
    informaticien2.instance.setMoral(10);

    assign(informaticien1, task1);
    assign(informaticien2, task1);
    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(60, task1.instance.getProperty('completeness'), "testMotivationFactor(): task1 completness does not match"); //ancien 60 %
    assertEquals(104, task1.instance.getProperty('quality'), "testMotivationFactor(): task1 quality does not match"); //ancien 104
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testMotivationFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task1.instance.getProperty('wages'), "testMotivationFactor(): task1 wages does not match"); //ancien 500
}
function testremoveassign() {
    debug(arguments.callee.name);
    reset();
    assign(informaticien1, task2);
    assign(commercial1, task2);
    reserve(informaticien1, 1, 2, 3, 4);
    reserve(commercial1, 6);
    doNextPeriod(8);
}
function testOtherWorkFactor() {
    debug(arguments.callee.name);
    reset();

    task2.getInstance(self).setProperty('bac', '1500');

    assign(informaticien1, task2);
    reserve(informaticien1, 1, 2, 3, 4);

    doNextPeriod(4);                                                            // -> Executing week 3
    assertEquals(50, task2.instance.getProperty('completeness'), "testOtherWorkFactor(): task1 completness does not match"); //ancien 50
    nextPeriod();
    assertEquals(70, task2.instance.getProperty('completeness'), "testOtherWorkFactor(): task1 quality does not match"); //ancien 70
    nextPeriod();
    assertEquals(90, task2.instance.getProperty('completeness'), "testOtherWorkFactor(): task1 quality does not match"); //ancien 90
}
function testBonusProjectFactor() {
    debug(arguments.callee.name);
    reset();

    Variable.findByName(gameModel, 'bonusRatio').instance.setValue(1.15);

    assign(informaticien1, task1);
    assign(informaticien2, task1);

    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(58, task1.instance.getProperty('completeness'), "testBonusProjectFactor(): task1 completness does not match");
}
function testActivityFactor() {
    debug(arguments.callee.name);
    reset();

    informaticien1.setProperty('coef_activity', '1.3');

    informaticien1.instance.setProperty('activityRate', '40');

    assign(informaticien1, task1);
    reserve(informaticien1, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(13, task1.instance.getProperty('completeness'), "testActivityFactor(): task1 completness does not match"); //ancien 12
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testActivityFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(100, task1.instance.getProperty('wages'), "testActivityFactor(): task1 wages does not match"); //ancien 100
    assertEquals(100, task1.instance.getProperty('quality'), "testActivityFactor(): task1 quality does not match"); //ancien 98
}
function testCoordinationRatioInf() {
    debug(arguments.callee.name);
    reset();

    task1.setProperty('coordinationRatioInf', '2');
    task1.instance.requirements.get(0).quantity = 5;

    assign(informaticien1, task1);
    assign(informaticien2, task1);
    assign(informaticien3, task1);
    assign(informaticien4, task1);

    reserve(informaticien1, 1);
    reserve(informaticien2, 1);
    reserve(informaticien3, 1);
    reserve(informaticien4, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(30, task1.instance.getProperty('completeness'), "testCoordinationRatioInf(): task1 completness does not match"); //ancien 30%
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testCoordinationRatioInf(): fixedCosts quality does not match"); //ancien 500
    assertEquals(1000, task1.instance.getProperty('wages'), "testCoordinationRatioInf(): task1 wages does not match"); //ancien 1000
    assertEquals(100, task1.instance.getProperty('quality'), "testCoordinationRatioInf(): task1 quality does not match"); //ancien 100
}
function testCoordinationRatioInfDiffWorks() {
    debug(arguments.callee.name);
    reset();

    task2.setProperty('coordinationRatioInf', '2');

    assign(informaticien1, task2);
    assign(informaticien2, task2);
    assign(commercial1, task2);
    reserve(informaticien1, 1);
    reserve(informaticien2, 1);
    reserve(commercial1, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(75, task2.instance.getProperty('completeness'), "testCoordinationRatioInfDiffWorks(): task2 completness does not match"); //ancien 75%
    assertEquals(500, task2.instance.getProperty('fixedCosts'), "testCoordinationRatioInfDiffWorks(): fixedCosts quality does not match"); //ancien 500
    assertEquals(750, task2.instance.getProperty('wages'), "testCoordinationRatioInfDiffWorks(): task2 wages does not match"); //ancien 750
    assertEquals(100, task2.instance.getProperty('quality'), "testCoordinationRatioInfDiffWorks(): task2 quality does not match"); //ancien 100
}
function testCoordinationRatioInfDiffWorks2() {
    debug(arguments.callee.name);
    reset();

    task2.setProperty('coordinationRatioInf', '2');
    task2.setProperty('coordinationRatioSup', '1.2');

    assign(informaticien1, task2);
    assign(informaticien2, task2);
    assign(commercial1, task2);
    reserve(informaticien1, 1);
    reserve(informaticien2, 1);
    reserve(commercial1, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(80, task2.instance.getProperty('completeness'), "testCoordinationRatioInfDiffWorks2(): task2 completness does not match"); //ancien 80%
    assertEquals(500, task2.instance.getProperty('fixedCosts'), "testCoordinationRatioInfDiffWorks2(): fixedCosts quality does not match"); //ancien 500
    assertEquals(750, task2.instance.getProperty('wages'), "testCoordinationRatioInfDiffWorks2(): task2 wages does not match"); //ancien 750
    assertEquals(100, task2.instance.getProperty('quality'), "testCoordinationRatioInfDiffWorks2(): task2 quality does not match"); //ancien 100
}
//TODO Check differences (probably round problem)
function testCoordinationRatioInfDiffWorks3() {
    debug(arguments.callee.name);
    reset();

    task6.setProperty('coordinationRatioInf', '1.5');
    task6.setProperty('coordinationRatioSup', '1.2');

    assign(informaticien1, task6);
    assign(informaticien2, task6);
    assign(commercial1, task6);
    assign(commercial2, task6);
    assign(designer1, task6);
    assign(designer2, task6);
    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);
    reserve(commercial1, 1, 2);
    reserve(commercial2, 1, 2);
    reserve(designer1, 1, 2);
    reserve(designer2, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(80, task6.instance.getProperty('completeness'), "testCoordinationRatioInfDiffWorks3(): completness does not match"); //ancien 81%
    assertEquals(500, task6.instance.getProperty('fixedCosts'), "testCoordinationRatioInfDiffWorks3(): fixedCosts quality does not match"); //ancien 500
    assertEquals(1500, task6.instance.getProperty('wages'), "testCoordinationRatioInfDiffWorks3(): wages does not match"); //ancien 1500
    assertEquals(100, task6.instance.getProperty('quality'), "testCoordinationRatioInfDiffWorks3(): quality does not match"); //ancien 100
    nextPeriod();
    assertEquals(100, task6.instance.getProperty('completeness'), "testCoordinationRatioInfDiffWorks3(): completness does not match"); //ancien 100%
    assertEquals(1950, task6.instance.getProperty('wages'), "testCoordinationRatioInfDiffWorks3(): wages does not match"); //ancien 1950
    assertEquals(100, task6.instance.getProperty('quality'), "testCoordinationRatioInfDiffWorks3(): quality does not match"); //ancien 100
}
function testCoordinationRatioInfDiffWorks4() {
    debug(arguments.callee.name);
    reset();

    task6.instance.duration = 3;
    task6.setProperty('coordinationRatioInf', '1.5');
    task6.setProperty('coordinationRatioSup', '1.2');

    assign(informaticien1, task6);
    assign(informaticien2, task6);
    assign(commercial1, task6);
    assign(commercial2, task6);
    assign(designer1, task6);
    assign(designer2, task6);
    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);
    reserve(commercial1, 1, 2);
    reserve(commercial2, 1, 2);
    reserve(designer1, 1, 2);
    reserve(designer2, 1, 2);

    doNextPeriod(3);                                                            // -> Execution week 2
    assertEquals(53, task6.instance.getProperty('completeness'), "testCoordinationRatioInfDiffWorks4(): task6 completness does not match"); // Old pmg 53%
    assertEquals(1500, task6.instance.getProperty('wages'), "testCoordinationRatioInfDiffWorks4(): wages does not match"); // Old pmg: 1500
    assertEquals(100, task6.instance.getProperty('quality'), "testCoordinationRatioInfDiffWorks4(): quality does not match"); // Old pmg: 100
    nextPeriod();                                                               // -> Execution week 3
    assertEquals(100, task6.instance.getProperty('completeness'), "testCoordinationRatioInfDiffWorks4(): task6 completness does not match"); // Old pmg 100%
    assertEquals(2850, task6.instance.getProperty('wages'), "testCoordinationRatioInfDiffWorks4(): wages does not match"); // Old pmg: 3000 @FIXME
    assertEquals(100, task6.instance.getProperty('quality'), "testCoordinationRatioInfDiffWorks4(): quality does not match"); // Old pmg: 100
}
//TODO Check differences (probably round problem)
function testCoordinationRatioDiffLevel() {
    debug(arguments.callee.name);
    reset();

    task2.setProperty('coordinationRatioSup', '1.3');

    informaticien1.instance.setSkillset("Informaticien", 12);
    informaticien2.instance.setSkillset("Informaticien", 12);
    commercial1.instance.setSkillset("Commercial", 5);

    assign(informaticien1, task2);
    assign(informaticien2, task2);
    assign(commercial1, task2);
    reserve(informaticien1, 1);
    reserve(informaticien2, 1);
    reserve(commercial1, 1);

    doNextPeriod(3);                                                            // -> Execution week 2
    assertEquals(87, task2.instance.getProperty('completeness'), "testCoordinationRatioDiffLevel(): task2 completness does not match"); //ancien 84%
    assertEquals(500, task2.instance.getProperty('fixedCosts'), "testCoordinationRatioDiffLevel(): fixedCosts quality does not match"); //ancien 500
    assertEquals(750, task2.instance.getProperty('wages'), "testCoordinationRatioDiffLevel(): task2 wages does not match"); //ancien 750
    assertEquals(102, task2.instance.getProperty('quality'), "testCoordinationRatioDiffLevel(): task2 quality does not match"); //ancien 101
}
function testCoordinationRatioSup() {
    debug(arguments.callee.name);
    reset();

    task1.setProperty('coordinationRatioSup', '2');
    task1.instance.setDuration(10);
    task1.instance.requirements.get(0).quantity = 1;

    assign(informaticien1, task1);
    assign(informaticien2, task1);
    assign(informaticien3, task1);
    reserve(informaticien1, 1);
    reserve(informaticien2, 1);
    reserve(informaticien3, 1);

    doNextPeriod(3);                                                            // -> Execution week 2
    assertEquals(50, task1.instance.getProperty('completeness'), "testCoordinationRatioSup(): task1 completness does not match"); //ancien 50%
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testCoordinationRatioSup(): fixedCosts quality does not match"); //ancien 500
    assertEquals(750, task1.instance.getProperty('wages'), "testCoordinationRatioSup(): task1 wages does not match"); //ancien 750
    assertEquals(100, task1.instance.getProperty('quality'), "testCoordinationRatioSup(): task1 quality does not match"); //ancien 100
}
function testCompetenceRatioInf() {
    debug(arguments.callee.name);

    reset();

    task2.setProperty('competenceRatioInf', '1.3');

    informaticien1.instance.setSkillset("Informaticien", 5);
    commercial1.instance.setSkillset("Commercial", 5);

    assign(informaticien1, task2);
    assign(commercial1, task2);
    reserve(informaticien1, 1);
    reserve(commercial1, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(40, task2.instance.getProperty('completeness'), "testCompetenceRatioInf(): task2 completness does not match"); //ancien 42%
    assertEquals(500, task2.instance.getProperty('fixedCosts'), "testCompetenceRatioInf(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task2.instance.getProperty('wages'), "testCompetenceRatioInf(): task2 wages does not match"); //ancien 500
    assertEquals(96, task2.instance.getProperty('quality'), "testCompetenceRatioInf(): task2 quality does not match"); //ancien 96
}
function testCompetenceRatioSup() {
    debug(arguments.callee.name);
    reset();

    task2.setProperty('competenceRatioSup', '1.3');

    informaticien1.instance.setSkillset("Informaticien", 11);
    commercial1.instance.setSkillset("Commercial", 11);

    assign(informaticien1, task2);
    assign(commercial1, task2);
    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(commercial1.instance.id, 1);

    doNextPeriod(3);                                                            // -> Execution week 2
    assertEquals(60, task2.instance.getProperty('completeness'), "testCompetenceRatioSup(): task2 completness does not match"); //ancien 60%
    assertEquals(500, task2.instance.getProperty('fixedCosts'), "testCompetenceRatioSup(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task2.instance.getProperty('wages'), "testCompetenceRatioSup(): task2 wages does not match"); //ancien 500
    assertEquals(103, task2.instance.getProperty('quality'), "testCompetenceRatioSup(): task2 quality does not match"); //ancien 103
}
function testRandomDurationInf() {
    debug(arguments.callee.name);
    reset();
    standardPlannification();
    task1.instance.setProperty('randomDurationInf', '1');

    assign(informaticien1, task1);
    assign(informaticien2, task1);

    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
}
function testRandomDurationSup() {
    debug(arguments.callee.name);
    reset();
    standardPlannification();
    task1.instance.setProperty('randomDurationSup', '1');

    assign(informaticien1, task1);
    assign(informaticien2, task1);

    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
}
function testLearnFactor() {
    debug(arguments.callee.name);
    reset();

    task5.setProperty('takeInHandDuration', '20');

    assign(commercial1, task5);
    assign(commercial2, task5);
    assign(commercial3, task5);

    resourceController.addReservation(commercial1.instance.id, 1);
    resourceController.addReservation(commercial2.instance.id, 2);
    resourceController.addReservation(commercial3.instance.id, 3);
    resourceController.addReservation(commercial3.instance.id, 4);

    doNextPeriod(3);                                                            // -> Execution week 2
    assertEquals(10, task5.instance.getProperty('completeness'), "testLearnFactor(): task5 completness does not match"); //ancien 10%
    assertEquals(500, task5.instance.getProperty('fixedCosts'), "testLearnFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(250, task5.instance.getProperty('wages'), "testLearnFactor(): task5 wages does not match"); //ancien 250
    assertEquals(100, task5.instance.getProperty('quality'), "testLearnFactor(): task5 quality does not match"); //ancien 100

    nextPeriod();
    assertEquals(20, task5.instance.getProperty('completeness'), "testLearnFactor(): task5 completness does not match"); //ancien 20%
    assertEquals(500, task5.instance.getProperty('fixedCosts'), "testLearnFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task5.instance.getProperty('wages'), "testLearnFactor(): task5 wages does not match"); //ancien 500
    assertEquals(100, task5.instance.getProperty('quality'), "testLearnFactor(): task5 quality does not match"); //ancien 100

    nextPeriod();
    assertEquals(28, task5.instance.getProperty('completeness'), "testLearnFactor(): task5 completness does not match"); //ancien 28%
    assertEquals(500, task5.instance.getProperty('fixedCosts'), "testLearnFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(750, task5.instance.getProperty('wages'), "testLearnFactor(): task5 wages does not match"); //ancien 750
    assertEquals(100, task5.instance.getProperty('quality'), "testLearnFactor(): task5 quality does not match"); //ancien 100

    nextPeriod();
    assertEquals(38, task5.instance.getProperty('completeness'), "testLearnFactor(): task5 completness does not match"); //ancien 38%
    assertEquals(500, task5.instance.getProperty('fixedCosts'), "testLearnFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(1000, task5.instance.getProperty('wages'), "testLearnFactor(): task5 wages does not match"); //ancien 1000
    assertEquals(100, task5.instance.getProperty('quality'), "testLearnFactor(): task5 quality does not match"); //ancien 100
}
function testRequirementLimit() {
    debug(arguments.callee.name);
    reset();

    task2.instance.requirements.get(0).limit = 80;

    assign(informaticien1, task2);
    reserve(informaticien1, 1, 2, 3, 4);

    doNextPeriod(4);                                                            // -> Execution week 3
    assertEquals(50, task2.instance.getProperty('completeness'), "testRequirementLimit(): task1 completness does not match"); // Old pmg: 50%
    nextPeriod();                                                               // -> Executing week 4
    assertEquals(70, task2.instance.getProperty('completeness'), "testRequirementLimit(): task1 completness does not match"); // Old pmg: 70%
    nextPeriod();                                                               // -> Executing week 3
    assertEquals(80, task2.instance.getProperty('completeness'), "testRequirementLimit(): task1 completness does not match"); // Old pmg: 80%
    nextPeriod();                                                               // -> Executing week 3
    assertEquals(80, task2.instance.getProperty('completeness'), "testRequirementLimit(): task1 completness does not match"); // Old pmg: 80%

    task2.instance.requirements.get(0).limit = 100;                              // Revert changes on the limit
}
function testPredecessorFactor() {
    debug(arguments.callee.name);
    reset();

    addPredecessor('task3', ['task1', 'task2']);

    task3.instance.setProperty('predecessorsDependances', '2');

    task3.instance.requirements.get(0).quantity = 1;
    //task3.instance.setRequirements(requirements);

    //task1
    assign(informaticien1, task1);
    assign(informaticien2, task1);
    resourceController.addReservation(informaticien1.instance.id, 1);
    resourceController.addReservation(informaticien2.instance.id, 1);

    //task2
    assign(commercial1, task2);
    assign(commercial2, task2);
    assign(informaticien3, task2);

    resourceController.addReservation(commercial1.instance.id, 1);
    resourceController.addReservation(commercial2.instance.id, 1);
    resourceController.addReservation(informaticien3.instance.id, 1);

    //task3    
    assign(commercial3, task3);
    assign(informaticien4, task3);

    resourceController.addReservation(commercial3.instance.id, 2);
    resourceController.addReservation(informaticien4.instance.id, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    assertEquals(50, task1.instance.getProperty('completeness'), "testPredecessorFactor(): task1 completness does not match"); //ancien 50%
    assertEquals(500, task1.instance.getProperty('fixedCosts'), "testPredecessorFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task1.instance.getProperty('wages'), "testPredecessorFactor(): task1 wages does not match"); //ancien 500
    assertEquals(100, task1.instance.getProperty('quality'), "testPredecessorFactor(): task1 quality does not match"); //ancien 100
    assertEquals(75, task2.instance.getProperty('completeness'), "testPredecessorFactor(): task1 completness does not match"); //ancien 75%
    assertEquals(500, task2.instance.getProperty('fixedCosts'), "testPredecessorFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(750, task2.instance.getProperty('wages'), "testPredecessorFactor(): task5 wages does not match"); //ancien 750
    assertEquals(100, task2.instance.getProperty('quality'), "testPredecessorFactor(): task5 quality does not match"); //ancien 100

    nextPeriod();
    assertEquals(20, task3.instance.getProperty('completeness'), "testPredecessorFactor(): task3 completness does not match"); //ancien 20%
    assertEquals(500, task3.instance.getProperty('fixedCosts'), "testPredecessorFactor(): fixedCosts quality does not match"); //ancien 500
    assertEquals(500, task3.instance.getProperty('wages'), "testPredecessorFactor(): task3 wages does not match"); //ancien 500
    assertEquals(100, task3.instance.getProperty('quality'), "testPredecessorFactor(): task3 quality does not match"); //ancien 100
}
function testUnassignable() {
    debug(arguments.callee.name);
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');
    //task2.getInstance(self).setProperty('bac', '1500');

    plan(task1, 1);
    plan(task1, 2);

    assign(informaticien1, task1);
    assign(informaticien2, task1);

    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);
}

function testResourceChangeWithinTask() {
    debug(arguments.callee.name);
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '3000');
    task2.getInstance(self).setProperty('bac', '3000');

    plan(task1, 1);
    plan(task1, 1);
    plan(task2, 1);
    plan(task2, 1);

    assign(commercial1, task1);
    assign(commercial1, task2);

    resourceController.addReservation(commercial1.instance.id, 1);
    resourceController.addReservation(commercial2.instance.id, 2);
    resourceController.addReservation(commercial3.instance.id, 3);
    resourceController.addReservation(commercial4.instance.id, 4);

    doNextPeriod(5);                                                            // -> Executing week 4
    // assertEquals(100, task1.instance.getProperty('completeness'), "testSimplePMGNormalAssignment(): task1 completness does not match");                                                             // -> Closing
}


function testUnworkedReq() {
    debug(arguments.callee.name);
    reset();

    /**
     * Task 7 contains 2 requierments
     *    - 1x designer lvl 9
     *    - 1x designer lvl 2
     */
    plan(task7, 1);

    assign(designer1, task7); // level 8 -> req lvl9
    assign(designer2, task7); // level 8 -> req lvl9
    reserve(designer1, 1);
    reserve(designer2, 1);

    // No resources on {req | req.lvl = 2}

    doNextPeriod(3);

    assertEquals(100, task7.instance.getProperty('completeness'), "testUnworledReq(): task7 completness does not match");
}


function reset() {
    removePredecessor();
//    addTestPredecessor();

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

    gameModelFacade.refresh(gameModel);
    gameModelFacade.reset(gameModel);
}
function standardPlannification() {
    plan(task1, 1);
    plan(task1, 2);
    plan(task2, 1);
    plan(task2, 2);
    plan(task3, 3);
    plan(task3, 4);
    plan(task4, 1);
    plan(task4, 2);
    plan(task5, 10);
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
