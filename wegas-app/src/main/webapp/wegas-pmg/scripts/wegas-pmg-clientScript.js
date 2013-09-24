var STRING = "string", HIDDEN = "hidden", ARRAY = "array",
            SELF = "self", BOOLEAN = "boolean", NUMBER = "number",
            SELECT = "select", VALUE = "value", KEY = "key"
Y.Wegas.persistence.ListDescriptor.EDITMENU[1].plugins[0].cfg.children.push({type: "AddEntityChildButton", label: "Resource", targetClass: "ResourceDescriptor"}, {type: "AddEntityChildButton", label: "Task", targetClass: "TaskDescriptor"});
Y.Wegas.persistence.TaskDescriptor.METHODS.getNumberInstanceProperty = {
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
Y.Wegas.persistence.TaskDescriptor.METHODS.addAtInstanceProperty = {
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
Y.Wegas.persistence.TaskDescriptor.METHODS.setInstanceProperty = {
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

Y.Wegas.persistence.TaskDescriptor.METHODS.addAtRequirementVariable = {
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

Y.Wegas.persistence.TaskDescriptor.METHODS.setRequirementVariable = {
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

Y.Wegas.persistence.ResourceDescriptor.METHODS = {
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
    addAtInstanceProperty: {
        label: "Add at instance's property",
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

Y.Wegas.persistence.ResourceDescriptor.ATTRS.defaultInstance.properties.confidence = {
    name: NUMBER,
    optional: true,
    type: STRING,
    _inputex: {
        label: "Default confiance",
        _type: HIDDEN
    }
};
Y.Wegas.persistence.ResourceInstance.ATTRS.confidence = {
    type: NUMBER,
    optional: true,
    _inputex: {
        _type: HIDDEN
    }
};
Y.Wegas.persistence.ResourceInstance.ATTRS.moralHistory = {
    type: ARRAY,
    _inputex: {
        label: "Moral history",
        _type: HIDDEN,
        useButtons: true
    }
};
Y.Wegas.persistence.ResourceInstance.ATTRS.confidenceHistory = {
    type: ARRAY,
    _inputex: {
        label: "Confidence history",
        _type: HIDDEN,
        useButtons: true
    }
};
