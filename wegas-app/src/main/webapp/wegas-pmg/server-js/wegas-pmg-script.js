importPackage(javax.naming);
var gm = self.getGameModel(),
        step = 1, minTaskDuration = 0.1;
function goToNextPeriod() {
    //to do test of period
    this.completePeriod();
    //this.enter_next_period();
}

function completePeriod() {
    for (var i = 0; i < step; i++) {
        calculTasksProgress(i);
    }
}

function calculTasksProgress(currentStep) {
    var i, work, activitiesAsNeeds, oneTaskPerActivity, allCurrentActivities,
            taskProgress, allCurrentActivities = createActivities(currentStep),
            requirementsByWork, taskInst;
    activitiesAsNeeds = getActivitiesWithEmployeeOnDifferentNeeds(allCurrentActivities);
    for (i = 0; i < activitiesAsNeeds.length; i++) { //for each need
        calculateProgressOfNeed(activitiesAsNeeds[i], allCurrentActivities);
    }
    oneTaskPerActivity = getOneTaskPerActivity(activitiesAsNeeds);

    for (i = 0; i < oneTaskPerActivity.length; i++) {
        taskProgress = 0;
        taskInst = oneTaskPerActivity.getTaskDescriptor().getInstance(self);
        requirementsByWork = getRequirementsByWork(taskInst.getRequirements());
        for (work in requirementsByWork) {
            taskProgress += requirementsByWork[work].completeness;
        }
        taskInst.setProperty("completeness", taskProgress);
        taskInst.setProperty("quality", taskInst.calculateTaskQuality(oneTaskPerActivity.getTaskDescriptor()));
    }
}

function getOneTaskPerActivity(activities) {
    var i, j, oneTaskPerActivity = [], wasAdded;
    oneTaskPerActivity.push(activities[0]);
    for (i = 0; i < activities.length; i++) {
        wasAdded = false;
        for (j = 0; j < oneTaskPerActivity.length; j++) {
            if (oneTaskPerActivity[j].getTaskDescription() === activities[i].getTaskDescriptor()) {
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
    var i, employeeInst, work, deltaLevel, employeeWorkOnLevel,
            employeeInstI, deltaLevelI, employeeIWorkOnLevel, sortedActivities = [];
    employeeInst = activity.getResourceInstance();
    work = employeeInst.getSkillsets().keySet().toArray()[0];
    deltaLevel = getDeltaLevel(activity.getTaskDescriptor().getInstance(self).getRequirements(), employeeInst);
    employeeWorkOnLevel = parseInt(employeeInst.getSkillsets().get(work)) - deltaLevel;
    for (i = 1; i < activities.length; i++) {
        if (activity.getTaskDescriptor() === activities[i].getTaskDescriptor()) {
            employeeInstI = activities[i].getResourceInstance();
            deltaLevelI = getDeltaLevel(activities[i].getTaskDescriptor().getInstance(self).getRequirements(), employeeInst);
            employeeIWorkOnLevel = parseInt(employeeInstI.getSkillsets().get(work)) - deltaLevelI;
            if ((work == employeeInstI.getSkillsets().keySet().toArray()[0] && employeeWorkOnLevel === employeeIWorkOnLevel)) {
                sortedActivities.push(activities[i]);
            }
        }
    }
    return sortedActivities;
}

function createActivities(currentStep) {
    var i, listEmployees = flattenList(VariableDescriptorFacade.findByName(gm, "employees")),
            employeeDesc, employeeInst, activity, activities = [],
            assignables, existanteActivity, time = getCurrentInGameTime().period + currentStep / 10;
    if (!listEmployees) {
        return activities;
    }
    for (i = 0; i < listEmployees.length; i++) {
        employeeDesc = listEmployees[i];
        employeeInst = employeeDesc.getInstance(self);
        if (isReservedToWork(employeeInst)) { //have a "player created" occupation
            assignables = getAssignables(findAbstractAssignments(employeeInst, "assignments"));
            if (assignables.length > 0) { //have assignable tasks
                existanteActivity = findLastStepCorrespondingActivity(employeeInst, assignables[0].getTaskDescriptor(), time);
                if (existanteActivity) { //set corresponding past activity if it existe. Else create it.
                    activity = existanteActivity;
                } else {
                    activity = employeeInst.createActivity(assignables[0].getTaskDescriptor());
                }
                activity.setTime(time);
                activities.push(activity);
            }
        }
    }
    return activities;
}

function findLastStepCorrespondingActivity(employeeInst, taskDesc, currentTime) {
    var i, activity, occurence = null;
    for (i = 0; i < employeeInst.getActivities.size(); i++) {
        activity = employeeInst.getActivities.get(i);
        if (activity.getTaskDescriptor() === taskDesc   //if the task of activity match with the given task (same task and same employee == same activity) 
                && currentTime - Math.floor(currentTime) !== 0 //if it's not a new period (current step !== 0) 
                && parseFloat(activity.getTime()) === currentTime - 0.1) { //if activity was used the last step
            occurence = activity;
            break;
        }
    }
    return occurence;
}

function haveCorrespondingActivityInPast(employeeInst, taskDesc, currentPeriod) {
    var i, activity, occurence = false;
    for (i = 0; i < employeeInst.getActivities.size(); i++) {
        activity = employeeInst.getActivities.get(i);
        if (activity.getTaskDescriptor() === taskDesc   //if the task of activity match with the given task (same task and same employee == same activity)
                && parseFloat(currentPeriod > activity.getTime())) {
            occurence = true;
            break;
        }
    }
    return occurence;
}

function findAbstractAssignments(employeeI, cast) {
    var AbsAssignments;
    switch (cast) {
        case "assignments" :
            AbsAssignments = employeeI.getAssignments();
            break;
        case "occupations" :
            AbsAssignments = employeeI.getOccupations();
            break;
        case "activities" :
            AbsAssignments = employeeI.getActivities();
            break;
    }
    return AbsAssignments;
}

function isReservedToWork(employeeInst) {
    var i, occupations = findAbstractAssignments(employeeInst, "occupations"),
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
        if (parseInt(taskDesc.getInstance(self).getProperty("completeness")) < 100) { //if the task isn't terminated
            assignables.push(assignments.get(i));
        }
    }
    return assignables;
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
            needProgress, motivationXActivityRate = 0, skillsetXActivityRate, level,
            averageSkillsetQuality, stepQuality;

    taskDesc = activityAsNeeds.getTaskDescriptor();
    taskInst = activityAsNeeds.getTaskInst();
    requirements = taskInst.getRequirements();
    reqByWorks = getRequirementsByWork(requirements);
    workAs = selectFirstUncompletedWork(requirements, reqByWorks);
    selectedReq = selectRequirement(taskInst, activityAsNeeds.getResourceInstance(), workAs, reqByWorks);
    sameNeedActivity = getActivitiesWithEmployeeOnSameNeed(allCurrentActivities, activityAsNeeds);
    level = parseInt(activityAsNeeds.getResourceInstance().getSkillsets().get(activityAsNeeds.getResourceInstance().getSkillsets().keySet().toArray()[0]));
    deltaLevel = parseInt(selectedReq.getLevel()) - level;

    //For each need
    for (i = 0; i < sameNeedActivity.length; i++) {
        employeeInst = sameNeedActivity[i].getResourceInstance();
        employeeDesc = employeeInst.getDescriptor();
        affectedEmployeesDesc.push(employeeDesc);
        activityRate = parseFloat(employeeDesc.getInstance(self).getProperty("activityRate"));
        sumActivityRate += activityRate;
        //Calculate ressource motivation factor
        employeesMotivationFactor = 1 + 0.05 * parseFloat(employeeDesc.getProperty("coef_moral")) * (parseInt(employeeDesc.getInstance(self).getMoral()) - 7);
        //Calcul variables for needMotivationFactor
        employeesMotivationXActivityRate += employeesMotivationFactor * activityRate;
        //Calcul variables for needSkillsetFactor
        if (deltaLevel > 0) {
            employeeSkillsetFactor = 1 + 0.05 * parseFloat(taskDesc.getProperty("competenceRatioSup")) * deltaLevel;
            if (employeeSkillsetFactor < 0) {
                employeeSkillsetFactor = 0;
            }
        } else {
            employeeSkillsetFactor = 1 + 0.05 * parseFloat(taskDesc.getProperty("competenceRatioInf")) * deltaLevel;
        }
        employeesSkillsetXActivityRate += employeeSkillsetFactor * activityRate;
        //Calcul variable for needSkillsetFactor
        activityCoefficientXActivityRate += parseFloat(employeeDesc.getProperty("coef_activity")) * activityRate;
        //Calcul variable for learnFactor
        if (!haveCorrespondingActivityInPast(employeeInst, taskDesc, getCurrentInGameTime().period)) {
            numberOfEmployeeOnNeedOnNewTask++;
        }
        //Calculate variable for quality
        motivationXActivityRate += parseInt(employeeInst.getMoral()) * activityRate;
        skillsetXActivityRate += level * activityRate;

    }
    //calculate needMotivationFactor, needSkillsetFactor and activityNeedRateFactor
    if (sumActivityRate !== 0) {
        stepAdvance *= employeesMotivationXActivityRate / sumActivityRate; //needMotivationFactor
        stepAdvance *= employeesMotivationXActivityRate / sumActivityRate; //needSkillsetFactor
        stepAdvance *= activityCoefficientXActivityRate / sumActivityRate; //activityNeedRateFactor
    }
    // calculate baseAdvance
    if (parseInt(taskInst.getProperty("completeness")) !== 0) {
        stepAdvance *= 1 / (step * (parseInt(taskInst.getProperty("completeness")))); //baseAdvance
    }
    // calculate numberOfRessourcesFactor
    if (reqByWorks[workAs].totalOfEmployees !== 0) {
        if (affectedEmployeesDesc.length <= reqByWorks[workAs].totalOfEmployees) {
            correctedRessources = reqByWorks[workAs].totalOfEmployees + parseFloat(taskDesc.getProperty("coordinationRatioInf")) * (affectedEmployeesDesc.length - reqByWorks[workAs].totalOfEmployees);
            if (correctedRessources / affectedEmployeesDesc.length < 0.2) {
                correctedRessources = 0.2 * affectedEmployeesDesc.length;
            }
        } else {
            correctedRessources = reqByWorks[workAs].totalOfEmployees + parseFloat(taskDesc.getProperty("coordinationRatioSup")) * (affectedEmployeesDesc.length - reqByWorks[workAs].totalOfEmployees);
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
    if (parseInt(taskInst.getProperty("completeness")) > 15) {
        stepAdvance *= 1 - ((numberOfEmployeeOnNeedOnNewTask * (parseFloat(taskInst.getProperty("takeInHandDuration") / 100))) / affectedEmployeesDesc.length);//learnFactor 
    }
    //calculate bonusRatio
    stepAdvance *= parseFloat(taskInst.getProperty("bonusRatio")) / 100;
    //calculate predecessor factor
    if (taskDesc.getPredecessors().getSize() > 0) {
        for (i = 0; i < taskDesc.getPredecessors().getSize(); i++) {
            predecessorsAdvance += parseInt(taskDesc.getPredecessors().get(i).getInstance(self).getProperty("completeness"));
        }
        stepAdvance *= Math.pow((predecessorsAdvance / taskDesc.getPredecessors().getSize()) / 100, parseInt(taskInst.getProperty("predecessorsDependances"))); //predecessor factor
    }
    //calculate new base completeness
    needProgress = Math.round(parseInt(selectedReq.getCompleteness()) + stepAdvance);

    //calculate stepQuality
    if (sumActivityRate !== 0) {
        stepQuality = (motivationXActivityRate / sumActivityRate);
        averageSkillsetQuality = (skillsetXActivityRate / sumActivityRate);
        if (averageSkillsetQuality >= selectedReq.getLevel()) {
            stepQuality += 1 + 0.02 * (averageSkillsetQuality - selectedReq.getLevel());
        } else {
            stepQuality += 1 + 0.03 * (averageSkillsetQuality - selectedReq.getLevel());
        }
    }
    stepQuality = (stepQuality / 2) * 100;
    selectedReq.setQuality((parseInt(selectedReq.getQuality()) * parseInt(selectedReq.getCompleteness()) + stepQuality * stepAdvance) / needProgress)

    //set need progress (after calcuateQuality) and return it
    selectedReq.setCompleteness(needProgress);
    return  needProgress;
}

function getRandomFactorFromTask(taskDesc) {
    var x = Math.floor(Math.random() * 101), //number 0 to 100 (both inclusive);
            randomDurationSup = parseFloat(taskDesc.getProperties().get("randomDurationSup")),
            randomDurationInf = parseFloat(taskDesc.getProperties().get("randomDurationInf")),
            duration = taskDesc.getInstance(self).getDuration(), delta,
            randomFactor;

    switch (x) {
        case (x < 3) :
            delta = -(0.25 * x + 0.75) * randomDurationInf;
            break;
        case (x < 10) :
            delta = -(0.25 * x + 0.50) * randomDurationInf;
            break;
        case (x < 25) :
            delta = -(0.25 * x + 0.25) * randomDurationInf;
            break;
        case (x < 50) :
            delta = -0.25 * x * randomDurationInf;
            break;
        case (x < 75) :
            delta = 0.25 * x * randomDurationSup;
            break;
        case (x < 90) :
            delta = (0.25 * x + 0.25) * randomDurationSup;
            break;
        case (x < 97) :
            delta = (0.25 * x + 0.50) * randomDurationSup;
            break;
        default :
            delta = (0.25 * x + 0.75) * randomDurationSup;
            break;
    }

    if (duration + delta < minTaskDuration) {
        randomFactor = minTaskDuration;
    }
    return duration / randomFactor;
}

function calculateTaskQuality(taskDesc){
    var i, req, needQualityXNeedProgress = 0, needProgress = 0;
    for (i = 0; i < taskDesc.getInstance(self).getRequirements().size(); i++) {
        req = taskDesc.getInstance(self).getRequirements().get(i);
        needQualityXNeedProgress += (parseInt(req.getQuality()) * parseInt(req.getCompleteness()));
        needProgress += parseInt(req.getCompleteness());
    }
    return (needQualityXNeedProgress / needProgress);
}


function tempInitializer() {
    var occupation, listEmployees = flattenList(VariableDescriptorFacade.findByName(gm, "employees"));
    occupation = listEmployees[0].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = listEmployees[0].getInstance(self).addOccupation();
    occupation.setTime(2.0);
    occupation = listEmployees[1].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = listEmployees[2].getInstance(self).addOccupation();
    occupation.setTime(2.0);
    listEmployees[0].getInstance(self).assign(VariableDescriptorFacade.findByName(gm, "tasks").items.get(0));
    return "is initialized";
}

function getCurrentInGameTime() {
    var inGameTime = {phase: null, period: null},
    phases = VariableDescriptorFacade.findByName(gm, "currentPeriod");
    inGameTime.phase = parseInt(currentPhase.value);
    if (phases !== null && inGameTime.phase !== null) {
        inGameTime.period = parseInt(phases.items.get(inGameTime.phase).getInstance(self).value);
    }
    return inGameTime;
}

function isTrue(arg) {
    return (arg == true || arg == "true") ? true : false;
}

function flattenList(list, finalList) {
    var i, el;
    finalList = (finalList) ? finalList : [];
    for (i = 0; i < list.items.size(); i++) {
        el = list.items.get(i);
        if (el.getClass() && el.getClass().toString() == "class com.wegas.core.persistence.variable.ListDescriptor") {
            finalList = this.flattenList(el, finalList);
        } else {
            finalList.push(el);
        }
    }
    return finalList;
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

