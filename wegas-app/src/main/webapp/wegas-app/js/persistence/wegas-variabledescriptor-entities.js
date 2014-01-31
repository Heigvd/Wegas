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
YUI.add('wegas-variabledescriptor-entities', function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "name",
            SELF = "self", BOOLEAN = "boolean", NUMBER = "number",
            ITEMS = "items", BUTTON = "Button", VALUE = "value", TEXT = "text",
            HTML = "html",
            Wegas = Y.namespace("Wegas"), Base = Y.Base,
            IDATTRDEF = {
        type: STRING,
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: HIDDEN
        }
    };

    /**
     * VariableDescriptor mapper
     */
    Wegas.persistence.VariableDescriptor = Base.create("VariableDescriptor", Wegas.persistence.Entity, [], {
        getInstance: function(player) {
            var playerId = player instanceof Wegas.persistence.Player ? player.get("id") : player || Wegas.app.get('currentPlayer');
            return this.get("scope").getInstance(playerId);
        },
        getLabel: function() {
            return this.get("label");
        }
    }, {
        ATTRS: {
            label: {
                type: STRING,
                "transient": false,
                getter: function(val) {
                    return val || this.get(NAME);
                },
                _inputex: {
                    label: "Name",
                    index: -1
                }
            },
            name: {
                value: null,
                type: STRING,
                optional: true,
                _inputex: {
                    wrapperClassName: 'wegas-advanced-feature',
                    label: "Script alias",
                    index: -1,
                    //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
                    description: "Alphanumeric characters,'_','$'. Without a digit as first character.<br/>Changing this may break your scripts."
                },
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            scope: {
                valueFn: function() {
                    return new Wegas.persistence.TeamScope();                 // Should the default scope be set server or client side?
                },
                validator: function(o) {
                    return o instanceof Wegas.persistence.Scope;
                },
                properties: {
                    "@class": {
                        type: STRING,
                        choices: [{
                                value: "TeamScope",
                                label: 'different for each team'
                            }, {
                                value: "PlayerScope",
                                label: 'different for each user'
                            }, {
                                value: "GameScope",
                                label: 'different for each game'
                            }, {
                                value: "GameModelScope",
                                label: 'the same for everybody'
                            }],
                        _inputex: {
                            wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                            label: 'Variable is'
                        }
                    },
                    broadcastScope: {
                        type: STRING,
                        choices: [{
                                value: "TeamScope",
                                label: 'anyone in the player\'s team'
                            }, {
                                value: "PlayerScope",
                                label: 'the current player only'
                            }, {
                                value: "GameScope",
                                label: 'anybody in the game'
                            }],
                        _inputex: {
                            wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                            label: 'Variable is visible by'
                        }
                    }
                }
            },
            defaultInstance: {
                value: null,
                validator: function(o) {
                    return o instanceof Wegas.persistence.VariableInstance;
                }
            }
        },
        EDITMENU: [{
                type: "EditEntityButton"
            }, {
                type: BUTTON,
                label: "Copy",
                plugins: [{
                        fn: "DuplicateEntityAction"
                    }]
            }, {
                type: "DeleteEntityButton"
            }]
    });


    /**
     * Scope mapper
     */
    Wegas.persistence.Scope = Base.create("Scope", Wegas.persistence.Entity, [], {
        getInstance: function() {
            Y.error("SHOULD BE OVERRIDDEN, abstract!", new Error("getInstance, abstract"), "Wegas.persistance.Scope");
        }
    }, {
        ATTRS: {
            variableInstances: {
                "transient": true,
                getter: function(val) {
                    if (!val) {
                        return this.get("privateInstances");
                    }
                    return val;
                }
            },
            privateInstances: {
                value: {},
                "transient": true
            },
            broadcastScope: {}
        }
    });
    /**
     * GameModelScope mapper
     */
    Wegas.persistence.GameModelScope = Base.create("GameModelScope", Wegas.persistence.Scope, [], {
        getInstance: function() {
            return this.get("variableInstances")[0];
        }
    }, {
        ATTRS: {
            "@class": {
                value: "GameModelScope"
            }
        }
    });
    /**
     * GameScope mapper
     */
    Wegas.persistence.GameScope = Base.create("GameScope", Wegas.persistence.Scope, [], {
        getInstance: function() {
            return this.get("variableInstances")["" + Wegas.app.get('currentGame')];
        }
    }, {
        ATTRS: {
            "@class": {
                value: "GameScope"
            }
        }
    });

    /**
     * TeamScope mapper
     */
    Wegas.persistence.TeamScope = Base.create("TeamScope", Wegas.persistence.Scope, [], {
        getInstance: function(playerId) {
            return this.get("variableInstances")[Wegas.app.get('currentTeam')];
        }
    }, {
        ATTRS: {
            "@class": {
                value: "TeamScope"
            }
        }
    });

    /**
     * PlayerScope mapper
     */
    Wegas.persistence.PlayerScope = Base.create("PlayerScope", Wegas.persistence.Scope, [], {
        getInstance: function(playerId) {
            return this.get("variableInstances")[playerId];
        }
    }, {
        ATTRS: {
            "@class": {
                value: "PlayerScope"
            }
        }
    });

    /**
     * VariableInstance mapper
     */
    Wegas.persistence.VariableInstance = Base.create("VariableInstance", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            descriptorId: {
                type: STRING,
                _inputex: {
                    _type: HIDDEN
                }
            }
        },
        EDITMENU: [{
                type: "EditEntityButton"
            }]
    });
    /**
     * Meant to augment primitive Descriptors (Number, Text, String) with some functions
     */
    Wegas.persistence.PrimitiveDescriptor = Base.create("Primitive", Wegas.persistence.Entity, [], {
        getValue: function(player) {
            return this.getInstance(player).get(VALUE);
        }
    });
    /**
     * StringDescriptor mapper
     */
    Wegas.persistence.StringDescriptor = Base.create("StringDescriptor", Wegas.persistence.VariableDescriptor, [Wegas.persistence.PrimitiveDescriptor], {}, {
        ATTRS: {
            "@class": {
                value: "StringDescriptor"
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            value: 'StringInstance',
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: STRING,
                        _inputex: {
                            label: 'Default value'
                        }
                    }

                }
            }
        }
    });
    /**
     * StringInstance mapper
     */
    Wegas.persistence.StringInstance = Base.create("StringInstance", Wegas.persistence.VariableInstance, [Wegas.persistence.PrimitiveDescriptor], {}, {
        ATTRS: {
            "@class": {
                value: "StringInstance"
            },
            value: {
                type: STRING
            }
        }
    });
    /**
     * StringDescriptor mapper
     */
    Wegas.persistence.TextDescriptor = Base.create("TextDescriptor", Wegas.persistence.VariableDescriptor, [Wegas.persistence.PrimitiveDescriptor], {}, {
        ATTRS: {
            "@class": {
                value: "TextDescriptor"
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            value: 'TextInstance',
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: HTML,
                        optional: true,
                        _inputex: {
                            label: 'Default value'
                        }
                    }

                }
            }
        },
        METHODS: {
            setValue: {
                label: "set",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: HTML,
                        value: "",
                        scriptType: STRING
                    }]
            },
            getValue: {
                label: VALUE,
                returns: STRING,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            }
        }
    });
    /**
     * TextInstance mapper
     */
    Wegas.persistence.TextInstance = Base.create("TextInstance", Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "TextInstance"
            },
            value: {
                type: STRING,
                format: HTML,
                optional: true
            }
        }
    });
    /**
     * NumberDescriptor mapper
     */
    Wegas.persistence.NumberDescriptor = Base.create("NumberDescriptor", Wegas.persistence.VariableDescriptor, [Wegas.persistence.PrimitiveDescriptor], {}, {
        ATTRS: {
            "@class": {
                value: "NumberDescriptor"
            },
            minValue: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: 'Minimum'
                }
            },
            maxValue: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: 'Maximum'
                }
            },
            defaultValue: {
                type: STRING,
                "transient": true
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            value: 'NumberInstance',
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: STRING,
                        _inputex: {
                            label: 'Default value',
                            regexp: /^[0-9]*$/
                        }
                    }

                }
            }
        },
        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {
            add: {
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            sub: {
                label: "substract",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            setValue: {
                label: "set",
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: 1
                    }]
            },
            getValue: {
                label: VALUE,
                returns: NUMBER,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            }
        }
    });
    /**
     * NumberInstance mapper
     */
    Wegas.persistence.NumberInstance = Base.create("NumberInstance", Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "NumberInstance"
            },
            value: {
                type: STRING,
                _inputex: {
                    regexp: /^[0-9]*$/
                }
            },
            history: {
                type: ARRAY,
                _inputex: {
                    _type: "list",
                    useButtons: true,
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            }
        }
    });
    /**
     * ListDescriptor mapper
     */
    Wegas.persistence.ListDescriptor = Base.create("ListDescriptor", Wegas.persistence.VariableDescriptor, [], {
        /**
         * Extend clone to add transient childs
         */
        clone: function() {
            var object = Wegas.Editable.prototype.clone.call(this), i;
            object.items = [];
            for (i in this.get(ITEMS)) {
                object.items.push(this.get(ITEMS)[i].clone());
            }
            return object;
        },
        flatten: function() {
            var acc = [],
                    doFlatten = function(items) {
                var i, it;
                for (i = 0; i < items.length; i += 1) {
                    it = items[i];
                    if (it instanceof Wegas.persistence.QuestionDescriptor) {
                        acc.push(it);
                    } else if (it instanceof Wegas.persistence.ListDescriptor) {
                        doFlatten(it.get(ITEMS));
                    } else {
                        acc.push(it);
                    }
                }
            };
            doFlatten(this.get(ITEMS));
            return acc;

        },
        find: function(id) {
            return this.depthFirstSearch(id);
        },
        depthFirstSearch: function(id) {
            var needle,
                    filterFn = function(it) {
                if (it.get("id") === +id) {
                    needle = it;
                    return false;
                } else if (it instanceof Wegas.persistence.ListDescriptor) {
                    return Y.Array.every(it.get(ITEMS), filterFn);
                } else {
                    return true;
                }
            };
            Y.Array.every(this.get(ITEMS), filterFn);
            return needle;
        }
    }, {
        ATTRS: {
            "@class": {
                value: "ListDescriptor"
            },
            items: {
                type: ARRAY,
                value: [],
                "transient": true,
                _inputex: {
                    _type: HIDDEN
                },
                setter: function(val) {
                    var i;
                    for (i = 0; i < val.length; i = i + 1) {                // We set up a back reference to the parent
                        val[i].parentDescriptor = this;
                    }
                    return val;
                }
            },
            /**
             * The currently selected element based on current ListInstance.
             */
            currentItem: {
                "transient": true,
                getter: function() {
                    var inst = this.getInstance();
                    if (!Y.Lang.isUndefined(inst)
                            && this.get(ITEMS)[inst.get(VALUE)]) {

                        return this.get(ITEMS)[inst.get(VALUE)];
                    } else {
                        return null;
                    }
                }
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            value: 'ListInstance',
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF
                }
            }
        },
        EDITORNAME: "Folder",
        EDITMENU: [{
                type: "EditEntityButton"
            }, {
                type: BUTTON,
                label: "New",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: [{
                                    type: "AddEntityChildButton",
                                    label: "Number",
                                    targetClass: "NumberDescriptor"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Text",
                                    targetClass: "TextDescriptor"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Folder",
                                    targetClass: "ListDescriptor"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Question",
                                    targetClass: "QuestionDescriptor"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Trigger",
                                    targetClass: "TriggerDescriptor"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Object",
                                    targetClass: "ObjectDescriptor"
                                }, {
                                    type: "NewEntityButton",
                                    label: "State machine",
                                    targetClass: "FSMDescriptor",
                                    cssClass: "experimental"
                                }, {
                                    type: "NewEntityButton",
                                    label: "Dialogue",
                                    targetClass: "DialogueDescriptor",
                                    cssClass: "experimental wegas-advaned-feature"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "String",
                                    targetClass: "StringDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "NewEntityButton",
                                    label: "Object",
                                    targetClass: "ObjectDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "NewEntityButton",
                                    label: "Inbox",
                                    targetClass: "InboxDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }]
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Copy",
                plugins: [{
                        fn: "DuplicateEntityAction"
                    }]
            }, {
                type: "DeleteEntityButton"
            }]
    });
    /*
     * ListInstance mapper
     */
    Wegas.persistence.ListInstance = Base.create("ListInstance", Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "ListInstance"
            }
        }
    });


    Wegas.persistence.InboxDescriptor = Base.create("InboxDescriptor", Wegas.persistence.VariableDescriptor, [], {
        isEmpty: function(player) {
            return this.getInstance(player).get("messages").length < 1;
        }
    }, {
        ATTRS: {
            "@class": {
                value: "InboxDescriptor"
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: 'InboxInstance'
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
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "From",
                        scriptType: STRING
                    }, {
                        type: STRING,
                        label: "Subject",
                        scriptType: STRING
                    }, {
                        type: HTML,
                        label: "Body",
                        scriptType: STRING
                    }, {
                        type: "list",
                        label: "Attachements",
                        scriptType: STRING,
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
                returns: BOOLEAN,
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
            }

        }
    });

    /**
     * InboxInstance mapper
     */
    Wegas.persistence.InboxInstance = Base.create("InboxInstance", Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "InboxInstance",
                _inputex: {
                    disabled: true,
                    label: "Nothing to edit"
                }
            },
            messages: {
                type: ARRAY,
                "transient": true,
                value: []
            }
        }
    });

    /**
     * Message mapper
     */
    Wegas.persistence.Message = Base.create("Message", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "Message"
            },
            subject: {},
            body: {},
            unread: {
                value: false,
                type: BOOLEAN
            },
            from: {},
            attachements: {}
        }
    });

    /**
     * Script mapper
     */
    Wegas.persistence.Script = Base.create("Script", Wegas.persistence.Entity, [], {
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
            if (Wegas.Facade.VariableDescriptor.script.eval) {
                if (this._result) {
                    this.fire("evaluated", this._result);
                    return;
                }
                if (!this._inProgress) {
                    this._inProgress = true;
                    Wegas.Facade.VariableDescriptor.script.eval(this.get("content"), {
                        success: Y.bind(function(result) {
                            if (result === true) {
                                this._result = true;
                            } else {
                                this._result = false;
                            }
                            this._inProgress = false;
                            this.fire("evaluated", this._result);
                        }, this),
                        failure: Y.bind(function(result) {
                            this._result = false;
                            this._inProgress = false;
                            this.fire("evaluated", false);
                        }, this)});
                } else {
                    Y.log("evaluation in progress");
                }
            }
        },
        isEmpty: function() {
            return (this.content === null || this.content === "");
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
                type: STRING
            },
            language: {
                value: "JavaScript",
                type: STRING,
                choices: [{
                        value: "JavaScript"
                    }],
                _inputex: {
                    //type:"select",
                    _type: HIDDEN
                }
            },
            content: {
                type: STRING,
                format: TEXT,
                _inputex: {
                    _type: "script"
                },
                setter: function(v) {
                    this._result = null;
                    return v;
                }
            }
        }
    });

    /**
     *
     */
    Wegas.persistence.PageMeta = Base.create("wegas-pagemeta", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: STRING,
                optional: true
            }
        }
    });
});
