/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */


/**
 * PMGHelper module contains PMG related utility function
 * 
 * @fileoverview
 * 
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */
/*global Variable, gameModel, self, Y, PMGSimulation, debug, I18n */
var PMGHelper = (function() {
    "use strict";

    var defaultPhaseNames = ["Initiation", "Planning", "Execution", "Closing"];

    /**
     * Return the automatic planning setting 
     * Such a setting is given by the "autoReservation" bln variable
     */
    function automatedReservation() {
        var autoDesc;
        try {
            autoDesc = Variable.findByName(gameModel, "autoReservation");
        } catch (e) {
            autoDesc = false;
        }

// Automatic means the descriptor exists and its value is TRUE
        return autoDesc && autoDesc.getValue(self);
    }


    /**
     * function to know if an employee is working on the task.
     * A employee working on task mean that he works the period before (currentPeriodNumber -1)
     * @param {ResourceDescriptor} resourceDescriptor
     * @param {TaskDescriptor} task
     * @returns Boolean true if works on project
     */
    function workOnTask(resourceDescriptor, task) {
        var currentPeriodNumber = getCurrentPeriodNumber();
        return Y.Array.find(resourceDescriptor.getInstance(self).activities, function(a) {
            return a.time === currentPeriodNumber - 1
                && task.id === a.taskDescriptorId;
        });
    }

    /**
     * Check if a ressource is working on the project
     *  -> MUST have assignment(s)
     *  -> MUST be reserved for the current period
     * 
     * @param {type} resourceDescriptor
     * @returns {Boolean}
     */
    function workOnProject(resourceDescriptor) {
        return isReservedToWork(resourceDescriptor) && resourceDescriptor.getInstance(self).assignments.size() > 0;
    }


    /**
     * Check if a ressource will work on the project
     * @param {ResourceDescriptor} resourceDescriptor
     * @return true if work on project
     */
    function willWorkOnProject(resourceDescriptor) {
        var rInst = resourceDescriptor.getInstance(self),
            currentPeriodNumber = getCurrentPeriodNumber();
        return Y.Array.find(rInst.assignments, function(a) {
            return !isCompleted(a.taskDescriptor);
        })
            && (automatedReservation() || Y.Array.find(rInst.occupations, function(o) { // Check if has an occupation for the futur
                return o.time >= currentPeriodNumber;
            }));
    }

    /**
     * Check if the given resource will work on the project for the given phase 3 period
     * 
     * If 'period' not specified
     *   a) use the first period of stage 3 if current phase < 3
     *   b) use the current period is current phase == 3
     *   c) return false is current phase = 4
     *   
     * if current phase is 4, return false
     * 
     *  in automatic mode:
     *      the resource will always work unless it's unavailable (i.e. current occupation not editable)
     *  in manual mode:
     *      the resource must have an editable occupation for the current time (i.e has been reseved by the player)
     *  
     *  In all case, the resource must be active
     *  
     * @param {RessourceDescriptor} rd
     * @param {Number} period (optional) the period number or the current period (default)
     * @returns {Boolean} is reserved
     */
    function isReservedToWork(rd, period) {
        var employeeInst = rd.getInstance(self);

        // Inactive resource never work, such as those with 0% activity rate
        if (!employeeInst.getActive() || employeeInst.getPropertyD("activityRate") < 1.0) {
            return false;
        }

        if (!period) {
            switch (getCurrentPhaseNumber()) {
                case 1:
                case 2:
                    // first period of third stage
                    period = 1;
                    break;
                case 3:
                    // current period of third phase
                    period = getCurrentPeriodNumber();
                    break;
                case 4:
                default:
                    return false; // no-one is working in phase 4
            }
        }
        debug("isReservedToWork (rd: " + rd + "; p:" + period + ")");

        if (!automatedReservation()) {
            /* MANUAL
             * the resource must be reserved.
             * it means that an "editable" occupation must exists for the current time
             */
            return (Y.Array.find(employeeInst.occupations, function(o) {
                debug(" o.editable ? time: " + o.time + " period: " + period + " editable:  " + o.editable);
                return o.time === period
                    && o.editable;
            }) === null ? false : true);
        } else {
            /* AUTOMATIC
             * The resource is always reserved unless
             * it has an "uneditable" occupation for the current period
             */
            return !Y.Array.find(employeeInst.occupations, function(o) {
                debug(" !o.editable ? time: " + o.time + " period: " + period + " editable:  " + o.editable);
                return o.time === period
                    && !o.editable; // Illness, etc. occupations are not editable
            });
        }
    }

    /**
     * Send a message to the current player.
     * @param {String} subject the subject of the message.
     * @param {String} content the content of the message.
     * @param {String} from the sender of the message.
     * @param {Array}  att attachement list
     */
    function sendMessage(subject, content, from, att) {
        att = att || [];
        Variable.find(gameModel, "inbox").sendDatedMessage(self, from, getCurrentPeriodFullName(), subject, content, att);
    }

    function sendHistory(from, title, msg) {
        Variable.find(gameModel, "history").sendDatedMessage(self, from, getCurrentPeriodFullName(), title, msg);
    }

    /**
     * 
     * @returns {NumberDescriptor} current phase descriptor
     */
    function getCurrentPhase() {
        return Variable.findByName(gameModel, "currentPhase");
    }

    /**
     * 
     * @returns {Number} current phase number
     */
    function getCurrentPhaseNumber() {
        return getCurrentPhase().getValue(self);
    }


    /**
     * 
     * @returns {NumberDescriptor} the currentPeriod descriptor
     */
    function getCurrentPeriod() {
        var currentPhase = getCurrentPhaseNumber(),
            periods = Variable.findByName(gameModel, "currentPeriod");
        if (periods !== null && currentPhase !== null) {
            return periods.items.get(currentPhase - 1);
        }
        return null;
    }


    function getCurrentPeriodNumber() {
        return getCurrentPeriod().getValue(self);
    }

    function getCurrentPhaseName() {
        var pNum = getCurrentPhaseNumber();
        try {
            return Variable.findByName(gameModel, "phase" + pNum + "Name").getValue(self);
        } catch (e) {
            return defaultPhaseNames[pNum - 1];
        }
    }

    function getCurrentPeriodFullName() {
        return getCurrentPhaseName() + "." + getCurrentPeriod().getValue(self);
    }

    function addImpactDuration(name, method, args, inTime) { // Helper
        var factorsDesc = Variable.findByName(gameModel, "factors"),
            currentTime = Variable.findByName(gameModel, "currentTime").getInstance().getValue(),
            endTim = inTime + currentTime,
            object = {
                n: name,
                m: method,
                a: args,
                t: endTim
            };
        factorsDesc.setProperty(self, Date.now(), JSON.stringify(object));
    }

    function cancelEffect() {
        var factorsDesc = Variable.findByName(gameModel, "factors"),
            propertiesKey = Java.from(factorsDesc.getInstance().getProperties().keySet()), i,
            currentTime = Variable.findByName(gameModel, "currentTime").getInstance().getValue(), object,
            args;
        for (i = 0; i < propertiesKey.length; i += 1) {
            object = JSON.parse(factorsDesc.getProperty(self, propertiesKey[i]));
            args = JSON.stringify(object.a).substr(1, JSON.stringify(object.a).length - 2);
            if (currentTime === object.t) {
                eval("Variable.find(gameModel, '" + object.n + "')." + object.m + "(self, " + args + ")");
                factorsDesc.removeProperty(self, propertiesKey[i]);
            }
        }
    }

    function updateBAC(taskName, value) {
        Variable.findByName(self.getGameModel(), taskName).getInstance(self).setProperty('bac', value);
        PMGSimulation.plannedValueHistory();
    }

    /**
     * Check if all active task is complete (Completeness > 100).
     * @returns {Boolean} true if the project is ended
     */
    function checkEndOfProject() {
        debug("CheckEndOfProject");
        return !Y.Array.find(Variable.findByName(gameModel, 'tasks').items, function(t) {
            var ti = t.getInstance(self);
            debug("ti: " + ti + "(" + ti.active + ")");
            return ti.active && !isTaskInstanceCompleted(ti);
        });
    }


    function isTaskInstanceCompleted(taskInstance) {
        debug("Completed (I) : " + taskInstance.getPropertyD("completeness"));
        return taskInstance.getPropertyD("completeness") >= 100;
    }

    function isTaskCompleted(taskDescriptor) {
        return isTaskInstanceCompleted(taskDescriptor.getInstance(self));
    }


    function sendManual() {
        var phaseNumber = PMGHelper.getCurrentPhaseNumber(),
            auto = PMGHelper.automatedReservation(),
            lang = I18n.lang(),
            file, autoSuf = (auto ? "aut" : "man");

        switch (phaseNumber) {
            case 1:
                file = "AvantProjet_" + lang + ".pdf";
                break;
            case 2:
                file = "Planification_" + autoSuf + "_" + lang + ".pdf";
                break;
            case 3:
                file = "Realisation_" + autoSuf + "_" + lang + ".pdf";
                break;
            default:
                file = null;
                break;
        }

        if (file) {
            Variable.findByName(gameModel, "news").sendDatedMessage(self, I18n.t("messages.manual.from"),
                getCurrentPeriodFullName(), I18n.t("messages.manual.subject", {
                phase: getCurrentPhaseName()
            }), I18n.t("messages.manual.content", {
                phase: getCurrentPhaseName(),
                href: "http://www.albasim.ch/wp-content/uploads/" + file
            }), []);
        }
    }


    return {
        automatedReservation: function() {
            return automatedReservation();
        },
        sendMessage: function(from, subject, content, att) {                    // Impact OK
            return sendMessage(subject, content, from, att);
        },
        sendHistory: function(from, title, message) {
            return sendHistory(from, title, message);
        },
        workOnProject: function(resourceDescriptor) {                           // Condition
            return workOnProject(resourceDescriptor);
        },
        workOnProjectByName: function(resourceName) {                           // Condition
            return workOnProject(Variable.findByName(gameModel, resourceName));
        },
        willWorkOnProject: function(resourceDescriptor) {                           // Condition
            return willWorkOnProject(resourceDescriptor);
        },
        willWorkOnProjectByName: function(resourceName) {                           // Condition
            return willWorkOnProject(Variable.findByName(gameModel, resourceName));
        },
        workOnTask: function(resourceDescriptor, taskDescriptor) {              // Condition
            return workOnTask(resourceDescriptor, taskDescriptor);
        },
        isReservedToWork: function(resourceDescriptor, period) {
            return isReservedToWork(resourceDescriptor, period);
        },
        getCurrentPhase: function() {
            return getCurrentPhase();
        },
        getCurrentPhaseNumber: function() {                                     // Condition
            return getCurrentPhaseNumber();
        },
        getCurrentPeriod: function() {
            return getCurrentPeriod();
        },
        getCurrentPeriodNumber: function() {                                    // Condition
            return getCurrentPeriodNumber();
        },
        getCurrentPeriodFullName: function() {
            return getCurrentPeriodFullName();
        },
        addImpactDuration: function(name, method, args, inTime) {               // Impact OK
            return addImpactDuration(name, method, args, inTime);
        },
        addNumberImpactDuration: addImpactDuration, // Duplicate for wysiwyg
        addResourceImpactDuration: addImpactDuration, // Duplicate for wysiwyg
        cancelEffect: function() {
            cancelEffect();
        },
        updateBAC: function(taskName, value) {
            updateBAC(taskName, value);
        },
        checkEndOfProject: function() {                                         // Condition
            return checkEndOfProject();
        },
        isTaskCompleted: function(taskDescriptor) {                             // Condition
            return isTaskCompleted(taskDescriptor);
        },
        isTaskInstanceCompleted: function(taskInstance) {
            return isTaskInstanceCompleted(taskInstance);
        },
        sendManual: function() {
            return sendManual();
        }
    };

}());
