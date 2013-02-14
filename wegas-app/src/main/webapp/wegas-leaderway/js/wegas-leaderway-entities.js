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
                format: 'html'
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
                        type: "string",
                        _inputex: {
                            label: "Moral"
                        }
                    },
                    moralHistory: {
                        type: "array"
                    },
                    confidence: {
                        name: "confidence",
                        type: "string",
                        _inputex: {
                            label: "Confiance"
                        }
                    },
                    properties: {
                        _inputex: {
                            _type: "object",
                            label: "Default properties"
                        }
                    },
                    skillset: {
                        optional: false,
                        _inputex: {
                            _type: "object",
                            label: "Default skills"
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
                type: "string"
            },
            confidence: {
                type: "string"
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: "object"
                }
            },
            skillset: {
                name: "skillset",
                _inputex: {
                    label: "Skills",
                    _type: "object"
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
                        type: "string"
                    },
                    properties: {
                        _inputex: {
                            label: "Default properties",
                            _type: "object"
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
                type: "string"
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

    Y.Wegas.persistence.InboxDescriptor = Y.Base.create("", Y.Wegas.persistence.VariableDescriptor, [], {}, {
        ATTRS: {
            "@class": {
                value: "InboxDescriptor"
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: 'InboxInstance',
                        _inputex: {
                            _type: 'hidden',
                            value: 'TaskInstance'
                        }
                    },
                    id: IDATTRDEF
                }
            }
        },
        METHODS: {
            sendMessage: {
                label: "send message",
                className: "wegas-method-sendmessage",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }, {
                    type: "string",
                    label: "from",
                    scriptType: "string"
                }, {
                    type: "string",
                    label: "title",
                    scriptType: "string"
                }, {
                    type: "text",
                    label: "Content",
                    scriptType: "string"
                }, {
                    type: "list",
                    label: "Attachements",
                    scriptType: "string",
                    useButtons: true,
                    /*sortable: true*/
                    elementType: {
                        type: "wegasurl",
                        label: "",
                        required: true
                    }
                }]
            },
            isEmpty: {
                label: "is empty",
                returns: "boolean",
                arguments: [{
                    type: "hidden",
                    value: "self"
                }]
            }

        }
    });
    /**
     * InboxInstance mapper
     */
    Y.Wegas.persistence.InboxInstance = Y.Base.create("InboxInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "InboxInstance",
                _inputex: {
                    disabled: true,
                    label: "Nothing to edit"
                }
            },
            messages: {
                type: "array",
                "transient": true,
                value: []
            }
        }
    });

    /**
     * Message mapper
     */
    Y.Wegas.persistence.Message = Y.Base.create("Message", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "Message"
            },
            subject: {},
            body: {},
            unread: {
                value: false,
                type: "boolean"
            },
            from: {},
            attachements: {}
        }
    });

    /**
     * Script mapper
     */
    Y.Wegas.persistence.Script = Y.Base.create("Script", Y.Wegas.persistence.Entity, [], {
        initializer: function() {
            this.publish("evaluated");
            this._inProgress = false;
            this._result = null;
        },
        isValid: function() {
        // @todo : FX a greffer :)
        },
        /*
         * evaluated event contains response. true or false. False if script error.
         */
        localEval: function() {
            if (Y.Wegas.VariableDescriptorFacade.script.scopedEval) {
                if (this._result) {
                    this.fire("evaluated", this._result);
                    return;
                }
                if (!this._eHandler) {
                    this._eHandler = Y.Wegas.VariableDescriptorFacade.script.on("ScriptEval:evaluated", function(e, o, id) {

                        if (this._yuid !== id) {
                            return;
                        }
                        e.halt(true);
                        if (o === true) {
                            this._result = true;
                        } else {
                            this._result = false;
                        }
                        this._inProgress = false;
                        this.fire("evaluated", this._result);
                    }, this);
                }
                if (!this._fHandler) {
                    this._fHandler = Y.Wegas.VariableDescriptorFacade.script.on("ScriptEval:failure", function(e, o, id) {

                        if (this._yuid !== id) {
                            return;
                        }
                        e.halt(true);
                        this._inProgress = false;
                        this.fire("evaluated", false);

                    }, this);
                }

                if (!this._inProgress) {
                    this._inProgress = true;
                    Y.Wegas.VariableDescriptorFacade.script.scopedEval(this.get("content"), this._yuid);
                } else {
                    Y.log("evaluation in progress");
                }
            }
        },
        isEmpty: function() {
            return (this.content === null || this.content === "");
        },
        destructor: function() {
            this._fHandler.detach();
            this._eHandler.detach();
        }
    }, {
        ATTRS: {
            id: {
                value: undefined, // An Embeddable has no ID !!! Forcing it
                readOnly: true,
                "transient": true
            },
            "@class": {
                value: "Script",
                type: "string"
            },
            language: {
                value: "JavaScript",
                type: "string",
                choices: [{
                    value: "JavaScript"
                }],
                _inputex: {
                    //type:"select",
                    _type: "hidden"
                }
            },
            content: {
                type: "string",
                format: "text",
                setter: function(v) {
                    this._result = null;
                    return v;
                }
            }
        }
    });
});
