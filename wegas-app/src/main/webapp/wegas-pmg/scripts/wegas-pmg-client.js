/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
var STRING = "string", HIDDEN = "hidden", ARRAY = "array",
    SELF = "self", BOOLEAN = "boolean", NUMBER = "number",
    SELECT = "select", VALUE = "value", KEY = "key", GROUP = "group",
    persistence = Y.Wegas.persistence;

/** 
 * Set available jobs in the edit form based on the employee folder content
 */
persistence.Resources.SKILLS.length = 0;                                        // Remove existing skills
Y.Array.each(Y.Wegas.Facade.Variable.cache.find("name", "employees").get("items"), function(vd) {
    persistence.Resources.SKILLS.push({label: vd.get("label"), value: vd.get("name")});
});

persistence.ListDescriptor.EDITMENU[1].plugins[0].cfg.children.push({
    type: "AddEntityChildButton",
    label: "Resource",
    targetClass: "ResourceDescriptor"
}, {
    type: "AddEntityChildButton",
    label: "Task",
    targetClass: "TaskDescriptor"
});

persistence.TaskDescriptor.ATTRS.properties._inputex = {
    type: GROUP,
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
    fields: [{
            name: "fixedCosts",
            label: "Fixed costs",
            type: NUMBER,
            value: 0
        }, {
            name: "predecessorsDependances",
            label: "Predecessors dependency",
            type: NUMBER,
            value: 1
        }, {
            name: "randomDurationInf",
            label: "Random duration delta inf.",
            type: NUMBER,
            value: 0
        }, {
            name: "randomDurationSup",
            label: "Random duration delta inf.",
            type: NUMBER,
            value: 0
        }, {
            name: "bonusRatio",
            label: "Bonus factor",
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
        }]
};
persistence.TaskDescriptor.METHODS.getNumberInstanceProperty = {
    label: "Get number instance's property",
    returns: NUMBER,
    arguments: [{
            type: HIDDEN,
            value: SELF
        }, {
            label: KEY,
            scriptType: STRING,
            type: SELECT,
            choices: [{
                    value: "fixedCosts"
                }, {
                    value: "quality"
                }, {
                    value: "completeness"
                }]
        }]
};
persistence.TaskDescriptor.METHODS.addNumberAtInstanceProperty = {
    label: "Add at instance's property",
    arguments: [{
            type: HIDDEN,
            value: SELF
        }, {
            label: KEY,
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
            label: VALUE,
            scriptType: STRING
        }]
};
persistence.TaskDescriptor.METHODS.setInstanceProperty = {
    label: "Set instance's property",
    arguments: [{
            type: HIDDEN,
            value: SELF
        }, {
            label: KEY,
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
            label: VALUE,
            scriptType: STRING
        }]
};

persistence.TaskDescriptor.METHODS.addAtRequirementVariable = {
    label: "Add at requirements",
    arguments: [{
            type: HIDDEN,
            value: SELF
        }, {
            type: "entityarrayfieldselect",
            returnAttr: "id",
            scope: "instance",
            field: "requirements",
            name: {
                values: ["quantity", "work", "level"],
                separator: " - "
            }
        }, {
            label: KEY,
            scriptType: STRING,
            type: SELECT,
            choices: [{
                    value: "quantity"
                }, {
                    value: "level"
                }]
        }, {
            type: STRING,
            label: VALUE,
            scriptType: STRING
        }]
};

persistence.TaskDescriptor.METHODS.setRequirementVariable = {
    label: "set requirements",
    arguments: [{
            type: HIDDEN,
            value: SELF
        }, {
            type: "entityarrayfieldselect",
            returnAttr: "id",
            scope: "instance",
            field: "requirements"
        }, {
            label: KEY,
            scriptType: STRING,
            type: SELECT,
            choices: [{
                    value: "quantity"
                }, {
                    value: "level"
                }]
        }, {
            type: STRING,
            label: VALUE,
            scriptType: STRING
        }]
};

/**
 * Resource descriptor edition customisation
 */
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
            value: 0
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
persistence.ResourceDescriptor.METHODS = {
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
                type: "html",
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
    getNumberInstanceProperty: {
        label: "Get number instance's property",
        returns: NUMBER,
        arguments: [{
                type: HIDDEN,
                value: SELF
            }, {
                label: KEY,
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
        label: "Add number at instance's property",
        arguments: [{
                type: HIDDEN,
                value: SELF
            }, {
                label: KEY,
                scriptType: STRING,
                type: SELECT,
                choices: [{
                        value: "activityRate"
                    }, {
                        value: "wage"
                    }]
            }, {
                type: STRING,
                label: VALUE,
                scriptType: STRING
            }]
    },
    setInstanceProperty: {
        label: "Set instance's property",
        arguments: [{
                type: HIDDEN,
                value: SELF
            }, {
                label: KEY,
                scriptType: STRING,
                type: SELECT,
                choices: [{
                        value: "activityRate"
                    }, {
                        value: "wage"
                    }]
            }, {
                type: STRING,
                label: VALUE,
                scriptType: STRING
            }]
    },
    getSkillset: {
        label: "Get skillset",
        returns: NUMBER,
        arguments: [{
                type: HIDDEN,
                value: SELF
            }, {
                label: KEY,
                scriptType: STRING,
                type: SELECT,
                choices: persistence.Resources.SKILLS
            }]
    },
    addAtSkillset: {
        label: "Add at skillset",
        arguments: [{
                type: HIDDEN,
                value: SELF
            }, {
                label: KEY,
                scriptType: STRING,
                type: SELECT,
                choices: persistence.Resources.SKILLS
            }, {
                type: STRING,
                label: VALUE,
                scriptType: STRING
            }]
    },
    setSkillset: {
        label: "Set skillset",
        arguments: [{
                type: HIDDEN,
                value: SELF
            }, {
                label: KEY,
                scriptType: STRING,
                type: SELECT,
                choices: persistence.Resources.SKILLS
            }, {
                type: STRING,
                label: VALUE,
                scriptType: STRING
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
};
