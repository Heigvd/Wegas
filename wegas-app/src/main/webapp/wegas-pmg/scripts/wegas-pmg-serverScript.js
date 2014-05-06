//Global variable for easy use
var gm = self.getGameModel();

/**
 * Call all necessary method to pass a period and calculate all variable.
 * set phase (if period egal max period) and set period.
 * if enter in phase 2, change pageGantt and pageTask then call function setWeekliesVariables
 * to calculate values like gauges and EV, AC, ...
 * if period is passed in phase realisation, calculate task progress (call
 *  function completeRealizationPeriod) and check the end of the project (if true, pass to phase 4).
 */
function nextPeriod() {
    var currentPhase = getCurrentPhase(),
            currentPeriod = getCurrentPeriod();

    //allPhaseQuestionAnswered();                                                 // First Check if all questions are answered

    if (currentPeriod.getValue(self) === currentPeriod.maxValueD) {              // If end of phase
        currentPhase.add(self, 1);
        //currentPeriod.setValue(self, 1);// Why?
        if (currentPhase.getValue(self) === 2) {
            Variable.findByName(gm, 'ganttPage').setValue(self, 11);
            Variable.findByName(gm, 'taskPage').setValue(self, 12);
        }
    } else if (currentPhase.getValue(self) === 2) {                             // If current phase is the 'realisation' phase
        runSimulation();
        currentPeriod.add(self, 1);
        if (checkEndOfProject()) {                                              //if the project ended
            currentPhase.add(self, 1);
        }
    } else {                                                                    // Otherwise pass to next period
        currentPeriod.add(self, 1);
    }
    updateVariables();
}

/**
 * Check if all active task is complete (Completeness > 100).
 * @returns {Boolean} true if the project is ended
 */
function checkEndOfProject() {
    var i, task, tasks = Variable.findByName(gm, 'tasks');
    for (i = 0; i < tasks.items.size(); i++) {
        task = tasks.items.get(i).getInstance(self);
        if (task.active && task.getPropertyD('completeness') < 100) {
            return false;
        }
    }
    return true;
}

/**
 * Check if all questions from a phase are answered
 */
function allPhaseQuestionAnswered() {
    var i, question, questions;

    try {
        questions = Variable.findByName(gm, "questions").items.get(getCurrentPhase().getValue(self)).items.get(getCurrentPeriod().getValue(self) - 1).items;
    } catch (e) {
        // Unable to find question list for current phase
    }
    if (questions) {
        for (i = 0; i < questions.size(); i++) {
            question = questions.get(i);
            if (!question.isReplied(self) && question.isActive(self)) {
                throw new Error("StringMessage: You have not answered all questions from this week.");
            }
        }
    }
}

/**
 * Calculate planedValue, earnedValue, actualCost, projectCompleteness, cpi, spi, save
 * history for variable the same variable and for costs, delay and quality.
 */
function updateVariables() {
    var i, j, task, employeesRequired,
            ev = 0, pv = 0, ac = 0, sumProjectCompleteness = 0, activeTasks = 0,
            tasksQuality = 0, tasksScale = 0,
            costsJaugeValue, qualityJaugeValue, delayJaugeValue, qualityJaugeValue = 0,
            tasks = Variable.findByName(gm, 'tasks'),
            costs = Variable.findByName(gm, 'costs'),
            delay = Variable.findByName(gm, 'delay'),
            quality = Variable.findByName(gm, 'quality'),
            planedValue = Variable.findByName(gm, 'planedValue'),
            earnedValue = Variable.findByName(gm, 'earnedValue'),
            actualCost = Variable.findByName(gm, 'actualCost'),
            exectutionPeriods = Variable.findByName(gm, 'periodPhase3');

    for (i = 0; i < tasks.items.size(); i++) {
        task = tasks.items.get(i).getInstance(self);
        sumProjectCompleteness += parseFloat(task.getProperty('completeness'));
        if (task.active) {                                                      //if task is active
            activeTasks += 1;
            ev += task.getPropertyD('bac') * task.getPropertyD('completeness') / 100;
            //pv += parseInt(task.getProperty('bac')) * (getPlannifiedCompleteness(v) / 100);
            //ac += parseInt(task.getProperty('wages')) + (parseInt(task.getProperty('completeness')) / 100) * parseInt(task.getProperty('fixedCosts')) + parseInt(task.getProperty('unworkedHoursCosts'));

            employeesRequired = 0;
            for (j = 0; j < task.requirements.size(); j++) {
                employeesRequired += task.requirements.get(j).quantity;
            }
            tasksScale += task.duration * employeesRequired;
            if (task.getPropertyD('completeness') > 0) {                        //...and started
                ac += task.getPropertyD('wages') + task.getPropertyD('fixedCosts') + task.getPropertyD('unworkedHoursCosts');
                //TO check
                tasksQuality += task.getPropertyD('quality') * task.duration * employeesRequired;
            } else {
                tasksQuality += (100 + task.getPropertyD('quality')) * task.duration * employeesRequired;
            }
        }
    }

    // completness = sum of all task's completeness in %
    Variable.findByName(gm, 'projectCompleteness').setValue(self, sumProjectCompleteness / activeTasks);
    //nbCompleteTasks = sumProjectCompleteness * activeTasks / (activeTasks * 100);
    //Variable.findByName(gm, 'projectCompleteness').setValue(self, nbCompleteTasks * 100 / activeTasks);
    //projectCompleteness.setValue(self, sumProjectCompleteness);

    // pv = for each task, sum -> bac * task completeness / 100
    planedValue.setValue(self, calculatePlanedValue(exectutionPeriods.getValue(self) - 1));
    // ev = for each task, sum -> bac * planified task completeness / 100
    earnedValue.setValue(self, ev);
    // ac = project fixe costs + for each task, sum -> wages + (completeness / 100) * fixed costs + unworkedHoursCosts
    //Variable.findByName(gm, 'actualCost').setValue(self, ac + parseInt(projectFixCosts.getValue(self)));
    actualCost.setValue(self, ac);
    //cpi = ev / ac * 100
    Variable.findByName(gm, 'cpi').setValue(self, (ev / ac * 100));
    //spi = ev / pv * 100
    Variable.findByName(gm, 'spi').setValue(self, (ev / pv * 100));

    // costs = EV / AC * 100
    if (planedValue.getValue(self) > 0) {
        costsJaugeValue = Math.round((earnedValue.getValue(self) / actualCost.getValue(self)) * 100);
    }
    costsJaugeValue = Math.min(Math.max(costsJaugeValue, costs.minValueD), costs.maxValueD);
    costs.setValue(self, costsJaugeValue);

    // delay = EV / PV * 100
    delayJaugeValue = Math.round(earnedValue.getValue(self) * 100 / planedValue.getValue(self));
    delayJaugeValue = Math.min(Math.max(delayJaugeValue, delay.minValueD), delay.maxValueD);
    delay.setValue(self, delayJaugeValue);

    //quality
    //with weighting of task's scale = sum each task -> task quality / task scale
    if (tasksScale > 0) {
        qualityJaugeValue = (tasksQuality / tasksScale);
    }
    //whitout weighting of task's scale
    //if (activeTasks > 0) {
    //    qualityJaugeValue = tasksQuality / activeTasks;
    //}
    qualityJaugeValue += Variable.findByName(gm, 'qualityImpacts').getValue(self) / 2;
    qualityJaugeValue = Math.min(Math.max(qualityJaugeValue, quality.minValueD), quality.maxValueD);
    quality.setValue(self, qualityJaugeValue);

    costs.getInstance(self).saveHistory();
    delay.getInstance(self).saveHistory();
    quality.getInstance(self).saveHistory();
    planedValue.getInstance(self).saveHistory();
    earnedValue.getInstance(self).saveHistory();
    actualCost.getInstance(self).saveHistory();
    Variable.findByName(gm, 'managementApproval').getInstance(self).saveHistory();
    Variable.findByName(gm, 'userApproval').getInstance(self).saveHistory();
}

/**
 * function to know if an employee is working on the task.
 * A employee working on task mean that he works the period before (currentPeriod -1)
 * @param {String} empName
 * @param {String} taskName
 * @returns Boolean true if works on project
 */
function workOnTask(empName, taskName) {
    var i, activity,
            employee = Variable.findByName(gm, empName).getInstance(),
            task = Variable.findByName(gm, taskName),
            currentPeriod = Variable.findByName(gm, "periodPhase3").getValue(self),
            previousPeriod = currentPeriod - 1;

    for (i = 0; i < employee.activities.size(); i++) {
        activity = employee.activities.get(i);
        if (activity.time === previousPeriod && task.id === activity.taskDescriptorId) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a ressource work on the project
 * @param {string} name the name from ressource to check
 * @return true if work on project
 */
function workOnProject(name) {
    var i, task,
            activityNotFinish = false, hasOccupation = false, occupation,
            employee = Variable.findByName(gm, name).getInstance(),
            currentPeriod = Variable.findByName(gm, "periodPhase3").getValue(self);

    //Check if has a not finished activity
    for (i = 0; i < employee.activities.size(); i++) {
        task = employee.activities.get(i).taskDescriptor.getInstance(self);
        if (task.getPropertyD("completeness") < 100) {
            activityNotFinish = true;
            break;
        }
    }

    // Check if has an occupation for the futur
    for (i = 0; i < employee.occupations.size(); i++) {
        occupation = employee.occupations.get(i);
        if (occupation.time >= currentPeriod) {
            hasOccupation = true;
            break;
        }
    }

    return activityNotFinish && hasOccupation;
}

// Functions for addArtosPredecessor
function addArtosPredecessor() {
    var listPredName = [];
    // ChoixEnvironnementDéveloppement predecessor
    listPredName.push('ChoixEnvironnementDéveloppement', 'AnalyseExistant', 'AnalyseBesoins');
    addPredecessor(Variable.findByName(gm, 'DossierSpécifications').getName(), listPredName);

    // ModélisationDonnées predecessor
    listPredName = [];
    listPredName.push('DossierSpécifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gm, 'ModélisationDonnées').getName(), listPredName);

    // ModélisationTraitements predecessor
    listPredName = [];
    listPredName.push('DossierSpécifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gm, 'ModélisationTraitements').getName(), listPredName);

    // ModélisationIHM predecessor
    listPredName = [];
    listPredName.push('DossierSpécifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gm, 'ModélisationIHM').getName(), listPredName);

    // ProgrammationBD predecessor
    listPredName = [];
    listPredName.push('ModélisationDonnées');
    addPredecessor(Variable.findByName(gm, 'ProgrammationBD').getName(), listPredName);

    // ProgrammationTraitements predecessor
    listPredName = [];
    listPredName.push('ModélisationDonnées', 'ModélisationTraitements');
    addPredecessor(Variable.findByName(gm, 'ProgrammationTraitements').getName(), listPredName);

    // ProgrammationIHM predecessor
    listPredName = [];
    listPredName.push('ModélisationIHM');
    addPredecessor(Variable.findByName(gm, 'ProgrammationIHM').getName(), listPredName);

    // PromotionSystème predecessor
    listPredName = [];
    listPredName.push('DossierSpécifications');
    addPredecessor(Variable.findByName(gm, 'PromotionSystème').getName(), listPredName);

    // Tests predecessor
    listPredName = [];
    listPredName.push('ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM', 'CorrectionModélisationTraitements', 'CorrectionProgrammationTraitements');
    addPredecessor(Variable.findByName(gm, 'Tests').getName(), listPredName);

    // ImplantationMachine predecessor
    listPredName = [];
    listPredName.push('ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM');
    addPredecessor(Variable.findByName(gm, 'ImplantationMachine').getName(), listPredName);

    // PrototypeUtilisateur predecessor
    listPredName = [];
    listPredName.push('ChoixEnvironnementDéveloppement', 'AnalyseExistant', 'AnalyseBesoins');
    addPredecessor(Variable.findByName(gm, 'PrototypeUtilisateur').getName(), listPredName);
}

/**
 * Function to add taskPredecessor
 * @param {type} descName
 * @param {type} listPredName
 */
function addPredecessor(descName, listPredName) {
    var i, ii, iii, taskDescList = Variable.findByName(gm, 'tasks'),
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

// Functions for addArtosOccupation
function addArtosOccupation() {
    addOccupation("Gaelle", 6);
    addOccupation("Gaelle", 7);

    addOccupation("Murielle", 4);
    addOccupation("Murielle", 5);

    addOccupation("Kurt", 4);

    addOccupation("Diane", 2);

    addOccupation("Luc", 11);
    addOccupation("Luc", 12);

    addOccupation("André", 10);
    addOccupation("André", 11);

    addOccupation("Pierre", 6);

    addOccupation("Yvonne", 6);

    addOccupation("Quentin", 9);

    addOccupation("Karim", 3);
}

function addOccupation(name, periode) {
    Variable.findByName(gm, name).addOccupation(self, periode, false, "");
}