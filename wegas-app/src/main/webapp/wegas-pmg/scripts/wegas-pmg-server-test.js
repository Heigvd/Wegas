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
}
function testSimplePMGNormalAssignment() {
    reset();                                                                    // Reset current game model

    task1.getInstance(self).setProperty('bac', '1000');
    task2.getInstance(self).setProperty('bac', '1500');

    standardPlannification();

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
    assertEquals(100, task1.instance.getProperty('completeness'), "testSimplePMGNormalAssignment(): task1 completness does not match");                                                             // -> Closing
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
function reset () {
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
    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task1.getInstance(self).id, 2);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 2);
    resourceController.addTaskPlannification(task3.getInstance(self).id, 3);
    resourceController.addTaskPlannification(task3.getInstance(self).id, 4);
    resourceController.addTaskPlannification(task4.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task4.getInstance(self).id, 2);
    resourceController.addTaskPlannification(task5.getInstance(self).id, 10);
}
function defaultTaskProperty (task) {
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
    var listPredName = [];
    listPredName.push('task1', 'task2');
    addPredecessor(Variable.findByName(self.getGameModel(), 'task3').getName(), listPredName);
}

function addPredecessor(descName, listPredName) {
    var i, ii, iii, taskDescList = Variable.findByName(self.getGameModel(), 'tasks'),
            taskDesc;

    for (i = 0; i < taskDescList.items.size(); i++) {
        taskDesc = taskDescList.items.get(i);
        if (taskDesc.getName() == descName) {
            for (ii = 0; ii < listPredName.length; ii++) {
                for (iii = 0; iii < taskDescList.items.size(); iii++) {
                    if (listPredName[ii] == taskDescList.items.get(iii).getName()) {
                        taskDesc.getPredecessors().add(taskDescList.items.get(iii));
                        break;
                    }
                }
            }
            break;
        }
    }
}

function removePredecessor() {
    var taskDescList = Variable.findByName(self.getGameModel(), 'tasks'), i,
            taskDesc;
    for (i = 0; i < taskDescList.items.size(); i++) {
        taskDesc = taskDescList.items.get(i);
        taskDesc.getPredecessors().clear();
    }
}