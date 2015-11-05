/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-variabledescriptor-entities", function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "name",
        SELF = "self", BOOLEAN = "boolean", NUMBER = "number",
        ITEMS = "items", BUTTON = "Button", VALUE = "value", TEXT = "text",
        HTML = "html", AVAILABLE_TYPES, OPTIONAL_AVAILABLE_TYPES,
        Wegas = Y.Wegas, persistence = Wegas.persistence, Base = Y.Base,
        IDATTRDEF = {
            type: STRING,
            optional: true, //                                                  // The id is optional for entites that
            // have not been persisted
            _inputex: {
                _type: HIDDEN
            }
        };

    AVAILABLE_TYPES = [
        {
            "label": "String",
            "value": "StringDescriptor"
        }, {
            "label": "Text",
            "value": "TextDescriptor"
        }, {
            "label": "Number",
            "value": "NumberDescriptor"
        }, {
            "label": "Folder",
            "value": "ListDescriptor"
        }, {
            "label": "Inbox",
            "value": "InboxDescriptor"
        }, {
            "label": "Boolean",
            "value": "BooleanDescriptor"
        }, {
            "label": "Question",
            "value": "QuestionDescriptor"
        }, {
            "label": "Task",
            "value": "TaskDescriptor"
        }, {
            "label": "Resource",
            "value": "ResourceDescriptor"
        }, {
            "label": "State Machine",
            "value": "FSMDescriptor"
        }, {
            "label": "Trigger",
            "value": "TriggerDescriptor"
        }, {
            "label": "Dialogue",
            "value": "DialogueDescriptor"
        }, {
            "label": "Peer Review",
            "value": "Peer Review Descriptor"
        }, {
            "label": "Object",
            "value": "ObjectDescriptor"
        }];

    persistence.AVAILABLE_TYPES = AVAILABLE_TYPES;

    OPTIONAL_AVAILABLE_TYPES = [{label: "none", value: ""}].concat(AVAILABLE_TYPES);

    persistence.OPTIONAL_AVAILABLE_TYPES = OPTIONAL_AVAILABLE_TYPES;

    /**
     * VariableDescriptor mapper
     */
    persistence.VariableDescriptor = Base.create("VariableDescriptor", persistence.Entity, [], {
        /**
         *
         */
        initializer: function() {
            persistence.VariableDescriptor.superclass.constructor.apply(this, arguments);
            Y.Object.each(this.getMethodCfgs(), function(i, key) {              // Push server methods defined in the METHODS static to the proto
                if (!this.constructor.prototype[key] && i.localEval) {
                    this.constructor.prototype[key] = i.localEval;
                }
            }, this);
        },
        /**
         *
         * @param {Y.Wegas.persistence.Player} player
         * @returns {Y.Wegas.persistence.VariableInstance}
         */
        getInstance: function(player) {
            return this.get("scope").getInstance(player || Wegas.Facade.Game.get("currentPlayer"));
        },
        /**
         *
         * @returns {String}
         */
        getLabel: function() {
            return this.get("label");
        },
        getIconCss: function() {
            return "wegas-icon-variabledescriptor wegas-icon-" + this.get("@class").toLowerCase();
        }
    }, {
        ATTRS: {
            comments: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: "text",
                    wrapperClassName: "wegas-comments",
                    index: 100
                }
            },
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
                    wrapperClassName: "wegas-advanced-feature",
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
                    return new persistence.TeamScope();                         // Should the default scope be set
                    // server or client side?
                },
                validator: function(o) {
                    return o instanceof persistence.Scope;
                },
                properties: {
                    "@class": {
                        type: STRING,
                        choices: [{
                                value: "TeamScope",
                                label: "different for each team"
                            }, {
                                value: "PlayerScope",
                                label: "different for each user"
                            }, {
                                value: "GameScope",
                                label: "different for each game"
                            }, {
                                value: "GameModelScope",
                                label: "the same for everybody"
                            }],
                        _inputex: {
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature",
                            label: "Variable is"
                        }
                    },
                    broadcastScope: {
                        type: STRING,
                        choices: [{
                                value: "TeamScope",
                                label: "anyone in the player's team"
                            }, {
                                value: "PlayerScope",
                                label: "the current player only"
                            }, {
                                value: "GameScope",
                                label: "anybody in the game"
                            }],
                        _inputex: {
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature",
                            label: "Variable is visible by"
                        }
                    }
                }
            },
            defaultInstance: {
                value: null,
                validator: function(o) {
                    return o instanceof persistence.VariableInstance;
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
            }, {
                type: BUTTON,
                label: "Export",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: [{
                                    type: "PrintButton",
                                    label: "Html"
                                }, {
                                    type: "PrintButton",
                                    label: "Html (Players document)",
                                    mode: "player"
                                }, {
                                    type: "PrintButton",
                                    label: "Pdf",
                                    outputType: "pdf"
                                }, {
                                    type: "PrintButton",
                                    label: "Pdf (Players document)",
                                    outputType: "pdf",
                                    mode: "player"
                                }, {
                                    type: "OpenEntityButton",
                                    label: "Json",
                                    url: "rest/Export/GameModel/VariableDescriptor/{id}"
                                }]
                        }
                    }]
            }, {
                type: BUTTON,
                label: "More",
                cssClass: "wegas-advanced-feature",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: []
                        }
                    }]
            }
        ]
    });

    /**
     * Scope mapper
     */
    persistence.Scope = Base.create("Scope", persistence.Entity, [], {
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
    persistence.GameModelScope = Base.create("GameModelScope", persistence.Scope, [], {
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
    persistence.GameScope = Base.create("GameScope", persistence.Scope, [], {
        getInstance: function() {
            return this.get("variableInstances")[String(Wegas.Facade.Game.get("currentGameId"))];
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
    persistence.TeamScope = Base.create("TeamScope", persistence.Scope, [], {
        getInstance: function(player) {
            return this.get("variableInstances")[player.get("team").get("id")];
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
    persistence.PlayerScope = Base.create("PlayerScope", persistence.Scope, [], {
        getInstance: function(player) {
            return this.get("variableInstances")[player.get("id")];
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
    persistence.VariableInstance = Base.create("VariableInstance", persistence.Entity, [], {}, {
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
    persistence.PrimitiveDescriptor = Base.create("Primitive", persistence.Entity, [], {
        getValue: function(player) {
            return this.getInstance(player).get(VALUE);
        }
    });
    /**
     * StringDescriptor mapper
     */
    persistence.StringDescriptor = Base.create("StringDescriptor",
        persistence.VariableDescriptor,
        [persistence.PrimitiveDescriptor],
        {
            getIconCss: function() {
                return "fa fa-font";
            }
        },
    {
        ATTRS: {
            "@class": {
                value: "StringDescriptor"
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            value: "StringInstance",
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: STRING,
                        _inputex: {
                            label: "Default value"
                        }
                    }

                }
            },
            allowedValues: {
                type: ARRAY,
                cssClass: "wegas-advanced-feature",
                _inputex: {
                    label: "Allowed Values",
                    elementType: {
                        required: true,
                        type: "string"
                    }
                }
            },
        },
        METHODS: {
            setValue: {
                label: "set",
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        value: "",
                        scriptType: STRING,
                        required: true
                    }]
            },
            getValue: {
                label: VALUE,
                returns: STRING,
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }],
                localEval: function(player) {
                    return this.getInstance(player).get(VALUE);
                }
            }
        }
    });
    /**
     * StringInstance mapper
     */
    persistence.StringInstance = Base.create("StringInstance",
        persistence.VariableInstance,
        [persistence.PrimitiveDescriptor],
        {},
        {
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
    persistence.TextDescriptor = Base.create("TextDescriptor",
        persistence.VariableDescriptor,
        [persistence.PrimitiveDescriptor],
        {
            getIconCss: function() {
                return "fa fa-paragraph";
            }
        }, {
        ATTRS: {
            "@class": {
                value: "TextDescriptor"
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            value: "TextInstance",
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: HTML,
                        optional: true,
                        _inputex: {
                            label: "Default value"
                        }
                    }

                }
            }
        },
        METHODS: {
            setValue: {
                label: "set",
                className: "wegas-method-returnline",
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: HTML,
                        value: "",
                        scriptType: STRING,
                        required: true
                    }]
            },
            getValue: {
                label: VALUE,
                returns: STRING,
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }],
                localEval: function(player) {
                    return this.getInstance(player).get(VALUE);
                }
            }
        }
    });
    /**
     * TextInstance mapper
     */
    persistence.TextInstance = Base.create("TextInstance", persistence.VariableInstance, [], {}, {
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
    persistence.NumberDescriptor = Base.create("NumberDescriptor",
        persistence.VariableDescriptor,
        [persistence.PrimitiveDescriptor],
        {
            getMaxValue: function() {
                return this.get("maxValue");
            },
            getMinValue: function() {
                return this.get("minValue");
            },
            getIconCss: function() {
                return "fa wegas-icon-numberdescriptor";
            }
        },
    {
        ATTRS: {
            "@class": {
                value: "NumberDescriptor"
            },
            minValue: {
                type: NUMBER,
                optional: true,
                _inputex: {
                    label: "Minimum"
                }
            },
            maxValue: {
                type: NUMBER,
                optional: true,
                _inputex: {
                    label: "Maximum"
                }
            },
            value: {
                "transient": true,
                getter: function() {
                    if (this.getInstance()) {
                        return this.getInstance().get(VALUE);
                    } else {
                        return null;
                    }
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
                            value: "NumberInstance",
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: NUMBER,
                        _inputex: {
                            label: "Default value"
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
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: NUMBER,
                        required: true
                    }]
            }, /*
             sub: {
             label: "subtract",
             "arguments": [{
             type: HIDDEN,
             value: SELF
             }, {
             type: NUMBER,
             required: true
             }]
             },*/
            setValue: {
                label: "set",
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: NUMBER,
                        required: true
                    }]
            },
            getValue: {
                label: VALUE,
                returns: NUMBER,
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }]
            }
        }
    });
    /**
     * NumberInstance mapper
     */
    persistence.NumberInstance = Base.create("NumberInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "NumberInstance"
            },
            value: {
                type: NUMBER
            },
            history: {
                type: ARRAY,
                _inputex: {
                    _type: "list",
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                }
            }
        }
    });

    persistence.VariableContainer = function() {
    };
    Y.mix(persistence.VariableContainer.prototype, {
        /**
         * Extend clone to add transient childs
         */
        clone: function() {
            var object = Wegas.Editable.prototype.clone.call(this), i;
            object.items = [];
            for (i in this.get(ITEMS)) {
                if (this.get(ITEMS).hasOwnProperty(i)) {
                    object.items.push(this.get(ITEMS)[i].clone());
                }
            }
            return object;
        },
        /**
         *
         * @param {type} i
         * @returns {Y.Wegas.persistence.VariableDescriptor}
         */
        item: function(i) {
            return this.get("items")[i];
        },
        size: function() {
            return this.get("items").length;
        }
    });

    /**
     * ListDescriptor mapper
     */
    persistence.ListDescriptor = Base.create("ListDescriptor", persistence.VariableDescriptor, [persistence.VariableContainer], {
        flatten: function() {
            var acc = [],
                doFlatten = function(items) {
                    var i, it;
                    for (i = 0; i < items.length; i += 1) {
                        it = items[i];
                        if (persistence.QuestionDescriptor && it instanceof persistence.QuestionDescriptor) {
                            acc.push(it);
                        } else if (it instanceof persistence.ListDescriptor) {
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
                    } else if (it instanceof persistence.ListDescriptor) {
                        return Y.Array.every(it.get(ITEMS), filterFn);
                    } else {
                        return true;
                    }
                };
            Y.Array.every(this.get(ITEMS), filterFn);
            return needle;
        },
        getTreeEditorLabel: function() {
            return "\u229e " + this.getEditorLabel();
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
                    for (var i = 0; i < val.length; i = i + 1) {                // We set up a back reference to the parent
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
                            value: "ListInstance",
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF
                }
            },
            allowedTypes: {
                type: ARRAY,
                cssClass: "wegas-advanced-feature",
                _inputex: {
                    label: "Allowed Types",
                    elementType: {
                        required: true,
                        type: "select",
                        choices: AVAILABLE_TYPES
                    }
                }
            },
            addShortcut: {
                type: "select",
                optional: true,
                _inputex: {
                    label: "default children type",
                    optional: true,
                    choices: OPTIONAL_AVAILABLE_TYPES
                }
            }
        },
        EDITORNAME: "Folder",
        EDITMENU: [{
                type: "EditEntityButton"
            }, {
                type: BUTTON,
                label: "Add",
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
                                    label: "State machine",
                                    targetClass: "FSMDescriptor",
                                    cfg: {
                                        states: {
                                            1: {
                                                "@class": "State"
                                            }
                                        }
                                    }
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Inbox",
                                    targetClass: "InboxDescriptor"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "String",
                                    targetClass: "StringDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Boolean",
                                    targetClass: "BooleanDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Object",
                                    targetClass: "ObjectDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Dialogue",
                                    targetClass: "DialogueDescriptor",
                                    cfg: {
                                        states: {
                                            1: {
                                                "@class": "DialogueState"
                                            }
                                        }
                                    }
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Resource",
                                    targetClass: "ResourceDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Task",
                                    targetClass: "TaskDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Peer Review",
                                    targetClass: "PeerReviewDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Burndown",
                                    targetClass: "BurndownDescriptor",
                                    cssClass: "wegas-advanced-feature"
                                }
                            ]
                        }
                    }]
            }, {
                type: BUTTON,
                label: '<span class="wegas-icon wegas-icon-sort"></span>Sort',
                plugins: [{
                        fn: "SortEntityAction"
                    }]
            }, {
                type: BUTTON,
                label: "Copy",
                plugins: [{
                        fn: "DuplicateEntityAction"
                    }]
            }, {
                type: "DeleteEntityButton"
            }, {
                type: BUTTON,
                label: "Export",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: [{
                                    type: "PrintButton",
                                    label: "Html"
                                }, {
                                    type: "PrintButton",
                                    label: "Html (Players document)",
                                    mode: "player"
                                }, {
                                    type: "PrintButton",
                                    label: "Pdf",
                                    outputType: "pdf"
                                }, {
                                    type: "PrintButton",
                                    label: "Pdf (Players document)",
                                    outputType: "pdf",
                                    mode: "player"
                                }, {
                                    type: "OpenEntityButton",
                                    label: "Json",
                                    url: "rest/Export/GameModel/VariableDescriptor/{id}"
                                }]
                        }
                    }]
            }, {
                type: BUTTON,
                label: "More",
                cssClass: "wegas-advanced-feature",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: []
                        }
                    }]
            }
        ]
    });
    /*
     * ListInstance mapper
     */
    persistence.ListInstance = Base.create("ListInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "ListInstance"
            }
        }
    });

    persistence.InboxDescriptor = Base.create("InboxDescriptor", persistence.VariableDescriptor, [], {
        getIconCss: function() {
            return "fa fa-envelope";
            //return "fa fa-envelope-o";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "InboxDescriptor"
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: "InboxInstance"
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
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "From",
                        scriptType: STRING
                    }, {
                        type: STRING,
                        label: "Subject",
                        scriptType: STRING,
                        required: true
                    }, {
                        type: HTML,
                        label: "Body",
                        scriptType: STRING,
                        required: true
                    }, {
                        type: "list",
                        label: "",
                        scriptType: STRING,
                        elementType: {
                            type: "wegasurl",
                            label: "",
                            required: true
                        }
                    }]
            },
            sendDatedMessage: {
                label: "send dated message",
                className: "wegas-method-sendmessage",
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        label: "From",
                        scriptType: STRING
                    }, {
                        type: STRING,
                        label: "Date",
                        scriptType: STRING
                    }, {
                        type: STRING,
                        label: "Subject",
                        scriptType: STRING,
                        required: true
                    }, {
                        type: HTML,
                        label: "Body",
                        scriptType: STRING,
                        required: true
                    }, {
                        type: "list",
                        label: "",
                        scriptType: STRING,
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
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }],
                localEval: function(player) {
                    return this.getInstance(player).get("messages").length < 1;
                }
            }
        }
    });

    /**
     * InboxInstance mapper
     */
    persistence.InboxInstance = Base.create("InboxInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "InboxInstance"
            },
            messages: {
                type: ARRAY,
                "transient": true,
                value: []
            },
            unreadCount: {
                type: NUMBER,
                "transient": true,
                value: 0
            }
        }
    });

    /**
     * Message mapper
     */
    persistence.Message = Base.create("Message", persistence.Entity, [], {}, {
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
            date: {},
            attachements: {}
        }
    });

    /**
     * Script mapper
     */
    persistence.Script = Base.create("Script", persistence.Entity, [], {
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
            if (this.get("content") === "") {                                   // empty scripts resolve to true
                this.fire("evaluated", true);
            }
            if (Wegas.Facade.Variable.script["eval"]) {
                if (this._result) {
                    this.fire("evaluated", this._result);
                    return;
                }
                if (!this._inProgress) {
                    this._inProgress = true;
                    Wegas.Facade.Variable.script["eval"](this.get("content"), {
                        success: Y.bind(function(result) {
                            if (result === true) {
                                this._result = true;
                            } else {
                                this._result = false;
                            }
                            this._inProgress = false;
                            this.fire("evaluated", this._result);
                        }, this),
                        failure: Y.bind(function() {
                            this._result = false;
                            this._inProgress = false;
                            this.fire("evaluated", false);
                        }, this)
                    });
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
                value: "Script"
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
    persistence.PageMeta = Base.create("wegas-pagemeta", persistence.Entity, [], {}, {
        EDITORNAME: "Page properties",
        ATTRS: {
            name: {
                type: STRING,
                optional: true
            }
        }
    });
    /**
     * BooleanDescriptor mapper
     */
    persistence.BooleanDescriptor = Base.create("BooleanDescriptor",
        persistence.VariableDescriptor,
        [persistence.PrimitiveDescriptor],
        {
            getIconCss: function() {
                return "fa fa-toggle-on";
            }
        },
    {
        ATTRS: {
            "@class": {
                value: "BooleanDescriptor"
            },
            value: {
                "transient": true,
                getter: function() {
                    if (this.getInstance()) {
                        return this.getInstance().get(VALUE);
                    } else {
                        return null;
                    }
                }
            },
            defaultValue: {
                type: BOOLEAN,
                value: false,
                "transient": true
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: BOOLEAN,
                        _inputex: {
                            value: "BooleanInstance",
                            _type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: BOOLEAN,
                        _inputex: {
                            label: "Default value",
                            _type: "select",
                            choices: [true, false]
                        }
                    }

                }
            }
        },
        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {
            setValue: {
                label: "set",
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: "select",
                        required: true,
                        choices: [true, false]
                    }]
            },
            getValue: {
                label: VALUE,
                returns: BOOLEAN,
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }]
            }
        }
    });
    /**
     * BooleanInstance mapper
     */
    persistence.BooleanInstance = Base.create("BooleanInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "BooleanInstance"
            },
            value: {
                type: BOOLEAN
            }
        }
    });
});
