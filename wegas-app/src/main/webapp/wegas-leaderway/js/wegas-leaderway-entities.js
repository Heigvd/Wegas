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

    var IDATTRDEF = {
        type: "string",
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: "hidden"
        }
    }, SKILLSDEF = {
        type: 'combine',
        required: true,
        fields: [{
            type: "select",
            name: 'name',
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
            type: "select",
            name: 'value',
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
                type: "string",
                format: 'html',
                optional: true
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: "string",
                        _inputex: {
                            _type: 'hidden',
                            value: 'ResourceInstance'
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: 'boolean',
                        _inputex: {
                            label: "Active by default",
                            value: true
                        }
                    },
                    moral: {
                        type: "number",
                        optional: true,
                        _inputex: {
                            label: "Default moral"
                        }
                    },
                    moralHistory: {
                        type: "array",
                        optional: true,
                        _inputex: {
                            value: [],
                            _type: "hidden"
                        }
                    },
                    confidence: {
                        name: "number",
                        optional: true,
                        type: "string",
                        _inputex: {
                            label: "Default confiance"
                        }
                    },
                    properties: {
                        _inputex: {
                            label: "Default properties",
                            _type: "hashlist",
                            elementType: {
                                type: 'combine',
                                required: true,
                                fields: [{
                                    name: 'name',
                                    typeInvite: 'name'
                                }, {
                                    name: 'value',
                                    typeInvite: 'value'
                                }]
                            }
                        }
                    },
                    skillset: {
                        _inputex: {
                            label: "Default skills",
                            _type: "hashlist",
                            elementType: SKILLSDEF
                        }
                    }
                }
            }
        },
        METHODS: {
            getConfidence: {
                label: "Get confidence",
                returns: "number",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }]
            },
            addAtConfidence: {
                label: "Add at confidence",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            setConfidence: {
                label: "Set confidence",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            getMoral: {
                label: "Get moral",
                returns: "number",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }]
            },
            addAtMoral: {
                label: "Add at moral",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            setMoral: {
                label: "Set moral",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            //methods below are temporary ; only for CEP-Game
            getSalary: {
                label: "Get salary",
                returns: "number",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }]
            },
            addAtSalary: {
                label: "Add at salary",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            setSalary: {
                label: "Set salary",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            getExperience: {
                label: "Get experience",
                returns: "number",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }]
            },
            addAtExperience: {
                label: "Add at experience",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            setExperience: {
                label: "Set experience",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            getLeadershipLevel: {
                label: "Get leadership level",
                returns: "number",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }]
            },
            addAtLeadershipLevel: {
                label: "Add at leadership level",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            setLeadershipLevel: {
                label: "Set leadership level",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    value: 1
                }]
            },
            getActive: {
                label: "Is active",
                returns: "boolean",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }]
            },
            activate: {
                label: "Activate",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }]
            },
            desactivate: {
                label: "Desactivate",
                arguments: [{
                    type: "hidden",
                    value: "self"
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
                type: "boolean"
            },
            moral: {
                type: "number",
                optional: true
            },
            confidence: {
                type: "number",
                optional: true
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: "hashlist",
                    elementType: {
                        type: 'combine',
                        required: true,
                        fields: [{
                            name: 'name',
                            typeInvite: 'name'
                        }, {
                            name: 'value',
                            typeInvite: 'value'
                        }]
                    }
                }
            },
            skillset: {
                name: "skillset",
                _inputex: {
                    label: "Skills",
                    _type: "hashlist",
                    elementType: SKILLSDEF
                }
            },
            assignments: {
                type: "array",
                value: []
            },
            moralHistory: {
                type: "array"
            },
            confidenceHistory: {
                type: "array"
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
                        type: 'string',
                        _inputex: {
                            _type: 'hidden',
                            value: 'TaskInstance'
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: 'boolean',
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    },
                    duration: {
                        type: "number"
                    },
                    properties: {
                        optional: false,
                        _inputex: {
                            label: "Default properties",
                            _type: "hashlist",
                            keyField: "name",
                            valueField: "value",
                            elementType: {
                                type: 'combine',
                                fields: [{
                                    name: 'name',
                                    typeInvite: 'name'
                                }, {
                                    name: 'value',
                                    typeInvite: 'value'
                                }]
                            }
                        }
                    },
                    skillset: {
                        _inputex: {
                            label: "Default skillset",
                            _type: "object"
                        }
                    }
                }
            },
            description: {
                type: 'string',
                format: 'html'
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
                type: 'boolean'
            },
            duration: {
                type: "number"
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: "object"
                }
            },
            skillset: {
                _inputex: {
                    label: "Skillset",
                    _type: "object"
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
                type: 'string'
            }
        }
    });
});
