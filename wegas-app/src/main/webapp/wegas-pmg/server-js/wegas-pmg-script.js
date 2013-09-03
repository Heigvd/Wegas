importPackage(javax.naming);
var gm = self.getGameModel(), testMode = false;
steps = 10, minTaskDuration = 0.1;

function nextPeriod() {
    var time = getCurrentInGameTime(), phase = VariableDescriptorFacade.findByName(gm, 'currentPhase'),
            ganttPage, taskPage;
    phases = VariableDescriptorFacade.findByName(gm, 'currentPeriod');
    if (time.period === parseInt(phases.items.get(time.phase).getMaxValue())) { // if end of phase
        phases.items.get(time.phase).getInstance(self).setValue(1);
        phase.getInstance(self).setValue(time.phase + 1);
        if (parseInt(phase.getInstance(self).getValue()) === 2) {
            ganttPage = VariableDescriptorFacade.findByName(gm, 'ganttPage');
            ganttPage.getInstance(self).setValue(11);
            taskPage = VariableDescriptorFacade.findByName(gm, 'taskPage');
            taskPage.getInstance(self).setValue(12);
        } 
    } else if (time.phase === 2) { //if current phase is the 'realisation' phase
        completeRealizationPeriod();
        if (checkEndOfProject()) { //if the project ended
            phases.items.get(time.phase).getInstance(self).setValue(1);
            phase.getInstance(self).setValue(time.phase + 1);
        } else {
            phases.items.get(time.phase).getInstance(self).setValue(time.period + 1);
        }
    } else {
        phases.items.get(time.phase).getInstance(self).setValue(time.period + 1);
    }
}

function checkEndOfProject() {
    var i, taskInst, tasks = VariableDescriptorFacade.findByName(gm, 'tasks'), isTheEnd = true;
    for (i = 0; i < tasks.items.size(); i++) {
        taskInst = tasks.items.get(i).getInstance(self);
        if (isTrue(taskInst.getActive()) && parseInt(taskInst.getProperty('completeness')) < 100) {
            isTheEnd = false;
            break;
        }
    }
    return isTheEnd;
}

function completeRealizationPeriod() {
    var i;
    if (testMode) {
        println('==============================');
        println('==============================');
    }
    for (i = 0; i < steps; i++) {
        calculTasksProgress(i);
        if (testMode) {
            println('---');
        }
    }
    AddNewFixedCosts();
    setWeekliesVariables();
}

function setWeekliesVariables() {
    var i, taskInst, ev = 0, pv = 0, tasks = VariableDescriptorFacade.findByName(gm, 'tasks'),
            costs = VariableDescriptorFacade.findByName(self.getGameModel(), 'costs'),
            delay = VariableDescriptorFacade.findByName(self.getGameModel(), 'delay'),
            quality = VariableDescriptorFacade.findByName(self.getGameModel(), 'quality');
    for (i = 0; i < tasks.items.size(); i++) {
        taskInst = tasks.items.get(i).getInstance(self);
        if (isTrue(taskInst.getActive())) {
            ev += parseInt(taskInst.getProperty('fixedCosts')) * parseInt(taskInst.getProperty('completeness')) / 100;
            pv += parseInt(taskInst.getProperty('bac')) * parseInt(taskInst.getProperty('completeness')) / 100;
        }
    }

    planedValue.setValue(pv);
    earnedValue.setValue(ev);

    updateGauges();

    costs.getInstance(self).saveHistory();
    delay.getInstance(self).saveHistory();
    quality.getInstance(self).saveHistory();
    planedValue.saveHistory();
    earnedValue.saveHistory();
    actualCost.saveHistory();
}

function updateGauges() {
    var i, taskInst, tasks = VariableDescriptorFacade.findByName(gm, 'tasks'),
            costs = VariableDescriptorFacade.findByName(self.getGameModel(), 'costs'),
            delay = VariableDescriptorFacade.findByName(self.getGameModel(), 'delay'),
            quality = VariableDescriptorFacade.findByName(self.getGameModel(), 'quality'),
            management = VariableDescriptorFacade.findByName(self.getGameModel(), 'managementApproval'),
            customers = VariableDescriptorFacade.findByName(self.getGameModel(), 'userApproval'),
            tasksQuality = 0, nomberOfTasks = 0, nomberOfBeganTasks = 0, tasksDelay = 0,
            costsJaugeValue, qualityJaugeValue, delayJaugeValue, managementJaugeValue, customerJaugeValue;

    for (i = 0; i < tasks.items.size(); i++) {
        taskInst = tasks.items.get(i).getInstance(self);
        if (isTrue(taskInst.getActive())) {//if task is active
            tasksDelay += getCurrentTaskDelay(tasks.items.get(i));
            nomberOfTasks += 1;
            if (parseInt(taskInst.getProperty('completeness')) > 0) { //...and started
                tasksQuality += parseInt(taskInst.getProperty('quality'));
                nomberOfBeganTasks += 1;
            }
        }
    }

    //costs
    if (parseInt(planedValue.value) > 0) {
        costsJaugeValue = Math.round((100 / parseInt(earnedValue.value)) * parseInt(planedValue.value));
    }
    costsJaugeValue = (costsJaugeValue > parseInt(costs.getMinValue())) ? costsJaugeValue : parseInt(costs.getMinValue());
    costsJaugeValue = (costsJaugeValue < parseInt(costs.getMaxValue())) ? costsJaugeValue : parseInt(costs.getMaxValue());
    costs.getInstance(self).setValue(costsJaugeValue);

    //delay
    if (nomberOfTasks > 0) {
        delayJaugeValue = Math.round(tasksDelay / nomberOfTasks);
    }
    delayJaugeValue = (delayJaugeValue > parseInt(delay.getMinValue())) ? delayJaugeValue : parseInt(delay.getMinValue());
    delayJaugeValue = (delayJaugeValue < parseInt(delay.getMaxValue())) ? delayJaugeValue : parseInt(delay.getMaxValue());
    delay.getInstance(self).setValue(delayJaugeValue);

    //quality
    if (nomberOfBeganTasks > 0) {
        qualityJaugeValue = tasksQuality / nomberOfBeganTasks + parseInt(qualityImpacts.value);
    }
    qualityJaugeValue = (qualityJaugeValue > parseInt(quality.getMinValue())) ? qualityJaugeValue : parseInt(quality.getMinValue());
    qualityJaugeValue = (qualityJaugeValue < parseInt(quality.getMaxValue())) ? qualityJaugeValue : parseInt(quality.getMaxValue());
    quality.getInstance(self).setValue(qualityJaugeValue);

    //management approval
    managementJaugeValue = parseInt(management.getInstance(self).getValue()) + parseInt(managementApprovalImpacts.value);
    managementJaugeValue = (managementJaugeValue > parseInt(management.getMinValue())) ? managementJaugeValue : parseInt(management.getMinValue());
    managementJaugeValue = (managementJaugeValue < parseInt(management.getMaxValue())) ? managementJaugeValue : parseInt(management.getMaxValue());
    management.getInstance(self).setValue(managementJaugeValue);
    management.getInstance(self).saveHistory();

    //customer approval
    customerJaugeValue = parseInt(customers.getInstance(self).getValue()) + parseInt(userApprovalImpacts.value);
    customerJaugeValue = (customerJaugeValue > parseInt(customers.getMinValue())) ? customerJaugeValue : parseInt(customers.getMinValue());
    customerJaugeValue = (customerJaugeValue < parseInt(customers.getMaxValue())) ? customerJaugeValue : parseInt(customers.getMaxValue());
    customers.getInstance(self).setValue(customerJaugeValue);
    customers.getInstance(self).saveHistory();

}

function getCurrentTaskDelay(taskDesc) {
    var i, planif, pastPeriods = [], delay = 0, time = getCurrentInGameTime(),
            completeness = parseInt(taskDesc.getInstance(self).getProperty('completeness')),
            planif = taskDesc.getInstance(self).getPlannification(), planifArray = [];
    for (i = 0; i < planif.size(); i++) {
        planifArray.push(parseInt(planif.get(i)));
    }
    planif = planifArray;
    for (i = 0; i <= time.period; i++) {
        if (planif.indexOf(i) > -1) {
            pastPeriods.push(i);
        }
    }
    if (completeness > 0 && planif.length > 0) {
        if (pastPeriods.length <= 0) {
            delay = completeness + 100;
        }
        else {
            delay = (100 / ((pastPeriods.length / planif.length) * 100)) * completeness;
        }
    }
    return delay;
}

function AddNewFixedCosts() {
    var i, j, listEmployees = flattenList(VariableDescriptorFacade.findByName(gm, 'employees')),
            activities, pastActivities = [], currentActivities = [], time = getCurrentInGameTime(),
            exist = true;
    for (i = 0; i < listEmployees.length; i++) {
        activities = listEmployees[i].getInstance(self).getActivities();
        for (j = 0; j < activities.size(); j++) {
            if (parseInt(activities.get(j).getTime()) === time.period) { //parseInt = parseFloat() + Math.floor()
                currentActivities.push(activities.get(j));
            } else {
                pastActivities.push(activities.get(j));
            }
        }
    }
    currentActivities = getUniqueTasksInActivities(currentActivities);
    pastActivities = getUniqueTasksInActivities(pastActivities);
    for (i = 0; i < currentActivities.length; i++) {
        exist = (pastActivities.length > 0) ? true : false;
        for (j = 0; j < pastActivities.length; j++) {
            if (currentActivities[i].getTaskDescriptor() === pastActivities[j].getTaskDescriptor()) {
                exist = true;
                break;
            }
        }
        if (!exist) {
            actualCost.setValue(parseInt(actualCost.getValue()) + parseInt(currentActivities[i].getTaskDescriptor().getInstance(self).getProperty('fixedCosts')));
        }
    }
}

function calculTasksProgress(currentStep) {
    var i, work, activitiesAsNeeds, oneTaskPerActivity, allCurrentActivities,
            taskProgress, allCurrentActivities,
            requirementsByWork, taskInst;
    allCurrentActivities = createActivities(currentStep);
    activitiesAsNeeds = getActivitiesWithEmployeeOnDifferentNeeds(allCurrentActivities);
    for (i = 0; i < activitiesAsNeeds.length; i++) { //for each need
        calculateProgressOfNeed(activitiesAsNeeds[i], allCurrentActivities);
    }
    oneTaskPerActivity = getUniqueTasksInActivities(activitiesAsNeeds);
    for (i = 0; i < oneTaskPerActivity.length; i++) {
        taskProgress = 0;
        taskInst = oneTaskPerActivity[i].getTaskDescriptor().getInstance(self);
        requirementsByWork = getRequirementsByWork(taskInst.getRequirements());
        for (work in requirementsByWork) {
            taskProgress += requirementsByWork[work].completeness;
        }
        taskProgress = (taskProgress > 97) ? 100 : taskProgress; //>97 yes, don t frustrate the players please.
        taskInst.setProperty('completeness', Math.round(taskProgress));
        taskInst.setProperty('quality', calculateTaskQuality(oneTaskPerActivity[i].getTaskDescriptor()));
    }
    checkEnd(allCurrentActivities, currentStep);
}

function getUniqueTasksInActivities(activities) {
    var i, j, oneTaskPerActivity = [], wasAdded;
    if (activities.length > 0) {
        oneTaskPerActivity.push(activities[0]);
    }
    for (i = 0; i < activities.length; i++) {
        wasAdded = false;
        for (j = 0; j < oneTaskPerActivity.length; j++) {
            if (oneTaskPerActivity[j].getTaskDescriptor() === activities[i].getTaskDescriptor()) {
                wasAdded = true;
                break;
            }
        }
        if (!wasAdded) {
            oneTaskPerActivity.push(activities[i]);
        }
    }
    return oneTaskPerActivity;
}

function getActivitiesWithEmployeeOnDifferentNeeds(activities) {
    var i, j, activitiesAsNeeds = [], wasAdded;
    if (activities.length > 0) {
        activitiesAsNeeds.push(activities[0]);
    }
    for (i = 1; i < activities.length; i++) { //for each need
        wasAdded = false;
        if (getActivitiesWithEmployeeOnSameNeed(activities, activities[i]).length > 1) {
            for (j = 1; j < activitiesAsNeeds.length; j++) {
                if (activities[i] === activitiesAsNeeds[j]) {
                    wasAdded = true;
                    break;
                }
            }
        }
        if (!wasAdded) {
            activitiesAsNeeds.push(activities[i]);
        }
    }
    return activitiesAsNeeds;
}

function getActivitiesWithEmployeeOnSameNeed(activities, activity) {
    var i, employeeInst, selectedReq, sortedActivities = [], selectedReqI;
    employeeInst = activity.getResourceInstance();
    selectedReq = activity.getRequirement();
    for (i = 0; i < activities.length; i++) {
        if (parseFloat(activity.getTime()) === parseFloat(activities[i].getTime()) && activity.getTaskDescriptor() === activities[i].getTaskDescriptor()) {
            selectedReqI = activities[i].getRequirement();
            if (selectedReq === selectedReqI) {
                sortedActivities.push(activities[i]);
            }
        }
    }
    return sortedActivities;
}

function createActivities(currentStep) {
    var i, listEmployees = flattenList(VariableDescriptorFacade.findByName(gm, 'employees')),
            employeeDesc, employeeInst, activity, activities = [], assignables,
            existanteActivity, time = getCurrentInGameTime().period + currentStep / 10;
    if (!listEmployees) {
        return activities;
    }
    for (i = 0; i < listEmployees.length; i++) {
        employeeDesc = listEmployees[i];
        employeeInst = employeeDesc.getInstance(self);
        if (isReservedToWork(employeeInst)) { //have a 'player created' occupation
            assignables = checkAssignments(employeeInst.getAssignments(), currentStep);
            if (assignables.length > 0) { //have assignable tasks
                existanteActivity = findLastStepCorrespondingActivity(employeeInst, assignables[0].getTaskDescriptor(), time);
                if (existanteActivity) { //set corresponding past activity if it existe. Else create it.
                    activity = existanteActivity;
                } else {
                    activity = employeeInst.createActivity(assignables[0].getTaskDescriptor());
                }
                activity.setRequirement(selectRequirementFromActivity(activity));
                activity.setTime(time);
                activities.push(activity);
            }
        }
    }
    return activities;
}

function selectRequirementFromActivity(activity) {
    var selectedReq, workAs, taskInst, reqByWorks;
    taskInst = activity.getTaskDescriptor().getInstance(self);
    reqByWorks = getRequirementsByWork(taskInst.getRequirements());
    workAs = selectFirstUncompletedWork(taskInst.getRequirements(), reqByWorks);
    selectedReq = selectRequirement(taskInst, activity.getResourceInstance(), workAs, reqByWorks);
    return selectedReq;
}

function findLastStepCorrespondingActivity(employeeInst, taskDesc, currentPeriod) {
    var i, activity, occurence = null;
    for (i = 0; i < employeeInst.getActivities().size(); i++) {
        activity = employeeInst.getActivities().get(i);
        if (activity.getTaskDescriptor() === taskDesc   //if the task of activity match with the given task (same task and same employee == same activity) 
                && currentPeriod - Math.floor(currentPeriod) !== 0 //if it s not a new period (current step !== 0) 
                && parseFloat(activity.getTime()) === getFloat(currentPeriod - 0.1)) { //if activity was used the last step
            occurence = activity;
            break;
        }
    }
    return occurence;
}

function haveCorrespondingActivityInPast(employeeInst, taskDesc, currentPeriod) {
    var i, activity, occurence = false;
    for (i = 0; i < employeeInst.getActivities().size(); i++) {
        activity = employeeInst.getActivities().get(i);
        if (activity.getTaskDescriptor() === taskDesc   //if the task of activity match with the given task (same task and same employee == same activity)
                && currentPeriod > parseFloat(activity.getTime())) {
            occurence = true;
            break;
        }
    }
    return occurence;
}

function isReservedToWork(employeeInst) {
    var i, occupations = employeeInst.getOccupations(),
            time = getCurrentInGameTime(), reservedToWork = false;
    for (i = 0; i < occupations.size(); i++) {
        if (parseInt(occupations.get(i).getTime()) === time.period && isTrue(occupations.get(i).getEditable())) {
            reservedToWork = true;
        }
    }
    return reservedToWork;
}

function getAssignables(assignments) {
    var i, taskDesc, assignables = [], work;
    for (i = 0; i < assignments.size(); i++) {
        work = null;
        taskDesc = assignments.get(i).getTaskDescriptor();
        if (parseInt(taskDesc.getInstance(self).getProperty('completeness')) < 100 && getPredecessorFactor(taskDesc) >= 0.2) { //if the task isn t terminated and average of predecessors advancement is upper than 20% 
            assignables.push(assignments.get(i));
        }
    }
    return assignables;
}

function checkAssignments(assignments, currentStep) {
    var i, taskDesc, employeeInst, employeeName,
            employeeJob, taskInst, nextTasks;
    if (assignments.size() <= 0) {
        return [];
    }
    employeeInst = assignments.get(0).getResourceInstance();
    employeeName = employeeInst.getDescriptor().getLabel();
    employeeJob = employeeInst.getSkillsets().keySet().toArray()[0];
    nextTasks = getAssignables(employeeInst.getAssignments());
    for (i = 0; i < assignments.size(); i++) {
        taskDesc = assignments.get(i).getTaskDescriptor();
        taskInst = taskDesc.getInstance();
        if (parseFloat(taskInst.getProperty('completeness')) >= 100) {
            if (nextTasks[0]) {
                sendMessage(getStepName(currentStep) + ') Fin de la tâche : ' + taskDesc.getLabel(),
                        'La tâche ' + taskDesc.getLabel() + ' est terminée, je passe à la tâche ' + nextTasks[0].getTaskDescriptor().getLabel() + ' <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
                        employeeName);
            } else {
                sendMessage(getStepName(currentStep) + ') Fin de la tâche : ' + taskDesc.getLabel(),
                        'La tâche ' + taskDesc.getLabel() + ' est terminée, je retourne à mon activitié traditionnelle. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
                        employeeName);
            }
            assignments.remove(i);
            break;
        } else if (getPredecessorFactor(taskDesc) <= 0.2) {
            sendMessage(getStepName(currentStep) + ') Impossible de progresser sur la tâche : ' + taskDesc.getLabel(),
                    'Je suis sensé travailler sur la tâche ' + taskDesc.getLabel() + ' mais les tâches précedentes ne sont pas assez avancées. <br/> Je retourne donc à mes occupations habituel. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
                    employeeName);
            assignments.remove(i);
            break;
        }
    }
    return nextTasks;
}

function getPredecessorFactor(taskDesc) {
    var i, predecessorsAdvancements, predecessors, average, numberOfPredecessors;
    predecessorsAdvancements = 0;
    numberOfPredecessors = 0;
    predecessors = taskDesc.getPredecessors();
    for (i = 0; i < predecessors.size(); i++) {
        if (isTrue(predecessors.get(i).getInstance(self).getActive())) {
            predecessorsAdvancements += parseInt(predecessors.get(i).getInstance(self).getProperty('completeness'));
            numberOfPredecessors += 1;
        }
    }
    if (numberOfPredecessors > 0) {
        average = predecessorsAdvancements / numberOfPredecessors;
    } else {
        average = 100;
    }
    return Math.pow(average / 100, parseInt(taskDesc.getInstance(self).getProperty('predecessorsDependances')));
}

function selectFirstUncompletedWork(requirements, reqByWorks) {
    var work, firstUncompletedWork;
    if (!reqByWorks) {
        reqByWorks = getRequirementsByWork(requirements); // get requirements merged by kind of work. 
    }
    for (work in reqByWorks) {
        if (reqByWorks[work].completeness < reqByWorks[work].maxLimit) { //check if the maximum limite from all requirements of the current kind of work is smaller than the completeness of the current kind of work
            firstUncompletedWork = work;
            break;
        }
    }
    return firstUncompletedWork;
}

function selectRequirement(taskInst, employeeInst, workAs, reqByWorks) {
    var i, requirements = taskInst.getRequirements(), req, selectedReq = null,
            totalOfPersonneInTask = 0, deltaLevel = 1000,
            level = parseInt(employeeInst.getSkillsets().get(employeeInst.getSkillsets().keySet().toArray()[0]));
    for (i = 0; i < requirements.size(); i++) {
        totalOfPersonneInTask += parseInt(requirements.get(i).getQuantity());
    }
    for (i = 0; i < requirements.size(); i++) {
        req = requirements.get(i);
        if (req.getWork() == workAs && req.getCompleteness() < (reqByWorks[workAs].maxLimit * totalOfPersonneInTask / reqByWorks[workAs].totalOfEmployees)) {
            if (Math.abs(deltaLevel) > level - parseInt(req.getLevel())) {
                deltaLevel = level - parseInt(req.getLevel());
                selectedReq = req;
            }
        }
    }
    return selectedReq;
}

function getRequirementsByWork(requirements) {
    var i, req, works = {}, work, needsCompletion = 0, totalOfEmployees = 0;
    for (i = 0; i < requirements.size(); i++) {
        req = requirements.get(i);
        //keep an occurance of each kind of work needed
        if (works[req.getWork()]) {
            work = works[req.getWork()];
        } else {
            work = works[req.getWork()] = {
                maxLimit: 0,
                typesOfLevels: [],
                totalOfEmployees: 0,
                completeness: 0
            };
        }
        //keep the highest limit of all limits from each kind of work needed
        if (work.maxLimit < parseInt(req.getLimit())) {
            work.maxLimit = parseInt(req.getLimit());
        }
        //keep all kind of levels for each kind of work needed
        if (work.typesOfLevels.indexOf(req.getLevel()) <= -1) {
            work.typesOfLevels.push(req.getLevel());
        }
        //keep the summe of personns needed for each kind of work needed
        totalOfEmployees += parseInt(req.getQuantity());
        //is needed for next calcul
        needsCompletion += (parseInt(req.getCompleteness()) * parseInt(req.getQuantity()));
    }
    for (work in works) {
        //keep the summe of personns needed for each kind of work needed
        works[work].totalOfEmployees = totalOfEmployees;
        //keep the work completion for each kind of work needed
        works[work].completeness = (needsCompletion / totalOfEmployees);
    }
    return works;
}

function calculateProgressOfNeed(activityAsNeeds, allCurrentActivities) {
    var i, taskDesc, taskInst, employeeDesc, employeeInst, activityRate, sameNeedActivity,
            affectedEmployeesDesc = [], requirements, stepAdvance = 1, sumActivityRate = 0,
            employeesMotivationXActivityRate = 0, deltaLevel, workAs, selectedReq,
            employeesMotivationFactor, employeesSkillsetXActivityRate = 0, predecessorsAdvance = 1,
            employeeSkillsetFactor, activityCoefficientXActivityRate = 0, otherWorkFactor = 1,
            correctedRessources, reqByWorks, numberOfEmployeeOnNeedOnNewTask = 0,
            needProgress, motivationXActivityRate = 0, skillsetXActivityRate = 0, level,
            averageSkillsetQuality, stepQuality;

    taskDesc = activityAsNeeds.getTaskDescriptor();
    taskInst = taskDesc.getInstance(self);
    requirements = taskInst.getRequirements();
    reqByWorks = getRequirementsByWork(requirements);
    selectedReq = activityAsNeeds.getRequirement();
    workAs = selectedReq.getWork();
    sameNeedActivity = getActivitiesWithEmployeeOnSameNeed(allCurrentActivities, activityAsNeeds);
    level = parseInt(activityAsNeeds.getResourceInstance().getSkillsets().get(activityAsNeeds.getResourceInstance().getSkillsets().keySet().toArray()[0]));
    deltaLevel = parseInt(selectedReq.getLevel()) - level;

    //For each need
    for (i = 0; i < sameNeedActivity.length; i++) {
        employeeInst = sameNeedActivity[i].getResourceInstance();
        employeeDesc = employeeInst.getDescriptor();
        affectedEmployeesDesc.push(employeeDesc);
        activityRate = parseFloat(employeeDesc.getInstance(self).getProperty('activityRate'));
        sumActivityRate += activityRate;
        //Calculate ressource motivation factor
        employeesMotivationFactor = 1 + 0.05 * parseFloat(employeeDesc.getProperty('coef_moral')) * (parseInt(employeeDesc.getInstance(self).getMoral()) - 7);
        //Calcul variables for needMotivationFactor
        employeesMotivationXActivityRate += employeesMotivationFactor * activityRate;
        //Calcul variables for needSkillsetFactor
        if (deltaLevel > 0) {
            employeeSkillsetFactor = 1 + 0.05 * parseFloat(taskDesc.getProperty('competenceRatioSup')) * deltaLevel;
            if (employeeSkillsetFactor < 0) {
                employeeSkillsetFactor = 0;
            }
        } else {
            employeeSkillsetFactor = 1 + 0.05 * parseFloat(taskDesc.getProperty('competenceRatioInf')) * deltaLevel;
        }
        employeesSkillsetXActivityRate += employeeSkillsetFactor * activityRate;
        //Calcul variable for needSkillsetFactor
        activityCoefficientXActivityRate += parseFloat(employeeDesc.getProperty('coef_activity')) * activityRate;
        //Calcul variable for learnFactor
        if (!haveCorrespondingActivityInPast(employeeInst, taskDesc, getCurrentInGameTime().period)) {
            numberOfEmployeeOnNeedOnNewTask++;
        }
        //Calculate variable for quality
        motivationXActivityRate += parseInt(employeeInst.getMoral()) * activityRate;
        skillsetXActivityRate += parseInt(employeeInst.getSkillsets().get(employeeInst.getSkillsets().keySet().toArray()[0])) * activityRate; //level * activityRate
    }

    //calculate needMotivationFactor, needSkillsetFactor and activityNeedRateFactor
    if (sumActivityRate !== 0) {
        stepAdvance *= employeesMotivationXActivityRate / sumActivityRate; //needMotivationFactor
        stepAdvance *= employeesMotivationXActivityRate / sumActivityRate; //needSkillsetFactor
        stepAdvance *= activityCoefficientXActivityRate / sumActivityRate; //activityNeedRateFactor
    }

    // calculate baseAdvance
    stepAdvance *= 1 / (steps * (parseInt(taskDesc.getInstance(self).getDuration()))); //baseAdvance

    // calculate numberOfRessourcesFactor
    if (reqByWorks[workAs].totalOfEmployees !== 0) {
        if (affectedEmployeesDesc.length <= reqByWorks[workAs].totalOfEmployees) {
            correctedRessources = reqByWorks[workAs].totalOfEmployees + parseFloat(taskDesc.getProperty('coordinationRatioInf')) * (affectedEmployeesDesc.length - reqByWorks[workAs].totalOfEmployees);
            if (correctedRessources / affectedEmployeesDesc.length < 0.2) {
                correctedRessources = 0.2 * affectedEmployeesDesc.length;
            }
        } else {
            correctedRessources = reqByWorks[workAs].totalOfEmployees + parseFloat(taskDesc.getProperty('coordinationRatioSup')) * (affectedEmployeesDesc.length - reqByWorks[workAs].totalOfEmployees);
        }
        stepAdvance *= correctedRessources / reqByWorks[workAs].totalOfEmployees; //numberOfRessourcesFactor
    }

    //calculate otherWorkFactor
    if (activityAsNeeds.getResourceInstance().getSkillsets().keySet().toArray()[0] != workAs) {
        otherWorkFactor = 0.8;
    }
    stepAdvance *= otherWorkFactor;

    //calculate randomFactor
    stepAdvance *= getRandomFactorFromTask(taskDesc);

    //calculate learnFactor
    if (parseInt(taskInst.getProperty('completeness')) > 15) {
        stepAdvance *= 1 - ((numberOfEmployeeOnNeedOnNewTask * (parseFloat(taskInst.getProperty('takeInHandDuration') / 100))) / affectedEmployeesDesc.length);//learnFactor 
    }

    //calculate bonusRatio
    stepAdvance *= (parseFloat(taskDesc.getProperty('bonusRatio')));

    //calculate predecessorFactor
    stepAdvance *= getPredecessorFactor(taskDesc); //predecessor factor

    stepAdvance *= 100;

    //calculate new needCompleteness
    needProgress = Math.round(parseInt(selectedReq.getCompleteness()) + stepAdvance);

    //calculate stepQuality
    if (sumActivityRate !== 0) {
        stepQuality = 1 + 0.03 * ((motivationXActivityRate / sumActivityRate) - 7); //Motivation quality
        averageSkillsetQuality = (skillsetXActivityRate / sumActivityRate);
        if (averageSkillsetQuality >= selectedReq.getLevel()) {
            stepQuality += 1 + 0.02 * (averageSkillsetQuality - selectedReq.getLevel()); //skillset (level) quality
        } else {
            stepQuality += 1 + 0.03 * (averageSkillsetQuality - selectedReq.getLevel()); //skillset (level) quality
        }
    }
    stepQuality = (stepQuality / 2) * 100; //step Quality
    if (needProgress > 0) {
        selectedReq.setQuality((parseInt(selectedReq.getQuality()) * parseInt(selectedReq.getCompleteness()) + stepQuality * stepAdvance) / needProgress);
    }
    
    //set Wage (add 1/steps of the need's wage at task);
    taskInst.setProperty("wage", parseInt(taskInst.getProperty("wage")) + (parseInt(activityAsNeeds.getResourceInstance().getProperty("wage")) / steps));

    if (testMode) {
        println('sameNeedActivity.length : ' + sameNeedActivity.length);
        println('employeesMotivationFactor : ' + employeesMotivationFactor);
        println('employeesMotivationXActivityRate : ' + employeesMotivationXActivityRate);
        println('sumActivityRate : ' + sumActivityRate);
        println('deltaLevel : ' + deltaLevel);
        println('employeeSkillsetFactor : ' + employeeSkillsetFactor);
        println('employeesSkillsetXActivityRate : ' + employeesSkillsetXActivityRate);
        println('activityCoefficientXActivityRate : ' + activityCoefficientXActivityRate);
        println('numberOfEmployeeOnNeedOnNewTask : ' + numberOfEmployeeOnNeedOnNewTask);
        println('motivationXActivityRate: ' + motivationXActivityRate);
        println('skillsetXActivityRate: ' + skillsetXActivityRate);
        println('NeedMotivationFactor : ' + employeesMotivationXActivityRate / sumActivityRate);
        println('NeedSkillsetFactor : ' + employeesMotivationXActivityRate / sumActivityRate);
        println('ActivityNeedRateFactor : ' + activityCoefficientXActivityRate / sumActivityRate);
        println('baseAdvance : ' + 1 / (steps * (parseInt(taskDesc.getInstance(self).getDuration()))));
        println('numberOfRessourcesFactor : ' + correctedRessources / reqByWorks[workAs].totalOfEmployees);
        println('otherWorkFactor : ' + otherWorkFactor);
        println('randomFactor (not same value as used !) : ' + getRandomFactorFromTask(taskDesc));
        println('learnFactor : ' + (1 - ((numberOfEmployeeOnNeedOnNewTask * (parseFloat(taskInst.getProperty('takeInHandDuration') / 100))) / affectedEmployeesDesc.length)));
        println('bonusRatio : ' + parseFloat(taskDesc.getProperty('bonusRatio')));
        println('predecessorFactor : ' + Math.pow((predecessorsAdvance / taskDesc.getPredecessors().size()) / 100, parseInt(taskInst.getProperty('predecessorsDependances')))); //predecessor factor);
        println('stepAdvance : ' + stepAdvance);
        println('need completeness : ' + parseInt(selectedReq.getCompleteness()));
        println('needProgress : ' + needProgress);
        println('StepQuality : ' + ((parseInt(selectedReq.getQuality()) * parseInt(selectedReq.getCompleteness()) + stepQuality * stepAdvance) / needProgress));
    }

    //set need progress (after calcuateQuality) and return it
    selectedReq.setCompleteness(needProgress);
    return  needProgress;
}

function getRandomFactorFromTask(taskDesc) {
    var rn = Math.floor(Math.random() * 100), //number 0 to 100 (0 inclusive, 100 exclusive);
            randomDurationSup = parseFloat(taskDesc.getProperty('randomDurationSup')),
            randomDurationInf = parseFloat(taskDesc.getProperty('randomDurationInf')),
            duration = parseInt(taskDesc.getInstance(self).getDuration()), delta,
            randomFactor, x = Math.random();

    switch (rn) {
        case (rn < 3) :
            delta = -(0.25 * x + 0.75) * randomDurationInf;
            break;
        case (rn < 10) :
            delta = -(0.25 * x + 0.50) * randomDurationInf;
            break;
        case (rn < 25) :
            delta = -(0.25 * x + 0.25) * randomDurationInf;
            break;
        case (rn < 50) :
            delta = -0.25 * x * randomDurationInf;
            break;
        case (rn < 75) :
            delta = 0.25 * x * randomDurationSup;
            break;
        case (rn < 90) :
            delta = (0.25 * x + 0.25) * randomDurationSup;
            break;
        case (rn < 97) :
            delta = (0.25 * x + 0.50) * randomDurationSup;
            break;
        default :
            delta = (0.25 * x + 0.75) * randomDurationSup;
            break;
    }

    randomFactor = duration + delta;

    if (randomFactor < minTaskDuration) {
        randomFactor = minTaskDuration;
    }

    return getFloat((duration / randomFactor), 2);
}

function calculateTaskQuality(taskDesc) {
    var i, req, needQualityXNeedProgress = 0, needProgress = 0;
    for (i = 0; i < taskDesc.getInstance(self).getRequirements().size(); i++) {
        req = taskDesc.getInstance(self).getRequirements().get(i);
        needQualityXNeedProgress += (parseInt(req.getQuality()) * parseInt(req.getCompleteness()));
        needProgress += parseInt(req.getCompleteness());
    }
    return Math.round((needQualityXNeedProgress / needProgress));
}


function tempInit() {
    var occupation, listEmployees = flattenList(VariableDescriptorFacade.findByName(gm, 'employees')),
            listTasks = VariableDescriptorFacade.findByName(gm, 'tasks');

    occupation = listEmployees[0].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = listEmployees[0].getInstance(self).addOccupation();
    occupation.setTime(2.0);
    occupation = listEmployees[1].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = listEmployees[2].getInstance(self).addOccupation();
    occupation.setTime(2.0);
    occupation = listEmployees[2].getInstance(self).addOccupation();
    occupation.setTime(3.0);
    occupation.setEditable(false);

    //listTasks.items.get(0).getPredecessors().add(listTasks.items.get(1));

    listEmployees[1].getInstance(self).assign(listTasks.items.get(0));
    listEmployees[0].getInstance(self).assign(listTasks.items.get(1));

    return 'is initialized';
}

function getCurrentInGameTime() {
    var inGameTime = {phase: null, period: null},
    phases = VariableDescriptorFacade.findByName(gm, 'currentPeriod');
    inGameTime.phase = parseInt(currentPhase.value);
    if (phases !== null && inGameTime.phase !== null) {
        inGameTime.period = parseInt(phases.items.get(inGameTime.phase).getInstance(self).value);
    }
    return inGameTime;
}

function isTrue(arg) {
    return (arg == true || arg == 'true') ? true : false;
}

function getFloat(number, numberOfDigit) {
    numberOfDigit = Math.pow(10, (numberOfDigit > 1) ? numberOfDigit : 1);
    return Math.round(number * numberOfDigit) / numberOfDigit;
}

function flattenList(list, finalList) {
    var i, el;
    finalList = (finalList) ? finalList : [];
    for (i = 0; i < list.items.size(); i++) {
        el = list.items.get(i);
        if (el.getClass() && el.getClass().toString() == 'class com.wegas.core.persistence.variable.ListDescriptor') {
            finalList = this.flattenList(el, finalList);
        } else {
            finalList.push(el);
        }
    }
    return finalList;
}
function checkEnd(allCurrentActivities, currentStep) {
    var i, employeeInst, taskInst, taskDesc, employeeName, employeeJob,
            nextWork, reqByWorks;
    for (i = 0; i < allCurrentActivities.length; i++) {
        taskDesc = allCurrentActivities[i].getTaskDescriptor();
        taskInst = taskDesc.getInstance(self);
        employeeInst = allCurrentActivities[i].getResourceInstance();
        employeeName = employeeInst.getDescriptor().getLabel();
        employeeJob = employeeInst.getSkillsets().keySet().toArray()[0];
        if (currentStep === steps - 1) {
            checkAssignments(employeeInst.getAssignments(), currentStep);
        } else if (parseFloat(taskInst.getProperty('completeness')) < 100) {
            reqByWorks = getRequirementsByWork(taskInst.getRequirements());
            nextWork = selectFirstUncompletedWork(taskInst.getRequirements(), reqByWorks);
            if (allCurrentActivities[i].getRequirement().getWork() != nextWork) {
                sendMessage(getStepName(currentStep) + ') Tâche : ' + taskDesc.getLabel() + ' en partie terminée',
                        'Nous avons terminé la partie ' + allCurrentActivities[i].getRequirement().getWork() + ' de la tâche ' + taskDesc.getLabel() + '. Je passe à ' + nextWork + '. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
                        employeeName);
            }
        }

    }
}

function getStepName(step) {
    var name;
    switch (step) {
        case 0 :
            name = 'Lundi matin';
            break;
        case 1 :
            name = 'Lundi après-midi';
            break;
        case 2 :
            name = 'Mardi matin';
            break;
        case 3 :
            name = 'Mardi après-midi';
            break;
        case 4 :
            name = 'Mercredi matin';
            break;
        case 5 :
            name = 'Mercredi après-midi';
            break;
        case 6 :
            name = 'Jeudi matin';
            break;
        case 7 :
            name = 'Jeudi après-midi';
            break;
        case 8 :
            name = 'Vendredi matin';
            break;
        case 9 :
            name = 'Vendredi après-midi';
            break;
        default :
            name = 'samedi matin';
    }
    return name;
}

/**
 * get the specified wegas bean.
 * @param String name, the name of the bean
 * @return the wanted bean or null
 */
function lookupBean(name) {
    var ctx = new InitialContext();
    return ctx.lookup('java:module/' + name);
}

/**
 * Send a message to the current player.
 * @param String subject, the subject of the message.
 * @param String message, the content of the message.
 * @param String from, the sender of the message.
 */
function sendMessage(subject, content, from) {
    var EF = lookupBean('MessageFacade');
    if (EF) {
        EF.send(self, subject, content, from);
    }
    else {
        println('Bean InGameMailFacade does not exist, unable to send in-game message: ' + subject);
    }
}

