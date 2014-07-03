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
 */
//Global variables
var DEBUGMODE = true,
        STEPS = 10,
        MINTASKDURATION = 0.1,
        taskTable = {},
        STEPNAMES = ['Lundi matin', 'Lundi après-midi', 'Mardi matin', 'Mardi après-midi', 'Mercredi matin',
    'Mercredi après-midi', 'Jeudi matin', 'Jeudi après-midi', 'Vendredi matin', 'Vendredi après-midi', 'Samedi matin'];

/**
 * Divide period in steps (see global variable).
 * Call function step at each step.
 */
function runSimulation() {
    var i, activeTasks = getActiveTasks();
    
    debug('runSimulation()');
    
    taskTable = {};
    for (i=0; i<activeTasks.length; i++) {
        taskTable[activeTasks[i].getDescriptor().name] = {
            completeness: activeTasks[i].getPropertyD('completeness'),
            randomFactor: getRandomFactorFromTask(activeTasks[i])
        };
    }
    
    for (var i = 0; i < STEPS; i++) {
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
    debug('step(' + currentStep + ")");

    var activities = assignRessources(currentStep);                          // Create activities for ressources

    debug("step(): #activities:" + activities.length);

    if (activities.length !== getActivitiesWithEmployeeOnDifferentNeeds(activities).length) {
        throw new Error("step(): activities length does not match filtered length : " + getActivitiesWithEmployeeOnDifferentNeeds(activities).length);
    }

    Y.Array.each(activities, function(a) {                                      // Calculate progress for each activity
        calculateActivityProgress(a, activities, currentStep);
    });

    Y.Array.each(getTasksByActivities(activities), function(t) {                //get each modified task and calculate is new quality and completeness
        t.setProperty('completeness', Math.round(calculateTaskProgress(t)));
        t.setProperty('quality', calculateTaskQuality(t));
    });
    checkEnd(activities, currentStep);
}
/**
 * 
 * @param {type} taskInst
 * @returns {Number}
 */
function calculateTaskProgress(taskInst) {
    var work, taskProgress = 0,
            requirementsByWork = getRequirementsByWork(taskInst.requirements);
    for (work in requirementsByWork) {
        taskProgress += requirementsByWork[work].completeness;
    }
    return (taskProgress > 97) ? 100 : taskProgress;                            // >97 yes, don't frustrate the players please.
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

    var i, currentPeriod = getCurrentPeriod().getValue(self),
            pastPeriods = 0;

    for (i = 0; i < taskInst.plannification.size() && i <= currentPeriod.period; i++) {
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
            completeness = taskInst.getPropertyD('completeness'),
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
function getActiveTasks() {
    return Variable.findByName(gm, 'tasks').items.toArray().map(function(t) {
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
 */
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

/**
 * Sort the given array to keep only activities with employee on the same requirement
 * @param {Array} activities an Array of Activity
 * @param {Activity} activity
 * @returns {Array} an Array of Activity
 */
function getActivitiesWithEmployeeOnSameNeed(activities, activity) {
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
    debug("assignRessources(currentStep: " + currentStep + ")");
    var i, employee, activity, assignables,
            activities = [],
            employees = flattenList(Variable.findByName(gameModel, 'employees')),
            currentPeriod = getCurrentPeriod().getValue(self) + currentStep / STEPS;

    if (!employees) {
        return [];
    }
    for (i = 0; i < employees.length; i++) {
        employee = employees[i].getInstance(self);
        if (isReservedToWork(employee)) {                                       // get a 'player created' occupation    
            assignables = checkAssignments(employee, currentStep);              // get assignable tasks
            if (assignables.length > 0) {
                activity = findLastStepCorrespondingActivity(employee,
                        assignables[0].taskDescriptor, currentPeriod);              //set corresponding past activity if it existe.
                debug("assignRessources(): activity for " + employees[i].name + ":" + activity);
                if (!activity) {                                                // Else create it.
                    debug("assignRessources(): creating new activity")
                    activity = employee.createActivity(assignables[0].taskDescriptor);
                }
                if (selectRequirementFromActivity(activity) === null) {         // Possible d'améliorer la performance en ne créant pas d'activity. Mais nécessite de créer une nouvelle fonction comme "selectRequirementFromActivity" en ne passant pas par une activity.
                    employee.removeActivity(activity);
                } else {
                    activity.setRequirement(selectRequirementFromActivity(activity));
                    activity.setTime(currentPeriod);
                    activities.push(activity);
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
    var i, task;

    for (i = 0; i < employeeInst.assignments.size(); i++) {
        task = employeeInst.assignments.get(i).taskDescriptor.getInstance(self);
        if (task.getPropertyD('completeness') >= 100) {
            task.assignments.remove(i);
        }
    }
}

/**
 * Check and return the most adapted requirement in the task of the activity,
 *  for the employee in the activity. Use function (''selectRequirement'') to
 *   choose the requirement.
 * @param {Activity} activity
 * @returns {WRequirement} the selected (most adapted) requierement
 */
function selectRequirementFromActivity(activity) {
    var taskInst = activity.taskDescriptor.getInstance(self),
            work = activity.resourceInstance.mainSkill,
            workAs = selectFirstUncompletedWork(taskInst.requirements, work);

    return selectRequirement(taskInst, activity.resourceInstance, workAs);
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
    var i, activity;
    //debug("findLastStepCorrespondingActivity(" + employeeInst.descriptor.name + ")" + employeeInst.activities.size());
    for (i = 0; i < employeeInst.activities.size(); i++) {
        activity = employeeInst.activities.get(i);
        if (activity.taskDescriptor == taskDesc                                 // If the task of activity match with the given task (same task and same employee == same activity)
                && period !== Math.floor(period)                                    // if it s not a new period (current step !== 0)
                && activity.time === getFloat(period - 0.1)) {                      // if activity was used the last step
            return activity;
        }
    }
    return null;
}

/**
 * Research and return an activity having the same task, the same employee and
 *  worked on in previous period or step.
 * @param {ResourceInstance} employeeInst
 * @param {TaskDescriptor} taskDesc
 * @param {Number} currentPeriod
 * @returns {Activity} activity
 */
function haveCorrespondingActivityInPast(employeeInst, taskDesc, currentPeriod) {
    var i, activity;
    for (i = 0; i < employeeInst.activities.size(); i++) {
        activity = employeeInst.activities.get(i);
        if (activity.taskDescriptor === taskDesc   //if the task of activity match with the given task (same task and same employee == same activity)
                && currentPeriod > activity.time) {
            return true;
        }
    }
    return false;
}

/**
 * Check if the given resource have an occupation where time correspond to the current time.
 * If its true, the employee is reserved (and the function return true)
 * @param {RessourceInstance} employeeInst
 * @returns {Boolean} is reserved
 */
function isReservedToWork(employeeInst) {
    var i, currentPeriod = getCurrentPeriod().getValue(self);
    for (i = 0; i < employeeInst.occupations.size(); i++) {
        if (employeeInst.occupations.get(i).time === currentPeriod) {
            return employeeInst.occupations.get(i).editable;                    // Illness, etc. occupations are not editable
        }
    }
    return false;
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
        if (taskInst.getPropertyD('completeness') < 100
                && getPredecessorFactor(a.taskDescriptor) >= 0.2) { //if the task isn t terminated and average of predecessors advancement is upper than 20%

            debug("look up: " + Y.Array.find(taskInst.requirements, function(r) {
                return a.resourceInstance.mainSkill == r.work;
            }) + "*" + taskInst.requirements);
            if (Y.Array.find(taskInst.requirements, function(r) {
                debug(a.resourceInstance.mainSkill + "*" + r.work)
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
    debug("checkAssignments(" + employeeInst + ", " + currentStep + ")");
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
        if (taskInst.getPropertyD('completeness') >= 100) {
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
                    'Je suis sensé travailler sur la tâche "' + taskDesc.label + '" mais les tâches précedentes ne sont pas assez avancées. <br/> Je retourne donc à mes occupations habituel. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
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
    var i, predecessorsAdvancements = 0,
            numberOfPredecessors = 0,
            predecessors = taskDesc.predecessors;

    for (i = 0; i < predecessors.size(); i++) {
        if (predecessors.get(i).getInstance(self).active) {
            predecessorsAdvancements += predecessors.get(i).getInstance(self).getPropertyD('completeness');
            numberOfPredecessors += 1;
        }
    }
    if (numberOfPredecessors > 0) {
        return Math.pow((predecessorsAdvancements / numberOfPredecessors) / 100,
                taskDesc.getInstance(self).getPropertyD('predecessorsDependances'));
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
    var work, reqByWorks = getRequirementsByWork(requirements);          // get requirements merged by kind of work.

    for (work in reqByWorks) {
        if (reqByWorks[work].completeness < reqByWorks[work].maxLimit && metier == work) { //check if the maximum limit from all requirements of the current kind of work is smaller than the completeness of the current kind of work
            return work;
        }
    }
}

/**
 * Select the most appropriate requirement for a employee.
 * the requirement must be the same type of work than the given parameter
 *  'work as' and must be match with this condition : req.completeness < max limit of req in this kind of job * employee on this task / total of employee of req in this kind of job
 * If several requirement match, select the one which have least difference between its level and the level of the given employee
 * * @param {TaskInstance} taskInst
 * @param {EmployeeInstance} employeeInst
 * @param {String} workAs string which define current work type of the given employee (can be different than his job)
 * @returns {WRequirement} the selected requirement
 */
function selectRequirement(taskInst, employeeInst, workAs) {
    var i, req, requirements = taskInst.requirements,
            selectedReq = null,
            totalOfPersonneInTask = Y.Array.sum(requirements, function(r) {
        return r.quantity;
    }),
            deltaLevel = 1000,
            level = parseInt(employeeInst.mainSkillLevel),
            reqByWorks = getRequirementsByWork(requirements);

    for (i = 0; i < requirements.size(); i++) {
        req = requirements.get(i);
        if (req.work == workAs
                && req.completeness < (reqByWorks[workAs].maxLimit * totalOfPersonneInTask / reqByWorks[workAs].totalOfEmployees)) {
            if (deltaLevel > level - req.level) {
                deltaLevel = Math.abs(level - req.level);
                selectedReq = req;
            }
        }
    }
    return selectedReq;
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
    var i, req, works = {}, work, needsCompletion = 0, totalOfEmployees = 0;
    for (i = 0; i < requirements.size(); i++) {
        req = requirements.get(i);
        //keep an occurance of each kind of work needed
        if (works[req.work]) {
            work = works[req.work];
            work.totalByWork += req.quantity;
        } else {
            work = works[req.work] = {
                maxLimit: 0,
                typesOfLevels: [],
                totalOfEmployees: 0,
                completeness: 0,
                totalByWork: req.quantity,
                dimFactorAdvancement: false
            };
        }
        //keep the highest limit of all limits from each kind of work needed
        if (work.maxLimit < req.limit) {
            work.maxLimit = req.limit;
        }
        //keep all kind of levels for each kind of work needed
        if (work.typesOfLevels.indexOf(req.level) <= -1) {
            work.typesOfLevels.push(req.level);
        }
        //keep the summe of personns needed for each kind of work needed
        totalOfEmployees += req.quantity;
        //is needed for next calcul
        needsCompletion += req.completeness * req.quantity;
        work.completeness += req.completeness;
    }
    for (work in works) {                                                       //keep the sum of personns needed for each kind of work needed
        works[work].totalOfEmployees = totalOfEmployees;

        if (works[work].completeness > (works[work].totalByWork / totalOfEmployees) * 100) {
            works[work].dimFactorAdvancement = true;
        }
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
function calculateActivityProgress(activity, allActivities, currentStep) {
    debug("calculateActivityProgress(activity: " + activity + ", currentStep: " + currentStep + ")");

    var i, employeeDesc, employeeInst, activityRate, averageSkillsetQuality,
            correctedRessources, needProgress,
            affectedEmployeesDesc = [], stepAdvance = 1, sumActivityRate = 0,
            employeesMotivationXActivityRate = 0,
            employeesMotivationFactor, employeesSkillsetXActivityRate = 0,
            employeeSkillsetFactor, activityCoefficientXActivityRate = 0,
            numberOfEmployeeOnNeedOnNewTask = 0, stepQuality = 0,
            motivationXActivityRate = 0, skillsetXActivityRate = 0,
            taskDesc = activity.taskDescriptor,
            taskInst = taskDesc.getInstance(self),
            reqByWorks = getRequirementsByWork(taskInst.requirements),
            selectedReq = activity.requirement,
            workAs = selectedReq.work,
            sameNeedActivity = getActivitiesWithEmployeeOnSameNeed(allActivities, activity), // @fixme should thie be here or in the next loop?
            level = parseInt(activity.resourceInstance.mainSkillLevel),
            deltaLevel = level - selectedReq.level;

    //For each need
    for (i = 0; i < sameNeedActivity.length; i++) {
        employeeInst = sameNeedActivity[i].resourceInstance;
        employeeDesc = employeeInst.descriptor;
        affectedEmployeesDesc.push(employeeDesc);
        activityRate = employeeInst.getPropertyD('activityRate');
        sumActivityRate += activityRate;

        //Calculate ressource motivation factor
        employeesMotivationFactor = 1 + 0.05 * employeeDesc.getPropertyD('coef_moral') * (employeeInst.moral - 7);
        //Calcul variables for needMotivationFactor (numérateur de la moyenne pondérée de facteur motivation besoin)
        employeesMotivationXActivityRate += employeesMotivationFactor * activityRate;

        //Calcul variables for skill factor
        var skillsetFactor = (deltaLevel > 0) ? taskDesc.getPropertyD('competenceRatioSup') : taskDesc.getPropertyD('competenceRatioInf');
        employeeSkillsetFactor = Math.max(0, 1 + 0.05 * skillsetFactor * deltaLevel);
        employeesSkillsetXActivityRate += employeeSkillsetFactor * activityRate;//Calcul variables for needSkillFactor (numérateur de la moyenne pondérée facteur compétence besoin)

        //Calcul variable for needActivityFactor (numérateur de la moyenne pondérée facteur taux activité besoin)
        activityCoefficientXActivityRate += employeeDesc.getPropertyD('coef_activity') * activityRate;

        //Calcul variable for learnFactor
        if (!haveCorrespondingActivityInPast(employeeInst, taskDesc, getCurrentPeriod().getValue(self))) {
            numberOfEmployeeOnNeedOnNewTask++;
        }
        //Calculate variable for quality
        motivationXActivityRate += employeeInst.moral * activityRate;
        skillsetXActivityRate += employeeInst.mainSkillLevel * activityRate;    //level * activityRate
    }

    //calculate needMotivationFactor, needSkillsetFactor and activityNeedRateFactor
    if (sumActivityRate !== 0) {
        stepAdvance *= employeesMotivationXActivityRate / sumActivityRate;      //needMotivationFactor (facteur motivation besoin)
        stepAdvance *= employeesSkillsetXActivityRate / sumActivityRate;        //needSkillsetFactor (facteur compétence besoin)
        stepAdvance *= activityCoefficientXActivityRate / (affectedEmployeesDesc.length * 100); //activityNeedRateFactor (facteur taux activité besoin)
    }

    stepAdvance *= 1 / (STEPS * (taskDesc.getInstance(self).duration));         // calculate base advance

    // calculate numberOfRessourcesFactor
    if (reqByWorks[workAs].totalOfEmployees !== 0) {
        if (affectedEmployeesDesc.length <= reqByWorks[workAs].totalOfEmployees) {
            correctedRessources = 1 + taskDesc.getPropertyD('coordinationRatioInf') * (affectedEmployeesDesc.length / reqByWorks[workAs].totalOfEmployees - 1);
            if (correctedRessources / affectedEmployeesDesc.length < 0.2) {
                correctedRessources = affectedEmployeesDesc.length / 5 / reqByWorks[workAs].totalOfEmployees;
            }
        } else {
            correctedRessources = 1 + taskDesc.getPropertyD('coordinationRatioSup') * (affectedEmployeesDesc.length / reqByWorks[workAs].totalOfEmployees - 1);
        }
        stepAdvance *= correctedRessources;                                     //numberOfRessourcesFactor
    }

    if (reqByWorks[workAs].dimFactorAdvancement) {
        debug('otherWorkFactor : ' + 0.8);
        stepAdvance *= 0.8;
    }

    //calculate randomFactor                                                    
    stepAdvance *= taskTable[taskDesc.name].randomFactor;

    //calculate learnFactor
    if (taskTable[taskDesc.name].completeness > 15 && !workOnTask(employeeDesc, taskDesc)) {
        stepAdvance *= 1 - ((numberOfEmployeeOnNeedOnNewTask * (taskDesc.getPropertyD('takeInHandDuration') / 100)) / affectedEmployeesDesc.length);//learnFactor
    }

    stepAdvance *= taskInst.getPropertyD('bonusRatio');                         //calculate tasks bonusRatio

    stepAdvance *= Variable.findByName(gameModel, 'bonusRatio').getValue(self); //calculate project bonusRatio

    stepAdvance *= getPredecessorFactor(taskDesc);                              //calculate predecessorFactor

    stepAdvance *= 100;

    stepAdvance /= affectedEmployeesDesc.length;

    //calculate new needCompleteness
    needProgress = selectedReq.completeness + stepAdvance;

    //calculate stepQuality
    if (sumActivityRate !== 0) {
        averageSkillsetQuality = skillsetXActivityRate / sumActivityRate;
        var skillFactor = (averageSkillsetQuality >= selectedReq.level) ? 0.02 : 0.03;

        stepQuality = 2 + 0.03 * ((motivationXActivityRate / sumActivityRate) - 7) //Motivation quality
                + skillFactor * (averageSkillsetQuality - selectedReq.level);       //skillset (level) quality
    }
    stepQuality = (stepQuality / 2) * 100;                                      //step Quality
    if (needProgress > 0) {
        selectedReq.setQuality((selectedReq.quality * selectedReq.completeness + stepQuality * stepAdvance) / needProgress);
    }

    //set Wage (add 1/steps of the need's wage at task);
    taskInst.setProperty('wages', taskInst.getPropertyD('wages') + Math.round(((activity.resourceInstance.getPropertyD('wage') / 4) * (activity.resourceInstance.getPropertyD('activityRate') / 100)) / STEPS));

    if (DEBUGMODE) {
        debug('sameNeedActivity.length : ' + sameNeedActivity.length);
        debug('employeesMotivationFactor : ' + employeesMotivationFactor);
        debug('employeesMotivationXActivityRate : ' + employeesMotivationXActivityRate);
        debug('sumActivityRate : ' + sumActivityRate);
        debug('deltaLevel : ' + deltaLevel);
        debug('employeeSkillsetFactor : ' + employeeSkillsetFactor);
        debug('employeesSkillsetXActivityRate : ' + employeesSkillsetXActivityRate);
        debug('activityCoefficientXActivityRate : ' + activityCoefficientXActivityRate);
        debug('numberOfEmployeeOnNeedOnNewTask : ' + numberOfEmployeeOnNeedOnNewTask);
        debug('motivationXActivityRate: ' + motivationXActivityRate);
        debug('skillsetXActivityRate: ' + skillsetXActivityRate);
        debug('NeedMotivationFactor : ' + employeesMotivationXActivityRate / sumActivityRate);
        debug('NeedSkillsetFactor : ' + employeesMotivationXActivityRate / sumActivityRate);
        debug('ActivityNeedRateFactor : ' + activityCoefficientXActivityRate / sumActivityRate);
        debug('baseAdvance : ' + 1 / (STEPS * taskDesc.getInstance(self).duration));
        debug('numberOfRessourcesFactor : ' + correctedRessources / reqByWorks[workAs].totalOfEmployees);
        debug('randomFactor : ' + taskTable[taskDesc.name].randomFactor);
        debug('learnFactor : ' + (1 - ((numberOfEmployeeOnNeedOnNewTask * (taskDesc.getPropertyD('takeInHandDuration') / 100)) / affectedEmployeesDesc.length)));
        debug('taskbonusRatio : ' + taskInst.getPropertyD('bonusRatio'));
        debug('projectBonusRatio : ' + Variable.findByName(gameModel, 'bonusRatio').getValue(self));
        debug('predecessorFactor : ' + getPredecessorFactor(taskDesc)); //predecessor factor);
        debug('wages : ' + (taskInst.getPropertyD('wages') + (activity.resourceInstance.getPropertyD('wage') / STEPS))); //predecessor factor);
        debug('stepAdvance : ' + stepAdvance);
        debug('need completeness : ' + selectedReq.completeness);
        debug('needProgress : ' + needProgress);
        debug('StepQuality : ' + (selectedReq.quality * selectedReq.completeness + stepQuality * stepAdvance) / needProgress);
        debug('facteur motivation besoin : ' + employeesMotivationXActivityRate / sumActivityRate);
        debug('facteur competence besoin : ' + employeesSkillsetXActivityRate / sumActivityRate);
        debug('nb employé affecté : ' + affectedEmployeesDesc.length);
        debug('facteur taux activité besoin : ' + activityCoefficientXActivityRate / (affectedEmployeesDesc.length * 100));
        debug('Ressource corrigée : ' + correctedRessources);
        debug('emp total : ' + reqByWorks[workAs].totalOfEmployees);
        debug('Facteur nb ressource besoin : ' + correctedRessources);
        debug('task completness : ' + taskInst.getProperty('completeness'));
    }

    //set need progress (after calcuateQuality) and return it
    selectedReq.setCompleteness(needProgress);
    return needProgress;
}

/**
 * Return a random factor based on properties 'randomDurationSup' and 'randomDurationInf'
 * of the given task.
 * @param {TaskInstance} taskInst
 * @returns {Number} a factor between 0 and 2
 */
function getRandomFactorFromTask(taskInst) {
    var rn = Math.floor(Math.random() * 100), //number 0 to 100 (0 inclusive, 100 exclusive);
            randomDurationSup = taskInst.getPropertyD('randomDurationSup'),
            randomDurationInf = taskInst.getPropertyD('randomDurationInf'),
            duration = taskInst.duration, delta,
            randomFactor, x = Math.random();

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

    randomFactor = duration + delta;

    if (randomFactor < MINTASKDURATION) {
        randomFactor = MINTASKDURATION;
    }

    return getFloat((duration / randomFactor), 2);
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
    return Math.round((needQualityXNeedProgress / needProgress));
}

function getCurrentPhase() {
    return Variable.findByName(gameModel, 'currentPhase');
}

function getCurrentPeriod() {
    var periods = Variable.findByName(gameModel, 'currentPeriod');
    if (periods !== null && currentPhase.value !== null) {
        return periods.items.get(currentPhase.value);
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
        } else if (taskInst.getPropertyD('completeness') < 100) {
            nextWork = selectFirstUncompletedWork(taskInst.requirements, employeeInst.mainSkill);
            if (activities[i].requirement.work != nextWork) {
                sendMessage(getStepName(currentStep) + ') Tâche : ' + taskDesc.label + ' en partie terminée',
                        'Nous avons terminé la partie ' + activities[i].requirement.work + ' de la tâche ' + taskDesc.label + '. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeInst.mainSkill,
                        employeeInst.descriptor.label);
                //sendMessage(getStepName(currentStep) + ') Tâche : ' + taskDesc.label + ' en partie terminée',
                //        'Nous avons terminé la partie ' + activities[i].requirement.work + ' de la tâche ' + taskDesc.label + '. Je passe à ' + nextWork + '. <br/> Salutations <br/>' + employeeName + '<br/> ' + employeeJob,
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
    var currentPeriod = getCurrentPeriod().getValue(self),
            previousPeriod = currentPeriod - 1;

    return Y.Array.find(employee.getInstance(self).activities, function(a) {
        return a.time === previousPeriod && task.id === a.taskDescriptorId;
    });
}

/**
 * Check if a ressource work on the project
 * @param {string} name the name from ressource to check
 * @return true if work on project
 */
function workOnProject(employeeInst) {
    var currentPeriod = getCurrentPeriod().getValue(self);

    return Y.Array.find(employeeInst.activities, function(a) {        //Check if the employee a not finished activity
        return a.taskDescriptor.getInstance(self).task.getPropertyD("completeness") < 100;
    })
            && Y.Array.find(employeeInst.occupations, function(o) {       // Check if has an occupation for the futur
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
