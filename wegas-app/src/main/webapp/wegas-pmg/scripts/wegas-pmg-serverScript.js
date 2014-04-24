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

    allPhaseQuestionAnswered();                                                 // First Check if all questions are answered

    if (currentPeriod.getValue(self) === parseInt(currentPeriod.getMaxValue())) {// If end of phase
        currentPhase.add(self, 1);
        //currentPeriod.setValue(self, 1);// Why?
        if (currentPhase.getValue(self) === 2) {
            Variable.findByName(gm, 'ganttPage').setValue(self, 11);
            Variable.findByName(gm, 'taskPage').setValue(self, 12);
        }
    } else if (currentPhase.getValue(self) === 2) {                             // If current phase is the 'realisation' phase
        completeRealizationPeriod();
        if (checkEndOfProject()) {                                              //if the project ended
            //currentPeriod.setValue(self, 1);// Why?
            currentPhase.add(self, 1);
        } else {
            currentPeriod.add(self, 1);
        }
    } else {                                                                    // Otherwise pass to next period
        currentPeriod.add(self, 1);
    }
    setWeekliesVariables();
}

/**
 * Check if all active task is complete (Completeness > 100).
 * @returns {Boolean} true if the project is ended
 */
function checkEndOfProject() {
    var i, taskInst, tasks = Variable.findByName(gm, 'tasks'), isTheEnd = true;
    for (i = 0; i < tasks.items.size(); i++) {
        taskInst = tasks.items.get(i).getInstance(self);
        if (isTrue(taskInst.getActive()) && parseInt(taskInst.getProperty('completeness')) < 100) {
            isTheEnd = false;
            break;
        }
    }
    return isTheEnd;
}


/**
 * Check if all questions from a phase are answered
 */
function allPhaseQuestionAnswered() {
    var i, question,
            currentPhaseQuestions = Variable.findByName(gm, "questions").items.get(getCurrentPhase().getValue(self)).items.get(getCurrentPeriod().getValue(self) - 1).items;
    for (i = 0; i < currentPhaseQuestions.size(); i++) {
        question = currentPhaseQuestions.get(i);
        if (question.isReplied(self) == false && question.getInstance(self).getActive() == true) {
            throw new Error("StringMessage: You have not answered all questions from this week.");
        }
    }
}

/**
 * function to know if an employee is working on the task.
 * A employee working on task mean that he works the period before (currentPeriode -1)
 * @param String empName
 * @param String taskName
 * @returns Boolean true if works on project
 */
function workOnTask(empName, taskName) {
    var employee = Variable.findByName(gm, empName), empInstance, i, activity,
            task = Variable.findByName(gm, taskName),
            currentPeriode = Variable.findByName(gm, "periodPhase3").getInstance().value,
            precedentPeriode = currentPeriode - 1;

    empInstance = employee.getInstance();
    for (i = 0; i < empInstance.getActivities().size(); i++) {
        activity = empInstance.getActivities().get(i);
        if (parseInt(activity.getTime()) === precedentPeriode && task.getId() === activity.getTaskDescriptorId()) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a ressource work on the project
 * @param String name, the name from ressource to check
 * @return true if work on project
 */
function workOnProject(name) {
    var employee = Variable.findByName(gm, name), instance, i, activity,
            activityNotFinish = false, taskInstance, hasOccupation = false, occupation,
            currentPeriode = Variable.findByName(gm, "periodPhase3").getInstance().value;

    //Check if has a not finished activity
    instance = employee.getInstance();
    for (i = 0; i < instance.getActivities().size(); i++) {
        activity = instance.getActivities().get(i);
        taskInstance = activity.getTaskDescriptor().getInstance(self);
        if (parseInt(taskInstance.getProperties().get("completeness")) < 100) {
            activityNotFinish = true;
            break;
        }
    }

    // Check if has an occupation for the futur
    for (i = 0; i < instance.getOccupations().size(); i++) {
        occupation = instance.getOccupations().get(i);
        if (occupation.getTime() >= currentPeriode) {
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
    employee = Variable.findByName(gm, name),
            employee.addOccupation(self, periode, false, "");
}