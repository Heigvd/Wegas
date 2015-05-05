/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-resourcemanagement-entities', function(Y) {
    "use strict";
    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "name",
        SELF = "self", BOOLEAN = "boolean", NUMBER = "number", OBJECT = "object",
        HTML = "html", VALUE = "value", HASHLIST = "hashlist", COMBINE = "combine",
        GROUP = "group", LIST = "list", SELECT = "select", KEY = "key",
        Wegas = Y.Wegas, persistence = Wegas.persistence,
        PROPERTIESELEMENTTYPE = {
            type: COMBINE,
            fields: [{
                    name: NAME,
                    typeInvite: NAME,
                    size: 16
                }, {
                    name: VALUE,
                    typeInvite: VALUE,
                    size: 16
                }]
        },
    IDATTRDEF = {
        type: STRING,
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: HIDDEN
        }
    },
    lvl;
    Y.namespace("Wegas.persistence.Resources"); // Create namespace

    /**
     * 
     */
    persistence.Resources.LEVELS = [
        {value: 1, label: "Apprentice*"},
        {value: 2, label: "Apprentice**"},
        {value: 3, label: "Apprentice***"},
        {value: 4, label: "Junior*"},
        {value: 5, label: "Junior**"},
        {value: 6, label: "Junior***"},
        {value: 7, label: "Senior*"},
        {value: 8, label: "Senior**"},
        {value: 9, label: "Senior***"},
        {value: 10, label: "Expert*"},
        {value: 11, label: "Expert**"},
        {value: 12, label: "Expert***"}
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
        }
    }, {
        ATTRS: {
            "@class": {
                value: "ResourceDescriptor"
            },
            title: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: "Label",
                    description: "Displayed to players",
                    index: -1
                }
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true,
                _inputex: {
                    index: -1
                }
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                    _type: HASHLIST,
                    elementType: PROPERTIESELEMENTTYPE
                }
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: 'ResourceInstance'
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: "Active by default",
                            value: true
                        }
                    },
                    confidence: {
                        name: NUMBER,
                        optional: false,
                        type: STRING,
                        _inputex: {
                            wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                            label: "Initial confidence",
                            value: 100
                        }
                    },
                    occupations: {
                        type: ARRAY,
                        _inputex: {
                            wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature editor-resources-occupations',
                            label: "Unavailabilities",
                            description: "[periods]",
                            _type: LIST,
                            elementType: {
                                type: GROUP,
                                fields: [{
                                        name: "@class",
                                        type: HIDDEN,
                                        value: "Occupation"
                                    }, {
                                        name: "editable",
                                        value: false,
                                        type: HIDDEN
                                    }, {
                                        name: "time",
                                        typeInvite: "Period number",
                                        type: NUMBER,
                                        required: true
                                    }]
                            }
                        }
                    },
                    confidenceHistory: {
                        type: ARRAY,
                        optional: true,
                        _inputex: {
                            value: [],
                            _type: HIDDEN
                        }
                    },
                    properties: {
                        _inputex: {
                            label: "Default properties",
                            _type: OBJECT,
                            elementType: PROPERTIESELEMENTTYPE
                        }
                    }
                }
            }
        },
        METHODS: {
            getActive: {
                label: "Is active",
                returns: BOOLEAN,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            activate: {
                label: "Activate",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            desactivate: {
                label: "Desactivate",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            getConfidence: {
                label: "Get confidence",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            addAtConfidence: {
                label: "Add to confidence",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            setConfidence: {
                label: "Set confidence",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            addOccupation: {
                label: "Add occupation",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: NUMBER,
                        typeInvite: "Period",
                        scriptType: NUMBER
                    }, {
                        type: HIDDEN,
                        label: "Editable",
                        value: false,
                        scriptType: BOOLEAN
                    }, {
                        type: HIDDEN,
                        label: "Description",
                        scriptType: STRING
                    }
                ]
            },
            removeOccupationsAtTime: {
                label: "Remove occupation",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: NUMBER,
                        typeInvite: "Time"
                    }]
            },
            getNumberInstanceProperty: {
                label: "Get number property",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        typeInvite: KEY,
                        scriptType: STRING
                    }]
            },
            getStringInstanceProperty: {
                label: "Get text property",
                returns: STRING,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        typeInvite: KEY,
                        scriptType: STRING
                    }]
            },
            addNumberAtInstanceProperty: {
                label: "Add to property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        typeInvite: KEY,
                        scriptType: STRING
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
                        type: STRING,
                        typeInvite: KEY,
                        scriptType: STRING
                    }, {
                        type: STRING,
                        typeInvite: VALUE,
                        scriptType: STRING
                    }]
            },
            getSalary: {
                label: "Get salary",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            addAtSalary: {
                label: "Add to salary",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            setSalary: {
                label: "Set salary",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            getExperience: {
                label: "Get experience",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            addAtExperience: {
                label: "Add to experience",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            setExperience: {
                label: "Set experience",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            getLeadershipLevel: {
                label: "Get leadership level",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            addAtLeadershipLevel: {
                label: "Add to leadership level",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            setLeadershipLevel: {
                label: "Set leadership level",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
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
                type: BOOLEAN
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: HASHLIST,
                    elementType: PROPERTIESELEMENTTYPE
                }
            },
            assignments: {
                type: ARRAY,
                value: []
            },
            occupations: {
                type: ARRAY,
                value: [],
                _inputex: {
                    _type: HIDDEN
                }
            },
            activities: {
                type: ARRAY,
                value: []
            },
            confidenceHistory: {
                type: ARRAY,
                _inputex: {
                    label: "Confidence history",
                    _type: LIST
                }
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
                    if (assignments[i].get('taskDescriptorId') === this.get("id")) {
                        dict.taskDescriptor = this;
                        dict.ressourceInstance = employee.getInstance();
                        dict.ressourceDescriptor = employee;
                        data.push(dict);
                    }
                }
            }, this);
            return data;
        }
    }, {
        ATTRS: {
            "@class": {
                value: "TaskDescriptor"
            },
            title: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: "Label",
                    description: "Displayed to players",
                    index: -1
                }
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true,
                _inputex: {
                    index: -1
                }
            },
            index: {
                type: STRING,
                _inputex: {
                    label: "Number",
                    index: -1
                }
            },
            predecessors: {
                type: ARRAY,
                "transient": true,
                getter: function() {
                    return Y.Array.map(this.get("predecessorNames"), function(name) {
                        return Wegas.Facade.Variable.cache.find("name", name);
                    });
                }
            },
            predecessorNames: {
                type: ARRAY,
                value: [],
                _inputex: {
                    label: "Predecessors",
                    index: -1,
                    elementType: {
                        required: true,
                        type: "flatvariableselect",
                        classFilter: "TaskDescriptor"
                    }
                }
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: 'TaskInstance'
                        }
                    },
                    id: IDATTRDEF,
                    requirements: {
                        type: ARRAY,
                        _inputex: {
                            _type: LIST,
                            label: "Requirements",
                            wrapperClassName: 'inputEx-fieldWrapper wegas-inputex-inlinegroup',
                            elementType: {
                                type: GROUP,
                                fields: [{
                                        name: "@class",
                                        value: "WRequirement",
                                        type: HIDDEN
                                    }, {
                                        name: "id",
                                        type: HIDDEN
                                    }, {
                                        name: "name",
                                        type: HIDDEN,
                                        typeInvite: "name"
                                    }, {
                                        name: "work",
                                        type: SELECT,
                                        choices: persistence.Resources.SKILLS
                                    }, {
                                        name: "level",
                                        type: "select",
                                        choices: persistence.Resources.LEVELS
                                    }, {
                                        typeInvite: "quantity",
                                        name: "quantity",
                                        type: NUMBER,
                                        required: true,
                                        size: 4
                                    }, {
                                        typeInvite: "limit",
                                        name: "limit",
                                        size: 4,
                                        required: true,
                                        type: NUMBER
                                    }, {
                                        name: "completeness",
                                        type: HIDDEN,
                                        value: 0
                                    }, {
                                        name: "quality",
                                        type: HIDDEN,
                                        value: 100
                                    }]
                            }
                        }
                    },
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    },
                    plannification: {
                        type: ARRAY,
                        _inputex: {
                            _type: HIDDEN,
                            value: []
                        }
                    },
                    properties: {
                        _inputex: {
                            label: "Instance properties",
                            _type: HASHLIST,
                            keyField: NAME,
                            valueField: VALUE,
                            elementType: PROPERTIESELEMENTTYPE
                        }
                    }
                }
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    index: 2,
                    _type: HASHLIST,
                    keyField: NAME,
                    valueField: VALUE,
                    elementType: PROPERTIESELEMENTTYPE
                }
            }
        }, METHODS: {
            activate: {
                label: "Activate",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            desactivate: {
                label: "Desactivate",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            getActive: {
                label: "Is active",
                returns: BOOLEAN,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            getNumberInstanceProperty: {
                label: "Get number instance property",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        typeInvite: KEY,
                        scriptType: STRING
                    }]
            },
            getStringInstanceProperty: {
                label: "Get text instance property",
                returns: STRING,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        typeInvite: KEY,
                        scriptType: STRING
                    }]
            },
            addNumberAtInstanceProperty: {
                label: "Add to instance property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        typeInvite: KEY,
                        scriptType: STRING
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
                        type: STRING,
                        typeInvite: KEY,
                        scriptType: STRING
                    }, {
                        type: STRING,
                        typeInvite: VALUE,
                        scriptType: STRING
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
                type: BOOLEAN
            },
            requirements: {
                type: ARRAY,
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
                _inputex: persistence.TaskDescriptor.ATTRS.defaultInstance.properties.requirements._inputex
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: OBJECT
                }
            },
            plannification: {
                type: ARRAY,
                _inputex: {
                    _type: HIDDEN
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
            taskDescriptorId: {
                type: STRING
            },
            time: {
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
            time: {
                type: NUMBER
            },
            editable: {
                type: BOOLEAN
            },
            taskDescriptorId: {
                type: STRING
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
            taskDescriptorId: {
                type: STRING
            }
        }
    });
});
