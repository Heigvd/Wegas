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
YUI.add('wegas-leaderway-entities', function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "name",
            SELF = "self", BOOLEAN = "boolean", NUMBER = "number", SELECT = "select",
            OBJECT = "object", HTML = "html", VALUE = "value", HASHLIST = "hashlist",
            COMBINE = "combine", GROUP = "group", LIST = "list",
            IDATTRDEF = {
        type: STRING,
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: HIDDEN
        }
    }

    /**
     * ResourceDescriptor mapper
     */
    Y.Wegas.persistence.ResourceDescriptor = Y.Base.create("ResourceDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {}, {
        ATTRS: {
            "@class": {
                value: "ResourceDescriptor"
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: HASHLIST,
                    elementType: {
                        type: COMBINE,
                        required: true,
                        fields: [{
                                name: NAME,
                                typeInvite: NAME
                            }, {
                                name: VALUE,
                                typeInvite: VALUE
                            }]
                    }
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
                    moral: {
                        type: NUMBER,
                        optional: true,
                        _inputex: {
                            label: "Default moral"
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
                        optional: true,
                        type: STRING,
                        _inputex: {
                            label: "Default confiance"
                        }
                    },
                    properties: {
                        _inputex: {
                            label: "Default properties",
                            _type: HASHLIST,
                            elementType: {
                                type: COMBINE,
                                required: true,
                                fields: [{
                                        name: NAME,
                                        typeInvite: NAME
                                    }, {
                                        name: VALUE,
                                        typeInvite: VALUE
                                    }]
                            }
                        }
                    },
                    skillsets: {
                        _inputex: {
                            label: "Default skills",
                            _type: HASHLIST,
                            elementType: {
                                type: COMBINE,
                                required: true,
                                fields: [{
                                        name: NAME,
                                        typeInvite: NAME
                                    }, {
                                        name: VALUE,
                                        typeInvite: VALUE
                                    }]
                            }
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
                label: "Add at confidence",
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
                label: "Add at moral",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            setMoral: {
                label: "Set moral",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            addOccupation: {
                label: "add occupation",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: NUMBER,
                        label: "Time",
                        scriptType: NUMBER,
                        value: 1
                    }, {
                        type: BOOLEAN,
                        label: "Editable",
                        scriptType: BOOLEAN
                    }, {
                        type: HTML,
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
                        value: 1
                    }]
            },
            getInstanceProperty: {
                label: "Get instance's property",
                returns: STRING,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "Key",
                        scriptType: STRING

                    }]
            },
            setInstanceProperty: {
                label: "Set instance's property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "Key",
                        scriptType: STRING

                    }, {
                        type: STRING,
                        label: "Value",
                        scriptType: STRING

                    }]
            },
            addAtInstanceProperty: {
                label: "Add at instance's property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "Key",
                        scriptType: STRING

                    }, {
                        type: STRING,
                        label: "Value",
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
                label: "Add at salary",
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
                label: "Add at experience",
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
                label: "Add at leadership level",
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
    Y.Wegas.persistence.ResourceInstance = Y.Base.create("ResourceInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
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
                    elementType: {
                        type: COMBINE,
                        required: true,
                        fields: [{
                                name: NAME,
                                typeInvite: NAME
                            }, {
                                name: VALUE,
                                typeInvite: VALUE
                            }]
                    }
                }
            },
            skillsets: {
                name: "skillsets",
                _inputex: {
                    label: "Skills",
                    _type: HASHLIST,
                    elementType: {
                        type: COMBINE,
                        required: true,
                        fields: [{
                                name: NAME,
                                typeInvite: NAME
                            }, {
                                name: VALUE,
                                typeInvite: VALUE
                            }]
                    }
                }
            },
            assignments: {
                type: ARRAY,
                value: []
            },
            occupations: {
                type: ARRAY,
                value: []
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
    Y.Wegas.persistence.TaskDescriptor = Y.Base.create("TaskDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {
        findAssociatedRessources: function(abstractAssignments) {
            var ressources, i, data = [], assignments, dict;
            ressources = Y.Wegas.Facade.VariableDescriptor.cache.findAll("@class", "ResourceDescriptor");
            Y.Array.forEach(ressources, function(employee) {
                assignments = employee.getInstance().get(abstractAssignments);
                for (i = 0; i < assignments.length; i++) {
                    dict = {};
                    if (assignments[i].get('taskDescriptorId') === this.get("id")) {
                        dict["taskDescriptor"] = this;
                        dict["ressourceInstance"] = employee.getInstance();
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
            description: {
                type: STRING,
                format: HTML,
                optional: true
            },
            index: {
                type: NUMBER,
                format: HTML,
                optional: true
            },
            predecessors: {
                type: ARRAY,
                value: [],
                _inputex: {
                    label: "Predecessors",
                    _type: LIST,
                    useButtons: true,
                    elementType: {
                        type: SELECT,
                        value: "taskDescriptorId"
                    }
                }
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: HASHLIST,
                    keyField: NAME,
                    valueField: VALUE,
                    elementType: {
                        type: COMBINE,
                        fields: [{
                                name: NAME,
                                typeInvite: NAME
                            }, {
                                name: VALUE,
                                typeInvite: VALUE
                            }]
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
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    },
                    duration: {
                        type: NUMBER
                    },
                    plannification: {
                        type: ARRAY
                    },
                    requirements: {
                        type: ARRAY,
                        _inputex: {
                            label: "Default requirements",
                            _type: LIST,
                            useButtons: true,
                            keyField: NAME,
                            valueField: VALUE,
                            elementType: {
                                type: GROUP,
                                fields: [{
                                        name: "@class",
                                        type: HIDDEN,
                                        value: "WRequirement"
                                    }, {
                                        label: "Work",
                                        name: "work",
                                        typeInvite: NAME
//                                        type: "wegasvarautocomplete",
//                                        variableClass: "WRequirement"
                                    }, {
                                        label: "Limit",
                                        name: "limit",
                                        typeInvite: VALUE
                                    }, {
                                        label: "Level",
                                        name: "level",
                                        typeInvite: VALUE
                                    }, {
                                        label: "Number",
                                        name: "quantity",
                                        typeInvite: VALUE
                                    }, {
                                        label: "completeness",
                                        name: "completeness",
                                        type: HIDDEN
                                    }, {
                                        label: "quality",
                                        name: "quality",
                                        type: HIDDEN
                                    }]
                            }
                        }
                    },
                    properties: {
                        _inputex: {
                            label: "Default properties",
                            _type: HASHLIST,
                            keyField: NAME,
                            valueField: VALUE,
                            elementType: {
                                type: COMBINE,
                                fields: [{
                                        name: NAME,
                                        typeInvite: NAME
                                    }, {
                                        name: VALUE,
                                        typeInvite: VALUE
                                    }]
                            }
                        }
                    }
                }
            }
        }, METHODS: {
            getInstanceProperty: {
                label: "Get instance's property",
                returns: STRING,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "Key",
                        scriptType: STRING

                    }]
            },
            setInstanceProperty: {
                label: "Set instance's property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "Key",
                        scriptType: STRING

                    }, {
                        type: STRING,
                        label: "Value",
                        scriptType: STRING

                    }]
            },
            addAtInstanceProperty: {
                label: "Add at instance's property",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "Key",
                        scriptType: STRING

                    }, {
                        type: STRING,
                        label: "Value",
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
                label: "Add at duration",
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
    Y.Wegas.persistence.TaskInstance = Y.Base.create("TaskInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
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
                _inputex: {
                    label: "requirements",
                    _type: LIST,
                    useButtons: true,
                    keyField: NAME,
                    valueField: VALUE,
                    elementType: {
                        type: GROUP,
                        fields: [{
                                name: "@class",
                                type: HIDDEN
                            }, {
                                label: "Work",
                                name: "work",
                                typeInvite: NAME
                            }, {
                                label: "Limit",
                                name: "limit",
                                typeInvite: VALUE
                            }, {
                                label: "Level",
                                name: "level",
                                typeInvite: VALUE
                            }, {
                                label: "Number",
                                name: "quantity",
                                typeInvite: VALUE
                            }, {
                                label: "completeness",
                                name: "completeness",
                                type: HIDDEN
                            }, {
                                label: "quality",
                                name: "quality",
                                type: HIDDEN
                            }]
                    }
                }
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: OBJECT
                }
            },
            plannification: {
                type: ARRAY
            }
        }
    });

    /**
     * Requirements mapper
     */
    Y.Wegas.persistence.WRequirement = Y.Base.create("WRequirement", Y.Wegas.persistence.Entity, [], {}, {
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
    Y.Wegas.persistence.Activity = Y.Base.create("Activity", Y.Wegas.persistence.Entity, [], {}, {
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
    Y.Wegas.persistence.Occupation = Y.Base.create("Occupation", Y.Wegas.persistence.Entity, [], {}, {
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
    Y.Wegas.persistence.Assignment = Y.Base.create("Assignment", Y.Wegas.persistence.Entity, [], {}, {
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
