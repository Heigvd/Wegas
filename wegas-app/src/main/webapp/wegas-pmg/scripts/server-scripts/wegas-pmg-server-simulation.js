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
var taskTable, resourceTable,
    currentPeriodNumber = getCurrentPeriod().getValue(self),
    AUTOMATED_RESERVATION = false,
    DEBUGMODE = false,
    STEPS = 10,
    MIN_TASK_DURATION = 0.1,
    WEEKDAY_KEY = ["mon", "tue", "wed", "thu", "fri"],
    MONTH_KEY = ["dec", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov"],
    TASK_COMPLETED_AT = 97;

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
 * Divide period in steps (see global variable).
 * Call function step at each step.
 */
function runSimulation() {
    var i, activeTasks = getActiveTasks();
    AUTOMATED_RESERVATION = automatedReservation();
    currentPeriodNumber = getCurrentPeriod().getValue(self);
    debug("runSimulation(currentPeriodNumber: " + currentPeriodNumber + ")");

    resourceTable = {};
    // Init task table
    taskTable = {};
    for (i = 0; i < activeTasks.length; i++) {
        taskTable[activeTasks[i].descriptor.name] = {
            completeness: activeTasks[i].getPropertyD("completeness"),
            randomFactor: getRandomFactorFromTask(activeTasks[i])
        };
    }

    for (var i = 0; i < STEPS; i++) {
        step(i);
    }

    debug("All Step Computed");

    billUnworkedHoursForUselessResources();
}



function getResourceInstances() {
    return flattenList(Variable.findByName(gameModel, "employees")).map(function(rd) {
        return rd.getInstance(self); // Get instances
    }, this);
}
/**
 * 
 * @returns {Array} list of resources (desc) that may work on speciefied period this period 
 */
function getActiveResourceInstances() {
    return getResourceInstances().filter(// Filter 
        function(resourceInstance) {
            return isReservedToWork(resourceInstance, currentPeriodNumber);
        }, this);
}

function billUnworkedHoursForUselessResources() {
    debug(arguments.callee.name);
    if (!AUTOMATED_RESERVATION) {
        Y.Array.each(getActiveResourceInstances(),
            function(resourceInstance) {
                if (findActivitesByPeriod(resourceInstance, currentPeriodNumber).length === 0) {
                    // Useless resources -> reserved + noWork
                    addUnworkedHours(resourceInstance, 100); // 4 the whole period -> 100%
                }
            });
    }
}

/**
 * 
 * Make a step 
 * 
 *  a) according to assignements, link resources to requirements 
 *  b) compute each requirement progress 
 *  c) consolidate requirement's progress within tasks
 * 
 * @param {Number} currentStep the number [0-9]
 */
function step(currentStep) {
    debug("step(" + currentStep + ")");

    // Process assignments
    var activities = assignResources(currentStep);

    // Calculate progress for each requirement
    Y.Array.each(getDistinctRequirements(activities), function(r) {
        debug("step(): computeReq:" + r);
        calculateRequirementProgress(r, activities);
    });

    // Consolidate requirments progress & quality into tasks
    Y.Array.each(getTasksFromActivities(activities), function(t) {
        var oCompleteness = t.getProperty("completeness");
        t.setProperty("completeness", calculateTaskProgress(t));
        t.setProperty("quality", calculateTaskQuality(t));
        debug("step(" + currentStep + "): Task completeness: " + oCompleteness + " => " + t.getProperty("completeness"));
    });

    checkEnd(activities, currentStep);
}

/**
 * Create activities for the current step
 * 
 * @param {Number} currentStep
 * @returns {Array} an Array of Activity
 */
function assignResources(currentStep) {
    debug(arguments.callee.name + "(currentStep: " + currentStep + ", currentPeriodNumber: " + currentPeriodNumber + ")");
    var activities = [],
        i, resources = flattenList(Variable.findByName(gameModel, "employees"));

    if (!resources) {
        return [];
    }
    for (i = 0; i < resources.length; i++) {
        activities.push(assignResource(currentStep, resources[i].getInstance(self)));
    }

    debug(arguments.callee.name + "(activities before filtering: " + activities + ")");

    return activities.filter(function(o) {
        return o; // not null
    });
}

/**
 * 
 * An activity bounds a resource to the task.req it will work on
 * Ff a corresponding activity exist in the past, get it and update its values, 
 * create a new one otherwise
 * 
 * @param {type} currentStep
 * @param {type} resourceInstance
 * @returns {type} return an activity or null if the resource will not work durung the step
 */
function assignResource(currentStep, resourceInstance) {
    debug(arguments.callee.name + " (" + resourceInstance + ")\n***************************");
    var activity = null;

    if (isReservedToWork(resourceInstance, currentPeriodNumber)) {
        var i, allAssignments = resourceInstance.assignments,
            justCompletedTasks = [];

        // iterate through assigments until an activity exists
        for (i = 0; i < allAssignments.size() && !activity; i++) {
            var currentAssignment = allAssignments.get(i);
            var taskDesc = currentAssignment.taskDescriptor;
            // Only cares about uncompleted tasks
            if (!isCompleted(taskDesc)) {
                if (notBlockedByPredecessors(taskDesc)) {
                    var req = selectRequirement(taskDesc.getInstance(self), resourceInstance);

                    if (req) {
                        activity = getActivity(resourceInstance, taskDesc,
                            currentPeriodNumber + currentStep / STEPS,
                            req);
                        debug("   -> Activity");
                    } else {
                        debug("   -> NOT MY WORK req not found...");
                        sendNotMyWorkMail(resourceInstance, currentStep, taskDesc);
                        allAssignments.remove(i);

                        // dont work this step -> bill
                        addUnworkedHours(resourceInstance, 10); // Limit 10% -> a step
                        break; // stop looking for an activity
                    }
                } else {
                    debug("    -> BLOCKED BY PREDECESSORS");
                    if (currentStep === 0) {
                        sendBlockedByPredecessorsMail(resourceInstance, currentStep, taskDesc);
                    }
                }
            } else {
                debug("    -> COMPLETED TASK");
                // If a completed task still is in resource's assignments, it
                // means that such a task has been completed during the previous step
                // of the period : register it in order to send correct tracking messages
                justCompletedTasks.push(taskDesc);
            }
        }
        debug("All req processed (activity is : " + activity);

        /**
         * TRACKING MESSAGES
         */
        debug("TRACKING\n**************");
        if (justCompletedTasks.length === 0) {
            // No task just completed
            if (activity) {
                if (activity.getTime() < 0) { // Just created activity ? 
                    if (!findActivityByTaskAndPeriod(resourceInstance, activity.taskDescriptor, currentPeriodNumber - 1)) {
                        debug("New Activity: " + activity);
                        sendStartWorkingOnTaskMail(resourceInstance, currentStep, activity.taskDescriptor);
                    } else {
                        debug("Continue on activity from previous period: " + activity);
                    }
                } else {
                    debug("Continue on activity from previous step: " + activity);
                }
            }
        } else {
            var t;
            for (t in justCompletedTasks) {
                debug(" ->JUST COMPLETED TASKS[" + t + "]: " + justCompletedTasks[t]);
            }
            // task have been completed during the previous step -> tracking-message
            if (activity) {
                sendGoToNextTaskMail(resourceInstance, currentStep, activity.taskDesc, justCompletedTasks[0]);
            } else {
                // No more workable tasks for the resource message
                sendGoToOtherActivities(resourceInstance, currentStep, justCompletedTasks[0]);
            }
        }
    }
    debug("**************");

    removeAssignmentsFromCompleteTasks(resourceInstance);

    if (activity) {
        activity.setTime(currentPeriodNumber + currentStep / STEPS);
    }

    return activity;
}


/**
 * 
 * @param {Array} activities an Array of Activity
 * @param {Number} currentStep
 */
function checkEnd(activities, currentStep) {
    debug(arguments.callee.name + "() step: " + currentStep);
    var taskInst, taskDesc;

    Y.Array.each(getDistinctRequirements(activities), function(r) {
        taskInst = r.getTaskInstance(),
            taskDesc = taskInst.getDescriptor();

        if (!isTaskInstanceCompleted(taskInst)) {
            if (isSkillCompleted(taskInst, r.work)) {
                sendSkillCompletedEmail(currentStep, taskDesc, r.work);
            }
        }
    });
}


/**
 * 
 * @param {type} taskInst
 * @returns {Number}
 */
function calculateTaskProgress(taskInst) {
    var nbWork = Y.Array.sum(taskInst.requirements, function(r) {
        return r.quantity;
    }),
        skillsOverview = getSkillsOverview(taskInst),
        taskProgress = 0,
        skill;

    for (skill in skillsOverview) {
        taskProgress += skillsOverview[skill].completeness * skillsOverview[skill].totalByWork;
    }


    taskProgress = taskProgress / nbWork;

    if (taskProgress > 0.0 & taskProgress < 1) {
        taskProgress = 1; // Avoid >0 to be round to 0
    }

    return (taskProgress > TASK_COMPLETED_AT) ? 100 : Math.round(taskProgress); // > 97 yes, don't frustrate the players please.
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
    for (i = 0; i < taskInst.plannification.size() && i <= currentPeriodNumber; i++) {
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
 * Extract tasks from activities
 * 
 * @param {Array} activities
 * @returns {Array} list of unique tasks 
 */
function getTasksFromActivities(activities) {
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
 * @param {Array} activities  an array 
 * @returns {Array} an Array of distinct requirement extract from given activities
 */
function getDistinctRequirements(activities) {
    return Y.Array.unique(activities, function(a1, a2) {
        return a1.requirement === a2.requirement;
    }).map(function(a) {
        return a.requirement;
    });
}

/**
 * Fitler given activites according to specified requirement
 * 
 * @param {Array} activities an Array of Activity
 * @param {Requirement} requirement
 * @returns {Array} an Array of Activity that match the given requirement
 */
function getActivitiesFromRequirement(activities, requirement) {
    return activities.filter(function(a) {
        return a.requirement === requirement;
    });
}

/**
 *
 * @param {type} resource
 * @param {type} taskDesc
 * @param {type} period
 * @param {type} req
 * @returns {Activity|step._L60.a|getUpToDateActivity.activity}
 */
function getActivity(resource, taskDesc, period, req) {
    var activity = findLastStepCorrespondingActivity(resource, taskDesc, period);

    if (!activity) {
        debug("               Creating new activity");
        activity = resource.createActivity(taskDesc);
        activity.setTime(-1);  // @hack -1 means the activity has just been created
    } else {
        debug("               Existing activity for " + resource.name + ": " + activity);
    }
    activity.setRequirement(req);

    debug(arguments.callee.name + " (" + activity + ")");
    return activity;
}

/**
 * 
 * @param {type} resourceInst
 * @param {Number} limit additionnal %limit 
 * @returns {undefined}
 */
function addUnworkedHours(resourceInst, limit) {
    var status = resourceTable[resourceInst] = resourceTable[resourceInst] || {
        currentUnworkedHoursPercent: 0,
        maxUnworkedHoursPercent:
            resourceInst.getDescriptor().getPropertyD("maxBilledUnworkedHours")
    }, percentToBill = Math.min(status["maxUnworkedHoursPercent"], limit),
        projectUHDesc = Variable.findByName(gameModel, 'projectUnworkedHours'),
        projectUh = projectUHDesc.getValue(self);

    percentToBill = Math.max(percentToBill - status["currentUnworkedHoursPercent"], 0);

    status["currentUnworkedHoursPercent"] += percentToBill;

    projectUh += getResourcePeriodWages(resourceInst) * percentToBill / 100;
    projectUHDesc.setValue(self, projectUh);
}

function sendGoToNextTaskMail(resourceInstance, currentStep, oldTask, newTask) {
    var resourceName = resourceInstance.descriptor.label,
        resourceSkill = resourceInstance.mainSkill,
        oldTaskName = oldTask.label,
        newTaskName = newTask.label,
        key = "endOfTaskSwitchToNew";

    sendMessage(
        I18n_t("messages." + key + ".subject", {
            step: getStepName(currentStep),
            task: oldTaskName
        }),
        I18n_t("messages." + key + ".content", {
            task: oldTaskName,
            nextTask: newTaskName,
            employeeName: resourceName,
            job: resourceSkill
        }),
        I18n_t("messages." + key + ".from", {
            employeeName: resourceName
        }));
}

function sendSkillCompletedEmail(currentStep, taskDesc, skill) {
    var taskName = taskDesc.label,
        key = "skillCompleted";

    sendMessage(
        I18n_t("messages." + key + ".subject", {
            step: getStepName(currentStep),
            task: taskName}),
        I18n_t("messages." + key + ".content", {
            task: taskName,
            skill: skill
        }),
        I18n_t("messages." + key + ".from", {
            skill: skill
        }));
}
function sendStandardEmail(resourceInstance, currentStep, taskDesc, key) {
    var resourceName = resourceInstance.descriptor.label,
        resourceSkill = resourceInstance.mainSkill,
        taskName = taskDesc.label;

    sendMessage(
        I18n_t("messages." + key + ".subject", {
            step: getStepName(currentStep),
            task: taskName}),
        I18n_t("messages." + key + ".content", {
            task: taskName,
            employeeName: resourceName,
            job: resourceSkill
        }),
        I18n_t("messages." + key + ".from", {
            employeeName: resourceName
        }));
}

function sendEmailFromTemplate(resourceInstance, currentStep, taskDesc, template) {
    sendStandardEmail(resourceInstance, currentStep, taskDesc, template);
}

function sendStartWorkingOnTaskMail(resourceInstance, currentStep, taskDesc) {
    sendEmailFromTemplate(resourceInstance, currentStep, taskDesc, "startOnTask");
}

function sendGoToOtherActivities(resourceInstance, currentStep, taskDesc) {
    sendEmailFromTemplate(resourceInstance, currentStep, taskDesc, "endOfTaskOtherActivities");
}

function sendNotMyWorkMail(resourceInstance, currentStep, taskDesc) {
    sendEmailFromTemplate(resourceInstance, currentStep, taskDesc, "notMyWork");
}

function sendBlockedByPredecessorsMail(resourceInstance, currentStep, taskDesc) {
    sendEmailFromTemplate(resourceInstance, currentStep, taskDesc, "blockedByPredecessors");
}

function removeAssignment(resourceInstance, assignment) {
    resourceInstance.assignments.remove(assignment);
}

/**
 * When the task is complete remove (definitivly) all assignments from this task.
 * @param {ResourceInstance} employeeInst
 */
function removeAssignmentsFromCompleteTasks(employeeInst) {
    debug(arguments.callee.name);
    var i, assignment, toRemove = [];
    for (i = 0; i < employeeInst.assignments.size(); i++) {
        assignment = employeeInst.assignments.get(i);
        if (isCompleted(assignment.taskDescriptor)) {
            toRemove.push(assignment);
        }
    }

    Y.Array.each(toRemove, function(a) {
        removeAssignment(employeeInst, a);
    });
}

/**
 * return the most adapted (i.e closest accodring to levels) requirement
 * 
 * @param {type} taskInst
 * @param {type} resourceInst
 * @returns {WRequirement} the selected (most adapted) requierement
 */
function selectRequirement(taskInst, resourceInst) {
    var skill = resourceInst.mainSkill,
        skillCompleted = isSkillCompleted(taskInst, skill);
    debug("selectRequirement(" + taskInst + "," + resourceInst + ", mainSkill: " + resourceInst.mainSkill + ")");
    if (!skillCompleted) {
        var selectedReq = null, d, req, i,
            deltaLevel = 1000;
        for (i = 0; i < taskInst.requirements.size(); i++) {
            req = taskInst.requirements.get(i);
            d = Math.abs(parseInt(resourceInst.mainSkillLevel) - req.level);
            if (req.work == skill && deltaLevel > d) { // do not use ===  !!!
                deltaLevel = d;
                selectedReq = req;
            }
        }
        if (selectedReq && !selectedReq.getTaskInstance()) {
            debug("ERROR ORPHAN REQUIREMENT " + selectedReq + "(" + selectedReq.id + ")");
        }
        return selectedReq;
    } else {
        return null;
    }
}

/**
 * Research and return an activity having the same task, the same employee and
 *  worked on at the last step.
 * @param {ResourceInstance} employeeInst
 * @param {TaskDescriptor} taskDesc
 * @param {Number} period
 * @returns {Activity} activity
 */
function findLastStepCorrespondingActivity(employeeInst, taskDesc, period) {
    debug("findLastStepCorrespondingActivity(" + employeeInst.descriptor.name + ")" + employeeInst.activities.size());
    return Y.Array.find(employeeInst.activities, function(activity) {
        return activity.taskDescriptor === taskDesc                              // If the task of activity match with the given task (same task and same employee == same activity)
            && period !== Math.floor(period)                                    // if it s not a new period (current step !== 0)
            && activity.time === getFloat(period - 0.1); // if activity was used the last step
    });
}

/**
 * return  all activity for the given resource at the given period
 * 
 * @param {type} employeeInst
 * @param {type} period
 * @returns {undefined}
 */
function findActivitesByPeriod(employeeInst, period) {
    debug("Find all activities for " + employeeInst + " at period " + period);
    return employeeInst.activities.toArray().filter(function(activity) {
        return Math.floor(activity.time) === Math.floor(period);
    });
}

function findActivityByTaskAndPeriod(employeeInst, taskDesc, period) {
    debug("Find activity by period for " + employeeInst + " :: " + taskDesc + "; period: " + period);
    return Y.Array.find(employeeInst.activities, function(activity) {
        return activity.taskDescriptor === taskDesc
            && Math.floor(activity.time) === Math.floor(period);
    });
}


/**
 * Research and return an activity having the same task, the same employee and
 *  worked on in previous period or step.
 * @param {ResourceInstance} employeeInst
 * @param {TaskDescriptor} taskDesc
 * @returns {Activity} activity
 */
function haveCorrespondingActivityInPast(employeeInst, taskDesc) {
    return Y.Array.find(employeeInst.activities, function(activity) {
        return activity.taskDescriptor === taskDesc                             //if the task of activity match with the given task (same task and same employee == same activity)
            && currentPeriodNumber > activity.time;
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
 * @param {Number} period the period number
 * @returns {Boolean} is reserved
 */
function isReservedToWork(employeeInst, period) {
    // Inactive resource never work
    if (!employeeInst.getActive()) {
        return false;
    }

    if (!AUTOMATED_RESERVATION) {
        // the resource must be reserved.
        // it means that an "editable" occupation must exists for the current time
        return Y.Array.find(employeeInst.occupations, function(o) {
            return o.time === period
                && o.editable;
        });
    } else { // automatic
        // The resource is always reserved unless
        // it has an "uneditable" occupation for the current period
        return !Y.Array.find(employeeInst.occupations, function(o) {
            return o.time === period
                && !o.editable; // Illness, etc. occupations are not editable
        });
    }
}

function isTaskInstanceCompleted(taskInstance) {
    return taskInstance.getPropertyD("completeness") >= 100;
}

function isCompleted(taskDescriptor) {
    return isTaskInstanceCompleted(taskDescriptor.getInstance(self));
}

function notBlockedByPredecessors(taskDescriptor) {
    return getPredecessorFactor(taskDescriptor) >= 0.2;
}

function isAssignable(assigment) {
    return !isCompleted(assigment.taskDescriptor) && notBlockedByPredecessors(assigment.taskDescriptor);
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
 * Check if the given skill reach its maximum completeness within the given task
 * 
 * @param {type} taskInstance
 * @param {type} skill
 * @returns {String} work
 */
function isSkillCompleted(taskInstance, skill) {
    debug("isSkillCompleted(" + taskInstance + ", " + skill + ")");
    var skillOverview = getSkillsOverview(taskInstance)[skill],
        totalOfPersonneInTask = Y.Array.sum(taskInstance.requirements, function(r) {
            return r.quantity;
        });
    return (skillOverview && skillOverview.completeness >= skillOverview.maxLimit * totalOfPersonneInTask / skillOverview.totalByWork);
}

/**
 * Return an object which task requirements are gathered by work.
 * this object contains (by work) :
 * - maxLimit, the bigger limit found on this requirement job
 * - typesOfLevels, an Array of all found levels on this requirement job
 * - totalOfEmployees, the sum of all employees required on this requirement job.
 * - completeness the sum of each (completeness * quantity of required employees) divided by the total of employee on this requirement job.
 * @param {TaskInstance} taskInstance 
 * @returns {Object} works
 */
function getSkillsOverview(taskInstance) {
    var i, req, work, works = {},
        requirements = taskInstance.requirements;

    debug(arguments.callee.name + " req: " + requirements);

    for (i = 0; i < requirements.size(); i++) {
        req = requirements.get(i);

        //keep an occurance of each kind of work needed
        work = works[req.work] = works[req.work] || {
            maxLimit: 0,
            typesOfLevels: [],
            completeness: 0,
            totalByWork: 0
        };
        //keep the highest limit of all limits from each kind of work needed
        work.maxLimit = Math.max(work.maxLimit, req.limit);
        work.totalByWork += req.quantity;
        work.completeness += req.completeness;
    }
    return works;
}

/**
 * Calculate the progression and the quality of each worked requirement at this step.
 * Return the progression of the requirement.
 * @param {Requirement} requirement
 * @param {Array} allActivities
 * @returns {Number} a number between 0 and 100
 */
function calculateRequirementProgress(requirement, allActivities) {
    debug(arguments.callee.name);
    debug("calculateRequirementProgress(requirement: " + requirement + ", task: " + requirement.getTaskInstance() + ")");

    var i, employeeInst, activityRate, averageSkillsetQuality, correctedRessources,
        taskInst = requirement.getTaskInstance(),
        taskDesc = taskInst.getDescriptor(),
        stepAdvance = 1 / (STEPS * taskInst.duration),
        stepQuality = 0,
        sumActivityRate = 0,
        sumEmployeesMotivationXActivityRate = 0,
        sumEmployeesSkillsetXActivityRate = 0,
        sumActivityCoefficientXActivityRate = 0,
        sumMotivationXActivityRate = 0,
        sumSkillsetXActivityRate = 0,
        employeesMotivationFactor,
        employeeSkillsetFactor,
        newOnTask = 0,
        work = getSkillsOverview(taskInst)[requirement.work],
        sameNeedActivities = getActivitiesFromRequirement(allActivities, requirement),
        effectiveTotalOfEmployees = sameNeedActivities.length,
        totalOfEmployees = Y.Array.sum(taskInst.requirements, function(r) {
            return r.quantity;
        });

    debug("baseAdvance : " + stepAdvance + ", #sameNeedActivities: " + effectiveTotalOfEmployees);

    // Iterate through resources to sum various factor components
    for (i = 0; i < effectiveTotalOfEmployees; i++) {
        employeeInst = sameNeedActivities[i].resourceInstance;

        activityRate = employeeInst.getPropertyD("activityRate");
        sumActivityRate += activityRate;
        //Calculate ressource motivation factor
        employeesMotivationFactor = 1 + 0.05 * employeeInst.descriptor.getPropertyD("coef_moral") * (employeeInst.moral - 7);
        //Calcul variables for needMotivationFactor (numérateur de la moyenne pondérée de facteur motivation besoin)
        sumEmployeesMotivationXActivityRate += employeesMotivationFactor * activityRate;
        //debug("employeesMotivationFactor : " + employeesMotivationFactor);

        //Calcul variables for skill factor
        var deltaLevel = parseInt(employeeInst.mainSkillLevel) - requirement.level,
            skillsetFactor = (deltaLevel > 0) ? taskDesc.getPropertyD("competenceRatioSup") : taskDesc.getPropertyD("competenceRatioInf");

        employeeSkillsetFactor = Math.max(0, 1 + 0.05 * skillsetFactor * deltaLevel);
        //debug("calc skillset: activityRate:" + activityRate + ", skillsetFactor: " + skillsetFactor + "deltaLevel: " + deltaLevel);
        sumEmployeesSkillsetXActivityRate += employeeSkillsetFactor * activityRate; //Calcul variables for needSkillFactor (numérateur de la moyenne pondérée facteur compétence besoin)

        //Calcul variable for needActivityFactor (numérateur de la moyenne pondérée facteur taux activité besoin)
        sumActivityCoefficientXActivityRate += employeeInst.descriptor.getPropertyD("coef_activity") * activityRate;
        //Calcul variable for learnFactor
        if (!haveCorrespondingActivityInPast(employeeInst, taskDesc)) {
            newOnTask++;
        }
        //Calculate variable for quality
        sumMotivationXActivityRate += employeeInst.moral * activityRate;
        sumSkillsetXActivityRate += employeeInst.mainSkillLevel * activityRate; //level * activityRate
    }

    if (sumActivityRate !== 0) {
        stepAdvance *= sumEmployeesMotivationXActivityRate / sumActivityRate; //needMotivationFactor (facteur motivation besoin)
        debug("facteur motivation besoin: " + sumEmployeesMotivationXActivityRate / sumActivityRate + ", sumActivityRate:" + sumActivityRate + ", employeesMotivationXActivityRate: " + sumEmployeesMotivationXActivityRate);
        stepAdvance *= sumEmployeesSkillsetXActivityRate / sumActivityRate; //needSkillsetFactor (facteur compétence besoin)  
        debug("facteur competence besoin : " + sumEmployeesSkillsetXActivityRate / sumActivityRate + ", employeeSkillsetFactor : " + employeeSkillsetFactor + ", sumEemployeesSkillsetXActivityRate: " + sumEmployeesSkillsetXActivityRate);
        stepAdvance *= sumActivityCoefficientXActivityRate / (effectiveTotalOfEmployees * 100); //activityNeedRateFactor (facteur taux activité besoin)
        debug("facteur taux activité besoin : " + sumActivityCoefficientXActivityRate / (effectiveTotalOfEmployees * 100) + ", sumActivityCoefficientXActivityRate : " + sumActivityCoefficientXActivityRate + ", ActivityNeedRateFactor : " + sumActivityCoefficientXActivityRate / sumActivityRate);
    }

    // calculate numberOfRessourcesFactor
    if (totalOfEmployees !== 0) {
        var cooridationfactor = (effectiveTotalOfEmployees <= requirement.quantity) ?
            taskDesc.getPropertyD("coordinationRatioInf") : taskDesc.getPropertyD("coordinationRatioSup");
        correctedRessources = 1 + cooridationfactor * (effectiveTotalOfEmployees / requirement.quantity - 1);
        if (correctedRessources < 0.2) {
            correctedRessources = effectiveTotalOfEmployees / 5 / requirement.quantity;
        }
        stepAdvance *= correctedRessources; //numberOfRessourcesFactor
        debug("Facteur nb ressource besoin : " + correctedRessources + ", stepAdvance: " + stepAdvance + ", #sameNeedActivities: " + effectiveTotalOfEmployees + ", correctedRessources: " + correctedRessources);
    }

    if (work.completeness >= work.totalByWork * 100) {      // Other work factor 
        debug("otherWorkFactor : 0.8, stepAdvance: " + stepAdvance + ", work.totalByWork: " + work.totalByWork + ", totalOfEmployees: " + totalOfEmployees + ", work.completeness:" + work.completeness);
        stepAdvance *= 0.8;
    }

    stepAdvance *= taskTable[taskDesc.name].randomFactor; // Random factor 

    //calculate learnFactor
    if (taskTable[taskDesc.name].completeness > 15 && !workOnTask(employeeInst.descriptor, taskDesc)) {
        var learnFactor = 1 - ((newOnTask * (taskDesc.getPropertyD("takeInHandDuration") / 100)) / effectiveTotalOfEmployees);
        stepAdvance *= learnFactor; //learnFactor
        debug("learnFactor: " + learnFactor + ", stepAdvance: " + stepAdvance + ", newOnTask : " + newOnTask);
    }

    stepAdvance *= taskInst.getPropertyD("bonusRatio"); //calculate tasks bonusRatio
    debug("taskbonusRatio : " + taskInst.getPropertyD("bonusRatio") + ", stepAdvance: " + stepAdvance);
    stepAdvance *= Variable.findByName(gameModel, "bonusRatio").getValue(self); //calculate project bonusRatio
    debug("projectBonusRatio : " + Variable.findByName(gameModel, "bonusRatio").getValue(self) + ", stepAdvance: " + stepAdvance);
    stepAdvance *= getPredecessorFactor(taskDesc); //calculate predecessorFactor
    debug("predecessorFactor: " + getPredecessorFactor(taskDesc) + ", stepAdvance: " + stepAdvance + ", #sameNeedActivities: " + effectiveTotalOfEmployees);

    stepAdvance *= 100;
    //calculate stepQuality
    if (sumActivityRate !== 0) {
        averageSkillsetQuality = sumSkillsetXActivityRate / sumActivityRate;
        var skillFactor = (averageSkillsetQuality >= requirement.level) ? 0.02 : 0.03;
        stepQuality = 2 + 0.03 * ((sumMotivationXActivityRate / sumActivityRate) - 7) //Motivation quality
            + skillFactor * (averageSkillsetQuality - requirement.level); //skillset (level) quality
    }

    // Compute new quality 
    if (requirement.completeness + stepAdvance > 0) {
        stepQuality = (stepQuality / 2) * 100; //step Quality
        requirement.quality = (requirement.quality * requirement.completeness + stepQuality * stepAdvance) / (requirement.completeness + stepAdvance);
        debug("StepQuality: " + requirement.quality + ", sumSkillsetXActivityRate: " + sumSkillsetXActivityRate + ", sumMotivationXActivityRate: " + sumMotivationXActivityRate);
    }

    //set Wage (add 1/steps of the need's wage at task);
    var oWages = taskInst.getPropertyD("wages"),
        wages = Y.Array.sum(sameNeedActivities, function(a) {
            return getResourceStepWages(a.resourceInstance);
        });

    taskInst.setProperty("wages", taskInst.getPropertyD("wages") + wages);
    debug("Wages: " + oWages + " + " + (taskInst.getPropertyD("wages") - oWages) + " = " + taskInst.getPropertyD("wages"));

    var oCompleteness = requirement.completeness;
    requirement.completeness += stepAdvance; // update requirement completion
    debug("Requirement completeness change: " + oCompleteness + " + " + stepAdvance + " = " + requirement.completeness);
}

function getResourceStepWages(resourceInstance) {
    return getResourcePeriodWages(resourceInstance) / STEPS;
}

function getResourcePeriodWages(resourceInstance) {
    var timeUnit = Variable.findByName(gm, "timeUnit").getValue(self),
        activityRate = resourceInstance.getPropertyD("activityRate"),
        wages = resourceInstance.getPropertyD("wage") * activityRate / 100.0;

    if (timeUnit == "week") { // Do not use === 
        wages /= 4.0;
    }
    return wages;
}


/**
 * Return a random factor based on properties 'randomDurationSup' and 'randomDurationInf'
 * of the given task.
 * @param {TaskInstance} task
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
    if (randomFactor < MIN_TASK_DURATION) {
        randomFactor = MIN_TASK_DURATION;
    }

    return getFloat((task.duration / randomFactor), 2);
}

/**
 * Calculate the current quality of the task based on the average of the quality
 *  in each bound requirement and weighted by the progression of its cmpleteness.
 * @param {TaskInstance} taskInst
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
 * Return a name for each step.
 * @param {Number} step
 * @returns {String} the name of the step
 */
function getStepName(step) {
    var timeUnit = Variable.findByName(gm, "timeUnit").getValue(self);
    if (timeUnit == "week") { // DO NOT USE === 
        return I18n_t("date.formatter.weekday", {
            day: I18n_t("date.weekday." + WEEKDAY_KEY[parseInt(step / 2)]),
            ampm: (step % 2 === 0 ? I18n_t("date.am") : I18n_t("date.pm"))
        });
    } else {
        var period = Variable.findByName(gm, "periodPhase3").getValue(self),
            month = I18n_t("date.month." + MONTH_KEY[period % 12]),
            day = step * 3 + 1;

        return I18n_t("date.formatter.date", {day: day, month: month});
    }
}

/**
 * function to know if an employee is working on the task.
 * A employee working on task mean that he works the period before (currentPeriodNumber -1)
 * @param {ResourceDescriptor} employee
 * @param {TaskDescriptor} task
 * @returns Boolean true if works on project
 */
function workOnTask(employee, task) {
    return Y.Array.find(employee.getInstance(self).activities, function(a) {
        return a.time === currentPeriodNumber - 1
            && task.id === a.taskDescriptorId;
    });
}

/**
 * Check if a ressource work on the project
 * @param {ResourceInstance} employeeInst
 * @return true if work on project
 */
function workOnProject(employeeInst) {
    return Y.Array.find(employeeInst.activities, function(a) {
        return !isCompleted(a.taskDescriptor);
    })
        && Y.Array.find(employeeInst.occupations, function(o) {                 // Check if has an occupation for the futur
            return o.time >= currentPeriodNumber;
        });
}

/**
 * Send a message to the current player.
 * @param {String} subject the subject of the message.
 * @param {String} content the content of the message.
 * @param {String} from the sender of the message.
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
