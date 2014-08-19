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
    task1 = getVariableDescriptor('task1'),
    task2 = getVariableDescriptor('task2'),
    task3 = getVariableDescriptor('task3'),
    task4 = getVariableDescriptor('task4'),
    task5 = getVariableDescriptor('task5'),
    task6 = getVariableDescriptor('task6'),
    task7 = getVariableDescriptor('task7'),
    task8 = getVariableDescriptor('task8'),
    commercial1 = getVariableDescriptor('commercial1'),
    commercial2 = getVariableDescriptor('commercial2'),
    commercial3 = getVariableDescriptor('commercial3'),
    commercial4 = getVariableDescriptor('commercial4'),
    commercial5 = getVariableDescriptor('commercial5'),
    informaticien1 = getVariableDescriptor('informaticien1'),
    informaticien2 = getVariableDescriptor('informaticien2'),
    informaticien3 = getVariableDescriptor('informaticien3'),
    informaticien4 = getVariableDescriptor('informaticien4'),
    informaticien5 = getVariableDescriptor('informaticien5'),
    designer1 = getVariableDescriptor('designer1'),
    designer2 = getVariableDescriptor('designer2'),
    designer3 = getVariableDescriptor('designer3'),
    designer4 = getVariableDescriptor('designer4'),
    quality = getVariableDescriptor('quality').getInstance(self),
    costs = getVariableDescriptor('costs').getInstance(self),
    delay = getVariableDescriptor('delay').getInstance(self),
    projectUnworkedHours = getVariableDescriptor('projectUnworkedHours').getInstance(self),
    currentPhase = getVariableDescriptor('currentPhase').getInstance(self);


function testsimplepmg() {
    debug(arguments.callee.name);

    testLanguage();
    testUnworkedHours();
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

    plan(task1, 1, 2);

    assign(informaticien1, task1);
    assign(informaticien2, task1);

    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    checkProperty(task1, 'completeness', 50, arguments.callee.name);
    nextPeriod();                                                               // -> Executing week 3
    checkProperty(task1, 'completeness', 100, arguments.callee.name);
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
    checkProperty(task2, 'completeness', 50, arguments.callee.name);
    ;
    nextPeriod();                                                               // -> Executing week 3
    checkProperty(task2, 'completeness', 100, arguments.callee.name);
    ;                                                           // -> Closing
}
function testNotEnoughResources() {
    debug(arguments.callee.name);
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1500');

    plan(task1, 1);

    assign(informaticien1, task1);
    reserve(informaticien1, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    checkProperty(task1, 'completeness', 25, arguments.callee.name);
    ;
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
    checkProperty(task1, 'completeness', 75, arguments.callee.name);
    ;                                                             // -> Closing
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
    checkProperty(task1, 'completeness', 60, arguments.callee.name);
    ; //ancien 60 %
    checkProperty(task1, 'quality', 104, arguments.callee.name);
    ; //ancien 104
    checkProperty(task1, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task1, 'wages', 500, arguments.callee.name);
    ; //ancien 500
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
    checkProperty(task2, 'completeness', 50, arguments.callee.name);
    ; //ancien 50
    nextPeriod();
    checkProperty(task2, 'completeness', 70, arguments.callee.name);
    ; //ancien 70
    nextPeriod();
    checkProperty(task2, 'completeness', 90, arguments.callee.name);
    ; //ancien 90
}
function testBonusProjectFactor() {
    debug(arguments.callee.name);
    reset();

    getVariableDescriptor('bonusRatio').instance.setValue(1.15);

    assign(informaticien1, task1);
    assign(informaticien2, task1);

    reserve(informaticien1, 1, 2);
    reserve(informaticien2, 1, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    checkProperty(task1, 'completeness', 58, arguments.callee.name);
    ;
}
function testActivityFactor() {
    debug(arguments.callee.name);
    reset();

    informaticien1.setProperty('coef_activity', '1.3');

    informaticien1.instance.setProperty('activityRate', '40');

    assign(informaticien1, task1);
    reserve(informaticien1, 1);

    doNextPeriod(3);                                                            // -> Executing week 2
    checkProperty(task1, 'completeness', 13, arguments.callee.name);
    ; //ancien 12
    checkProperty(task1, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task1, 'wages', 100, arguments.callee.name);
    ; //ancien 100
    checkProperty(task1, 'quality', 100, arguments.callee.name);
    ; //ancien 98
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
    checkProperty(task1, 'completeness', 30, arguments.callee.name);
    ; //ancien 30%
    checkProperty(task1, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task1, 'wages', 1000, arguments.callee.name);
    ; //ancien 1000
    checkProperty(task1, 'quality', 100, arguments.callee.name);
    ; //ancien 100
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
    checkProperty(task2, 'completeness', 75, arguments.callee.name);
    ; //ancien 75%
    checkProperty(task2, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task2, 'wages', 750, arguments.callee.name);
    ; //ancien 750
    checkProperty(task2, 'quality', 100, arguments.callee.name);
    ; //ancien 100
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
    checkProperty(task2, 'completeness', 80, arguments.callee.name);
    ; //ancien 80%
    checkProperty(task2, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task2, 'wages', 750, arguments.callee.name);
    ; //ancien 750
    checkProperty(task2, 'quality', 100, arguments.callee.name);
    ; //ancien 100
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
    checkProperty(task6, 'completeness', 80, arguments.callee.name);
    ; //ancien 81%
    checkProperty(task6, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task6, 'wages', 1500, arguments.callee.name);
    ; //ancien 1500
    checkProperty(task6, 'quality', 100, arguments.callee.name);
    ; //ancien 100
    nextPeriod();
    checkProperty(task6, 'completeness', 100, arguments.callee.name);
    ; //ancien 100%
    checkProperty(task6, 'wages', 1950, arguments.callee.name);
    ; //ancien 1950
    checkProperty(task6, 'quality', 100, arguments.callee.name);
    ; //ancien 100
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
    checkProperty(task6, 'completeness', 53, arguments.callee.name);
    ; // Old pmg 53%
    checkProperty(task6, 'wages', 1500, arguments.callee.name);
    ; // Old pmg: 1500
    checkProperty(task6, 'quality', 100, arguments.callee.name);
    ; // Old pmg: 100
    nextPeriod();                                                               // -> Execution week 3
    checkProperty(task6, 'completeness', 100, arguments.callee.name);
    ; // Old pmg 100%
    checkProperty(task6, 'wages', 2850, arguments.callee.name);
    ; // Old pmg: 3000 @FIXME
    checkProperty(task6, 'quality', 100, arguments.callee.name);
    ; // Old pmg: 100
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
    checkProperty(task2, 'completeness', 87, arguments.callee.name);
    ; //ancien 84%
    checkProperty(task2, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task2, 'wages', 750, arguments.callee.name);
    ; //ancien 750
    checkProperty(task2, 'quality', 102, arguments.callee.name);
    ; //ancien 101
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
    checkProperty(task1, 'completeness', 50, arguments.callee.name);
    ; //ancien 50%
    checkProperty(task1, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task1, 'wages', 750, arguments.callee.name);
    ; //ancien 750
    checkProperty(task1, 'quality', 100, arguments.callee.name);
    ; //ancien 100
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
    checkProperty(task2, 'completeness', 40, arguments.callee.name);
    ; //ancien 42%
    checkProperty(task2, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task2, 'wages', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task2, 'quality', 96, arguments.callee.name);
    ; //ancien 96
}
function testCompetenceRatioSup() {
    debug(arguments.callee.name);
    reset();

    task2.setProperty('competenceRatioSup', '1.3');

    informaticien1.instance.setSkillset("Informaticien", 11);
    commercial1.instance.setSkillset("Commercial", 11);

    assign(informaticien1, task2);
    assign(commercial1, task2);
    reserve(informaticien1, 1);
    reserve(commercial1, 1);

    doNextPeriod(3);                                                            // -> Execution week 2
    checkProperty(task2, 'completeness', 60, arguments.callee.name);
    ; //ancien 60%
    checkProperty(task2, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task2, 'wages', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task2, 'quality', 103, arguments.callee.name);
    ; //ancien 103
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

    reserve(commercial1, 1);
    reserve(commercial2, 2);
    reserve(commercial3, 3);
    reserve(commercial3, 4);

    doNextPeriod(3);                                                            // -> Execution week 2
    checkProperty(task5, 'completeness', 10, arguments.callee.name);
    ; //ancien 10%
    checkProperty(task5, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task5, 'wages', 250, arguments.callee.name);
    ; //ancien 250
    checkProperty(task5, 'quality', 100, arguments.callee.name);
    ; //ancien 100

    nextPeriod();
    checkProperty(task5, 'completeness', 20, arguments.callee.name);
    ; //ancien 20%
    checkProperty(task5, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task5, 'wages', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task5, 'quality', 100, arguments.callee.name);
    ; //ancien 100

    nextPeriod();
    checkProperty(task5, 'completeness', 28, arguments.callee.name);
    ; //ancien 28%
    checkProperty(task5, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task5, 'wages', 750, arguments.callee.name);
    ; //ancien 750
    checkProperty(task5, 'quality', 100, arguments.callee.name);
    ; //ancien 100

    nextPeriod();
    checkProperty(task5, 'completeness', 38, arguments.callee.name);
    ; //ancien 38%
    checkProperty(task5, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task5, 'wages', 1000, arguments.callee.name);
    ; //ancien 1000
    checkProperty(task5, 'quality', 100, arguments.callee.name);
    ; //ancien 100
}
function testRequirementLimit() {
    debug(arguments.callee.name);
    reset();

    task2.instance.requirements.get(0).limit = 80;

    assign(informaticien1, task2);
    reserve(informaticien1, 1, 2, 3, 4);

    doNextPeriod(4);                                                            // -> Execution week 3
    checkProperty(task2, 'completeness', 50, arguments.callee.name);
    ; // Old pmg: 50%
    nextPeriod();                                                               // -> Executing week 4
    checkProperty(task2, 'completeness', 70, arguments.callee.name);
    ; // Old pmg: 70%
    nextPeriod();                                                               // -> Executing week 3
    checkProperty(task2, 'completeness', 80, arguments.callee.name);
    ; // Old pmg: 80%
    nextPeriod();                                                               // -> Executing week 3
    checkProperty(task2, 'completeness', 80, arguments.callee.name);
    ; // Old pmg: 80%

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
    reserve(informaticien1, 1);
    reserve(informaticien2, 1);

    //task2
    assign(commercial1, task2);
    assign(commercial2, task2);
    assign(informaticien3, task2);

    reserve(commercial1, 1);
    reserve(commercial2, 1);
    reserve(informaticien3, 1);

    //task3    
    assign(commercial3, task3);
    assign(informaticien4, task3);

    reserve(commercial3, 2);
    reserve(informaticien4, 2);

    doNextPeriod(3);                                                            // -> Executing week 2
    checkProperty(task1, 'completeness', 50, arguments.callee.name);
    ; //ancien 50%
    checkProperty(task1, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task1, 'wages', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task1, 'quality', 100, arguments.callee.name);
    ; //ancien 100
    checkProperty(task2, 'completeness', 75, arguments.callee.name);
    ; //ancien 75%
    checkProperty(task2, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task2, 'wages', 750, arguments.callee.name);
    ; //ancien 750
    checkProperty(task2, 'quality', 100, arguments.callee.name);
    ; //ancien 100

    nextPeriod();
    checkProperty(task3, 'completeness', 20, arguments.callee.name);
    ; //ancien 20%
    checkProperty(task3, 'fixedCosts', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task3, 'wages', 500, arguments.callee.name);
    ; //ancien 500
    checkProperty(task3, 'quality', 100, arguments.callee.name);
    ; //ancien 100
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

    reserve(commercial1, 1);
    reserve(commercial2, 2);
    reserve(commercial3, 3);
    reserve(commercial4, 4);

    doNextPeriod(5);                                                            // -> Executing week 4
    // checkProperty(task1, 'completeness', 100, arguments.callee.name); ;                                                             // -> Closing
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

    checkProperty(task7, 'completeness', 100, arguments.callee.name);
    ;
}


function testUnworkedHours() {
    var unworkedCost = 0;
    debug(arguments.callee.name);
    reset();
    debug("Init");

    doNextPeriod(2);

    assertEquals(0, projectUnworkedHours.value, "testUnworkedHours(): initial value does not match");


    debug("costs0: " + unworkedCost + " :: " + projectUnworkedHours.value);


    commercial1.setProperty('maxBilledUnworkedHours', '100');
    checkDescriptorProperty(commercial1, 'maxBilledUnworkedHours', '100', " UnworkedHours v1");

    assign(commercial1, task1, task8);  // 1step on task1 -> NotMyWork + 9step on task8
    reserve(commercial1, 1);           // Unworked 10% 1000$/4 ->  25$
    // Do first execution period
    silentNextPeriod();
    clearAssignments(commercial1);

    unworkedCost += 25;
    debug("costs1: " + unworkedCost + " :: " + projectUnworkedHours.value);
    assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period1 value does not match");


    commercial2.setProperty('maxBilledUnworkedHours', '10');
    checkDescriptorProperty(commercial2, 'maxBilledUnworkedHours', '10', " UnworkedHours v2");
    assign(commercial2, task1, task8);  // 1step on task1 -> NotMyWork + 9step on task8
    reserve(commercial2, 2); // Unworked 10% -> 25$
    // Do 2nd execution period
    silentNextPeriod();
    clearAssignments(commercial2);

    unworkedCost += 25;
    debug("costs2: " + unworkedCost + " :: " + projectUnworkedHours.value);
    assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period2 value does not match");


    clearAssignments(commercial3);
    commercial3.setProperty('maxBilledUnworkedHours', '5');
    checkDescriptorProperty(commercial3, 'maxBilledUnworkedHours', '5', " UnworkedHours v3");
    assign(commercial3, task1, task8);  // 1step on task1 -> NotMyWork + 9step on task8
    reserve(commercial3, 3);  // Unworked 5%  -> 12.5$
    // Do 3rd execution period
    silentNextPeriod();
    clearAssignments(commercial3);

    unworkedCost += 12.5;
    debug("costs3: " + unworkedCost + " :: " + projectUnworkedHours.value);
    assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period3 value does not match");





    commercial4.setProperty('maxBilledUnworkedHours', '20');
    assign(commercial4, task1);  // 1step on task1 -> NotMyWork + 9step loosed
    reserve(commercial4, 4); // Unwork 20% of 1000/4 => 50$
    // Do 4th execution period
    silentNextPeriod();
    clearAssignments(commercial4);

    unworkedCost += 50;
    debug("costs4: " + unworkedCost + " :: " + projectUnworkedHours.value);
    assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period4 value does not match");




    commercial5.setProperty('maxBilledUnworkedHours', '50');
    reserve(commercial5, 5); // Unwork 50% -> 125$
    // Do 5th execution period
    silentNextPeriod();

    unworkedCost += 125;
    debug("costs5: " + unworkedCost + " :: " + projectUnworkedHours.value);
    assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period5 value does not match");




    commercial1.setProperty('maxBilledUnworkedHours', '100');
    reserve(commercial1, 6); // Unwork 100% -> 250$
    // Do 6th execution period
    silentNextPeriod();

    unworkedCost += 250;
    debug("costs6: " + unworkedCost + " :: " + projectUnworkedHours.value);
    assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period6 value does not match");




    designer1.setProperty('maxBilledUnworkedHours', '200');
    reserve(designer1, 7); // Unwork 100%    250$
    // Do 5th execution period
    silentNextPeriod();

    unworkedCost += 250;
    debug("costs7: " + unworkedCost + " :: " + projectUnworkedHours.value);
    assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period7 value does not match");




    designer2.setProperty('maxBilledUnworkedHours', '-200');
    reserve(designer2, 8); // Unwork 0% -> 0$
    // Do 5th execution period
    silentNextPeriod();

    debug("costs8: " + unworkedCost + " :: " + projectUnworkedHours.value);
    assertEquals(unworkedCost + 0, projectUnworkedHours.value, "testUnworkedHours(): period8 value does not match");
}

function silentNextPeriod() {
    var oldMode = DEBUGMODE;
    DEBUGMODE = false;
    nextPeriod();
    DEBUGMODE = oldMode;
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


function testLanguage() {
    var missingArgs, missingKey, missingLocale, ok,
        exp_missingArgs, exp_missingKey, exp_missingLocale, exp_ok,
        key = "messages.endOfTaskSwitchToNew.content";

    debug(arguments.callee.name);

    ok = I18n_t(key, {task: "Task #1", nextTask: "Task #2", employeeName: "John", job: "Job"});
    exp_ok = "La tâche \"Task #1\" est terminée, je passe à la tâche Task #2 <br/> Salutations <br/>John<br/> Job";
    assertEquals(exp_ok, ok, "TestLanguage(): OK Failed");

    missingArgs = I18n_t(key, {task: "Task #1", nextTask: "Task #2"});
    exp_missingArgs = "[I18N] MISSING MANDATORY ARGUMENT \"job\" FOR \"" + key + "\"";
    assertEquals(exp_missingArgs, missingArgs, "TestLanguage(): Missing Arg");

    missingKey = I18n_t("wacky-name");
    exp_missingKey = "[I18N] MISSING fr translation for \"wacky-name\"";
    assertEquals(exp_missingKey, missingKey, "TestLanguage(): Missing KEY");

    setLocale("ru");
    missingLocale = I18n_t(key, {task: "Task #1", nextTask: "Task #2", employeeName: "John"});
    exp_missingLocale = "[I18N] MISSING ru LOCALE";
    assertEquals(exp_missingLocale, missingLocale, "TestLanguage(): Missing KEY");
}
