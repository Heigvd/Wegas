/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */


/**
 * @fileoverview
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 *
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */

/*global Java, Event, ErrorManager, PMGHelper, Variable, debug, self, gameModel, Y, I18n, lookupBean */

var PMGSimulation = (function() {
    "use strict";

    var taskTable, resourceTable, iterationTable, // To store various variables throughout the steps
        CURRENT_PERIOD_NUMBER,
        CURRENT_PHASE_NUMBER,
        GANTT = null,
        AUTOMATED_RESERVATION = false,
        STEPS = 10,
        MIN_TASK_DURATION = 0.1,
        TASK_COMPLETED_AT = 97,
        mails = {};

    /**
     * Divide period in steps (see global variable).
     * Call function step at each step.
     */
    function runSimulation() {
        var i, activeTasks = getActiveTasks(), iterations = getIterations(), iteration;
        AUTOMATED_RESERVATION = PMGHelper.automatedReservation();

        // Init tables
        CURRENT_PERIOD_NUMBER = PMGHelper.getCurrentPeriodNumber();
        if (AUTOMATED_RESERVATION) {
            GANTT = PMGHelper.computePert();
        }
        debug("runSimulation(currentPeriodNumber: " + CURRENT_PERIOD_NUMBER + ")");
        resourceTable = {};
        iterationTable = {};
        taskTable = {};
        debug("runSimulation::fillTaskTable");
        for (i = 0; i < activeTasks.length; i += 1) {
            taskTable[activeTasks[i].descriptor.name] = {
                completeness: activeTasks[i].getPropertyD("completeness"),
                randomFactor: getRandomFactorFromTask(activeTasks[i])
            };
        }

        // Init Iteration Status Table
        debug("runSimulation::fillIterationTable");
        for (i = 0; i < iterations.length; i += 1) {
            iteration = iterations[i];
            iterationTable[iteration.id] = PMGHelper.getIterationStatus(iteration);
            iterationTable[iteration.id].spent = 0;
            iterationTable[iteration.id].lastWorkedStep = 0;
        }

        // Calculus
        for (i = 0; i < STEPS; i += 1) {
            step(i);
        }

        debug("All Step Computed");
        closePeriod();
    }

    function updateIterationPlanning(iteration) {
        var remainingWL = iterationTable[iteration.id].final.remainingWorkload,
            replannedWL = iteration.getReplannedWorkloads(),
            remainingPlannedWL = 0, i, keys, diff, k, planned, nPlanned, toRemove = [];

        keys = Y.Object.keys(replannedWL);
        for (k in keys) {
            k = keys[k];
            if (k <= CURRENT_PERIOD_NUMBER) {
                // destory the past
                iteration.replan(k, 0);
            } else {
                remainingPlannedWL += replannedWL[k];
            }
        }

        // too much planned, cut the planning
        if (remainingPlannedWL > remainingWL) {
            keys = Y.Object.keys(replannedWL).sort(function(a, b) {
                return a > b;
            });

            diff = remainingWL - remainingPlannedWL;

            for (i = 0; diff > 0; i += 1) {
                debug("Diff: " + diff);
                k = keys[i];
                planned = replannedWL[k];
                nPlanned = Math.min(planned, diff);
                debug("planed: " + planned);
                debug("nPlaned: " + nPlanned);
                if (nPlanned > 0.0) {
                    iteration.replan(k, nPlanned);
                } else {
                    debug("remove replanned for " + k);
                    replannedWL.remove(k);
                }
                diff -= nPlanned;
            }
        }
    }

    function updateIterations() {
        var i, iterations = getIterations(), iteration, finalStatus,
            pwls, rpwls, k, workloads, spent;
        for (i = 0; i < iterations.length; i += 1) {
            iteration = iterations[i];
            finalStatus = PMGHelper.getIterationStatus(iteration);
            iterationTable[iteration.id].final = finalStatus;
            spent = iterationTable[iteration.id].spent;
            if (finalStatus.status === "NOT_STARTED") {
                // CASE I NOT_STARTED
            } else if (finalStatus.status === "STARTED") {
                if (iterationTable[iteration.id].status === "NOT_STARTED") {
                    // CASE II JUST STARTED
                    iteration.setTotalWorkload(iterationTable[iteration.id].remainingWorkload);
                    iteration.addWorkload(CURRENT_PERIOD_NUMBER, iteration.getTotalWorkload(), 0);
                    rpwls = iteration.getReplannedWorkloads();
                    pwls = iteration.getPlannedWorkloads();

                    for (k in pwls) {
                        debug("INITIALIZE replanning: " + k);
                        // first planned period is the current period, lets ignore it
                        if (k > 0) {
                            iteration.replan(CURRENT_PERIOD_NUMBER + k, pwls[k]);
                        }
                    }
                } else {
                    // CASE III
                    workloads = Java.from(iteration.getWorkloads());
                    // Detect if iteration workload has changed due to player actions (impact on requirements, etc)
                    if (Math.abs(iterationTable[iteration.id].remainingWorkload - workloads[workloads.length - 1].getWorkload()) > 0.00001) {
                        iteration.addWorkload(CURRENT_PERIOD_NUMBER, iterationTable[iteration.id].remainingWorkload, 0);
                    }
                }

                // CASE II, III
                iteration.addWorkload(CURRENT_PERIOD_NUMBER + 1, iterationTable[iteration.id].final.remainingWorkload, spent);

                updateIterationPlanning(iteration);
            } else if (finalStatus.status === "COMPLETED") {
                if (iterationTable[iteration.id].status !== "COMPLETED") {
                    if (iterationTable[iteration.id].status === "NOT_STARTED") {
                        // CASE (II + IV) in one time
                        iteration.setTotalWorkload(iterationTable[iteration.id].remainingWorkload);
                        iteration.addWorkload(CURRENT_PERIOD_NUMBER, iterationTable[iteration.id].remainingWorkload, 0);
                    } else {
                        // CASE IV: JUST COMPLETED
                        workloads = Java.from(iteration.getWorkloads());
                        // Detect if iteration workload has changed due to player actions (impact on requirements, etc)
                        if (iterationTable[iteration.id].remainingWorkload !== workloads[workloads.length - 1].getWorkload()) {
                            iteration.addWorkload(CURRENT_PERIOD_NUMBER, iterationTable[iteration.id].remainingWorkload, 0);
                        }
                    }

                    iteration.addWorkload(CURRENT_PERIOD_NUMBER + 1, iterationTable[iteration.id].final.remainingWorkload,
                        spent, iterationTable[iteration.id].lastWorkedStep);
                    updateIterationPlanning(iteration);
                }
                // CASE V: COMPLETED
            }
        }
    }


    function getResourceDescriptors() {
        return flattenList(Variable.findByName(gameModel, "employees"));
    }

    /*function getInstancesFromDescriptors(descriptors) {
     return descriptors.map(function(desc) {
     desc.getInstacnce(self);
     }, this);
     }
     
     function getResourceInstances() {
     return getInstancesFromDescriptors(getResourceDescriptors());
     }*/

    function cleanAssignments(resources) {
        var i;
        for (i = 0; i < resources.length; i += 1) {
            removeAssignmentsFromCompleteTasks(resources[i].getInstance(self));
        }
    }

    function disableCurrentPhaseQuestions() {
        var i, qPhase, n, item;

        qPhase = Variable.find(gameModel, "questions").item(CURRENT_PHASE_NUMBER - 1);
        n = qPhase.getItems().size();

        for (i = 0; i < n; i += 1) {
            item = qPhase.item(i);
            if (item.getClass().getSimpleName() === "QuestionDescriptor" && item.isActive(self)) {
                item.desactivate(self);
            }
        }
    }

    function closePeriod() {
        var resources = getResourceDescriptors();

        cleanAssignments(resources);
        billUnworkedHoursForUselessResources(resources);
        updateIterations();
        updateVariables();
    }

    function billUnworkedHoursForUselessResources(resources) {
        if (!AUTOMATED_RESERVATION) {
            Y.Array.each(resources,
                function(resourceDescriptor) {
                    if (PMGHelper.isReservedToWork(resourceDescriptor, CURRENT_PERIOD_NUMBER)) {
                        var resourceInstance = resourceDescriptor.getInstance(self);
                        if (findActivitesByPeriod(resourceInstance, CURRENT_PERIOD_NUMBER).length === 0) {
                            // Useless resources -> reserved + noWork
                            addUnworkedHours(resourceInstance, 100); // for the whole period -> 100%
                            sendPlanningProblemEmail(resourceInstance);
                        }
                    }
                }, this);
        }
    }

    /**
     * 
     * Make a step 
     * 
     *  a) according to assignments, link resources to requirements 
     *  b) compute each requirement progress 
     *  c) consolidate requirement's progress within tasks
     * 
     * @param {Number} currentStep the number [0-9]
     */
    function step(currentStep) {
        debug("step(" + currentStep + ")");

        mails = {};

        // Process assignments
        var activities = assignResources(currentStep), activity;

        if (DEBUGMODE) {
            for (activity in activities) {
                debug("activity : " + activity);
            }
        }

        // Calculate progress for each requirement
        Y.Array.each(getDistinctRequirements(activities), function(r) {
            debug("step(): computeReq:" + r);
            calculateRequirementProgress(r, activities, currentStep);
        });

        // Consolidate requirments progress & quality into tasks
        Y.Array.each(getTasksFromActivities(activities), function(td) {
            var t = td.getInstance(self),
                oCompleteness = t.getProperty("completeness");
            t.setProperty("completeness", calculateTaskProgress(t));
            t.setProperty("computedQuality", calculateTaskQuality(t));
            debug("step(" + currentStep + "): Task completeness: " + oCompleteness + " => " + t.getProperty("completeness"));
            if (t.getProperty("completeness") >= 100) {
                sendEndOfTaskMail(td, currentStep);
            }
        });

        sendQueuedMails(currentStep);
    }

    /**
     * Create activities for the current step
     * 
     * @param {Number} currentStep
     * @returns {Array} an Array of Activity
     */
    function assignResources(currentStep) {
        debug("AssignResources(currentStep: " + currentStep + ", current period number: " + CURRENT_PERIOD_NUMBER + ")");
        var activities = [],
            i, resources = getResourceDescriptors();
        if (!resources) {
            return [];
        }
        for (i = 0; i < resources.length; i += 1) {
            activities.push(assignResource(currentStep, resources[i]));
        }

        debug("AssignResources(activities before filtering: " + activities + ")");
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
     * @param {Number} currentStep
     * @param {ResourceDescriptor} resourceDescriptor
     * @returns {type} return an activity or null if the resource will not work durung the step
     */
    function assignResource(currentStep, resourceDescriptor) {
        debug("AssignResource(" + resourceDescriptor + ")\n***************************");
        debug(" CurrentPeriodNumber: " + CURRENT_PERIOD_NUMBER);
        var activity = null,
            resourceInstance = resourceDescriptor.getInstance(self),
            currentAssignment, taskDesc, req, i, allAssignments, justCompletedTasks;
        if (PMGHelper.isReservedToWork(resourceDescriptor, CURRENT_PERIOD_NUMBER, GANTT)) {
            debug("   Is Reserved");
            allAssignments = resourceInstance.assignments;
            justCompletedTasks = [];
            // iterate through assigments until an activity exists
            for (i = 0; i < allAssignments.size() && !activity; i += 1) {
                currentAssignment = allAssignments.get(i);
                taskDesc = currentAssignment.taskDescriptor;
                // Only cares about uncompleted tasks
                if (!PMGHelper.isTaskCompleted(taskDesc)) {
                    req = selectRequirement(taskDesc.getInstance(self), resourceInstance);
                    if (req.requirement) {
                        if (!req.completed) {
                            if (notBlockedByPredecessors(taskDesc)) {
                                activity = getActivity(resourceInstance, taskDesc,
                                    CURRENT_PERIOD_NUMBER + currentStep / STEPS, req.requirement);
                                debug("   -> Activity");
                            } else {
                                debug("    -> BLOCKED BY PREDECESSORS");
                                if (currentStep === 0 && !AUTOMATED_RESERVATION) {
                                    sendBlockedByPredecessorsMail(resourceInstance, taskDesc);
                                }
                            }
                        } else {
                            debug("   -> WORK FINISHED ");
                            sendSkillCompletedMail(resourceInstance, taskDesc);
                            allAssignments.remove(i);
                        }
                    } else {
                        debug("   -> NOT MY WORK req not found...");
                        sendNotMyWorkMail(resourceInstance, taskDesc);
                        allAssignments.remove(i);
                        // dont work this step -> bill
                        addUnworkedHours(resourceInstance, 10); // Limit 10% -> a step
                        break; // stop looking for an activity
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
                        if (!findActivityByTaskAndPeriod(resourceInstance, activity.taskDescriptor, CURRENT_PERIOD_NUMBER - 1)) {
                            debug("New Activity: " + activity);
                            sendStartWorkingOnTaskMail(resourceInstance, activity.taskDescriptor);
                        } else {
                            debug("Continue on activity from previous period: " + activity);
                        }
                    } else {
                        debug("Continue on activity from previous step: " + activity);
                    }
                }
            } else {
                if (activity) {
                    // task have been completed during the previous step -> tracking-message
                    //sendGoToNextTaskMail(resourceInstance, currentStep, justCompletedTasks[0], activity.taskDescriptor);
                    queueMail("endOfTaskSwitchToNew", resourceInstance, justCompletedTasks[0], activity.taskDescriptor);
                } else {
                    // No more workable tasks for the resource message
                    sendGoToOtherActivities(resourceInstance, justCompletedTasks[0]);
                }
            }
        }
        removeAssignmentsFromCompleteTasks(resourceInstance);
        if (activity) {
            activity.setTime(CURRENT_PERIOD_NUMBER + currentStep / STEPS);
        }
        debug("**************");
        return activity;
    }

    function sumRequierementsQuantities(requirements) {
        return Y.Array.sum(requirements, function(r) {
            return (r.quantity > 0 ? r.quantity : 0);
        });
    }

    /**
     * 
     * @param {type} taskInst
     * @returns {Number}
     */
    function calculateTaskProgress(taskInst) {
        var nbWork = sumRequierementsQuantities(taskInst.requirements),
            skillsOverview = getSkillsOverview(taskInst),
            taskProgress = 0,
            skill;
        for (skill in skillsOverview) {
            taskProgress += skillsOverview[skill].completenessXquantity;
        }

        taskProgress = taskProgress / nbWork;
        if (taskProgress > 0.0 && taskProgress < 1) {
            taskProgress = 1; // Avoid >0 to be round to 0
        }

        return (taskProgress > TASK_COMPLETED_AT) ? 100 : taskProgress; // > 97 yes, don't frustrate the players please.
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
        for (i = 0; i < taskInst.plannification.size() && i <= CURRENT_PERIOD_NUMBER; i += 1) {
            if (parseInt(taskInst.plannification.get(i), 10) > -1) {
                pastPeriods += 1;
            }
        }
        return (pastPeriods / taskInst.plannification.size()) * 100;
    }

    /**
     * Extract tasks from activities
     * 
     * @param {Array} activities
     * @returns {Array} list of unique tasks 
     */
    function getTasksFromActivities(activities) {
        return Y.Array.unique(activities.map(function(a) {
            return a.taskDescriptor;
        }));
    }

    /**
     * 
     * @returns {Array} List of iterations
     */
    function getIterations() {
        return Java.from(Variable.findByName(gameModel, "burndown").getInstance().getIterations());
    }

    /**
     *  Simply retrieve the list of active tasks.
     */
    function getActiveTasks() {
        return Java.from(Variable.findByName(gameModel, "tasks").items).map(function(t) {
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
            activity.setTime(-1); // @hack -1 means the activity has just been created
        } else {
            debug("               Existing activity for " + resource.name + ": " + activity);
        }
        activity.setRequirement(req);
        debug("GetActivity(" + activity + ")");
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
        }, percentToBill = Math.min(status.maxUnworkedHoursPercent, limit),
            projectUHDesc = Variable.findByName(gameModel, 'projectUnworkedHours'),
            projectUh = projectUHDesc.getValue(self);
        percentToBill = Math.max(percentToBill - status.currentUnworkedHoursPercent, 0);
        status.currentUnworkedHoursPercent += percentToBill;
        projectUh += getResourcePeriodWages(resourceInst) * percentToBill / 100;
        projectUHDesc.setValue(self, projectUh);
    }

    /*
     * 
     */

    function removeAssignment(resourceInstance, assignment) {
        resourceInstance.assignments.remove(assignment);
    }

    /**
     * When the task is complete remove (definitivly) all assignments from this task.
     * @param {ResourceInstance} employeeInst
     */
    function removeAssignmentsFromCompleteTasks(employeeInst) {
        debug("removeAssignmentsFromCompleteTasks");
        var i, assignment, toRemove = [];
        for (i = 0; i < employeeInst.assignments.size(); i += 1) {
            assignment = employeeInst.assignments.get(i);
            if (PMGHelper.isTaskCompleted(assignment.taskDescriptor)) {
                toRemove.push(assignment);
            }
        }

        Y.Array.each(toRemove, function(a) {
            removeAssignment(employeeInst, a);
        });
    }

    function getResourceSkillName(resourceInstance) {
        try {
            return Variable.findParentListDescriptor(resourceInstance.getDescriptor()).getName();
        } catch (e) {
            return null;
        }
    }

    function getResourceGrade(resourceInstance) {
        return resourceInstance.getPropertyD("level");
    }

    /**
     * return the most adapted (i.e closest accodring to levels) requirement
     * 
     * @param {type} taskInst
     * @param {type} resourceInst
     * @returns {WRequirement} the selected (most adapted) requierement
     */
    function selectRequirement(taskInst, resourceInst) {
        var skill = getResourceSkillName(resourceInst),
            grade = getResourceGrade(resourceInst),
            overview = getSkillsOverview(taskInst),
            nbRequiredResourceInTask, ski, d, req, i,
            selectedReq, completedReq, deltaLevel;

        debug("selectRequirement(" + taskInst + "," + resourceInst + ", mainSkill: " + skill + ")");

        // Be sure current tast requiere resource skill
        if (overview[skill]) {
            nbRequiredResourceInTask = 0;
            selectedReq = null;
            completedReq = null;
            deltaLevel = 1000;
            for (ski in overview) {
                nbRequiredResourceInTask += overview[ski].quantity;
            }
            for (i = 0; i < taskInst.requirements.size(); i += 1) {
                req = taskInst.requirements.get(i);
                d = Math.abs(grade - req.level);
                if (req.work == skill) {
                    if (deltaLevel > d && req.quantity > 0) {
                        // Still work to do
                        if (req.completeness < overview[skill].maxLimit * nbRequiredResourceInTask / overview[skill].quantity) {
                            deltaLevel = d;
                            selectedReq = req;
                        } else {
                            completedReq = req;
                        }
                    }
                }
            }
            if (selectedReq && !selectedReq.getTaskInstance()) {
                debug("ERROR ORPHAN REQUIREMENT " + selectedReq + "(" + selectedReq.id + ")");
            }
            if (selectedReq) {
                return {
                    requirement: selectedReq,
                    completed: false
                };
            } else if (completedReq) {
                return {
                    requirement: completedReq,
                    completed: true
                };
            }
        }

        return {
            requirement: null,
            completed: false
        };
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
            return activity.taskDescriptor === taskDesc && // If the task of activity match with the given task (same task and same employee == same activity)
                period !== Math.floor(period) && // if it s not a new period (current step !== 0)
                activity.time === getFloat(period - 0.1); // if activity was used the last step
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
        return Java.from(employeeInst.activities).filter(function(activity) {
            return Math.floor(activity.time) === Math.floor(period);
        });
    }

    function findActivityByTaskAndPeriod(employeeInst, taskDesc, period) {
        debug("Find activity by period for " + employeeInst + " :: " + taskDesc + "; period: " + period);
        return Y.Array.find(employeeInst.activities, function(activity) {
            return activity.taskDescriptor === taskDesc &&
                Math.floor(activity.time) === Math.floor(period);
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
            return activity.taskDescriptor === taskDesc && //if the task of activity match with the given task (same task and same employee == same activity)
                CURRENT_PERIOD_NUMBER > activity.time;
        });
    }

    function notBlockedByPredecessors(taskDescriptor) {
        if (AUTOMATED_RESERVATION) {
            return getPredecessorFactor(taskDescriptor) >= 0.85;
        } else {
            return getPredecessorFactor(taskDescriptor) >= 0.25;
        }
    }

    /**
     * @deprecated useless
     * @param {type} assigment
     * @returns {Boolean}
     */
    function isAssignable(assigment) {
        return !PMGHelper.isTaskCompleted(assigment.taskDescriptor) &&
            notBlockedByPredecessors(assigment.taskDescriptor);
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
            totalOfPersonneInTask = sumRequierementsQuantities(taskInstance.requirements);
        //return (skillOverview && skillOverview.completeness >= skillOverview.maxLimit * totalOfPersonneInTask / skillOverview.quantity);
        return (skillOverview && skillOverview.completenessXquantity >= skillOverview.maxLimit * totalOfPersonneInTask);
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
        var i, req, work, works = {}, effectiveQuantity,
            requirements = taskInstance.requirements;
        debug("getSkillsOverview() req: " + requirements);

        for (i = 0; i < requirements.size(); i += 1) {
            req = requirements.get(i);
            //keep an occurance of each kind of work needed
            work = works[req.work] = works[req.work] || {
                maxLimit: 0,
                typesOfLevels: [],
                completeness: 0,
                quantity: 0,
                completenessXquantity: 0
            };
            //keep the highest limit of all limits from each kind of work needed
            effectiveQuantity = (req.quantity > 0 ? req.quantity : 0);
            work.maxLimit = Math.max(work.maxLimit, req.limit);
            work.quantity += effectiveQuantity;
            work.completeness += req.completeness;
            work.completenessXquantity += effectiveQuantity * req.completeness;
        }

        for (work in works) {
            works[work].weightedCompleteness = works[work].completenessXquantity / works[work].quantity;
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
    function calculateRequirementProgress(requirement, allActivities, stepNumber) {
        debug("calculateRequirementProgress(requirement: " + requirement + ", task: " + requirement.getTaskInstance() + ")");
        var i, employeeInst, activityRate, averageSkillsetQuality, correctedRessources,
            taskInst = requirement.getTaskInstance(),
            taskDesc = taskInst.getDescriptor(),
            stepAdvance = 1 / (STEPS * taskInst.getPropertyD("duration")),
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
            totalOfEmployees = sumRequierementsQuantities(taskInst.requirements),
            grade,
            iteration;

        debug("baseAdvance : " + stepAdvance + ", #sameNeedActivities: " + effectiveTotalOfEmployees);
        // Iterate through resources to sum various factor components
        for (i = 0; i < effectiveTotalOfEmployees; i += 1) {
            employeeInst = sameNeedActivities[i].resourceInstance;
            activityRate = employeeInst.getPropertyD("activityRate");
            grade = getResourceGrade(employeeInst);
            sumActivityRate += activityRate;
            //Calculate ressource motivation factor
            employeesMotivationFactor = 1 + 0.05 * employeeInst.descriptor.getPropertyD("coef_moral") * (employeeInst.getPropertyD("motivation") - 7);
            //Calcul variables for needMotivationFactor (numérateur de la moyenne pondérée de facteur motivation besoin)
            sumEmployeesMotivationXActivityRate += employeesMotivationFactor * activityRate;
            //debug("employeesMotivationFactor : " + employeesMotivationFactor);

            //Calcul variables for skill factor
            var deltaLevel = parseInt(grade) - requirement.level,
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
            sumMotivationXActivityRate += employeeInst.getPropertyD("motivation") * activityRate;
            sumSkillsetXActivityRate += grade * activityRate; //level * activityRate
        }

        if (sumActivityRate !== 0) {
            stepAdvance *= sumEmployeesMotivationXActivityRate / sumActivityRate; //needMotivationFactor (facteur motivation besoin)
            debug("facteur motivation besoin: " + sumEmployeesMotivationXActivityRate / sumActivityRate + ", sumActivityRate:" + sumActivityRate + ", employeesMotivationXActivityRate: " + sumEmployeesMotivationXActivityRate);
            stepAdvance *= sumEmployeesSkillsetXActivityRate / sumActivityRate; //needSkillsetFactor (facteur compétence besoin)  
            debug("facteur competence besoin : " + sumEmployeesSkillsetXActivityRate / sumActivityRate + ", sumActivityRate : " + sumActivityRate + ", sumEemployeesSkillsetXActivityRate: " + sumEmployeesSkillsetXActivityRate);
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

        //if (work.completeness >= work.quantity * 100) {      // Other work factor 
        if (work.weightedCompleteness >= 100) {      // Other work factor 
            //debug("otherWorkFactor : 0.8, stepAdvance: " + stepAdvance + ", work.quantity: " + work.quantity + ", totalOfEmployees: " + totalOfEmployees + ", work.completeness:" + work.completeness);
            debug("otherWorkFactor : 0.8, stepAdvance: " + stepAdvance + ", work.weightedCompleteness: " + work.weightedCompleteness);
            stepAdvance *= 0.8;
        } else {
            debug("otherWorkFactor : 1, work.weightedCompleteness: " + work.weightedCompleteness);
        }

        stepAdvance *= taskTable[taskDesc.name].randomFactor; // Random factor 
        debug("randomFactor : " + taskTable[taskDesc.name].randomFactor + " , stepAdvance: " + stepAdvance);

        //calculate learnFactor
        if (taskTable[taskDesc.name].completeness > 15 && !PMGHelper.workOnTask(employeeInst.descriptor, taskDesc)) {
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

        // sum spent workload

        debug("iterationSpentWorkload");
        iteration = PMGHelper.getIterationFromTask(taskDesc, Variable.find(gameModel, "burndown").getInstance(self));
        if (iteration && iterationTable[iteration.id]) {
            iterationTable[iteration.id].spent += sumActivityRate / (100 * STEPS);
            iterationTable[iteration.id].lastWorkedStep = stepNumber;
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
        var timeUnit = Variable.findByName(gameModel, "timeUnit").getValue(self),
            activityRate = resourceInstance.getPropertyD("activityRate"),
            wages = resourceInstance.getPropertyD("wage") * activityRate / 100.0;
        if (timeUnit == "week") { // Do not use === 
            wages /= 4.0;
        }
        return wages;
    }

    /**
     * return number if its value in [minValue; maxValue], 
     * return the broken bound otherwise
     * 
     * @param {number} number value to bound
     * @param {number} minValue minimum returned value
     * @param {number} maxValue maximum returned value
     * @returns {number}
     */
    function bound(number, minValue, maxValue) {
        if (number < minValue) {
            return minValue;
        } else if (number > maxValue) {
            return maxValue;
        } else {
            return number;
        }
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

            // Make sure coeff dont break bounds
            randomDurationSup = bound(task.getPropertyD("randomDurationSup"), 0, 4),
            randomDurationInf = bound(task.getPropertyD("randomDurationInf"), 0, 4);

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

        randomFactor = task.getPropertyD("duration") + delta;
        if (randomFactor < MIN_TASK_DURATION) {
            randomFactor = MIN_TASK_DURATION;
        }

        return task.getPropertyD("duration") / randomFactor;
    }

    /**
     * Calculate the current quality of the task based on the average of the quality
     *  in each bound requirement and weighted by the progression of its cmpleteness.
     * @param {TaskInstance} taskInst
     * @returns {Number} a number btween 0 and 200
     */
    function calculateTaskQuality(taskInst) {
        var i, req, needQualityXNeedProgress = 0, needProgress = 0;
        for (i = 0; i < taskInst.requirements.size(); i += 1) {
            req = taskInst.requirements.get(i);
            needQualityXNeedProgress += req.quality * req.completeness;
            needProgress += req.completeness;
        }
        return needQualityXNeedProgress / needProgress;
    }

    /**
     * Return a name for each step.
     * @param {Number} step
     * @returns {String} the name of the step
     */
    function getStepName(step) {
        var timeUnit = Variable.findByName(gameModel, "timeUnit").getValue(self);
        if (timeUnit == "week") { // DO NOT USE === 
            return I18n.t("date.formatter.weekday", {
                day: I18n.t("date.weekday.day" + parseInt((step + 2) / 2)),
                ampm: (step % 2 === 0 ? I18n.t("date.am") : I18n.t("date.pm"))
            });
        } else {
            var period = Variable.findByName(gameModel, "periodPhase3").getValue(self),
                month = I18n.t("date.month.month" + (period % 12)),
                day = step * 3 + 1;
            return I18n.t("date.formatter.date", {day: day, month: month});
        }
    }

    /**
     * Call all necessary method to pass a period and calculate all variable.
     * set phase (if period egal max period) and set period.
     * if enter in phase 2, change pageGantt and pageTask then call function setWeekliesVariables
     * to calculate values like gauges and EV, AC, ...
     * if period is passed in phase realisation, calculate task progress (call
     *  function completeRealizationPeriod) and check the end of the project (if true, pass to phase 4).
     */
    function nextPeriod() {
        CURRENT_PERIOD_NUMBER = PMGHelper.getCurrentPeriodNumber();
        CURRENT_PHASE_NUMBER = PMGHelper.getCurrentPhaseNumber();
        var currentPhase = PMGHelper.getCurrentPhase(),
            currentPeriod = PMGHelper.getCurrentPeriod();

        assertAllPeriodQuestionAnswered();                                                 // First Check if all questions are answered
        assertAdvancementLimit();

        disableCurrentPhaseQuestions();
        Variable.find(gameModel, "currentTime").add(self, 1);

        if (currentPhase.getValue(self) === 3) {                                    // If current phase is the 'realisation' phase
            if (PMGHelper.checkEndOfProject()) {                                              // If the project is over
                currentPhase.add(self, 1);
                CURRENT_PHASE_NUMBER += 1;
                Event.fire("nextPhase");
            } else {
                runSimulation();
                currentPeriod.add(self, 1);
                CURRENT_PERIOD_NUMBER += 1;
            }
        } else if (currentPeriod.getValue(self) === currentPeriod.maxValueD) {      // If end of phase
            currentPhase.add(self, 1);
            CURRENT_PHASE_NUMBER += 1;
            //currentPeriod.setValue(self, 1);                                      // Why?
            if (currentPhase.getValue(self) === 3) {                                // Execution period
                Variable.findByName(gameModel, 'ganttPage').setValue(self, 11);
                Variable.findByName(gameModel, 'taskPage').setValue(self, 12);
            }
            Event.fire("nextPhase");

        } else {                                                                    // Otherwise pass to next period
            currentPeriod.add(self, 1);
            CURRENT_PERIOD_NUMBER += 1;
        }

        Event.fire("nextWeek");
        Event.fire("nextPeriod");

        // TODO #777 shall SaveHistory each time value changed rather than store once by period (ok for the time...)
        Variable.findByName(gameModel, 'managementApproval').getInstance(self).saveHistory();
        Variable.findByName(gameModel, 'userApproval').getInstance(self).saveHistory();
    }

    /*****************************************
     *    ADVANCEMENT ASSERTS
     *****************************************/

    /**
     * Check if an advancement limit exists
     */
    function assertAdvancementLimit() {
        var phaseLimit, periodLimit, executionPeriods,
            advLimitDesc;
        try {
            advLimitDesc = Variable.find(gameModel, "advancementLimit");
        } catch (e) {
        }
        if (advLimitDesc === undefined || advLimitDesc.getValue(self)) {
            phaseLimit = Variable.find(gameModel, "phaseLimit").getValue(self);
            periodLimit = Variable.find(gameModel, "periodLimit").getValue(self);
            executionPeriods = Variable.find(gameModel, "executionPeriods").getValue(self);

            if (!(CURRENT_PHASE_NUMBER < phaseLimit) &&
                !(CURRENT_PERIOD_NUMBER < periodLimit) &&
                !(CURRENT_PHASE_NUMBER === 3 && !PMGHelper.checkEndOfProject()
                    && executionPeriods < periodLimit)) {
                ErrorManager.throwInfo(I18n.t("errors.advancementLimit"));
            }
        }
    }

    function getCurrentQuestions() {
        var i, q,
            items = [], item, itemType;

        q = Variable.find(gameModel, 'questions').item(CURRENT_PHASE_NUMBER - 1);
        if (q) {
            for (i in q.items) {
                item = q.item(i);
                itemType = item.getClass().getSimpleName();
                if (itemType === 'QuestionDescriptor') {
                    items.push(item);
                } else if (i === CURRENT_PERIOD_NUMBER - 1 && itemType === 'ListDescriptor') {
                    items = items.concat(Java.from(item.flatten()));
                }
            }
        }

        return items;
    }

    /**
     * Check if all questions from the current period are answered
     */
    function assertAllPeriodQuestionAnswered() {
        var i, question, questions, forceQuestion = Variable.findByName(gameModel, "forceQuestionReplies").getValue(self);

        if (!forceQuestion) {
            return;
        }

        questions = getCurrentQuestions();
        for (i = 0; i < questions.length; i += 1) {
            question = questions[i];
            if (!question.isReplied(self) && question.isActive(self)) {
                ErrorManager.throwWarn(I18n.t("errors.allQuestions"));
            }
        }
    }


    function plannedValueHistory() {
        var currentPeriod = Variable.find(gameModel, "periodPhase3").getValue(self),
            initialMaximum = Variable.find(gameModel, "executionPeriods").getValue(self),
            len = Math.max(currentPeriod, initialMaximum),
            pv = Variable.find(gameModel, "planedValue"),
            pvs, sum = 0,
            history = pv.getInstance(self).getHistory();

        history.clear();
        pvs = computePlannedValues(len);
        for (var i = 0; i < len; i += 1) {
            sum += pvs[i];
            history.add(sum);
        }
        if (history.size() > 0) {
            pv.setValue(self, history.get(history.size() - 1));
        }
    }

    function getCurrentPlannedValue() {
        return Y.Array.sum(computePlannedValues(Variable.find(gameModel, "periodPhase3").getValue(self)), function(pv) {
            return pv;
        }, this);
    }

    /**
     * This function calculate the planned value for a given time
     * @param {Number} maxPeriod max period number
     * @returns {Array} value consumption for each periods (do not forget to sum !)
     */
    function computePlannedValues(maxPeriod) {
        var pvs = [], i, j, tasks, task, bac, l, val, period;

        for (i = 0; i <= maxPeriod; i += 1) {
            pvs.push(0);
        }

        tasks = getActiveTasks();
        for (i = 0; i < tasks.length; i += 1) {
            task = tasks[i];
            bac = task.getPropertyD("bac");
            l = task.plannification.size();
            if (bac > 0) {
                val = bac / l;
                for (j = 0; j < l; j += 1) {
                    period = parseInt(task.plannification[j]);
                    if (period <= maxPeriod) {
                        pvs[parseInt(task.plannification[j])] += val;
                    }
                }
            }
        }
        return pvs;
    }


    /**
     * @returns {number} the last period of the project, according to GANTT planning
     */
    function getLastPlannedPeriodNumber() {
        var tasks = getActiveTasks();
        return Y.Array.reduce(tasks, 0, function(max, task) {
            return Y.Array.reduce(task.plannification,
                max, function(p, c) {
                    return (c > p ? c : p);
                });
        });
    }


    /**
     * Calculate earnedValue, actualCost, projectCompleteness, cpi, spi.
     * save histories for variable the same variable and for costs, delay and quality.
     * 
     * @returns {undefined}
     */
    function updateVariables() {
        // #777 save EVM related histories only during execution
        var i, task, employeesRequired,
            sumCompletenessXdurationXnbr = 0, // nbr => numberOfRequiredResources
            taskDuration = 0,
            sumDurationXnbr = 0, // nbr => idem
            sumRealised = 0,
            sumQualityXrealised = 0,
            costs = Variable.findByName(gameModel, 'costs'), costValue,
            delay = Variable.findByName(gameModel, 'delay'), delayValue,
            quality = Variable.findByName(gameModel, 'quality'), effectiveQuality = 100,
            earnedValue = Variable.findByName(gameModel, 'earnedValue'), ev = 0,
            actualCost = Variable.findByName(gameModel, 'actualCost'), ac = 0,
            cpi = 100, spi = 100,
            projectUnworkedHours = Variable.findByName(gameModel, 'projectUnworkedHours'),
            projectComp = Variable.findByName(gameModel, 'projectCompleteness'), projectCompleteness = 0,
            tasks = getActiveTasks(),
            completeness,
            currentPeriod3 = Variable.findByName(gameModel, 'periodPhase3').getValue(self),
            lastPlannedPeriod = getLastPlannedPeriodNumber(),
            pv = getCurrentPlannedValue();

        for (i = 0; i < tasks.length; i += 1) {
            task = tasks[i];
            completeness = task.getPropertyD('completeness');
            ev += task.getPropertyD('bac') * completeness / 100;
            //debug("ev: " + task.getPropertyD('bac') + "*" + completeness);
            employeesRequired = Y.Array.sum(task.requirements, function(r) {
                return r.quantity;
            });
            if (completeness > 0) {
                // Actual cost only cares about started tasks
                ac += task.getPropertyD('wages') + task.getPropertyD('fixedCosts') + task.getPropertyD('unworkedHoursCosts');
            }

            /* For project quality & completeness */
            taskDuration = task.getPropertyD("duration");
            sumCompletenessXdurationXnbr += completeness * taskDuration * employeesRequired;
            sumDurationXnbr += taskDuration * employeesRequired;
            sumRealised += completeness;
            // Effective task quality := computedQuality + impact's quality delta (stored as 'quality')
            sumQualityXrealised += completeness * task.getPropertyD('computedQuality') + task.getPropertyD('quality');

            // Round 
            task.setProperty("wages", Math.round(task.getPropertyD("wages")));
            task.setProperty('completeness', Math.round(task.getPropertyD('completeness')));
            task.setProperty('computedQuality', Math.round(task.getPropertyD('computedQuality')));
        }

        if (sumDurationXnbr > 0) {
            projectCompleteness = Math.floor(sumCompletenessXdurationXnbr / sumDurationXnbr);
        }

        // Quality
        if (sumRealised > 0) {
            effectiveQuality = sumQualityXrealised / sumRealised;
            // Include quality impact
            effectiveQuality += Variable.findByName(gameModel, 'qualityImpacts').getValue(self);
            effectiveQuality = Math.round(Math.min(Math.max(effectiveQuality, quality.minValueD), quality.maxValueD));
        }

        ac += projectUnworkedHours.getValue(self);


        debug("updateVariables(): pv: " + pv + ", ac: " + ac + ", ev: " + ev);

        // Costs
        if (ac > 0) {
            cpi = ev / ac * 100;
        }
        costValue = Math.min(Math.max(Math.round(cpi), costs.minValueD), costs.maxValueD);

        // Delay
        if (pv > 0) {
            if (currentPeriod3 > lastPlannedPeriod) {
                pv = pv + (pv / lastPlannedPeriod) * (currentPeriod3 - lastPlannedPeriod);
            }
            spi = ev / pv * 100;
        }
        delayValue = Math.min(Math.max(Math.round(spi), delay.minValueD), delay.maxValueD);


        projectComp.setValue(self, projectCompleteness);
        Variable.findByName(gameModel, 'cpi').setValue(self, cpi);
        Variable.findByName(gameModel, 'spi').setValue(self, spi);

        // save history of previous value and set the new one for quality, costs, delay, ev & ac
        quality.getInstance(self).saveHistory();
        quality.setValue(self, effectiveQuality);

        costs.getInstance(self).saveHistory();
        costs.setValue(self, costValue);

        delay.getInstance(self).saveHistory();
        delay.setValue(self, delayValue);

        earnedValue.getInstance(self).saveHistory();
        earnedValue.setValue(self, ev);

        actualCost.getInstance(self).saveHistory();
        actualCost.setValue(self, ac);
    }



    /*
     * 
     * TRACKIN SYSTEM EMAILS
     * **********************************************
     */

    function getSkillLabel(skillName) {
        return Variable.findByName(gameModel, skillName).getLabel();
    }


    function concatenateOthers(resourceInstances, includeSkills) {
        var result = "", i;
        for (i = resourceInstances.length - 1; i > 0; i -= 1) {
            result += resourceInstances[i].descriptor.label;
            if (includeSkills) {
                result += " (" + getSkillLabel(getResourceSkillName(resourceInstances[i])) + ")";
            }
            if (i > 1) {
                result += ", ";
            }
        }
        return result;
    }

    function getTaskLabelWithNumber(td) {
        return td.index + ". " + td.label;
    }

    // Project tracking message : end of task
    function sendEndOfTaskMail(task, currentStep) {
        var key = "endOfTask",
            taskName = getTaskLabelWithNumber(task);
        PMGHelper.sendMessage(
            I18n.t("messages." + key + ".from"),
            I18n.t("messages." + key + ".subject", {
                task: taskName
            }),
            I18n.t("messages." + key + ".content", {
                step: getStepName(currentStep),
                task: taskName
            }));
    }

    function sendPlanningProblemEmail(resourceInstance) {
        var resourceName = resourceInstance.descriptor.label,
            resourceSkill = getSkillLabel(getResourceSkillName(resourceInstance)),
            timeUnit = Variable.findByName(gameModel, "timeUnit").getValue(self),
            wholePeriod, key = "planningProblem";
        if (timeUnit == "week") {
            wholePeriod = I18n.t("date.formatter.wholeWeek");
        } else {
            wholePeriod = I18n.t("date.formatter.wholeMonth");
        }

        PMGHelper.sendMessage(
            I18n.t("messages." + key + ".from", {
                employeeName: resourceName}),
            I18n.t("messages." + key + ".subject"),
            I18n.t("messages." + key + ".content", {
                wholePeriod: wholePeriod,
                employeeName: resourceName,
                job: resourceSkill
            }));
    }


    // individial got to next task e-mail
    function sendGoToNextTaskMail(resourceInstance, currentStep, oldTask, newTask) {
        var resourceName = resourceInstance.descriptor.label,
            resourceSkill = getSkillLabel(getResourceSkillName(resourceInstance)),
            oldTaskName = getTaskLabelWithNumber(oldTask),
            newTaskName = getTaskLabelWithNumber(newTask),
            key = "endOfTaskSwitchToNew";
        PMGHelper.sendMessage(
            I18n.t("messages." + key + ".from", {
                employeeName: resourceName}),
            I18n.t("messages." + key + ".subject", {
                task: oldTaskName
            }),
            I18n.t("messages." + key + ".content", {
                step: getStepName(currentStep),
                task: oldTaskName,
                nextTask: newTaskName,
                employeeName: resourceName,
                job: resourceSkill
            }));
    }

    // individial got to next task e-mail
    function sendGroupedGoToNextTaskMail(resourceInstances, currentStep, oldTask, newTask) {
        var resourceName = resourceInstances[0].descriptor.label,
            resourceSkill = getSkillLabel(getResourceSkillName(resourceInstances[0])),
            oldTaskName = getTaskLabelWithNumber(oldTask),
            newTaskName = getTaskLabelWithNumber(newTask),
            others = concatenateOthers(resourceInstances),
            key = "endOfTaskSwitchToNew_grouped";

        PMGHelper.sendMessage(
            I18n.t("messages." + key + ".from", {
                employeeName: resourceName}),
            I18n.t("messages." + key + ".subject", {
                task: oldTaskName
            }),
            I18n.t("messages." + key + ".content", {
                step: getStepName(currentStep),
                others: others,
                task: oldTaskName,
                nextTask: newTaskName,
                employeeName: resourceName,
                job: resourceSkill
            }));
    }

    function sendGroupedEmailFromTemplate(resourceInstances, currentStep, taskDesc, key) {
        var resourceName = resourceInstances[0].descriptor.label,
            resourceSkill = getSkillLabel(getResourceSkillName(resourceInstances[0])),
            taskName = getTaskLabelWithNumber(taskDesc),
            others = concatenateOthers(resourceInstances, key !== "skillCompleted");

        key += "_grouped";

        PMGHelper.sendMessage(
            I18n.t("messages." + key + ".from", {
                employeeName: resourceName}),
            I18n.t("messages." + key + ".subject", {
                task: taskName
            }),
            I18n.t("messages." + key + ".content", {
                step: getStepName(currentStep),
                others: others,
                task: taskName,
                employeeName: resourceName,
                job: resourceSkill
            }));
    }

    function sendEmailFromTemplate(resourceInstance, currentStep, taskDesc, key) {
        var resourceName = resourceInstance.descriptor.label,
            resourceSkill = getSkillLabel(getResourceSkillName(resourceInstance)),
            taskName = getTaskLabelWithNumber(taskDesc);
        PMGHelper.sendMessage(
            I18n.t("messages." + key + ".from", {
                employeeName: resourceName}),
            I18n.t("messages." + key + ".subject", {
                task: taskName}),
            I18n.t("messages." + key + ".content", {
                step: getStepName(currentStep),
                task: taskName,
                employeeName: resourceName,
                job: resourceSkill
            }));
    }


    function groupMails(mails, getKey, thiz) {
        var lists = {}, mail, key, i;

        for (i in mails) {
            if (mails.hasOwnProperty(i)) {
                mail = mails[i];
                key = getKey.call(thiz, mail);
                if (!lists[key]) {
                    lists[key] = [];
                }
                lists[key].push(mail);
            }
        }
        return lists;
    }

    function getKeys(list, key) {
        var keys = [], i;
        for (i in list) {
            keys.push(list[i][key]);
        }
        return keys;
    }

    function sendQueuedMails(currentStep) {
        var i, key, td1, td2,
            groups, group, k;
        for (key in mails) {
            if (mails.hasOwnProperty(key)) {

                // a group is a list of mails that can be joined into a single one
                // if a group contains 1 mail, send the normal mail (1 sender)   @ TODO
                // if a group contains more mails, send its pluralized version   @ TODO
                switch (key) {
                    case "endOfTaskSwitchToNew":
                        // Group mail by T1,T2
                        groups = groupMails(mails[key], function(mail) {
                            return mail.taskD1.id + "/" + mail.taskD2.id;
                        });

                        for (i in groups) {
                            if (groups.hasOwnProperty(i)) {
                                group = groups[i];
                                td1 = group[0].taskD1;
                                td2 = group[0].taskD2;
                                if (group.length === 1) {
                                    sendGoToNextTaskMail(group[0].resourceInstance, currentStep, td1, td2);
                                    // Single 
                                } else {
                                    // Pluralized
                                    sendGroupedGoToNextTaskMail(getKeys(group, "resourceInstance"), currentStep, td1, td2);
                                }
                            }
                        }
                        break;
                    default:
                        // Group By (T)
                        groups = groupMails(mails[key], function(mail) {
                            return mail.taskD1.id;
                        });

                        for (i in groups) {
                            if (groups.hasOwnProperty(i)) {
                                group = groups[i];
                                td1 = group[0].taskD1;
                                if (group.length === 1) {
                                    // Single 
                                    sendEmailFromTemplate(group[0].resourceInstance, currentStep, td1, key);
                                } else {
                                    // Pluralized
                                    sendGroupedEmailFromTemplate(getKeys(group, "resourceInstance"), currentStep, td1, key);
                                }
                            }
                        }
                        break;
                }
            }
        }
    }

    function queueMail(key, resourceInstance, taskDesc1, taskDesc2) {
        if (!mails[key]) {
            mails[key] = [];
        }

        mails[key].push({
            resourceInstance: resourceInstance,
            taskD1: taskDesc1,
            taskD2: taskDesc2
        });
    }

    function sendStartWorkingOnTaskMail(resourceInstance, taskDesc) {
        queueMail("startOnTask", resourceInstance, taskDesc, null);
    }

    function sendGoToOtherActivities(resourceInstance, taskDesc) {
        queueMail("endOfTaskOtherActivities", resourceInstance, taskDesc, null);
    }

    function sendSkillCompletedMail(resourceInstance, taskDesc) {
        queueMail("skillCompleted", resourceInstance, taskDesc, null);
    }

    function sendNotMyWorkMail(resourceInstance, taskDesc) {
        queueMail("notMyWork", resourceInstance, taskDesc, null);
    }

    function sendBlockedByPredecessorsMail(resourceInstance, taskDesc) {
        queueMail("blockedByPredecessors", resourceInstance, taskDesc, null);
    }

    return {
        currentPlannedValue: function() {
            return getCurrentPlannedValue();
        },
        plannedValueHistory: function() {
            plannedValueHistory();
        },
        nextPeriod: function() {
            nextPeriod();
        },
        assertQuestion: function() {
            return assertAllPeriodQuestionAnswered();
        }
    };
}());
