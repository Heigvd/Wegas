/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */
var taskTable, currentPeriod,
    DEBUGMODE = false,
    STEPS = 10,
    MINTASKDURATION = 0.1,
    STEPNAMES = ["Lundi matin", "Lundi après-midi", "Mardi matin", "Mardi après-midi", "Mercredi matin",
        "Mercredi après-midi", "Jeudi matin", "Jeudi après-midi", "Vendredi matin", "Vendredi après-midi", "Samedi matin"];
/**
 * Divide period in steps (see global variable).
 * Call function step at each step.
 */
function runSimulation() {
    var i, activeTasks = getActiveTasks();

    currentPeriod = getCurrentPeriod().getValue(self);

    debug("runSimulation(currentPeriod: " + currentPeriod + ")");

    taskTable = {};                                                             // Init task table
    for (i = 0; i < activeTasks.length; i++) {
        taskTable[activeTasks[i].descriptor.name] = {
            completeness: activeTasks[i].getPropertyD("completeness"),
            randomFactor: getRandomFactorFromTask(activeTasks[i])
        };
    }

    for (var i = 0; i < STEPS; i++) {                                           // Run algo for each step (half days of work)
        step(i);
    }
}

/**
 * Call fonction to creat activities (assignRessources) then get each
 *  activities (but only one per task's requirement). for each activities,
 *   Call the function to calculate the progression of each requirement
 *   (calculateProgress).
 *   Then, calculate and set the quality and the completeness for each tasks
 *   Then, check the end of a requirement inactivities (function ''checkEnd'');
 * @param {Number} currentStep
 */
function step(currentStep) {
    debug("step(" + currentStep + ")");
    var activities = assignRessources(currentStep);                             // Create activities for ressources

    debug("step(): #activities:" + activities.length);
    Y.Array.each(getActivitiesWithEmployeeOnDifferentNeeds(activities), function(a) {// Calculate progress for each activity
        calculateActivityProgress(a, activities);
    });
    Y.Array.each(getTasksByActivities(activities), function(t) {                // Get each modified task and calculate is new quality and completeness
        var oCompleteness = t.getProperty("completeness");
        t.setProperty("completeness", Math.round(calculateTaskProgress(t)));
        debug("step(" + currentStep + "): Task completeness: " + oCompleteness + " => " + t.getProperty("completeness"));
        t.setProperty("quality", calculateTaskQuality(t));
    });
    checkEnd(activities, currentStep);
}
/**
 * 
 * @param {type} taskInst
 * @returns {Number}
 */
function calculateTaskProgress(taskInst) {
    var //reqByWorks = getRequirementsByWork(taskInst.requirements),
        nbWork = Y.Array.sum(taskInst.requirements, function(r) {
            return r.quantity;
        }),
        taskProgress = Y.Array.sum(taskInst.requirements, function(r) {
            return r.completeness * r.quantity;
        }) / nbWork;
    return (taskProgress > 97) ? 100 : taskProgress;                            // > 97 yes, don't frustrate the players please.
}
/**
 * calculate how many percent is completed based on current period and planified
 *  length of the task.
 * @param {TaskInstance} taskInst
 * @returns {Number} number between 0 and 100 (both including)
 */
function getPlannifiedCompleteness(taskInst) {
    if (taskInst.plannification.isEmpty()) {                                    // If there's no plannficiation
        return 0;
    }

    var i, pastPeriods = 0;
    for (i = 0; i < taskInst.plannification.size() && i <= currentPeriod; i++) {
        if (parseInt(taskInst.plannification.get(i)) > -1) {
            pastPeriods += 1;
        }
    }
    return (pastPeriods / taskInst.plannification.size()) * 100;
}

/**
 * return the delay based on the difference (in percent) between
 *  plannifiedcompleteness and real completeness (completeness / planifiedCompleteness * 100)
 * if given task isn't started then delay = completeness + 100
 * planified completeness is based on function ''getPlannifiedCompleteness''
 * @param {taskDescriptor} taskDesc
 * @returns {Number} delay between 0 and 100
 */
function getCurrentTaskDelay(taskDesc) {
    var taskInst = taskDesc.getInstance(self),
        completeness = taskInst.getPropertyD("completeness"),
        planifiedCompleteness = getPlannifiedCompleteness(taskInst);
    if (completeness > 0 && taskInst.plannification.length > 0) {
        if (planifiedCompleteness <= 0) {
            return completeness + 100;
        } else {
            return completeness / planifiedCompleteness * 100;
        }
    }
    return 0;
}

/**
 * Sort an Array of activities to keep only one occurence of task Descriptor
 * in each activities. So in the returned list, two activities can't have the same task.
 * @param {Array} activities  an Array of Activity
 * @returns {Array of activities}
 */
function getTasksByActivities(activities) {
    return Y.Array.unique(activities.map(function(a) {
        return a.taskDescriptor.getInstance(self);
    }));
}
/**
 * 
 */
function getActiveTasks() {
    return Variable.findByName(gm, "tasks").items.toArray().map(function(t) {
        return t.getInstance(self);
    }).filter(function(t) {
        return t.active;
    });
}
/**
 * Sort an Array of activities to keep only one occurence of requirement
 * in each activities. So in the returned list, two activities can't have the same requirement.
 * @param {Array} activities  an Array of Activity
 * @returns {Array} an Array of Activity
 * @deprecated
 */
function getActivitiesWithEmployeeOnDifferentNeeds(activities) {
    //debug("getActivitiesWithEmployeeOnDifferentNeeds()");
    return Y.Array.unique(activities, function(a1, a2) {
        return a1.requirement == a2.requirement;
    });
}

/**
 * Sort the given array to keep only activities with employee on the same requirement
 * @param {Array} activities an Array of Activity
 * @param {Activity} activity
 * @returns {Array} an Array of Activity
 */
function getActivitiesWithEmployeeOnSameNeed(activities, activity) {
    //debug("getActivitiesWithEmployeeOnSameNeed(" + activity + ")");
    return activities.filter(function(a) {
        return activity.time === a.time
            && activity.taskDescriptor === a.taskDescriptor
            && activity.requirement === a.requirement;
    });
}

/**
 * Create activities for each reserved (having an occupation at this time) employees having a valid assignement.
 * if a corresponding activity exist in the past, get it, else create activity
 *  and adjust its value.
 * @param {Number} currentStep
 * @returns {Array} an Array of Activity
 */
function assignRessources(currentStep) {
    //debug("assignRessources(currentStep: " + currentStep + ", currentPeriod: " + currentPeriod + ")");
    var i, employee, activity, assignables,
        activities = [],
        employees = flattenList(Variable.findByName(gameModel, "employees")),
        period = currentPeriod + currentStep / STEPS;
    
    if (!employees) {
        return [];
    }
    for (i = 0; i < employees.length; i++) {
        employee = employees[i].getInstance(self);
        if (isReservedToWork(employee)) {                                       // get a 'player created' occupation    
            assignables = checkAssignments(employee, currentStep);              // get assignable tasks
            if (assignables.length > 0) {
                activity = findLastStepCorrespondingActivity(employee,
                    assignables[0].taskDescriptor, period);                     //set corresponding past activity if it existe.
                //debug("assignRessources(): Existing activity for " + employees[i].name + ":" + activity);
                if (!activity) {                                                // Else create it.
                    //debug("assignRessources(): Creating new activity");
                    activity = employee.createActivity(assignables[0].taskDescriptor);
                }
                var req = selectRequirementFromActivity(activity);
                if (req) {                                                      // Possible d'améliorer la performance en ne créant pas d'activity.
                    activity.setRequirement(req);                               // Mais nécessite de créer une nouvelle fonction comme "selectRequirementFromActivity" en ne passant pas par une activity.
                    activity.setTime(period);
                    activities.push(activity);
                    debug("assignRessources(): Assigning employee" + employees[i] + " to " + req.work);
                }
            }
        }
        removeAssignmentsFromCompleteTasks(employee);
    }
    return activities;
}

/**
 * When the task is complete remove all assignment from this task.
 * @param {ResourceInstance} employeeInst
 */
function removeAssignmentsFromCompleteTasks(employeeInst) {
    var i, assignment, toRemove = [];
    for (i = 0; i < employeeInst.assignments.size(); i++) {
        assignment = employeeInst.assignments.get(i);
        if (assignment.taskDescriptor.getInstance(self).getPropertyD("completeness") >= 100) {
            toRemove.push(assignment);
        }
    }
    Y.Array.each(toRemove, function(a) {
        employeeInst.assignments.remove(a);
    });
}

/**
 * Check and return the most adapted requirement in the task of the activity,
 *  for the employee in the activity. Use function (''selectRequirement'') to
 *   choose the requirement.
 * @param {Activity} activity
 * @returns {WRequirement} the selected (most adapted) requierement
 */
function selectRequirementFromActivity(activity) {
    var i, req, d, selectedReq,
        taskInst = activity.taskDescriptor.getInstance(self),
        workAs = selectFirstUncompletedWork(taskInst.requirements, activity.resourceInstance.mainSkill),
        deltaLevel = 1000,
        reqByWorks = getRequirementsByWork(taskInst.requirements)[workAs],
        totalOfPersonneInTask = Y.Array.sum(taskInst.requirements, function(r) {
            return r.quantity;
        });

    //debug("selectRequirement(" + taskInst + "," + activity.resourceInstance + ", workAs: " + workAs + ", mainSkill: " + activity.resourceInstance.mainSkill + ")");
    for (i = 0; i < taskInst.requirements.size(); i++) {
        req = taskInst.requirements.get(i);
        d = Math.abs(parseInt(activity.resourceInstance.mainSkillLevel) - req.level);
        if (req.work == workAs && deltaLevel > d
            && req.completeness < (reqByWorks.maxLimit * totalOfPersonneInTask / reqByWorks.totalByWork)) {
            deltaLevel = d;
            selectedReq = req;
        }
    }
    return selectedReq;
}

/**
 * Research and return an activity having the same task, the same employee and
 *  worked on at the last step.
 * @param {ResourceInstance} employeeInst
 * @param {TaskDescriptor} taskDesc
 * @param {Number} currentPeriod
 * @returns {Activity} activity
 */
function findLastStepCorrespondingActivity(employeeInst, taskDesc, period) {
    //debug("findLastStepCorrespondingActivity(" + employeeInst.descriptor.name + ")" + employeeInst.activities.size());
    return Y.Array.find(employeeInst.activities, function(activity) {
        return activity.taskDescriptor == taskDesc                              // If the task of activity match with the given task (same task and same employee == same activity)
            && period !== Math.floor(period)                                    // if it s not a new period (current step !== 0)
            && activity.time === getFloat(period - 0.1);                        // if activity was used the last step
    });
}

/**
 * Research and return an activity having the same task, the same employee and
 *  worked on in previous period or step.
 * @param {ResourceInstance} employeeInst
 * @param {TaskDescriptor} taskDesc
 * @param {Number} currentPeriod
 * @returns {Activity} activity
 */
function haveCorrespondingActivityInPast(employeeInst, taskDesc) {
    return Y.Array.find(employeeInst.activities, function(activity) {
        return activity.taskDescriptor === taskDesc                             //if the task of activity match with the given task (same task and same employee == same activity)
            && currentPeriod > activity.time;
    });
}

/**
 * Return the automatic planning setting 
 * Such a setting is given by the "autoReservation" bln variable
 */
function automatedReservation() {
    var autoDesc;

    try {
        autoDesc = Variable.findByName(gm, "autoReservation");
    } catch (e) {
        autoDesc = false;
    }

    // Automatic means the descriptor exists and its value is TRUE
    return autoDesc && autoDesc.getValue(self);
}

/**
 * Check if the given resource will work on the project for the current period
 * 
 *  in automatic mode:
 *      the resource will always work unless it's unavailable (i.e. current occupation not editable)
 *  in manual mode:
 *      the resource must have an editable occupation for the current time (i.e has been reseved by the player)
 *  
 *  In all case, the resource must be active
 *  
 * @param {RessourceInstance} employeeInst
 * @returns {Boolean} is reserved
 */
function isReservedToWork(employeeInst) {
    // Inactive resource never work
    if (!employeeInst.getActive()){
        return false;
    }

    if (!automatedReservation()()){
        // the resource must be reserved.
        // it means that an "editable" occupation must exists for the current time
        return Y.Array.find(employeeInst.occupations, function(o) {
            return o.time === currentPeriod
                && o.editable;
        });
    } else { // automatic
        // The resource is always reserved unless
        // it has an "uneditable" occupation for the current period
        return !Y.Array.find(employeeInst.occupations, function(o) {
            return o.time === currentPeriod
                && !o.editable; // Illness, etc. occupations are not editable
        });
    }
}

/**
 *  Return the given list but without the invalid Assignments.
 *  An valid assignment is one where its bound task completion is < 100 and
 *  where a employee can progress decently without problem of predecessor
 *   ( see function ''getPredecessorFactor'');
 * @param {Array} assignments an Array of Assignment
 * @returns {Array} an Array of Assignment
 */
function getAssignables(assignments, currentStep) {
    //debug("getAssignables();");
    return assignments.toArray().map(function(a, index) {
        var taskInst = a.taskDescriptor.getInstance(self);
        if (taskInst.getPropertyD("completeness") < 100
            && getPredecessorFactor(a.taskDescriptor) >= 0.2) {                 //if the task isn t terminated and average of predecessors advancement is upper than 20%
            if (Y.Array.find(taskInst.requirements, function(r) {
                return a.resourceInstance.mainSkill == r.work;
            })) {
                return a;
            } else {
                sendMessage('(' + getStepName(currentStep) + ') Impossible de progresser sur la tâche : ' + a.taskDescriptor.label,
                    'Je suis censé travailler sur la tâche "' + a.taskDescriptor.label + '" mais je ne suis pas qualifié pour ce travail. <br/>'
                    + ' Salutations <br/>' + a.resourceInstance.descriptor.label + '<br/> ' + a.resourceInstance.mainSkill,
                    a.resourceInstance.descriptor.label);
                assignments.remove(index);
                //TODO add unworked hours                
            }
        }
    }).filter(function(a) {
        return a;                                                               // Filter null values
    });
}

/**
 * For each activity, send different message if a task is completed or if the
 *  employee can't work on a task because a predecessor is not enough advanced.
 *  Return the next avalaible assignements.
 * @param {Array} assignments An Array of Assignment
 * @param {Number} currentStep
 * @returns {Array} An Array of Assignment
 */
function checkAssignments(employeeInst, currentStep) {
    //debug("checkAssignments(" + employeeInst + ", " + currentStep + ")");
    if (employeeInst.assignments.isEmpty()) {
        return [];
    }
    var i, taskDesc, taskInst, exist,
        assignments = employeeInst.assignments,
        employeeName = employeeInst.descriptor.label,
        employeeJob = employeeInst.mainSkill,
        nextTasks = getAssignables(assignments, currentStep);
    for (i = 0; i < assignments.size(); i++) {
        exist = false;
        taskDesc = assignments.get(i).taskDescriptor;
        taskInst = taskDesc.getInstance();
        if (taskInst.getPropertyD("completeness") >= 100) {
            if (nextTasks[0]) {
                sendMessage('(' + getStepName(currentStep) + ') Fin de la tâche : ' + taskDesc.label,
                    'La tâche "' + taskDesc.label + '" est terminée, je passe à la tâche ' + nextTasks[0].taskDescriptor.label + ' <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
                    employeeName);
            } else {
                sendMessage('(' + getStepName(currentStep) + ') Fin de la tâche : ' + taskDesc.label,
                    'La tâche "' + taskDesc.label + '" est terminée. Je retourne à mes activités traditionnelles. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
                    employeeName);
            }
            assignments.remove(i);
            break;
        } else if (i === 0 && getPredecessorFactor(taskDesc) <= 0.2) {
            sendMessage('(' + getStepName(currentStep) + ') Impossible de progresser sur la tâche : ' + taskDesc.label,
                'Je suis sensé travailler sur la tâche "' + taskDesc.label + '" mais les tâches précedentes ne sont pas assez avancées. <br/> Je retourne donc à mes occupations habituel. <br/>'
                + ' Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
                employeeName);
            assignments.remove(i);
            //TODO add unworked hours
            break;
        }
    }
    return nextTasks;
}

/**
 * Get a number which determinate if a task can be already worked or if
 * its predecessors is not enough advanced.
 * @param {TaskDescriptor} taskDesc
 * @returns {Number} number between 0 and 1.
 */
function getPredecessorFactor(taskDesc) {
    var predecessorsAdvancements = 0,
        numberOfPredecessors = 0;
    Y.Array.each(taskDesc.predecessors, function(p) {
        if (p.getInstance(self).active) {
            predecessorsAdvancements += p.getInstance(self).getPropertyD("completeness");
            numberOfPredecessors += 1;
        }
    });
    if (numberOfPredecessors > 0) {
        return Math.pow((predecessorsAdvancements / numberOfPredecessors) / 100,
            taskDesc.getInstance(self).getPropertyD("predecessorsDependances"));
    } else {
        return 1;
    }
}

/**
 * Return th first uncomplete kind of work in the given list requirements.
 * An uncomplete requirement is one where its completeness is smaller than its maxLimit.
 * @param {List} requirements List of WRequirements
 * @param {Object} reqByWorks object returned by function ''getRequirementsByWork'', can be null
 * @returns {String} work
 */
function selectFirstUncompletedWork(requirements, metier) {
    //debug("selectFirstUncompletedWork(" + requirements + ", " + metier + ")");
    var work, reqByWorks = getRequirementsByWork(requirements), //              // get requirements merged by kind of work.
        totalOfPersonneInTask = Y.Array.sum(requirements, function(r) {
            return r.quantity;
        });

    for (work in reqByWorks) {
        if (reqByWorks[work].completeness < reqByWorks[work].maxLimit * totalOfPersonneInTask / reqByWorks[work].totalByWork &&
            metier == work) {                                                   //check if the maximum limit from all requirements of the current kind of work is smaller than the completeness of the current kind of work
            return work;
        }
    }
}
/**
 * Return an object which requirements are gathered by work.
 * this object contains (by work) :
 * - maxLimit, the bigger limit found on this requirement job
 * - typesOfLevels, an Array of all found levels on this requirement job
 * - totalOfEmployees, the sum of all employees required on this requirement job.
 * - completeness the sum of each (completeness * quantity of required employees) divided by the total of employee on this requirement job.
 * @param {WRequirement} requirements
 * @returns {Object} works
 */
function getRequirementsByWork(requirements) {
    var i, req, work, works = {};
    for (i = 0; i < requirements.size(); i++) {
        req = requirements.get(i);
        work = works[req.work] = works[req.work] || {//                         //keep an occurance of each kind of work needed
            maxLimit: 0,
            typesOfLevels: [],
            completeness: 0,
            totalByWork: 0                                                      // keep the sum of people needed for each kind of work
        };
        //keep the highest limit of all limits from each kind of work needed
        work.maxLimit = Math.max(work.maxLimit, req.limit);
        work.totalByWork += req.quantity;
        work.completeness += req.completeness;
        //keep all kind of levels for each kind of work needed
        //if (work.typesOfLevels.indexOf(req.level) === -1) {
        //    work.typesOfLevels.push(req.level);
        //}
        //is needed for next calcul
        //needsCompletion += req.completeness * req.quantity;
    }
    return works;
}

/**
 * Calculate the progression and the quality of each worked requirement at this step.
 * Return the progression of the requirement.
 * @param {Activity} activity an Activity
 * @param {Array} allActivities an Array of Activity
 * @returns {Number} a number between 0 and 100
 */
function calculateActivityProgress(activity, allActivities) {
    debug("calculateActivityProgress(activity: " + activity + ", task: " + activity.taskDescriptor.getInstance(self)
        + ", employee: " + activity.resourceInstance + ", requirement: " + activity.requirement + ")");
    var i, employeeInst, activityRate, averageSkillsetQuality, correctedRessources,
        taskDesc = activity.taskDescriptor,
        taskInst = taskDesc.getInstance(self),
        stepAdvance = 1 / (STEPS * taskInst.duration), //                       // calculate base advance,
        sumActivityRate = 0, employeesMotivationXActivityRate = 0,
        employeesMotivationFactor, employeesSkillsetXActivityRate = 0,
        employeeSkillsetFactor, activityCoefficientXActivityRate = 0,
        numberOfEmployeeOnNeedOnNewTask = 0, stepQuality = 0,
        motivationXActivityRate = 0, skillsetXActivityRate = 0,
        requirement = activity.requirement,
        workAs = requirement.work,
        reqByWorks = getRequirementsByWork(taskInst.requirements),
        work = reqByWorks[workAs],
        sameNeedActivity = getActivitiesWithEmployeeOnSameNeed(allActivities, activity), // @fixme should this be here or in the next loop?
        totalOfEmployees = Y.Array.sum(taskInst.requirements, function(r) {
            return r.quantity;
        });
    debug("baseAdvance : " + stepAdvance + ", #sameNeedActivity: " + sameNeedActivity.length);

    //For each need
    for (i = 0; i < sameNeedActivity.length; i++) {
        employeeInst = sameNeedActivity[i].resourceInstance;
        activityRate = employeeInst.getPropertyD("activityRate");
        sumActivityRate += activityRate;
        //Calculate ressource motivation factor
        employeesMotivationFactor = 1 + 0.05 * employeeInst.descriptor.getPropertyD("coef_moral") * (employeeInst.moral - 7);
        //Calcul variables for needMotivationFactor (numérateur de la moyenne pondérée de facteur motivation besoin)
        employeesMotivationXActivityRate += employeesMotivationFactor * activityRate;
        //debug("employeesMotivationFactor : " + employeesMotivationFactor);

        //Calcul variables for skill factor

        deltaLevel = parseInt(employeeInst.mainSkillLevel) - requirement.level,
            skillsetFactor = (deltaLevel > 0) ? taskDesc.getPropertyD("competenceRatioSup") : taskDesc.getPropertyD("competenceRatioInf");
        employeeSkillsetFactor = Math.max(0, 1 + 0.05 * skillsetFactor * deltaLevel);
        //debug("calc skillset: activityRate:" + activityRate + ", skillsetFactor: " + skillsetFactor + "deltaLevel: " + deltaLevel);
        employeesSkillsetXActivityRate += employeeSkillsetFactor * activityRate;//Calcul variables for needSkillFactor (numérateur de la moyenne pondérée facteur compétence besoin)

        //Calcul variable for needActivityFactor (numérateur de la moyenne pondérée facteur taux activité besoin)
        activityCoefficientXActivityRate += employeeInst.descriptor.getPropertyD("coef_activity") * activityRate;
        //Calcul variable for learnFactor
        if (!haveCorrespondingActivityInPast(employeeInst, taskDesc)) {
            numberOfEmployeeOnNeedOnNewTask++;
        }
        //Calculate variable for quality
        motivationXActivityRate += employeeInst.moral * activityRate;
        skillsetXActivityRate += employeeInst.mainSkillLevel * activityRate;    //level * activityRate
    }

    if (sumActivityRate !== 0) {
        stepAdvance *= employeesMotivationXActivityRate / sumActivityRate;      //needMotivationFactor (facteur motivation besoin)
        debug("facteur motivation besoin: " + employeesMotivationXActivityRate / sumActivityRate + ", sumActivityRate:" + sumActivityRate + ", employeesMotivationXActivityRate: " + employeesMotivationXActivityRate);

        stepAdvance *= employeesSkillsetXActivityRate / sumActivityRate;        //needSkillsetFactor (facteur compétence besoin)  
        debug("facteur competence besoin : " + employeesSkillsetXActivityRate / sumActivityRate + ", employeeSkillsetFactor : " + employeeSkillsetFactor + ", employeesSkillsetXActivityRate: " + employeesSkillsetXActivityRate);

        stepAdvance *= activityCoefficientXActivityRate / (sameNeedActivity.length * 100); //activityNeedRateFactor (facteur taux activité besoin)
        debug("facteur taux activité besoin : " + activityCoefficientXActivityRate / (sameNeedActivity.length * 100) + ", activityCoefficientXActivityRate : " + activityCoefficientXActivityRate + ", ActivityNeedRateFactor : " + activityCoefficientXActivityRate / sumActivityRate);
    }

    // calculate numberOfRessourcesFactor
    if (totalOfEmployees !== 0) {
        var cooridationfactor = (sameNeedActivity.length <= requirement.quantity) ?
            taskDesc.getPropertyD("coordinationRatioInf") : taskDesc.getPropertyD("coordinationRatioSup");
        correctedRessources = 1 + cooridationfactor * (sameNeedActivity.length / requirement.quantity - 1);
        if (correctedRessources < 0.2) {
            correctedRessources = sameNeedActivity.length / 5 / requirement.quantity;
        }
        stepAdvance *= correctedRessources; //numberOfRessourcesFactor
        debug("Facteur nb ressource besoin : " + correctedRessources + ", stepAdvance: " + stepAdvance + ", #sameNeedActivity: " + sameNeedActivity.length + ", correctedRessources: " + correctedRessources);
    }

    if (work.completeness >= work.totalByWork * 100) {      // Other work factor
        debug("otherWorkFactor : 0.8, stepAdvance: " + stepAdvance + ", work.totalByWork: " + work.totalByWork + ", totalOfEmployees: " + totalOfEmployees + ", work.completeness:" + work.completeness);
        stepAdvance *= 0.8;
    }

    stepAdvance *= taskTable[taskDesc.name].randomFactor;                       // Random factor 

    //calculate learnFactor
    if (taskTable[taskDesc.name].completeness > 15 && !workOnTask(employeeInst.descriptor, taskDesc)) {
        var learnFactor = 1 - ((numberOfEmployeeOnNeedOnNewTask * (taskDesc.getPropertyD("takeInHandDuration") / 100)) / sameNeedActivity.length);
        stepAdvance *= learnFactor;                                             //learnFactor
        debug("learnFactor: " + learnFactor + ", stepAdvance: " + stepAdvance + ", numberOfEmployeeOnNeedOnNewTask : " + numberOfEmployeeOnNeedOnNewTask);
    }

    stepAdvance *= taskInst.getPropertyD("bonusRatio");                         //calculate tasks bonusRatio
    debug("taskbonusRatio : " + taskInst.getPropertyD("bonusRatio") + ", stepAdvance: " + stepAdvance);

    stepAdvance *= Variable.findByName(gameModel, "bonusRatio").getValue(self); //calculate project bonusRatio
    debug("projectBonusRatio : " + Variable.findByName(gameModel, "bonusRatio").getValue(self) + ", stepAdvance: " + stepAdvance);

    stepAdvance *= getPredecessorFactor(taskDesc);                              //calculate predecessorFactor
    debug("predecessorFactor: " + getPredecessorFactor(taskDesc) + ", stepAdvance: " + stepAdvance + ", #sameNeedActivity: " + sameNeedActivity.length);

    stepAdvance *= 100;

    //calculate stepQuality
    if (sumActivityRate !== 0) {
        averageSkillsetQuality = skillsetXActivityRate / sumActivityRate;
        var skillFactor = (averageSkillsetQuality >= requirement.level) ? 0.02 : 0.03;
        stepQuality = 2 + 0.03 * ((motivationXActivityRate / sumActivityRate) - 7) //Motivation quality
            + skillFactor * (averageSkillsetQuality - requirement.level);       //skillset (level) quality
    }

    // Compute new quality 
    if (requirement.completeness + stepAdvance > 0) {
        stepQuality = (stepQuality / 2) * 100; //step Quality
        requirement.quality = (requirement.quality * requirement.completeness + stepQuality * stepAdvance) / (requirement.completeness + stepAdvance);
        debug("StepQuality: " + requirement.quality + ", skillsetXActivityRate: " + skillsetXActivityRate + ", motivationXActivityRate: " + motivationXActivityRate);
    }

    //set Wage (add 1/steps of the need's wage at task);
    var oWages = taskInst.getPropertyD("wages"),
        wages = Y.Array.sum(sameNeedActivity, function(a) {
            return activity.resourceInstance.getPropertyD("wage") / 4 * activity.resourceInstance.getPropertyD("activityRate") / 100 / STEPS
        });
    taskInst.setProperty("wages", taskInst.getPropertyD("wages") + Math.round(wages));
    debug("Wages: " + oWages + " + " + (taskInst.getPropertyD("wages") - oWages) + " = " + taskInst.getPropertyD("wages"));

    var oCompleteness = requirement.completeness;
    requirement.completeness += stepAdvance;                                    // update requirement completion
    debug("Requirement completeness change: " + oCompleteness + " + " + stepAdvance + " = " + requirement.completeness);
}

/**
 * Return a random factor based on properties 'randomDurationSup' and 'randomDurationInf'
 * of the given task.
 * @param {TaskInstance} taskInst
 * @returns {Number} a factor between 0 and 2
 */
function getRandomFactorFromTask(task) {
    var delta, randomFactor, x = Math.random(),
        rn = Math.floor(Math.random() * 100), //number 0 to 100 (0 inclusive, 100 exclusive);
        randomDurationSup = task.getPropertyD("randomDurationSup"),
        randomDurationInf = task.getPropertyD("randomDurationInf");
    if (rn < 3) {
        delta = -(0.25 * x + 0.75) * randomDurationInf;
    } else if (rn < 10) {
        delta = -(0.25 * x + 0.50) * randomDurationInf;
    } else if (rn < 25) {
        delta = -(0.25 * x + 0.25) * randomDurationInf;
    } else if (rn < 50) {
        delta = -0.25 * x * randomDurationInf;
    } else if (rn < 75) {
        delta = 0.25 * x * randomDurationSup;
    } else if (rn < 90) {
        delta = (0.25 * x + 0.25) * randomDurationSup;
    } else if (rn < 97) {
        delta = (0.25 * x + 0.50) * randomDurationSup;
    } else {
        delta = (0.25 * x + 0.75) * randomDurationSup;
    }

    randomFactor = task.duration + delta;
    if (randomFactor < MINTASKDURATION) {
        randomFactor = MINTASKDURATION;
    }

    return getFloat((task.duration / randomFactor), 2);
}

/**
 * Calculate the current quality of the task based on the average of the quality
 *  in each bound requirement and weighted by the progression of its cmpleteness.
 * @param {TaskDescriptor} taskDesc
 * @returns {Number} a number btween 0 and 200
 */
function calculateTaskQuality(taskInst) {
    var i, req, needQualityXNeedProgress = 0, needProgress = 0;
    for (i = 0; i < taskInst.requirements.size(); i++) {
        req = taskInst.requirements.get(i);
        needQualityXNeedProgress += req.quality * req.completeness;
        needProgress += req.completeness;
    }
    return Math.round(needQualityXNeedProgress / needProgress);
}

function getCurrentPhase() {
    return Variable.findByName(gameModel, "currentPhase");
}

function getCurrentPeriod() {
    var currentPhase = getCurrentPhase().getValue(self),
        periods = Variable.findByName(gameModel, "currentPeriod");
    if (periods !== null && currentPhase !== null) {
        return periods.items.get(currentPhase - 1);
    }
    return null;
}

/**
 * return a float with a length = to the given "numberOfDigit"
 * @param {Number} number
 * @param {Number} numberOfDigit
 * @returns {Number}
 */
function getFloat(number, numberOfDigit) {
    numberOfDigit = Math.pow(10, (numberOfDigit > 1) ? numberOfDigit : 1);
    return Math.round(number * numberOfDigit) / numberOfDigit;
}

/**
 * Check the end of a task or of a requirement and send corresponding messages.
 * if it's the last step, call function ''checkAssignments'' to send other kind of messages.
 * @param {Array} activities, an Array of Activity
 * @param {Number} currentStep
 */
function checkEnd(activities, currentStep) {
    var i, employeeInst, taskInst, taskDesc, employeeName, nextWork;
    for (i = 0; i < activities.length; i++) {
        taskDesc = activities[i].taskDescriptor;
        taskInst = taskDesc.getInstance(self);
        employeeInst = activities[i].resourceInstance;
        if (currentStep === STEPS - 1) {
            checkAssignments(employeeInst, currentStep);
        } else if (taskInst.getPropertyD("completeness") < 100) {
            nextWork = selectFirstUncompletedWork(taskInst.requirements, employeeInst.mainSkill);
            if (activities[i].requirement.work != nextWork) {
                sendMessage(getStepName(currentStep) + ') Tâche : ' + taskDesc.label + ' en partie terminée',
                    'Nous avons terminé la partie ' + activities[i].requirement.work + ' de la tâche ' + taskDesc.label
                    + '. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeInst.mainSkill,
                    employeeInst.descriptor.label);
                //sendMessage(getStepName(currentStep) + ') Tâche : ' + taskDesc.label + ' en partie terminée',
                //        'Nous avons terminé la partie ' + activities[i].requirement.work + ' de la tâche ' + taskDesc.label + '. Je passe à ' + nextWork 
                //        + '. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
                //        employeeInst.descriptor.label);
            }
        }
    }
}

/**
 * Return a name for each step.
 * @param {Number} step
 * @returns {String} the name of the step
 */
function getStepName(step) {
    return STEPNAMES[step];
}

/**
 * function to know if an employee is working on the task.
 * A employee working on task mean that he works the period before (currentPeriod -1)
 * @param {String} empName
 * @param {String} taskName
 * @returns Boolean true if works on project
 */
function workOnTask(employee, task) {
    return Y.Array.find(employee.getInstance(self).activities, function(a) {
        return a.time === currentPeriod - 1
            && task.id === a.taskDescriptorId;
    });
}

/**
 * Check if a ressource work on the project
 * @param {string} name the name from ressource to check
 * @return true if work on project
 */
function workOnProject(employeeInst) {
    return Y.Array.find(employeeInst.activities, function(a) {                  //Check if the employee a not finished activity
        return a.taskDescriptor.getInstance(self).task.getPropertyD("completeness") < 100;
    })
        && Y.Array.find(employeeInst.occupations, function(o) {                 // Check if has an occupation for the futur
            return o.time >= currentPeriod;
        });
}

/**
 * Send a message to the current player.
 * @param String subject, the subject of the message.
 * @param String message, the content of the message.
 * @param String from, the sender of the message.
 */
function sendMessage(subject, content, from) {
    Variable.find(gameModel, "inbox").sendMessage(self, from, subject, content, []);
}

/**
 * Print a console msg if in debug mode
 * 
 * @param {String} msg
 */
function debug(msg) {
    if (DEBUGMODE) {
        println(msg);
        RequestManager.sendCustomEvent("debug", msg);
    }
}
