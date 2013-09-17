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
Y.Wegas.persistence.ResourceDescriptor.METHODS.getNumberInstanceProperty = {
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
};
Y.Wegas.persistence.ResourceDescriptor.METHODS.addAtInstanceProperty = {
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
};
Y.Wegas.persistence.ResourceDescriptor.METHODS.setInstanceProperty = {
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
};
