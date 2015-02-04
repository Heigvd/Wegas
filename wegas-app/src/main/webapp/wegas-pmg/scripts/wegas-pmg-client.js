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
/*global Y, persistence */
(function() {
    "use strict";
    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", SELF = "self",
        NUMBER = "number", SELECT = "select", VALUE = "value", GROUP = "group",
        persistence = Y.Wegas.persistence,
        centerTab, dashboard, properties;

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

        persistence.Resources.GET_SKILL_LABEL = function(skillName){
            var skill = Y.Array.find(Y.Wegas.persistence.Resources.SKILLS, function(item){
                if (item.value === skillName){
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
                    value: 0
                }, {
                    name: "competenceRatioInf",
                    label: "Competence coeff. inf.",
                    type: NUMBER,
                    value: 1
                }, {
                    name: "competenceRatioSup",
                    label: "Competence coeff. sup.",
                    type: NUMBER,
                    value: 1
                }, {
                    name: "coordinationRatioInf",
                    type: NUMBER,
                    label: "Coordination coeff. inf.",
                    value: 1
                }, {
                    name: "coordinationRatioSup",
                    label: "Coordination coeff. sup.",
                    type: NUMBER,
                    value: 1
                }, {
                    name: "progressionOfNeeds",
                    type: HIDDEN,
                    value: 1
                }]
        };

        persistence.TaskDescriptor.ATTRS.defaultInstance.properties.properties._inputex = {
            type: GROUP,
            index: 10,
            fields: [{
                    name: "fixedCosts",
                    label: "Fixed costs",
                    type: NUMBER,
                    value: 0
                }, {
                    name: "randomDurationInf",
                    label: "Random duration delta inf.",
                    type: NUMBER,
                    value: 0
                }, {
                    name: "randomDurationSup",
                    label: "Random duration delta sup.",
                    type: NUMBER,
                    value: 0
                }, {
                    name: "predecessorsDependances",
                    label: "Predecessors dependency",
                    type: NUMBER,
                    value: 1
                }, {
                    name: "bonusRatio",
                    label: "Bonus coeff.",
                    type: NUMBER,
                    value: 1
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
                label: "Get instance property",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        scriptType: STRING,
                        type: SELECT,
                        choices: [{
                                value: "fixedCosts"
                            }, {/*
                             value: "quality"
                             }, {*/
                                value: "completeness"
                            }]
                    }]
            },
            addNumberAtInstanceProperty: {
                label: "Add to instance property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: SELECT,
                        scriptType: STRING,
                        choices: [{
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
                label: "Set instance property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        scriptType: STRING,
                        type: SELECT,
                        choices: [{
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
                                value: "level"
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

        persistence.ResourceDescriptor.ATTRS.defaultInstance.properties.moral._inputex.value = 7;

        persistence.ResourceDescriptor.ATTRS.properties._inputex = {
            type: GROUP,
            fields: [{
                    label: "Activity rate coeff.",
                    name: "coef_activity",
                    value: 1
                }, {
                    label: "Motivation coeff.",
                    name: "coef_moral",
                    value: 1
                }, {
                    label: "Maximum % of billed unworked hours",
                    name: "maxBilledUnworkedHours",
                    value: 10
                }, {
                    label: "Engagement delay",
                    name: "engagementDelay",
                    value: 0
                }]
        };

        persistence.ResourceDescriptor.ATTRS.defaultInstance.properties.properties._inputex = {
            type: GROUP,
            fields: [{
                    name: "activityRate",
                    label: "Activity rate",
                    type: NUMBER,
                    value: 100
                }, {
                    name: "wage",
                    label: "Monthly wages (100%)",
                    type: NUMBER,
                    value: 1000
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
        persistence.ResourceInstance.ATTRS.moralHistory = {
            type: ARRAY,
            _inputex: {
                _type: HIDDEN
            }
        };
        persistence.ResourceInstance.ATTRS.confidenceHistory = {
            type: ARRAY,
            _inputex: {
                _type: HIDDEN
            }
        };
        persistence.ResourceDescriptor.METHODS = Y.Object.filter(persistence.ResourceDescriptor.METHODS, function(m, k) {
            return !(k.match(/confidence/i)
                || k.match(/salary/i)
                || k.match(/experience/i)
                || k.match(/leadership/i));
        });
        Y.mix(persistence.ResourceDescriptor.METHODS, {
            getNumberInstanceProperty: {
                label: "Get instance property",
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
                                value: "wage"
                            }]
                    }]
            },
            addNumberAtInstanceProperty: {
                label: "Add to instance property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        scriptType: STRING,
                        type: SELECT,
                        choices: [{
                                value: "activityRate"
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
                label: "Set instance property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        scriptType: STRING,
                        type: SELECT,
                        choices: [{
                                value: "activityRate"
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
            isRequirementCompleted: function(req){
                
            },
            /*
             *  return {skills: {skill2 : x, skill2: y}, total: (x+y)}
             */
            countRequiredResources: function(){
                var total = {}, i, req;
                for (i = 0 ; i < this.requirements.size(); i++){
                }
            }
        });

        Y.mix(persistence.ResourceDescriptor.prototype, {
            isFirstPriority: function(taskDescriptor) {
                var assignments = this.getInstance().get("assignments");

                return assignments.length > 0 && assignments[0].get('taskDescriptorId') === taskDescriptor.get("id");
            },
            isReservedToWork: function() {
                var autoReserve = Y.Wegas.Facade.Variable.cache.find("name", "autoReservation").get("value"),
                    currentPeriod = Y.Wegas.Facade.Variable.cache.find("name", "periodPhase3").getInstance().get("value"),
                    occupations = this.getInstance().get("occupations"),
                    oi;

                if (autoReserve) {
                    // Auto Reservation : resource is always reserved unless
                    // an uneditable occupation exist
                    for (oi = 0; oi < occupations.length; oi++) {
                        if (occupations[oi].get("time") === currentPeriod && !occupations[oi].get("editable")) {
                            return false;
                        }
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
            isPlannedForCurrentPeriod: function(taskDescriptor) {
                return this.isFirstPriority(taskDescriptor) && this.isReservedToWork();
            }
        });

    });

    Y.use("wegas-inputex-variabledescriptorselect", function() {
        Y.mix(Y.inputEx.getFieldClass("statement").prototype.GLOBALMETHODS, {
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
                        type: "select",
                        typeInvite: "",
                        scriptType: "string",
                        choices: [{
                                value: "addAtMoral",
                                label: "Add to moral"
                            }],
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


// Game properties & dashboard page
    centerTab = Y.Widget.getByNode("#centerTabView");

    if (centerTab) {
        Y.use('wegas-fullwidthtab', function() {
            var hostMode = Y.one(".wegas-hostmode");

            if (hostMode) {
                // Add dashboard tab in first position
                dashboard = centerTab.add({
                    label: "Overview",
                    children: [{
                            type: "PageLoader",
                            pageLoaderId: "properties",
                            defaultPageId: 17
                        }],
                    plugins: [{
                            fn: "FullWidthTab"
                        }]
                }, 0).item(0);
                dashboard.set("selected", 2);
            }

            centerTab.some(function(child) {
                if (child.get("label") === "Properties") {
                    centerTab.remove(child.get("index"));
                    return true;
                }
            });

            // Add properties tab
            properties = centerTab.add({
                label: "Properties",
                children: [{
                        type: "PageLoader",
                        pageLoaderId: "properties",
                        defaultPageId: 16
                    }]
            }).item(0);
            
            if (!hostMode) {
                properties.plug(Y.Plugin.TabDocker);
            }
        });
    }

}());