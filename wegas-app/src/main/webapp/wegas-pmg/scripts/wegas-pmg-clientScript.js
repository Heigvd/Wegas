Y.Wegas.persistence.ListDescriptor.EDITMENU[1].plugins[0].cfg.children.push({type: "AddEntityChildButton", label: "Resource", targetClass: "ResourceDescriptor"}, {type: "AddEntityChildButton", label: "Task", targetClass: "TaskDescriptor"});
Y.Wegas.persistence.TaskDescriptor.METHODS.getNumberInstanceProperty = {
    label: "Get number instance's property",
    returns: "number",
    arguments: [{
            type: "hidden",
            value: "self"
        }, {
            label: "Key",
            scriptType: "string",
            type: "select",
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
            type: "hidden",
            value: "self"
        }, {
            label: "Key",
            type: "select",
            scriptType: "string",
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
            type: "string",
            label: "Value",
            scriptType: "string"

        }]
};
Y.Wegas.persistence.TaskDescriptor.METHODS.setInstanceProperty = {
    label: "Set instance's property",
    arguments: [{
            type: "hidden",
            value: "self"
        }, {
            label: "Key",
            scriptType: "string",
            type: "select",
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
            type: "string",
            label: "Value",
            scriptType: "string"

        }]
};

Y.Wegas.persistence.TaskDescriptor.METHODS.addAtRequirementVariable = {
    label: "Add at requirements",
    arguments: [{
            type: "hidden",
            value: "self"
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
            label: "Key",
            scriptType: "string",
            type: "select",
            choices: [{
                    value: "quantity"
                }, {
                    value: "level"
                }]
        }, {
            type: "string",
            label: "Value",
            scriptType: "string"
        }]
};

Y.Wegas.persistence.TaskDescriptor.METHODS.setRequirementVariable = {
    label: "set requirements",
    arguments: [{
            type: "hidden",
            value: "self"
        }, {
            type: "entityarrayfieldselect",
            returnAttr: "id",
            scope: "instance",
            field: "requirements"
        }, {
            label: "Key",
            scriptType: "string",
            type: "select",
            choices: [{
                    value: "quantity"
                }, {
                    value: "level"
                }]
        }, {
            type: "string",
            label: "Value",
            scriptType: "string"
        }]
};

Y.Wegas.persistence.ResourceDescriptor.METHODS = {
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
    addOccupation: {
        label: "add occupation",
        arguments: [{
                type: "hidden",
                value: "self"
            }, {
                type: "number",
                label: "Time",
                scriptType: "number",
                value: 1
            }, {
                type: "boolean",
                label: "Editable",
                scriptType: "boolean"
            }, {
                type: "html",
                label: "Description",
                scriptType: "string"
            }
        ]
    },
    removeOccupationsAtTime: {
        label: "Remove occupation",
        arguments: [{
                type: "hidden",
                value: "self"
            }, {
                type: "number",
                value: 1
            }]
    },
    getNumberInstanceProperty: {
        label: "Get number instance's property",
        returns: "number",
        arguments: [{
                type: "hidden",
                value: "self"
            }, {
                label: "Key",
                scriptType: "string",
                type: "select",
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
                type: "hidden",
                value: "self"
            }, {
                label: "Key",
                scriptType: "string",
                type: "select",
                choices: [{
                        value: "activityRate"
                    }, {
                        value: "wage"
                    }]
            }, {
                type: "string",
                label: "Value",
                scriptType: "string"
            }]
    },
    addAtInstanceProperty: {
        label: "Add at instance's property",
        arguments: [{
                type: "hidden",
                value: "self"
            }, {
                label: "Key",
                scriptType: "string",
                type: "select",
                choices: [{
                        value: "activityRate"
                    }, {
                        value: "wage"
                    }]
            }, {
                type: "string",
                label: "Value",
                scriptType: "string"
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
};

Y.Wegas.persistence.ResourceDescriptor.ATTRS.defaultInstance.properties.confidence = {
    name: "number",
    optional: true,
    type: "string",
    _inputex: {
        label: "Default confiance",
        _type: "hidden"
    }
};
Y.Wegas.persistence.ResourceInstance.ATTRS.confidence = {
    type: "number",
    optional: true,
    _inputex: {
        _type: "hidden"
    }
};
Y.Wegas.persistence.ResourceInstance.ATTRS.moralHistory = {
    type: "array",
    _inputex: {
        label: "Moral history",
        _type: "hidden",
        useButtons: true
    }
};
Y.Wegas.persistence.ResourceInstance.ATTRS.confidenceHistory = {
    type: "array",
    _inputex: {
        label: "Confidence history",
        _type: "hidden",
        useButtons: true
    }
};
