/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
    COMBINE = "combine",
    IDATTRDEF = {
        type: STRING,
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: HIDDEN
        }
    }, SKILLSDEF = {
        type: COMBINE,
        required: true,
        fields: [{
            type: SELECT,
            name: NAME,
            choices: [{
                value: 'softwareEngineer',
                label: "Software engineering"
            }, {
                value: 'webDesgign',
                label: "Web design"
            }, {
                value: 'negotiation',
                label: "Negotiation"
            }, {
                value: 'dbEngineer',
                label: "Database engineer"
            }, {
                value: 'processModeling',
                label: "Process modeling"
            },{
                value: 'graphicDesign',
                label: "Graphic design"
            }]
        }, {
            type: SELECT,
            name: VALUE,
            choices: [{
                value: 0,
                label: "Junior"
            }, {
                value: 20,
                label: "Intermediate"
            }, {
                value: 20,
                label: "Senior"
            }, {
                value: 99,
                label: "Expert"
            }]
        }]
    };

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
                    skillset: {
                        _inputex: {
                            label: "Default skills",
                            _type: HASHLIST,
                            elementType: SKILLSDEF
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
            skillset: {
                name: "skillset",
                _inputex: {
                    label: "Skills",
                    _type: HASHLIST,
                    elementType: SKILLSDEF
                }
            },
            assignments: {
                type: ARRAY,
                value: []
            },
            moralHistory: {
                type: ARRAY
            },
            confidenceHistory: {
                type: ARRAY
            }
        }
    });

    /**
     * TaskDescriptor mapper
     */
    Y.Wegas.persistence.TaskDescriptor = Y.Base.create("TaskDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {}, {
        ATTRS: {
            "@class": {
                value: "TaskDescriptor"
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
                    properties: {
                        optional: false,
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
                    },
                    skillset: {
                        _inputex: {
                            label: "Default skillset",
                            _type: OBJECT
                        }
                    }
                }
            },
            description: {
                type: STRING,
                format: HTML
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
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: OBJECT
                }
            },
            skillset: {
                _inputex: {
                    label: "Skillset",
                    _type: OBJECT
                }
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
