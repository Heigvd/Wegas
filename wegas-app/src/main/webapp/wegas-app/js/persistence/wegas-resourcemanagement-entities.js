/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-resourcemanagement-entities', function(Y) {
    "use strict";
    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "Name",
        SELF = "self", BOOLEAN = "boolean", NUMBER = "number", OBJECT = "object",
        HTML = "html", VALUE = "Value", HASHLIST = "hashlist", COMBINE = "combine",
        GROUP = "group", LIST = "list", SELECT = "select", KEY = "Key", NULLSTRING = ["null", STRING],
        SELFARG = {
            type: 'identifier',
            value: 'self',
            view: {type: HIDDEN}
        },
        Wegas = Y.Wegas, persistence = Wegas.persistence,
        VERSION_ATTR_DEF,
        IDATTRDEF, lvl;
    VERSION_ATTR_DEF = {
        type: NUMBER,
        view: {
            type: HIDDEN
        }
    };
    IDATTRDEF = {
        type: NUMBER,
        optional: true, // The id is optional for entites that have not been persisted
        view: {
            type: HIDDEN
        }
    };
    Y.namespace("Wegas.persistence.Resources"); // Create namespace

    /**
     *
     */
    persistence.Resources.LEVELS = [
        {
            value: 1,
            label: "Apprentice*"
        },
        {
            value: 2,
            label: "Apprentice**"
        },
        {
            value: 3,
            label: "Apprentice***"
        },
        {
            value: 4,
            label: "Junior*"
        },
        {
            value: 5,
            label: "Junior**"
        },
        {
            value: 6,
            label: "Junior***"
        },
        {
            value: 7,
            label: "Senior*"
        },
        {
            value: 8,
            label: "Senior**"
        },
        {
            value: 9,
            label: "Senior***"
        },
        {
            value: 10,
            label: "Expert*"
        },
        {
            value: 11,
            label: "Expert**"
        },
        {
            value: 12,
            label: "Expert***"
        }
    ];
    /**
     * Since level became a Resource Property, the select field ask for a string
     * value,
     */
    persistence.Resources.STR_LEVELS = [];
    for (lvl in  persistence.Resources.LEVELS) {
        persistence.Resources.STR_LEVELS.push({
            value: "" + persistence.Resources.LEVELS[lvl].value,
            label: "" + persistence.Resources.LEVELS[lvl].label
        });
    }

    persistence.Resources.SKILLS = ["Commercial", "Informaticien", "Web designer", "Monteur"];
    /**
     * ResourceDescriptor mapper
     */
    persistence.ResourceDescriptor = Y.Base.create("ResourceDescriptor", persistence.VariableDescriptor, [], {
        getConfidence: function() {
            return this.getInstance().get("confidence");
        },
        getIconCss: function() {
            return "fa fa-user";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "ResourceDescriptor"
            },
            description: Y.Wegas.Helper.getTranslationAttr({
                label: "Description",
                index: 1,
                type: HTML
            }),
            properties: {
                type: OBJECT,
                additionalProperties: {
                    type: STRING,
                    required: true,
                    view: {
                        label: NAME
                    }
                },
                view: {
                    label: "Properties",
                    className: 'wegas-advanced-feature',
                    type: HASHLIST,
                    keyLabel: VALUE
                }
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'ResourceInstance',
                        view: {
                            type: HIDDEN,
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    active: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            label: "Active from start",
                        }
                    },
                    /*
                     confidence: {
                     required: true,
                     type: NUMBER,
                     value: 100,
                     view: {
                     className: 'wegas-advanced-feature',
                     label: "Initial confidence"
                     }
                     },
                     */
                    /* FORM2 :
                     activities: {
                     type: ARRAY,
                     value: [],
                     view: {
                     type: HIDDEN,
                     }
                     },
                     assignments: {
                     type: ARRAY,
                     value: [],
                     view: {
                     type: HIDDEN,
                     }
                     }
                     */
                    occupations: {
                        type: ARRAY,
                        items: {
                            type: OBJECT,
                            properties: {
                                "@class": {
                                    type: STRING,
                                    value: "Occupation",
                                    view: {type: HIDDEN}
                                },
                                refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                                id: IDATTRDEF,
                                parentId: IDATTRDEF,
                                parentType: {
                                    type: "string",
                                    view: {type: HIDDEN}
                                },
                                editable: {
                                    type: BOOLEAN,
                                    value: false,
                                    view: {type: HIDDEN}
                                },
                                time: {
                                    type: NUMBER,
                                    required: true,
                                    view: {
                                        className: "short-input",
                                        label: "Period number"
                                    }
                                }
                            }
                        },
                        view: {
                            className: 'editor-resources-occupations',
                            label: "Unavailabilities",
                            description: "[periods]"
                        }
                    },
                    properties: {
                        type: OBJECT,
                        additionalProperties: {
                            type: STRING,
                            required: true,
                            view: {
                                label: VALUE
                            }
                        },
                        view: {
                            label: "Default properties",
                            type: HASHLIST,
                            keyLabel: NAME
                        }
                    },
                    assignments: {
                        type: ARRAY,
                        view: {type: HIDDEN}
                    },
                    activities: {
                        type: ARRAY,
                        view: {type: HIDDEN}
                    }
                }
            }
        },
        METHODS: {
            getActive: {
                label: "is active",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            activate: {
                label: "activate",
                arguments: [SELFARG]
            },
            desactivate: {
                label: "deactivate",
                arguments: [SELFARG]
            },
            separator1: {
                label: "\u2501\u2501\u2501\u2501"
            },
            getConfidence: {
                label: "Get confidence",
                returns: NUMBER,
                arguments: [SELFARG]
            },
            addAtConfidence: {
                label: "Add to confidence",
                arguments: [
                    SELFARG,
                    {
                        type: STRING,
                        required: true,
                        value: "1"
                    }]
            },
            setConfidence: {
                label: "Set confidence",
                arguments: [
                    SELFARG,
                    {
                        type: STRING,
                        required: true,
                        value: "1"
                    }]
            },
            getNumberInstanceProperty: {
                label: "Get number property",
                returns: NUMBER,
                arguments: [
                    SELFARG, {
                        type: STRING,
                        view: {
                            label: KEY
                        }
                    }]
            },
            getStringInstanceProperty: {
                label: "Get text property",
                returns: STRING,
                arguments: [
                    SELFARG, {
                        type: STRING,
                        view: {
                            label: KEY
                        }
                    }]
            },
            addNumberAtInstanceProperty: {
                label: "Add to property",
                arguments: [
                    SELFARG, {
                        type: STRING,
                        required: true,
                        view: {
                            label: KEY
                        }
                    }, {
                        type: STRING,
                        required: true,
                        view: {label: VALUE}
                    }]
            },
            setInstanceProperty: {
                label: "Set property",
                arguments: [SELFARG,
                    {
                        type: STRING,
                        required: true,
                        view: {
                            label: KEY
                        }
                    }, {
                        type: STRING,
                        view: {label: VALUE}
                    }]
            },
            separator2: {
                label: "\u2501\u2501\u2501\u2501"
            },
            addOccupation: {
                label: "Add occupation",
                arguments: [
                    SELFARG, {
                        type: NUMBER,
                        required: true,
                        view: {label: "Period"}
                    }, {
                        type: BOOLEAN,
                        value: false,
                        view: {
                            label: "Editable",
                            type: HIDDEN
                        }
                    }
                ]
            },
            removeOccupationsAtTime: {
                label: "Remove occupation",
                arguments: [SELFARG, {
                        type: NUMBER,
                        view: {label: "Time"}
                    }]
            },
            getSalary: {
                label: "Get salary",
                returns: NUMBER,
                arguments: [SELFARG]
            },
            addAtSalary: {
                label: "Add to salary",
                arguments: [SELFARG,
                    {
                        type: STRING,
                        required: true,
                        value: "1"
                    }]
            },
            setSalary: {
                label: "Set salary",
                arguments: [
                    SELFARG, {
                        type: STRING,
                        required: true,
                        value: "1"
                    }]
            },
            getExperience: {
                label: "Get experience",
                returns: NUMBER,
                arguments: [SELFARG]
            },
            addAtExperience: {
                label: "Add to experience",
                arguments: [
                    SELFARG, {
                        type: STRING,
                        required: true,
                        value: "1"
                    }]
            },
            setExperience: {
                label: "Set experience",
                arguments: [
                    SELFARG, {
                        type: STRING,
                        required: true,
                        value: "1"
                    }]
            },
            getLeadershipLevel: {
                label: "Get leadership level",
                returns: NUMBER,
                arguments: [SELFARG]
            },
            addAtLeadershipLevel: {
                label: "Add to leadership level",
                arguments: [
                    SELFARG, {
                        type: STRING,
                        required: true,
                        value: "1"
                    }]
            },
            setLeadershipLevel: {
                label: "Set leadership level",
                arguments: [
                    SELFARG, {
                        type: STRING,
                        required: true,
                        value: "1"
                    }]
            }
        }
    });
    /**
     * ResourceInstance mapper
     */
    persistence.ResourceInstance = Y.Base.create("ResourceInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "ResourceInstance"
            },
            active: {
                type: BOOLEAN,
                view: {label: 'Active'}
            },
            properties: {
                type: OBJECT,
                additionalProperties: {
                    type: STRING,
                    required: true,
                    view: {
                        label: VALUE
                    }
                },
                view: {
                    label: "Properties",
                    type: HASHLIST,
                    keyLabel: NAME
                }
            },
            assignments: {
                type: ARRAY,
                items: {type: OBJECT, view: {type: "uneditable"}},
                view: {label: "Assignments", type: HIDDEN}
            },
            occupations: {
                type: ARRAY,
                setter: function(v) {
                    v.sort(function(a, b) {
                        return a.get("time") - b.get("time");
                    });
                    return v;
                },
                value: [],
                view: {
                    type: HIDDEN
                }
            },
            activities: {
                type: ARRAY,
                items: {type: OBJECT, view: {type: "uneditable"}},
                view: {label: "Activities", type: HIDDEN}
            }
        }
    });
    /**
     * TaskDescriptor mapper
     */
    persistence.TaskDescriptor = Y.Base.create("TaskDescriptor", persistence.VariableDescriptor, [], {
        findAssociatedRessources: function(abstractAssignments) {
            var ressources, i, data = [], assignments, dict;
            ressources = Wegas.Facade.Variable.cache.findAll("@class", "ResourceDescriptor");
            Y.Array.each(ressources, function(employee) {
                assignments = employee.getInstance().get(abstractAssignments);
                for (i = 0; i < assignments.length; i++) {
                    dict = {};
                    if (assignments[i].get('taskDescriptorName') === this.get("name")) {
                        dict.taskDescriptor = this;
                        dict.ressourceInstance = employee.getInstance();
                        dict.ressourceDescriptor = employee;
                        data.push(dict);
                    }
                }
            }, this);
            return data;
        },
        getLabelWithIndex: function() {
            var trLabel = this.getLabel() || "",
                index = this.get("index");
            if (index) {
                return index + ". " + trLabel
            } else {
                return trLabel;
            }
        },
        getEditorLabel: function() {
            var trLabel = this.getLabelWithIndex();
            var toDisplay;

            if (!this.get("editorTag") && !trLabel) {
                toDisplay = this.get("name");
            } else if (!this.get("editorTag")) {
                toDisplay = trLabel;
            } else if (!trLabel) {
                toDisplay = this.get("editorTag");
            } else {
                toDisplay = this.get("editorTag") + " - " + trLabel;
            }

            if (Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("type") === "MODEL"
                && this.get("visibility") === "PRIVATE") {
                toDisplay = "<i class='private-in-model'>" + toDisplay + "</i>";
            }

            return toDisplay;

        },
        getIconCss: function() {
            return "fa fa-list";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "TaskDescriptor"
            },
            index: {
                type: STRING,
                index: -11,
                required: true,
                view: {
                    label: "Task number",
                    layout: "extraShort"
                }
            },
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                index: -10,
                description: "Displayed to players",
                type: STRING
            }),
            predecessors: {
                type: ARRAY,
                items: {
                    type: OBJECT
                },
                "transient": true,
                getter: function() {
                    return Y.Array.map(this.get("predecessorNames"), function(name) {
                        return Wegas.Facade.Variable.cache.find("name", name);
                    });
                },
                view: {
                    type: HIDDEN
                }
            },
            predecessorNames: {
                type: ARRAY,
                value: [],
                items: {
                    type: STRING,
                    required: true,
                    view: {
                        type: "flatvariableselect",
                        classFilter: "TaskDescriptor"
                    }
                },
                index: -1,
                view: {
                    label: "Predecessors"
                }
            },
            description: Y.Wegas.Helper.getTranslationAttr({
                label: "Description",
                index: -1,
                type: HTML
            }),
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'TaskInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    requirements: {
                        type: ARRAY,
                        view: {
                            label: "Resource requirements",
                            highlight: true
                        },
                        items: {
                            type: OBJECT,
                            properties: {
                                "@class": {
                                    type: STRING,
                                    value: "WRequirement",
                                    view: {type: HIDDEN}
                                },
                                id: IDATTRDEF,
                                refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                                parentId: IDATTRDEF,
                                parentType: {
                                    type: "string",
                                    view: {type: HIDDEN}
                                },
                                name: {type: STRING, view: {type: HIDDEN}},
                                work: {
                                    type: STRING,
                                    view: {
                                        type: SELECT,
                                        choices: persistence.Resources.SKILLS,
                                        layout: "shortInline"
                                    }
                                },
                                level: {
                                    type: NUMBER,
                                    view: {
                                        type: SELECT,
                                        choices: persistence.Resources.LEVELS,
                                        layout: "shortInline"
                                    }
                                },
                                quantity: {
                                    type: NUMBER,
                                    required: true,
                                    value: 1,
                                    view: {
                                        label: 'Quantity',
                                        layout: "extraShortInline"
                                    }
                                },
                                limit: {
                                    type: NUMBER,
                                    required: true,
                                    value: 100,
                                    view: {
                                        label: 'Limit',
                                        layout: "extraShortInline"
                                    }
                                },
                                completeness: {
                                    type: NUMBER,
                                    value: 0,
                                    view: {type: HIDDEN}
                                },
                                quality: {
                                    type: NUMBER,
                                    value: 100,
                                    view: {type: HIDDEN}
                                }
                            }
                        }
                    },
                    active: {
                        type: BOOLEAN,
                        view: {
                            label: 'Active from start',
                            value: true
                        }
                    },
                    plannification: {
                        type: ARRAY,
                        value: [],
                        view: {
                            type: HIDDEN,
                        }
                    },
                    properties: {
                        type: OBJECT,
                        index: 3,
                        additionalProperties: {
                            view: {label: VALUE}
                        },
                        view: {
                            label: "Instance properties",
                            type: HASHLIST,
                            keyLabel: NAME
                        }
                    }
                }
            },
            properties: {
                type: OBJECT,
                index: 3,
                additionalProperties: {
                    type: STRING,
                    view: {
                        label: VALUE
                    }
                },
                view: {
                    label: "Properties",
                    type: HASHLIST,
                    keyField: NAME,
                }
            }
        },
        METHODS: {
            activate: {
                label: "activate",
                arguments: [SELFARG]
            },
            desactivate: {
                label: "deactivate",
                arguments: [SELFARG]
            },
            separator1: {
                label: "\u2501\u2501\u2501\u2501"
            },
            getActive: {
                label: "is active",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            getNumberInstanceProperty: {
                label: "Get number property",
                returns: NUMBER,
                arguments: [
                    SELFARG, {
                        type: STRING,
                        view: {label: KEY}
                    }]
            },
            getStringInstanceProperty: {
                label: "Get text property",
                returns: STRING,
                arguments: [
                    SELFARG, {
                        type: STRING,
                        view: {label: KEY}
                    }]
            },
            addNumberAtInstanceProperty: {
                label: "Add to property",
                arguments: [
                    SELFARG, {
                        type: STRING,
                        view: {label: KEY}
                    }, {
                        type: STRING,
                        view: {label: VALUE}
                    }]
            },
            setInstanceProperty: {
                label: "Set property",
                arguments: [
                    SELFARG, {
                        type: STRING,
                        view: {label: KEY}
                    }, {
                        type: STRING,
                        view: {label: VALUE}
                    }]
            }
        }
    });
    /**
     * TaskInstance mapper
     */
    persistence.TaskInstance = Y.Base.create("TaskInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "TaskInstance"
            },
            active: {
                type: BOOLEAN,
                view: {
                    label: 'Active from start',
                    value: true
                }
            },
            requirements: {
                type: ARRAY,
                view: {
                    label: "Resource requirements"
                },
                setter: function(v) {
                    v.sort(function(a, b) {
                        if (a.get("work") === b.get("work")) {
                            return a.get("level") < b.get("level") ?
                                -1 : a.get("level") > b.get("level") ?
                                1 : 0;
                        }
                        return a.get("work") < b.get("work") ? -1 : 1;
                    });
                    return v;
                },
                items: persistence.TaskDescriptor.ATTRS.defaultInstance.properties.requirements.items
            },
            properties: {
                type: OBJECT,
                additionalProperties: {
                    view: {label: VALUE}
                },
                view: {
                    label: "Properties",
                    type: HASHLIST,
                    keyLabel: NAME
                }
            },
            plannification: {
                type: ARRAY,
                view: {
                    type: HIDDEN
                }
            }
        }
    });
    /**
     * Requirements mapper
     */
    persistence.WRequirement = Y.Base.create("WRequirement", persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "WRequirement"
            },
            id: {
                optional: true,
                type: NUMBER
            },
            refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
            name: {
                optional: true,
                type: STRING
            },
            work: {
                type: STRING
            },
            limit: {
                type: NUMBER
            },
            level: {
                type: NUMBER
            },
            quantity: {
                type: NUMBER
            },
            completeness: {
                type: NUMBER
            },
            quality: {
                type: NUMBER
            }
        }
    });
    /**
     * Activity mapper
     */
    persistence.Activity = Y.Base.create("Activity", persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "Activity"
            },
            refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
            taskDescriptorName: {
                type: STRING
            },
            time: {
                type: NUMBER
            },
            startTime: {
                type: NUMBER
            },
            completion: {
                type: NUMBER
            },
            requirementId: {
                type: STRING
            }
        }
    });
    /**
     * Occupation mapper
     */
    persistence.Occupation = Y.Base.create("Occupation", persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "Occupation"
            },
            refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
            time: {
                type: NUMBER
            },
            editable: {
                type: BOOLEAN
            }
        }
    });
    /**
     * Assignement mapper
     */
    persistence.Assignment = Y.Base.create("Assignment", persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "TaskInstance"
            },
            refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
            taskDescriptorName: {
                type: STRING
            }
        }
    });
    /*
     * BURNDOWN
     */
    persistence.BurndownDescriptor = Y.Base.create("BurndownDescriptor", persistence.VariableDescriptor, [], {
        getIconCss: function() {
            return "fa fa-area-chart";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "BurndownDescriptor"
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'BurndownInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    iterations: {
                        type: ARRAY,
                        value: [],
                        view: {
                            type: HIDDEN
                        }
                    }
                }
            }
        },
        METHODS: {
        }
    });
    /**
     * BurndownInstance mapper
     */
    persistence.BurndownInstance = Y.Base.create("BurndownInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "BurndownInstance"
            },
            iterations: {
                type: ARRAY,
                setter: function(v) {
                    v.sort(function(a, b) {
                        // older first
                        return a.get("createdTime") - b.get("createdTime");
                    });
                    return v;
                },
                value: []
            }
        }
    });
    persistence.Iteration = Y.Base.create("Iteration", persistence.Entity, [], {
        getTaskDescriptors: function() {
            var names = this.get("taskNames"), i, taskDs = [];
            for (i = 0; i < names.length; i += 1) {
                taskDs.push(Y.Wegas.Facade.Variable.cache.find("name", names[i]));
            }
            return taskDs;
        },
        containsTask: function(taskDescriptor) {
            var needle = taskDescriptor.get("name");
            return !!this.get("taskNames").find(function(taskName) {
                return taskName === needle;
            });
        },
        /**
         * Get active tasks
         * @returns {Array} Active tasks only
         */
        getTaskInstances: function() {
            return this.getTaskDescriptors()
                .map(function(taskD) {
                    return taskD.getInstance();
                })
                .filter(function(taskI) {
                    return taskI.get("active");
                });
        },
        getRemainingWorkload: function() {
            var taskI, taskIs, i,
                sum = 0,
                workload;
            taskIs = this.getTaskInstances();
            for (i = 0; i < taskIs.length; i += 1) {
                taskI = taskIs[i];

                workload = taskI.get("properties.duration") * taskI.get("requirements").reduce(function(acc, current) {
                    return acc + current.get("quantity");
                }, 0);

                sum += (workload * (100 - taskI.get("properties.completeness")) / 100);
            }
            return sum;
        },
        getDeltaSum: function() {
            var period, periods, i, sum = 0;
            periods = this.get("periods");
            for (i = 0; i < periods.length; i += 1) {
                period = periods[i];
                sum += periods.get("deltaAtStart");
            }
            return sum;
        },
        getTotalWorkload: function() {
            var taskI, taskIs, i, workload = 0;
            taskIs = this.getTaskInstances();
            for (i = 0; i < taskIs.length; i += 1) {
                taskI = taskIs[i];

                workload = taskI.get("properties.duration") * taskI.get("requirements").reduce(function(acc, current) {
                    return acc + current.get("quantity");
                }, 0);
            }
            return workload;
        },
        getTotalAc: function() {
            var taskI, taskIs, i,
                total = 0;
            taskIs = this.getTaskInstances();
            for (i = 0; i < taskIs.length; i += 1) {
                taskI = taskIs[i];
                var completeness = taskI.get("properties.completeness");
                if (completeness > 0) {
                    total += +taskI.get("properties.wages") + +taskI.get("properties.fixedCosts") + +taskI.get("properties.unworkedHoursCosts");
                }
            }
            return total;
        },
        getTotalEv: function() {
            var taskI, taskIs, i,
                total = 0;
            taskIs = this.getTaskInstances();
            for (i = 0; i < taskIs.length; i += 1) {
                taskI = taskIs[i];
                total += taskI.get("properties.completeness") / 100 * taskI.get("properties.bac");
            }
            return total;
        },
        getStatus: function(currentPeriod) {
            var tasks = this.getTaskInstances(),
                i, taskI, started = false, completed = tasks.length > 0,
                completeness;

            //started = Y.Wegas.PMGHelper.getCurrentPhaseNumber() > 3 || (Y.Wegas.PMGHelper.getCurrentPhaseNumber() === 3 && Y.Wegas.PMGHelper.getCurrentPeriodNumber() > this.get("beginAt"));

            for (i = 0; i < tasks.length; i += 1) {
                taskI = tasks[i];
                completeness = taskI.get("properties.completeness");
                if (completeness < 100) {
                    completed = false;
                }
                if (completeness > 0) {
                    started = true;
                }
            }
            if (completed) {
                return "COMPLETED";
            } else if (started) {
                return "STARTED";
            } else {

                if (currentPeriod > this.get("beginAt") || this.get("periods").find(function(period) {
                    return period.get("ew") > 0;
                })) {
                    // some work has already be done, but the related task has been removed from the iteration
                    return "STARTED";
                }
                return "NOT_STARTED";
            }
        },
        hasBegun: function() {
            return this.getStatus() !== "NOT_STARTED";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "Iteration"
            },
            name: {
                type: STRING
            },
            beginAt: {
                type: NUMBER
            },
            cpi: {
                type: NUMBER
            },
            wspi: {
                type: NUMBER
            },
            taskNames: {
                type: ARRAY
            },
            createdTime: {
                transient: true
            },
            periods: {
                type: ARRAY
            }
        }
    });
    persistence.IterationPeriod = Y.Base.create("IterationPeriod", persistence.Entity, [], {
    }, {
        ATTRS: {
            periodNumber: {
                "type": "number",
                "view": {
                    "label": "Period number",
                    readOnly: true
                }
            },
            deltaAtStart: {
                "type": "number",
                "view": {
                    "label": "Delta workload"
                }
            },
            deltaAc: {
                "type": "number",
                "view": {
                    "label": "Delta AC"
                }
            },
            deltaEv: {
                "type": "number",
                "view": {
                    "label": "Delta EV"
                }
            },
            planned: {
                "type": "number",
                "view": {
                    "label": "Initial Planned Team Size"
                }
            },
            replanned: {
                "type": "number",
                "view": {
                    "label": "Re-Planned Team Size"
                }
            },
            ac: {
                "type": "number",
                "view": {
                    "label": "Actual Cost (AC)"
                }
            },
            ev: {
                "type": "number",
                "view": {
                    "label": "Earned Value (EV)"
                }
            },
            aw: {
                "type": "number",
                "view": {
                    "label": "Actual Workload Spent during the period(AW)"
                }
            },
            ew: {
                "type": "number",
                "view": {
                    "label": "Earned Workload (EW) from iteration start"
                }
            },
            pw: {
                "type": "number",
                "view": {
                    "label": "Planned Workload (PW) from iteration start"
                }
            },
            lastWorkedStep: {
                "type": "number",
                "view": {
                    "label": "Last worked step",
                    readOnly: true
                }
            },
            iterationEvents: {
                "type": "array",
                "value": [],
                "items": {
                    type: "object",
                    properties: {
                        "data": {
                            "view": {
                                "label": "Data"
                            }
                        },
                        "eventType": {
                            "type": "string",
                            "view": {
                                "label": "Event Type"
                            }

                        },
                        "step": {
                            "type": "number",
                            "view": {
                                "label": "Step"
                            }
                        },
                        "taskName": {
                            "type": "string",
                            "view": {
                                "label": "Task name"
                            }
                        }
                    }

                },
                "view": {
                    "label": "Events"
                }
            }
        }
    });
    persistence.IterationEvent = Y.Base.create("IterationEvent", persistence.Entity, [], {
    }, {
        ATTRS: {
            "data": {
                "view": {
                    "label": "Data"
                }
            },
            "eventType": {
                "type": "string",
                "view": {
                    "label": "Event Type"
                }

            },
            "step": {
                "type": "number",
                "view": {
                    "label": "Step"
                }
            },
            "taskName": {
                "type": "string",
                "view": {
                    "label": "Task name"
                }
            }
        }
    });
});
