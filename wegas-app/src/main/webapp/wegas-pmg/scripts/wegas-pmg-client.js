/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
/*global Y, app, persistence */

app.once("preRender", function() {
    var lang = Y.Wegas.Facade.Variable.cache.find("name", "language").getValue();
    Y.Wegas.I18n.setLang(lang);
    Y.use("wegas-i18n-pmg-" + lang);
});


app.once("render",
    function() {
        "use strict";
        var STRING = "string", HIDDEN = "hidden", ARRAY = "array", SELF = "self",
            NUMBER = "number", SELECT = "select", VALUE = "value", GROUP = "group",
            persistence = Y.Wegas.persistence,
            dashboard, properties;

        Y.use("wegas-variabledescriptor-entities", function() {
            persistence.ListDescriptor.EDITMENU[1].plugins[0].cfg.children.push({
                type: "AddEntityChildButton",
                label: "Resource",
                targetClass: "ResourceDescriptor"
            }, {
                type: "AddEntityChildButton",
                label: "Task",
                targetClass: "TaskDescriptor"
            });
        });

        Y.Wegas.PMGHelper = {
            getTaskTable: function() {
                var taskTable = {}, tasks,
                    i, taskDesc, taskInst, properties;

                tasks = Y.Wegas.Facade.Variable.cache.find("name", "tasks");

                for (i = 0; i < tasks.size(); i += 1) {
                    taskDesc = tasks.item(i);
                    taskInst = taskDesc.getInstance();
                    properties = taskInst.get("properties");
                    if (taskInst.get("active") & parseInt(properties.completeness, 10) < 100) {
                        taskDesc.timeSolde = taskInst.getRemainingTime();
                        taskDesc.startPlannif = taskInst.getFirstPlannedPeriod();
                        taskDesc.beginAt = undefined;
                        taskDesc.endAt = undefined;
                        taskDesc.planned = [];
                        taskTable[taskDesc.get("id")] = taskDesc;
                    }
                }
                return taskTable;
            },
            /**
             * 
             * fill each task table entry with:
             *   - planned : periods numbers the task is planned on   (e.g. [3, 5, 6]
             *   - beginAt : "real" time the work on task will start (e.g 3.25)
             *   - endAt : "real" time the work on task will start (e.g 6.18)
             *
             * @param {type} taskTable
             * @param {type} currentPeriod
             * @returns {undefined}
             */
            computePert: function(taskTable, currentPeriod, currentStage) {
                var taskId, taskDesc, initialPlanning,
                    predecessors, i, minBeginAt, delta,
                    allPredDefine, predecessorId, stillMissing,
                    deltaMissing, queue = [],
                    lastPlanned, max,
                    taskInstance, stillPlanned;

                taskTable = taskTable || Y.Wegas.PMGHelper.getTaskTable();
                currentStage = currentStage || Y.Wegas.PMGHelper.getCurrentPhaseNumber();
                currentPeriod = currentPeriod || Y.Wegas.PMGHelper.getCurrentPeriodNumber();

                if (currentStage < 3) {
                    // do not compute pert before stage3 but return the planning planned by players
                    for (taskId in taskTable) {
                        taskDesc = taskTable[taskId];
                        initialPlanning = taskDesc.getInstance().getPlannedPeriods().sort(Y.Array.numericSort);
                        taskDesc.planned = initialPlanning;
                        taskDesc.beginAt = 0;
                        taskDesc.endAt = 0;

                        if (initialPlanning.length > 0) {
                            taskDesc.beginAt = initialPlanning[0];
                            taskDesc.endAt = initialPlanning[initialPlanning.length - 1];
                        }
                    }
                } else {
                    queue = [];

                    for (taskId in taskTable) {
                        queue.push(taskId);
                    }
                    while (taskId = queue.shift()) {
                        taskDesc = taskTable[taskId];

                        minBeginAt = currentPeriod;
                        allPredDefine = true;
                        predecessors = taskDesc.get("predecessors");

                        // Check predecessors
                        for (i = 0; i < predecessors.length; i += 1) {
                            predecessorId = predecessors[i].get("id");
                            if (taskTable[predecessorId]) {
                                if (taskTable[predecessorId].endAt) {
                                    if (minBeginAt < taskTable[predecessorId].endAt) {
                                        minBeginAt = taskTable[predecessorId].endAt;
                                    }
                                } else {
                                    // At least one precedecessor has not been processed
                                    allPredDefine = false;
                                    break;
                                }
                            }
                        }

                        if (allPredDefine) {
                            // all require data are available, let's compute pert for the task
                            taskInstance = taskDesc.getInstance();
                            stillPlanned = taskInstance.getPlannedPeriods().filter(function(n) {
                                return n >= minBeginAt;
                            }, this).sort(Y.Array.numericSort);

                            delta = minBeginAt - parseInt(minBeginAt, 10);
                            stillMissing = taskInstance.getRemainingTime();


                            // postpone task that could start in the second part of period
                            if (minBeginAt - parseInt(minBeginAt, 10) > 0.50) {
                                minBeginAt = parseInt(minBeginAt, 10) + 1;
                            } else {
                                minBeginAt = parseInt(minBeginAt, 10);
                                stillMissing += delta;
                            }
                            if (stillPlanned.length > 0 && stillPlanned[0] > minBeginAt) {
                                minBeginAt = stillPlanned[0];
                                stillMissing -= delta;
                            }
                            taskDesc.beginAt = minBeginAt;

                            if (stillMissing === 0) {
                                taskDesc.endAt = minBeginAt;
                                taskDesc.planned = [];
                            } else if (stillPlanned.length >= stillMissing) {
                                // enough or too many planned period
                                deltaMissing = stillMissing - parseInt(stillMissing, 10);
                                if (deltaMissing === 0) {
                                    taskDesc.planned = stillPlanned.slice(0, parseInt(stillMissing, 10));
                                    taskDesc.endAt = taskDesc.planned[taskDesc.planned.length - 1] + 1;
                                } else {
                                    taskDesc.planned = stillPlanned.slice(0, Math.ceil(stillMissing));
                                    taskDesc.endAt = taskDesc.planned[taskDesc.planned.length - 1] || taskDesc.beginAt;
                                    taskDesc.endAt += deltaMissing;
                                }
                            } else {
                                // not enough planned period
                                taskDesc.planned = stillPlanned.slice();
                                if (stillPlanned.length === 0) {
                                    lastPlanned = minBeginAt - 1;
                                    // nothing planned -> stack
                                    taskDesc.endAt = minBeginAt + stillMissing;
                                } else {
                                    lastPlanned = stillPlanned[stillPlanned.length - 1];
                                    taskDesc.endAt = lastPlanned + stillMissing - stillPlanned.length + 1;
                                }
                                max = Math.ceil(stillMissing) - stillPlanned.length;
                                for (i = 0; i < max; i += 1) {
                                    taskDesc.planned.push(lastPlanned + i + 1);
                                }
                            }
                        } else {
                            queue.push(taskId);
                        }
                    }
                }
                return taskTable;
            },
            defaultPhaseNames: ["Initiation", "Planning", "Execution", "Closing"],
            getPhaseName: function(phaseNumber) {
                var names = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "phaseNames");
                if (names) {
                    return names.item(phaseNumber - 1).getInstance().get("value");
                } else {
                    return Y.Wegas.PMGHelper.defaultPhaseNames[phaseNumber - 1];
                }
            },
            getCurrentPhaseName: function() {
                return Y.Wegas.PMGHelper.getPhaseName(Y.Wegas.PMGHelper.getCurrentPhaseNumber());
            },
            getCurrentPeriodNumber: function() {
                return Y.Wegas.Facade.VariableDescriptor.cache.find("name", "currentPeriod").item(
                    Y.Wegas.PMGHelper.getCurrentPhaseNumber() - 1).get("value");
            },
            getCurrentPhaseNumber: function() {
                return Y.Wegas.Facade.VariableDescriptor.cache.find("name", "currentPhase").get("value");
            },
            getBACTotal: function() {
                var i, bacs = 0, tasks = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "tasks"), task;
                for (i = 0; i < tasks.get('items').length; i++) {
                    task = tasks.get("items")[i].getInstance();
                    if (task.get("active")) {
                        bacs += parseInt(task.get('properties').bac, 10);
                    }
                }
                return bacs;
            },
            getInitialBudget: function() {
                return Y.Wegas.Facade.VariableDescriptor.cache.find("name", "initialBudget").getValue();
            },
            getResourceSkill: function(resourceDescriptor) {
                return Y.Wegas.Facade.Variable.cache.findParentDescriptor(resourceDescriptor).get("name");
            },
            getTimeUnit: function() {
                return Y.Wegas.Facade.Variable.cache.find('name', 'timeUnit').getInstance().get("value");
            }
        };
        Y.use(["wegas-resourcemanagement-entities", "inputex-uneditable"], function() {

            /**
             * Set available jobs in the edit form based on the employee folder content
             */
            persistence.Resources.SKILLS.length = 0; // Remove existing skills
            Y.Array.each(Y.Wegas.Facade.VariableDescriptor.cache.find("name", "employees").get("items"), function(vd) {
                persistence.Resources.SKILLS.push({
                    label: vd.get("label"),
                    value: vd.get("name")
                });
            });

            persistence.Resources.GET_SKILL_LABEL = function(skillName) {
                var skill = Y.Array.find(Y.Wegas.persistence.Resources.SKILLS, function(item) {
                    if (item.value === skillName) {
                        return item;
                    }
                });
                return (skill && skill.label) || null;
            };

            persistence.TaskDescriptor.ATTRS.properties._inputex = {
                type: GROUP,
                index: 2,
                fields: [{
                        name: "takeInHandDuration",
                        label: "Take-in-hand duration",
                        type: NUMBER,
                        value: 0,
                        description: "[% of period]"
                    }, {
                        name: "competenceRatioInf",
                        label: "Competence coeff. inf.",
                        type: NUMBER,
                        value: 1,
                        description: "[0..3]"
                    }, {
                        name: "competenceRatioSup",
                        label: "Competence coeff. sup.",
                        type: NUMBER,
                        value: 1,
                        description: "[0..3]"
                    }, {
                        name: "coordinationRatioInf",
                        type: NUMBER,
                        label: "Coordination coeff. inf.",
                        value: 1,
                        description: "[0..2]"
                    }, {
                        name: "coordinationRatioSup",
                        label: "Coordination coeff. sup.",
                        type: NUMBER,
                        value: 1,
                        description: "[0..2]"
                    }, {
                        name: "progressionOfNeeds",
                        type: HIDDEN,
                        value: 1,
                    }]
            };

            persistence.TaskDescriptor.ATTRS.defaultInstance.properties.properties._inputex = {
                type: GROUP,
                index: 10,
                fields: [{
                        name: "fixedCosts",
                        label: "Fixed costs",
                        type: NUMBER,
                        value: 0,
                        description: "[$]"
                    }, {
                        name: "duration",
                        label: "Duration",
                        type: NUMBER,
                        value: 1,
                        description: "[period]"
                    }, {
                        name: "randomDurationInf",
                        label: "Random duration delta inf.",
                        type: NUMBER,
                        value: 0,
                        description: "[0..4 period]"
                    }, {
                        name: "randomDurationSup",
                        label: "Random duration delta sup.",
                        type: NUMBER,
                        value: 0,
                        description: "[0..4 period]"
                    }, {
                        name: "predecessorsDependances",
                        label: "Predecessors dependency",
                        type: NUMBER,
                        value: 1,
                        description: "[0..1000]"
                    }, {
                        name: "bonusRatio",
                        label: "Bonus coeff.",
                        type: NUMBER,
                        value: 1,
                        description: "[0..1..4]"
                    }, {
                        name: "unworkedHoursCosts",
                        type: HIDDEN,
                        value: 0
                    }, {
                        name: "wages",
                        type: HIDDEN,
                        value: 0
                    }, {
                        name: "bac",
                        type: HIDDEN,
                        value: 0
                    }, {
                        name: "completeness",
                        value: 0,
                        type: HIDDEN
                    }, {
                        name: "quality",
                        type: HIDDEN,
                        value: 0
                    }, {
                        name: "computedQuality",
                        type: HIDDEN,
                        value: 0
                    }
                ]
            };
            Y.mix(persistence.TaskDescriptor.METHODS, {
                getNumberInstanceProperty: {
                    label: "Get property",
                    returns: NUMBER,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            scriptType: STRING,
                            type: SELECT,
                            choices: [{
                                    value: "duration"
                                }, {
                                    value: "fixedCosts"
                                }, {
                                    /*
                                     value: "quality"
                                     }, {*/
                                    value: "completeness"
                                }]
                        }]
                },
                addNumberAtInstanceProperty: {
                    label: "Add to property",
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            type: SELECT,
                            scriptType: STRING,
                            choices: [{
                                    value: "duration"
                                }, {
                                    value: "fixedCosts"
                                }, {
                                    value: "quality"
                                }, {
                                    value: "predecessorsDependances"
                                }, {
                                    value: "randomDurationSup"
                                }, {
                                    value: "randomDurationInf"
                                }, {
                                    value: "bonusRatio"
                                }]
                        }, {
                            type: STRING,
                            typeInvite: VALUE,
                            scriptType: STRING
                        }]
                },
                setInstanceProperty: {
                    label: "Set property",
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            scriptType: STRING,
                            type: SELECT,
                            choices: [{
                                    value: "duration"
                                }, {
                                    value: "fixedCosts"
                                }, {
                                    value: "quality"
                                }, {
                                    value: "predecessorsDependances"
                                }, {
                                    value: "randomDurationSup"
                                }, {
                                    value: "randomDurationInf"
                                }, {
                                    value: "bonusRatio"
                                }]
                        }, {
                            type: STRING,
                            typeInvite: VALUE,
                            scriptType: STRING
                        }]
                },
                addAtRequirementVariable: {
                    label: "Add to requirements",
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            type: "entityarrayfieldselect",
                            returnAttr: "name",
                            scriptType: STRING,
                            scope: "instance",
                            field: "requirements",
                            name: {
                                values: ["quantity", "work", "level"],
                                separator: " - "
                            }
                        }, {
                            scriptType: STRING,
                            type: SELECT,
                            choices: [{
                                    value: "quantity"
                                }, {
                                    label: "grade",
                                    value: "level"
                                }]
                        }, {
                            type: STRING,
                            typeInvite: VALUE,
                            scriptType: STRING
                        }]
                },
                setRequirementVariable: {
                    label: "Set requirements",
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            type: "entityarrayfieldselect",
                            returnAttr: "name",
                            scriptType: STRING,
                            scope: "instance",
                            field: "requirements",
                            name: {
                                values: ["quantity", "work", "level"],
                                separator: " - "
                            }
                        }, {
                            scriptType: STRING,
                            type: SELECT,
                            choices: [{
                                    value: "quantity"
                                }, {
                                    value: "level",
                                    label: "grade"
                                }]
                        }, {
                            type: STRING,
                            typeInvite: VALUE,
                            scriptType: STRING
                        }]
                }
            }, true);

            /**
             * Resource descriptor edition customisation
             */
            persistence.ResourceDescriptor.ATTRS.properties._inputex = {
                type: GROUP,
                fields: [{
                        label: "Activity rate coeff.",
                        name: "coef_activity",
                        value: 1,
                        description: "[0..1..2]",
                        className: "short-input"
                    }, {
                        label: "Motivation coeff.",
                        name: "coef_moral",
                        value: 1,
                        description: "[0..1..2]",
                        className: "short-input"
                    }, {
                        label: "Maximum % of billed unworked hours",
                        name: "maxBilledUnworkedHours",
                        value: 10,
                        description: "[0..100]",
                        className: "short-input"
                    }, {
                        label: "Engagement delay",
                        name: "engagementDelay",
                        value: 0,
                        description: "[period]",
                        className: "short-input"
                    }]
            };

            persistence.ResourceDescriptor.ATTRS.defaultInstance.properties.properties._inputex = {
                type: GROUP,
                fields: [{
                        name: "activityRate",
                        label: "Activity rate",
                        type: NUMBER,
                        value: 100,
                        description: "[0..100]",
                        className: "short-input"

                    }, {
                        name: "level",
                        label: "Grade",
                        type: "select",
                        choices: persistence.Resources.STR_LEVELS,
                        className: "short-input"
                    }, {
                        name: "motivation",
                        label: "Motivation",
                        type: NUMBER,
                        value: 7,
                        description: "[0..7..12]",
                        className: "short-input"
                    }, {
                        name: "wage",
                        label: "Monthly wages (100%)",
                        type: NUMBER,
                        value: 1000,
                        description: "[$]",
                        className: "short-input"
                    }, {
                        name: "automaticMode",
                        type: "hidden",
                        value: "Gantt"
                    }]
            };

            persistence.ResourceDescriptor.ATTRS.defaultInstance.properties.confidence = {
                optional: true,
                type: NUMBER,
                _inputex: {
                    _type: HIDDEN
                }
            };
            persistence.ResourceInstance.ATTRS.confidence = {
                type: NUMBER,
                optional: true,
                _inputex: {
                    _type: HIDDEN
                }
            };
            persistence.ResourceDescriptor.METHODS = Y.Object.filter(persistence.ResourceDescriptor.METHODS,
                function(m, k) {
                    return !(k.match(/confidence/i)
                        || k.match(/salary/i)
                        || k.match(/experience/i)
                        || k.match(/leadership/i));
                });
            Y.mix(persistence.ResourceDescriptor.METHODS, {
                getNumberInstanceProperty: {
                    label: "Get property",
                    returns: NUMBER,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            scriptType: STRING,
                            type: SELECT,
                            choices: [{
                                    value: "activityRate"
                                }, {
                                    value: "level",
                                    label: "grade"
                                }, {
                                    value: "motivation"
                                }, {
                                    value: "wage"
                                }]
                        }]
                },
                addNumberAtInstanceProperty: {
                    label: "Add to property",
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            scriptType: STRING,
                            type: SELECT,
                            choices: [{
                                    value: "activityRate"
                                }, {
                                    value: "level",
                                    label: "grade"
                                }, {
                                    value: "motivation"
                                }, {
                                    value: "wage"
                                }]
                        }, {
                            type: STRING,
                            typeInvite: VALUE,
                            scriptType: STRING
                        }]
                },
                setInstanceProperty: {
                    label: "Set property",
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            scriptType: STRING,
                            type: SELECT,
                            choices: [{
                                    value: "activityRate"
                                }, {
                                    value: "level",
                                    label: "grade"
                                }, {
                                    value: "motivation"
                                }, {
                                    value: "wage"
                                }]
                        }, {
                            type: STRING,
                            typeInvite: VALUE,
                            scriptType: STRING
                        }]
                }
            }, true);

            Y.mix(persistence.TaskInstance.prototype, {
                getPlannedPeriods: function() {
                    return Y.Array.unique(this.get("plannification"));
                },
                getFirstPlannedPeriod: function() {
                    return Math.max(0, Math.min.apply(Math, this.getPlannedPeriods()));
                },
                getRemainingTime: function() {
                    var properties = this.get("properties"), timeSolde,
                        //plannedPeriods = this._plannedPeriods(taskInst);
                        plannedPeriods = this.getPlannedPeriods();

                    if (plannedPeriods.length > 0) {
                        timeSolde = (1 - parseInt(properties.completeness, 10) / 100) * plannedPeriods.length;
                    } else {
                        timeSolde = (1 - parseInt(properties.completeness, 10) / 100) * properties.duration;
                    }
                    return timeSolde;

                },
                isRequirementCompleted: function(req) {

                },
                /*
                 *  return {skills: {skill2 : x, skill2: y}, total: (x+y)}
                 */
                countRequiredResources: function() {
                    var total = {}, i, req;
                    //                    for (i = 0; i < this.requirements.size(); i++) {
                    //                    }
                }
            });

            Y.mix(persistence.ResourceDescriptor.prototype, {
                isFirstPriority: function(taskDescriptor) {
                    var assignments = this.getInstance().get("assignments");

                    return assignments.length > 0 &&
                        assignments[0].get('taskDescriptorId') === taskDescriptor.get("id");
                },
                isReservedToWork: function(gantt) {
                    var autoReserve = Y.Wegas.Facade.Variable.cache.find("name", "autoReservation").get("value"),
                        instance = this.getInstance(),
                        currentPeriod = Y.Wegas.Facade.Variable.cache.find("name",
                            "periodPhase3").getInstance().get("value"),
                        occupations = instance.get("occupations"),
                        assignment, assignments, i,
                        oi;

                    if (autoReserve) {
                        // Auto Reservation : resource is always reserved unless:
                        // 1) an uneditable occupation exists
                        for (oi = 0; oi < occupations.length; oi++) {
                            if (occupations[oi].get("time") === currentPeriod && !occupations[oi].get("editable")) {
                                return false;
                            }
                        }

                        // 2) it have to work according to Gantt projection
                        if (instance.get("properties.automaticMode") === "Gantt") {
                            // FOLLOW Gantt
                            gantt = gantt || Y.Wegas.PMGHelper.computePert();
                            assignments = instance.get("assignments");
                            for (i = 0; i < assignments.length; i += 1) {
                                assignment = assignments[i];
                                if (Y.Array.find(gantt[assignment.get("taskDescriptorId")].planned, function(periodNumber) {
                                    return currentPeriod === periodNumber;
                                })) {
                                    return true;
                                }
                            }
                            return false;
                        }

                        return true;
                    } else {
                        // Manual Reservation: never reserved unless
                        // editable occupation
                        for (oi = 0; oi < occupations.length; oi++) {
                            if (occupations[oi].get("time") === currentPeriod && occupations[oi].get("editable")) {
                                return true;
                            }
                        }
                        return false;
                    }
                },
                isPlannedForCurrentPeriod: function(taskDescriptor, gantt) {
                    return this.isFirstPriority(taskDescriptor) && this.isReservedToWork(gantt);
                },
                getAutomaticBehaviour: function() {
                    this.get("instance.properties.automaticBehaviour");
                }
            });

        });

        Y.use(["wegas-resourcemanagement-entities", "inputex-uneditable"], function() {
            persistence.InboxDescriptor.METHODS = {};
            /*Y.Object.filter(persistence.InboxDescriptor.METHODS,
                function(m, k) {
                    return !(k.match(/sendMessage/i));
                });*/
        });

        Y.use("wegas-inputex-variabledescriptorselect", function() {
            Y.mix(Y.inputEx.getFieldClass("statement").prototype.GLOBALMETHODS, {
                separatorPMG: {
                    disabled: true,
                    label: "\u2501\u2501\u2501\u2501"
                },
                "PMGHelper.sendMessage": {
                    label: "[PMG] Send Message",
                    className: "wegas-method-sendmessage",
                    "arguments": [
                        {
                            type: "string",
                            label: "From",
                            scriptType: "string"
                        }, {
                            type: "string",
                            label: "Subject",
                            scriptType: "string",
                            required: true
                        }, {
                            type: "html",
                            label: "Body",
                            scriptType: "string",
                            required: true
                        }, {
                            type: "list",
                            label: "",
                            scriptType: "string",
                            elementType: {
                                type: "wegasurl",
                                label: "",
                                required: true
                            }
                        }]
                },
                "PMGHelper.addImpactDuration": {
                    label: "[PMG] Delayed Task impact",
                    "arguments": [{
                            type: "flatvariableselect",
                            typeInvite: "Object",
                            scriptType: "string",
                            classFilter: ["TaskDescriptor"],
                            required: true
                        }, {
                            type: "uneditable",
                            typeInvite: "method",
                            scriptType: "string",
                            visu: {
                                visuType: 'func',
                                func: function(value) {
                                    return "add to";
                                }
                            },
                            //    choices: Y.Object.keys(Y.Wegas.persistence.TaskDescriptor.METHODS),
                            value: "addNumberAtInstanceProperty",
                            required: true
                        }, {
                            type: "combine",
                            typeInvite: "",
                            scriptType: "array",
                            fields: [{
                                    type: "select",
                                    choices: [{
                                            value: "bonusRatio",
                                            label: "bonus ratio"
                                        }]
                                },
                                {
                                    type: "number",
                                    typeInvite: "value",
                                    required: true
                                }],
                            required: true
                        }, {
                            type: "number",
                            typeInvite: "in period",
                            scriptType: "number",
                            required: true
                        }]
                },
                "PMGHelper.addNumberImpactDuration": {
                    label: "[PMG] Delayed Number impact",
                    "arguments": [{
                            type: "flatvariableselect",
                            typeInvite: "Object",
                            scriptType: "string",
                            classFilter: ["NumberDescriptor"],
                            required: true
                        }, {
                            type: "uneditable",
                            typeInvite: "method",
                            scriptType: "string",
                            value: "add",
                            required: true
                        }, {
                            type: "combine",
                            typeInvite: "",
                            scriptType: "array",
                            fields: [{
                                    type: "number",
                                    typeInvite: "value",
                                    required: true
                                }],
                            required: true
                        }, {
                            type: "number",
                            typeInvite: "in period",
                            scriptType: "number",
                            required: true
                        }]
                },
                "PMGHelper.addResourceImpactDuration": {
                    label: "[PMG] Delayed resource impact",
                    "arguments": [{
                            type: "flatvariableselect",
                            typeInvite: "Object",
                            scriptType: "string",
                            classFilter: ["ResourceDescriptor"],
                            required: true
                        }, {
                            type: "uneditable",
                            typeInvite: "method",
                            scriptType: "string",
                            visu: {
                                visuType: 'func',
                                func: function(value) {
                                    return "add to";
                                }
                            },
                            //    choices: Y.Object.keys(Y.Wegas.persistence.ResourceDescriptor.METHODS),
                            value: "addNumberAtInstanceProperty",
                            required: true
                        }, {
                            type: "combine",
                            typeInvite: "",
                            scriptType: "array",
                            fields: [{
                                    type: "select",
                                    choices: [{
                                            value: "activityRate",
                                            label: "activity rate"
                                        }, {
                                            value: "level",
                                            label: "grade"
                                        }, {
                                            value: "motivation",
                                            label: "motivation"
                                        }
                                    ]
                                },
                                {
                                    type: "number",
                                    typeInvite: "value",
                                    required: true
                                }],
                            required: true
                        }, {
                            type: "number",
                            typeInvite: "in period",
                            scriptType: "number",
                            required: true
                        }

                    ]
                }
            });

            Y.mix(Y.inputEx.getFieldClass("condition").prototype.GLOBALMETHODS, {
                "PMGHelper.workOnProjectByName": {
                    label: "[PMG] resource work on project ?",
                    "arguments": [{
                            type: "flatvariableselect",
                            typeInvite: "Object",
                            scriptType: "string",
                            classFilter: ["ResourceDescriptor"],
                            required: true
                        }]
                },
                "PMGHelper.willWorkOnProjectByName": {
                    label: "[PMG] resource will work on project ?",
                    "arguments": [{
                            type: "flatvariableselect",
                            typeInvite: "Object",
                            scriptType: "string",
                            classFilter: ["ResourceDescriptor"],
                            required: true
                        }]
                }
            });
        });

        /*
         *  Custom Error definition
         */
        Y.Wegas.Facade.Variable.on("WegasOutOfBoundException", function(e) {
            if (e.variableName === "Time cards") {
                var node = (Y.Widget.getByNode("#centerTabView") &&
                    Y.Widget.getByNode("#centerTabView").get("selection")) ||
                    Y.Widget.getByNode(".wegas-playerview");
                node.showMessage("warn", "You don't have enough time");
                e.halt();
            }
        });
    });
(function() {
    "use strict";
    var varLabel = function(name) {
        return Y.Wegas.Facade.Variable.cache.find("name", name).get("label");
    };
    Y.namespace("Wegas.Config").Dashboards = {
        overview: "PMGDashboards.overview()"
    };

    Y.namespace("Wegas.Config").CustomImpacts = function() {
        return [
            ["Send Mail",
                'PMGHelper.sendMessage(${"type":"string", "label":"From"}, ${"type":"string", "label":"Subject"}, ${"type":"html", "label":"Body", "required":true}, []);'],
            ["Add to project variables",
                'Variable.find(gameModel, "managementApproval").add(self, ${"type":"number", "label":"' +
                    varLabel("managementApproval") + '"});'],
            'Variable.find(gameModel, "userApproval").add(self, ${"type":"number", "label": "' + varLabel("userApproval") + '"});',
            'Variable.find(gameModel, "qualityImpacts").add(self, ${"type":"number", "label": "Quality"});',
            'Variable.find(gameModel, "timeCards").add(self, ${"type":"number", "label": "Time budget"});'/*,
            'Variable.find(gameModel, "projectFixedCosts").add(self, ${"type":"number", "label": "Fixed costs"});',
            'Variable.find(gameModel, "bonusRatio").add(self, ${"type":"number", "label": "Bonus ratio"});'*/
        ];
    };
    Y.namespace("Wegas.Config").ExtraTabs = [{
            label: "Properties",
            children: [{
                    type: "PageLoader",
                    pageLoaderId: "properties",
                    defaultPageId: 16
                }]
        }, {
            label: "Statistics",
            children: [{
                    type: "PageLoader",
                    pageLoaderId: "properties",
                    defaultPageId: 18
                }]
        }];
})();

