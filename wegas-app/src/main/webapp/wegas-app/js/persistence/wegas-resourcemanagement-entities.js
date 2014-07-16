/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
    };

    Y.namespace("Wegas.persistence.Resources");
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
    persistence.Resources.SKILLS = ["Consultant IT", "Commercial", "Informaticien hardware",
        "Informaticien logiciel", "Web designer", "Monteur"];

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
                    useButtons: true,
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
                    skillsets: {
                        _inputex: {
                            label: "Skills",
                            _type: HASHLIST,
                            wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature editor-resources-skillset',
                            elementType: {
                                type: COMBINE,
                                required: true,
                                fields: [{
                                        name: "work",
                                        type: "select",
                                        choices: persistence.Resources.SKILLS
                                    }, {
                                        name: "level",
                                        type: "select",
                                        choices: persistence.Resources.LEVELS
                                    }]
                            }
                        }
                    },
                    moral: {
                        type: NUMBER,
                        optional: false,
                        _inputex: {
                            label: "Motivation",
                            value: 100
                        }
                    },
                    moralHistory: {
                        type: ARRAY,
                        optional: true,
                        _inputex: {
                            value: [],
                            _type: HIDDEN
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
                            label: "Vacancies",
                            _type: LIST,
                            useButtons: true,
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
                            useButtons: true,
                            elementType: PROPERTIESELEMENTTYPE
                        }
                    }
                }
            }
        },
        METHODS: {
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
            getMoral: {
                label: "Get moral",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            addAtMoral: {
                label: "Add to moral",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: NUMBER,
                        value: 1
                    }]
            },
            setMoral: {
                label: "Set moral",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: NUMBER,
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
                        typeInvite: "Time",
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
            },
            getSkillset: {
                label: "Skill level",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        scriptType: STRING,
                        type: SELECT,
                        choices: persistence.Resources.SKILLS
                    }]
            },
            addAtSkillset: {
                label: "Add to skill level",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        scriptType: STRING,
                        type: SELECT,
                        choices: persistence.Resources.SKILLS
                    }, {
                        type: STRING,
                        typeInvite: "level",
                        scriptType: STRING
                    }]
            },
            setSkillset: {
                label: "Set skill level",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        scriptType: STRING,
                        type: SELECT,
                        choices: persistence.Resources.SKILLS
                    }, {
                        type: NUMBER,
                        typeInvite: "level",
                        scriptType: STRING
                    }]
            },
            //methods below are temporary ; only for CEP-Game
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
            },
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
            moral: {
                type: NUMBER,
                optional: true
            },
            confidence: {
                type: NUMBER,
                optional: true
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: HASHLIST,
                    elementType: PROPERTIESELEMENTTYPE
                }
            },
            skillsets: {
                name: "skillsets",
                _inputex: {
                    label: "Skills",
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
            moralHistory: {
                type: ARRAY,
                _inputex: {
                    label: "Moral history",
                    _type: LIST,
                    useButtons: true
                }
            },
            confidenceHistory: {
                type: ARRAY,
                _inputex: {
                    label: "Confidence history",
                    _type: LIST,
                    useButtons: true
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
            ressources = Wegas.Facade.VariableDescriptor.cache.findAll("@class", "ResourceDescriptor");
            Y.Array.forEach(ressources, function(employee) {
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
                type: NUMBER,
                optional: true,
                index: -1
            },
            predecessors: {
                type: ARRAY,
                "transient": true,
                getter: function() {
                    return Y.Array.map(this.get("predecessorNames"), function(name) {
                        return Wegas.Facade.VariableDescriptor.cache.find("name", name);
                    });
                }
            },
            predecessorNames: {
                type: ARRAY,
                value: [],
                "transient": true, //@fixme Shloud be enabled to allow edition
                _inputex: {
                    label: "Predecessors",
                    useButtons: true
                }
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: HASHLIST,
                    keyField: NAME,
                    useButtons: true,
                    valueField: VALUE,
                    elementType: PROPERTIESELEMENTTYPE
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
                            _type: HIDDEN
                        }
                    },
                    requirements: {
                        type: ARRAY,
                        _inputex: {
                            _type: LIST,
                            label: "Requirements",
                            useButtons: true,
                            elementType: {
                                type: GROUP,
                                fields: [{
                                        name: "@class",
                                        value: "WRequirement",
                                        type: HIDDEN
                                    }, {
                                        //label: "Job",
                                        name: "work",
                                        type: "select",
                                        choices: persistence.Resources.SKILLS
                                    }, {
                                        label: "Level",
                                        name: "level",
                                        type: "select",
                                        choices: persistence.Resources.LEVELS
                                    }, {
                                        label: "Quantity",
                                        name: "quantity",
                                        type: NUMBER,
                                        value: 1
                                    }, {
                                        label: "Limit",
                                        name: "limit",
                                        type: NUMBER,
                                        value: 100
                                    }, {
                                        name: "completeness",
                                        type: HIDDEN
                                    }, {
                                        name: "quality",
                                        type: HIDDEN
                                    }]
                            }
                        }
                    },
                    duration: {
                        type: NUMBER
                    },
                    properties: {
                        _inputex: {
                            label: "Instance properties",
                            _type: HASHLIST,
                            keyField: NAME,
                            valueField: VALUE,
                            useButtons: true,
                            elementType: PROPERTIESELEMENTTYPE
                        }
                    }
                }
            }
        }, METHODS: {
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
            getDuration: {
                label: "Get Duration",
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            },
            addAtDuration: {
                label: "Add to duration",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            setDuration: {
                label: "Set duration",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
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
            duration: {
                type: NUMBER
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
                _inputex: Y.Wegas.persistence.TaskDescriptor.ATTRS.defaultInstance.properties.requirements._inputex
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
            editable: {
                type: BOOLEAN
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
