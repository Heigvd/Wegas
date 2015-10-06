/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * 
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */


var PMGTest = (function() {
    "use strict";
    var gameModelFacade, loaded = false,
        task1, task2, task3, task4, task5, task6, task7, task8, task9, task10,
        commercial1, commercial2, commercial3, commercial4, commercial5,
        informaticien1, informaticien2, informaticien3, informaticien4, informaticien5, informaticien6,
        designer1, designer2, designer3, designer4,
        quality, costs, delay,
        projectUnworkedHours, actualCost,
        language,
        currentPhase;



    function loadGameModelFacade() {
        if (!gameModelFacade) {
            debug("Load GameModelFacade");
            gameModelFacade = lookupBean("GameModelFacade");
        }
    }

    function loadVariables() {
        if (!loaded) {
            loaded = true;
            task1 = getVariableDescriptor('task1');
            task2 = getVariableDescriptor('task2');
            task3 = getVariableDescriptor('task3');
            task4 = getVariableDescriptor('task4');
            task5 = getVariableDescriptor('task5');
            task6 = getVariableDescriptor('task6');
            task7 = getVariableDescriptor('task7');
            task8 = getVariableDescriptor('task8');
            task9 = getVariableDescriptor('task9_limits');
            task10 = getVariableDescriptor('task10');

            commercial1 = getVariableDescriptor('commercial1');
            commercial2 = getVariableDescriptor('commercial2');
            commercial3 = getVariableDescriptor('commercial3');
            commercial4 = getVariableDescriptor('commercial4');
            commercial5 = getVariableDescriptor('commercial5');
            informaticien1 = getVariableDescriptor('informaticien1');
            informaticien2 = getVariableDescriptor('informaticien2');
            informaticien3 = getVariableDescriptor('informaticien3');
            informaticien4 = getVariableDescriptor('informaticien4');
            informaticien5 = getVariableDescriptor('informaticien5');
            informaticien6 = getVariableDescriptor('informaticien6');
            designer1 = getVariableDescriptor('designer1');
            designer2 = getVariableDescriptor('designer2');
            designer3 = getVariableDescriptor('designer3');
            designer4 = getVariableDescriptor('designer4');
            quality = getVariableDescriptor('quality').getInstance(self);
            costs = getVariableDescriptor('costs').getInstance(self);
            delay = getVariableDescriptor('delay').getInstance(self);
            projectUnworkedHours = getVariableDescriptor('projectUnworkedHours').getInstance(self);
            actualCost = getVariableDescriptor('actualCost').getInstance(self);
            currentPhase = getVariableDescriptor('currentPhase').getInstance(self);
            language = getVariableDescriptor('language').getInstance(self);
        }
    }



    function testsimplepmg() {
        debug("TestSimplePMG");
        // DEBUGMODE = true;
        loadVariables();

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
        debug("Normal Assignment");
        reset();                                                                    // Reset current game model

        task1.getInstance(self).setProperty('bac', '1500');

        plan(task1, 1, 2);

        assign(informaticien1, task1);
        assign(informaticien2, task1);

        reserve(informaticien1, 1, 2);
        reserve(informaticien2, 1, 2);

        doNextPeriod(3);                                                            // -> Executing week 2
        checkProperty(task1, 'completeness', 50, "Normal Assignment");
        nextPeriod();                                                               // -> Executing week 3
        checkProperty(task1, 'completeness', 100, "Normal Assignment");
        assertEquals(100, costs.value, "testNormalAssignment(): task1 costs does not match");
        assertEquals(100, delay.value, "testNormalAssignment(): task1 delay does not match");
        assertEquals(100, quality.value, "testNormalAssignment(): task1 quality does not match");       // -> Closing
    }
    function testMultipleWork() {
        debug("Multiple Work");
        reset();                                                                    // Reset current game model

        task1.getInstance(self).setProperty('bac', '1500');

        plan(task2, 1, 2);

        assign(informaticien1, task2);
        reserve(informaticien1, 1, 2);
        assign(commercial1, task2);
        reserve(commercial1, 1, 2);

        doNextPeriod(3);                                                            // -> Executing week 2
        checkProperty(task2, 'completeness', 50, "Multiple Work");
        nextPeriod();                                                               // -> Executing week 3
        checkProperty(task2, 'completeness', 100, "Multiple Work");           // -> Closing
    }
    function testNotEnoughResources() {
        debug("Not enough resources");
        reset();                                                                    // Reset current game model

        task1.getInstance(self).setProperty('bac', '1500');

        plan(task1, 1);

        assign(informaticien1, task1);
        reserve(informaticien1, 1);

        doNextPeriod(3);                                                            // -> Executing week 2
        checkProperty(task1, 'completeness', 25, "Not enough resources");
    }

    function testTooManyResources() {
        debug("To many resources");
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
        checkProperty(task1, 'completeness', 75, "To many resources");            // -> Closing
    }
    function testMotivationFactor() {
        debug("MotivationFactor");
        reset();                                                                    // Reset current game model

        task1.getInstance(self).setProperty('bac', '1000');
        task2.getInstance(self).setProperty('bac', '1500');

        standardPlannification();
        informaticien1.setProperty('coef_moral', '1.3');
        informaticien2.setProperty('coef_moral', '1.3');
        informaticien1.instance.setProperty("motivation", "10");
        informaticien2.instance.setProperty("motivation", "10");

        assign(informaticien1, task1);
        assign(informaticien2, task1);
        reserve(informaticien1, 1, 2);
        reserve(informaticien2, 1, 2);

        doNextPeriod(3);                                                            // -> Executing week 2
        checkProperty(task1, 'completeness', 60, "MotivationFactor"); //ancien 60 %
        checkProperty(task1, 'computedQuality', 104, "MotivationFactor"); //ancien 104
        checkProperty(task1, 'fixedCosts', 500, "MotivationFactor"); //ancien 500
        checkProperty(task1, 'wages', 500, "MotivationFactor"); //ancien 500
    }
    function testremoveassign() {
        debug("RemoveAssign");
        reset();
        assign(informaticien1, task2);
        assign(commercial1, task2);
        reserve(informaticien1, 1, 2, 3, 4);
        reserve(commercial1, 6);
        doNextPeriod(8);
    }
    function testOtherWorkFactor() {
        debug("OtherWorkFactor");
        reset();

        task2.getInstance(self).setProperty('bac', '1500');

        assign(informaticien1, task2);
        reserve(informaticien1, 1, 2, 3, 4);

        doNextPeriod(4);                                                            // -> Executing week 3
        checkProperty(task2, 'completeness', 50, "OtherWorkFactor"); //ancien 50
        nextPeriod();
        checkProperty(task2, 'completeness', 70, "OtherWorkFactor"); //ancien 70
        nextPeriod();
        checkProperty(task2, 'completeness', 90, "OtherWorkFactor"); //ancien 90
    }
    function testBonusProjectFactor() {
        debug("BonusProjectFactor");
        reset();

        getVariableDescriptor('bonusRatio').instance.setValue(1.15);

        assign(informaticien1, task1);
        assign(informaticien2, task1);

        reserve(informaticien1, 1, 2);
        reserve(informaticien2, 1, 2);

        doNextPeriod(3);                                                            // -> Executing week 2
        checkProperty(task1, 'completeness', 58, "BonusProjectFactor");
    }
    function testActivityFactor() {
        debug("ActivityFactor");
        reset();

        informaticien6.setProperty('coef_activity', '1.3');

        informaticien6.instance.setProperty('activityRate', '40');

        assign(informaticien6, task1);
        reserve(informaticien6, 1);

        doNextPeriod(3);                                                            // -> Executing week 2
        checkProperty(task1, 'completeness', 12, "ActivityFactor"); //ancien 12
        checkProperty(task1, 'fixedCosts', 500, "ActivityFactor"); //ancien 500
        checkProperty(task1, 'wages', 100, "ActivityFactor"); //ancien 100
        checkProperty(task1, 'computedQuality', 99, "ActivityFactor"); //ancien 98   @fixme @diff
    }
    function testCoordinationRatioInf() {
        debug("CoordinationRatioInf");
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
        checkProperty(task1, 'completeness', 30, "CoordinationRatioInf"); //ancien 30%
        checkProperty(task1, 'fixedCosts', 500, "CoordinationRatioInf"); //ancien 500
        checkProperty(task1, 'wages', 1000, "CoordinationRatioInf"); //ancien 1000
        checkProperty(task1, 'computedQuality', 100, "CoordinationRatioInf"); //ancien 100
    }
    function testCoordinationRatioInfDiffWorks() {
        debug("CoordinationRatioInfDiffWorks");
        reset();

        task2.setProperty('coordinationRatioInf', '2');

        assign(informaticien1, task2);
        assign(informaticien2, task2);
        assign(commercial1, task2);
        reserve(informaticien1, 1);
        reserve(informaticien2, 1);
        reserve(commercial1, 1);

        doNextPeriod(3);                                                            // -> Executing week 2
        checkProperty(task2, 'completeness', 75, "CoordinationRatioInfDiffWorks"); //ancien 75%
        checkProperty(task2, 'fixedCosts', 500, "CoordinationRatioInfDiffWorks"); //ancien 500
        checkProperty(task2, 'wages', 750, "CoordinationRatioInfDiffWorks"); //ancien 750
        checkProperty(task2, 'computedQuality', 100, "CoordinationRatioInfDiffWorks"); //ancien 100
    }
    function testCoordinationRatioInfDiffWorks2() {
        debug("CoordinationRatioInfDiffWorks2");
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
        checkProperty(task2, 'completeness', 80, "CoordinationRatioInfDiffWorks2"); //ancien 80%
        checkProperty(task2, 'fixedCosts', 500, "CoordinationRatioInfDiffWorks2"); //ancien 500
        checkProperty(task2, 'wages', 750, "CoordinationRatioInfDiffWorks2"); //ancien 750
        checkProperty(task2, 'computedQuality', 100, "CoordinationRatioInfDiffWorks2"); //ancien 100
    }
//TODO Check differences (probably round problem)
    function testCoordinationRatioInfDiffWorks3() {
        debug("CoordinationRatioInfDiffWorks3");
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
        checkProperty(task6, 'completeness', 80, "CoordinationRatioInfDiffWorks3"); //ancien 81%   @fixme @diff
        checkProperty(task6, 'fixedCosts', 500, "CoordinationRatioInfDiffWorks3"); //ancien 500
        checkProperty(task6, 'wages', 1500, "CoordinationRatioInfDiffWorks3"); //ancien 1500
        checkProperty(task6, 'computedQuality', 100, "CoordinationRatioInfDiffWorks3"); //ancien 100
        nextPeriod();
        checkProperty(task6, 'completeness', 100, "CoordinationRatioInfDiffWorks3"); //ancien 100%
        checkProperty(task6, 'wages', 1950, "CoordinationRatioInfDiffWorks3"); //ancien 1950
        checkProperty(task6, 'computedQuality', 100, "CoordinationRatioInfDiffWorks3"); //ancien 100
    }
    function testCoordinationRatioInfDiffWorks4() {
        debug("CoordinationRatioInfDiffWorks4");
        reset();

        task6.instance.setProperty("duration", "3");
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
        checkProperty(task6, 'completeness', 53, "CoordinationRatioInfDiffWorks4"); // Old pmg 53%
        checkProperty(task6, 'wages', 1500, "CoordinationRatioInfDiffWorks4"); // Old pmg: 1500
        checkProperty(task6, 'computedQuality', 100, "CoordinationRatioInfDiffWorks4"); // Old pmg: 100
        nextPeriod();                                                               // -> Execution week 3
        checkProperty(task6, 'completeness', 100, "CoordinationRatioInfDiffWorks4"); // Old pmg 100%
        checkProperty(task6, 'wages', 2850, "CoordinationRatioInfDiffWorks4"); // Old pmg: 3000 @fixme @diff
        checkProperty(task6, 'computedQuality', 100, "CoordinationRatioInfDiffWorks4"); // Old pmg: 100
    }
//TODO Check differences (probably round problem)
    function testCoordinationRatioDiffLevel() {
        debug("CoordinationRatioInfDiffLevel");
        reset();

        task2.setProperty('coordinationRatioSup', '1.3');

        informaticien1.instance.setProperty("level", "11");
        informaticien2.instance.setProperty("level", "11");
        commercial1.instance.setProperty("level", 5);

        assign(informaticien1, task2);
        assign(informaticien2, task2);
        assign(commercial1, task2);
        reserve(informaticien1, 1);
        reserve(informaticien2, 1);
        reserve(commercial1, 1);

        doNextPeriod(3);                                                            // -> Execution week 2
        checkProperty(task2, 'completeness', 85, "CoordinationRatioInfDiffLevel"); //ancien 84%  @fixme @diff
        checkProperty(task2, 'fixedCosts', 500, "CoordinationRatioInfDiffLevel"); //ancien 500
        checkProperty(task2, 'wages', 750, "CoordinationRatioInfDiffLevel"); //ancien 750
        checkProperty(task2, 'computedQuality', 101, "CoordinationRatioInfDiffLevel"); //ancien 101
    }
    function testCoordinationRatioSup() {
        debug("CoordinationRatioSup");
        reset();

        task1.setProperty('coordinationRatioSup', '2');
        task1.instance.setProperty("duration", "10");
        task1.instance.requirements.get(0).quantity = 1;

        assign(informaticien1, task1);
        assign(informaticien2, task1);
        assign(informaticien3, task1);
        reserve(informaticien1, 1);
        reserve(informaticien2, 1);
        reserve(informaticien3, 1);

        doNextPeriod(3);                                                            // -> Execution week 2
        checkProperty(task1, 'completeness', 50, "CoordinationRatioSup"); //ancien 50%
        checkProperty(task1, 'fixedCosts', 500, "CoordinationRatioSup"); //ancien 500
        checkProperty(task1, 'wages', 750, "CoordinationRatioSup"); //ancien 750
        checkProperty(task1, 'computedQuality', 100, "CoordinationRatioSup"); //ancien 100
    }
    function testCompetenceRatioInf() {
        debug("CompetenceRationInf");

        reset();

        task2.setProperty('competenceRatioInf', '1.3');

        informaticien1.instance.setProperty("level", 5);
        commercial1.instance.setProperty("level", 5);

        assign(informaticien1, task2);
        assign(commercial1, task2);
        reserve(informaticien1, 1);
        reserve(commercial1, 1);

        doNextPeriod(3);                                                            // -> Executing week 2
        checkProperty(task2, 'completeness', 40, "CompetenceRationInf"); //ancien 42%  @fixme diff
        checkProperty(task2, 'fixedCosts', 500, "CompetenceRationInf"); //ancien 500
        checkProperty(task2, 'wages', 500, "CompetenceRationInf"); //ancien 500
        checkProperty(task2, 'computedQuality', 96, "CompetenceRationInf"); //ancien 96
    }
    function testCompetenceRatioSup() {
        debug("CompetenceRationSup");
        reset();

        task2.setProperty('competenceRatioSup', '1.3');

        informaticien1.instance.setProperty("level", 11);
        commercial1.instance.setProperty("level", 11);

        assign(informaticien1, task2);
        assign(commercial1, task2);
        reserve(informaticien1, 1);
        reserve(commercial1, 1);

        doNextPeriod(3);                                                            // -> Execution week 2
        checkProperty(task2, 'completeness', 60, "CompetenceRationSup"); //ancien 60%
        checkProperty(task2, 'fixedCosts', 500, "CompetenceRationSup"); //ancien 500
        checkProperty(task2, 'wages', 500, "CompetenceRationSup"); //ancien 500
        checkProperty(task2, 'computedQuality', 103, "CompetenceRationSup"); //ancien 103
    }
    function testRandomDurationInf() {
        debug("RandomDurationinF");
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
        debug("RandomDurationSup");
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
        debug("LearnFactor");
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
        checkProperty(task5, 'completeness', 10, "LearnFactor"); //ancien 10%
        checkProperty(task5, 'fixedCosts', 500, "LearnFactor"); //ancien 500
        checkProperty(task5, 'wages', 250, "LearnFactor"); //ancien 250
        checkProperty(task5, 'computedQuality', 100, "LearnFactor"); //ancien 100

        nextPeriod();
        checkProperty(task5, 'completeness', 20, "LearnFactor"); //ancien 20%
        checkProperty(task5, 'fixedCosts', 500, "LearnFactor"); //ancien 500
        checkProperty(task5, 'wages', 500, "LearnFactor"); //ancien 500
        checkProperty(task5, 'computedQuality', 100, "LearnFactor"); //ancien 100

        nextPeriod();
        checkProperty(task5, 'completeness', 28, "LearnFactor"); //ancien 28%
        checkProperty(task5, 'fixedCosts', 500, "LearnFactor"); //ancien 500
        checkProperty(task5, 'wages', 750, "LearnFactor"); //ancien 750
        checkProperty(task5, 'computedQuality', 100, "LearnFactor"); //ancien 100

        nextPeriod();
        checkProperty(task5, 'completeness', 38, "LearnFactor"); //ancien 38%
        checkProperty(task5, 'fixedCosts', 500, "LearnFactor"); //ancien 500
        checkProperty(task5, 'wages', 1000, "LearnFactor"); //ancien 1000
        checkProperty(task5, 'computedQuality', 100, "LearnFactor"); //ancien 100
    }
    function testRequirementLimit() {
        debug("Limits");
        reset();

        task2.instance.requirements.get(0).limit = 80;

        assign(informaticien1, task2);
        reserve(informaticien1, 1, 2, 3, 4);

        assertEquals(80, task2.instance.requirements.get(0).limit, "Limits does not match");

        doNextPeriod(4);                                                            // -> Execution week 3
        checkProperty(task2, 'completeness', 50, "Limits"); // Old pmg: 50%
        nextPeriod();                                                               // -> Executing week 4
        checkProperty(task2, 'completeness', 70, "Limits"); // Old pmg: 70%
        nextPeriod();                                                               // -> Executing week 3
        checkProperty(task2, 'completeness', 80, "Limits"); // Old pmg: 80%
        nextPeriod();                                                               // -> Executing week 3
        checkProperty(task2, 'completeness', 80, "Limits"); // Old pmg: 80%
        
        task2.instance.requirements.get(0).limit = 100;                              // Revert changes on the limit
    }
    function testPredecessorFactor() {
        debug("Predecessor");
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
        checkProperty(task1, 'completeness', 50, "Predecessor"); //ancien 50%
        checkProperty(task1, 'fixedCosts', 500, "Predecessor"); //ancien 500
        checkProperty(task1, 'wages', 500, "Predecessor"); //ancien 500
        checkProperty(task1, 'computedQuality', 100, "Predecessor"); //ancien 100
        checkProperty(task2, 'completeness', 75, "Predecessor"); //ancien 75%
        checkProperty(task2, 'fixedCosts', 500, "Predecessor"); //ancien 500
        checkProperty(task2, 'wages', 750, "Predecessor"); //ancien 750
        checkProperty(task2, 'computedQuality', 100, "Predecessor"); //ancien 100

        nextPeriod();
        checkProperty(task3, 'completeness', 20, "Predecessor"); //ancien 20%
        checkProperty(task3, 'fixedCosts', 500, "Predecessor"); //ancien 500
        checkProperty(task3, 'wages', 500, "Predecessor"); //ancien 500
        checkProperty(task3, 'computedQuality', 100, "Predecessor"); //ancien 100
    }
    function testUnassignable() {
        debug("Unassignable");
        reset();

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
        debug("Change Within");
        reset();

        task1.getInstance(self).setProperty('bac', '3000');
        task2.getInstance(self).setProperty('bac', '3000');

        plan(task1, 1, 2, 3, 4);
        plan(task2, 1, 2, 3, 4);

        assign(informaticien1, task1);
        assign(informaticien1, task2);

        assign(informaticien2, task1);
        assign(informaticien2, task2);

        assign(informaticien3, task1);
        assign(informaticien3, task2);

        assign(informaticien4, task1);
        assign(informaticien4, task2);

        reserve(informaticien1, 1, 5);
        reserve(informaticien2, 2, 6);
        reserve(informaticien3, 3, 7);
        reserve(informaticien4, 4, 8);

        doNextPeriod(5);                                                            // -> Executing week 4
        //checkProperty(task1, 'completeness', 100, "change within");
        //checkProperty(task2, 'completeness', 120, "change within");
    }


    function testUnworkedReq() {
        debug("Unworked reqs");
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

        checkProperty(task7, 'completeness', 100, "CoordinationRatioInfDiffWorks");
    }


    function testUnworkedHours() {
        var unworkedCost = 0;
        debug("UnworkedHours");
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
        nextPeriod();
        clearAssignments(commercial1);

        unworkedCost += 25; // -> Ancien 25
        debug("costs1: " + unworkedCost + " :: " + projectUnworkedHours.value);
        assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period1 value does not match");
        assertEquals(250, actualCost.value, "testUnworkedHours(): period1 ac does not match");


        commercial2.setProperty('maxBilledUnworkedHours', '10');
        checkDescriptorProperty(commercial2, 'maxBilledUnworkedHours', '10', " UnworkedHours v2");
        assign(commercial2, task1, task8);  // 1step on task1 -> NotMyWork + 9step on task8
        reserve(commercial2, 2); // Unworked 10% -> 25$
        // Do 2nd execution period
        nextPeriod();
        clearAssignments(commercial2);

        unworkedCost += 25; // -> Ancien 50
        debug("costs2: " + unworkedCost + " :: " + projectUnworkedHours.value);
        assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period2 value does not match");
        assertEquals(500, actualCost.value, "testUnworkedHours(): period1 ac does not match");


        clearAssignments(commercial3);
        commercial3.setProperty('maxBilledUnworkedHours', '5');
        checkDescriptorProperty(commercial3, 'maxBilledUnworkedHours', '5', " UnworkedHours v3");
        assign(commercial3, task1, task8);  // 1step on task1 -> NotMyWork + 9step on task8
        reserve(commercial3, 3);  // Unworked 5%  -> 12.5$
        // Do 3rd execution period
        nextPeriod();
        clearAssignments(commercial3);

        unworkedCost += 12.5;   // -> Ancien 62.5
        debug("costs3: " + unworkedCost + " :: " + projectUnworkedHours.value);
        assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period3 value does not match");





        commercial4.setProperty('maxBilledUnworkedHours', '20');
        assign(commercial4, task1);  // 1step on task1 -> NotMyWork + 9step loosed
        reserve(commercial4, 4); // Unwork 20% of 1000/4 => 50$
        // Do 4th execution period
        nextPeriod();
        clearAssignments(commercial4);

        unworkedCost += 50;  // Ancien 112.50 
        debug("costs4: " + unworkedCost + " :: " + projectUnworkedHours.value);
        assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period4 value does not match");




        commercial5.setProperty('maxBilledUnworkedHours', '50');
        reserve(commercial5, 5); // Unwork 50% -> 125$
        // Do 5th execution period
        nextPeriod();

        unworkedCost += 125; // Ancien 237.5
        debug("costs5: " + unworkedCost + " :: " + projectUnworkedHours.value);
        assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period5 value does not match");




        reserve(commercial1, 6); // Unwork 100% -> 250$
        // Do 6th execution period
        nextPeriod();

        unworkedCost += 250;  // Ancien 487.50
        debug("costs6: " + unworkedCost + " :: " + projectUnworkedHours.value);
        assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period6 value does not match");




        designer1.setProperty('maxBilledUnworkedHours', '200');
        reserve(designer1, 7); // Unwork 100%    250$
        // Do 5th execution period
        nextPeriod();

        unworkedCost += 250; // ancien 737.5
        debug("costs7: " + unworkedCost + " :: " + projectUnworkedHours.value);
        assertEquals(unworkedCost, projectUnworkedHours.value, "testUnworkedHours(): period7 value does not match");




        designer2.setProperty('maxBilledUnworkedHours', '-200');
        reserve(designer2, 8); // Unwork 0% -> 0$
        // Do 5th execution period
        nextPeriod();

        debug("costs8: " + unworkedCost + " :: " + projectUnworkedHours.value);
        assertEquals(unworkedCost + 0, projectUnworkedHours.value, "testUnworkedHours(): period8 value does not match");
    }


    function testTrackingMessages() {
        reset();
        addTestPredecessor();

        doNextPeriod(2);


        // reqs are 
        //  "1x informaticien senior**, l:50"
        //  "1x designer senior**, l:50"
        assign(informaticien1, task9);
        assign(informaticien2, task9);
        reserve(informaticien1, 1);
        reserve(informaticien2, 1);
        // skill_completed_grouped

        assign(commercial4, task4);
        reserve(commercial4, 1, 2);
        // Skill completed single


        assign(designer1, task7);
        reserve(designer1, 1, 2, 3);
        // end of task switch to new single


        assign(designer1, task9);
        reserve(designer1, 1);

        assign(commercial1, task9);
        reserve(commercial1, 1);
        // -> not my work

        // -> start_on_task_grouped


        assign(commercial2, task1);
        assign(commercial3, task1);
        reserve(commercial2, 1);
        reserve(commercial3, 1);
        // Not my work grouped


        assign(informaticien3, task1);
        reserve(informaticien3, 1, 2);
        // Start on task 

        assign(informaticien4, task1);
        reserve(informaticien4, 2);
        // startOnTask


        assign(commercial5, task3);
        reserve(commercial5, 1);
        assign(informaticien5, task3);
        reserve(informaticien5, 1, 2);
        // BlockedGroup 1 BlockedSingle

        // End of task
        assign(informaticien6, task1);

        assign(informaticien4, task1);
        assign(informaticien4, task2);
        assign(informaticien6, task2);

        reserve(informaticien3, 3, 4);
        reserve(informaticien4, 3, 4);
        reserve(informaticien6, 3, 4);
        // switch_to_new grouped / switch_to_other single



        doNextPeriod(3);
    }

    function reset() {
        loadVariables();
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
        defaultEmployee(informaticien6);

        loadGameModelFacade();
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


    return {
        testAll: function() {
            return testsimplepmg();
        },
        testUnworkedHours: function() {
            return testUnworkedHours();
        },
        testNormalAssignment: function() {
            return testNormalAssignment();
        },
        testMultipleWork: function() {
            return testMultipleWork();
        },
        testTooManyResources: function() {
            return testTooManyResources();
        },
        testNotEnoughResources: function() {
            return testNotEnoughResources();
        },
        testActivityFactor: function() {
            return testActivityFactor();
        },
        testBonusProjectFactor: function() {
            return testBonusProjectFactor();
        },
        testCompetenceRatioInf: function() {
            return testCompetenceRatioInf();
        },
        testCompetenceRatioSup: function() {
            return testCompetenceRatioSup();
        },
        testCoordinationRatioInf: function() {
            return testCoordinationRatioInf();
        },
        testCoordinationRatioSup: function() {
            return testCoordinationRatioSup();
        },
        testCoordinationRatioDiffLevel: function() {
            return testCoordinationRatioDiffLevel();
        },
        testCoordinationRatioInfDiffWorks: function() {
            return testCoordinationRatioInfDiffWorks();
        },
        testCoordinationRatioInfDiffWorks2: function() {
            return testCoordinationRatioInfDiffWorks2();
        },
        testCoordinationRatioInfDiffWorks3: function() {
            return testCoordinationRatioInfDiffWorks3();
        },
        testLearnFactor: function() {
            return testLearnFactor();
        },
        testMotivationFactor: function() {
            return testMotivationFactor();
        },
        testOtherWorkFactor: function() {
            return testOtherWorkFactor();
        },
        testPredecessorFactor: function() {
            return testPredecessorFactor();
        },
        testRandomDurationInf: function() {
            return testRandomDurationInf();
        },
        testRandomDurationSup: function() {
            return testRandomDurationSup();
        },
        testRequirementLimit: function() {
            return testRequirementLimit();
        },
        testUnassignable: function() {
            return testUnassignable();
        },
        testremoveassign: function() {
            return testremoveassign();
        },
        testUnworkedReq: function() {
            return testUnworkedReq();
        }
    };
}());