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
    var STRING = "string",
        HIDDEN = "hidden",
        ARRAY = "array",
        NAME = "name",
        SELF = "self",
        BOOLEAN = "boolean",
        NUMBER = "number",
        ITEMS = "items",
        BUTTON = "Button",
        VALUE = "value",
        TEXT = "text",
        INTERNAL = "INTERNAL",
        PROTECTED = "PROTECTED",
        INHERITED = "INHERITED",
        PRIVATE = "PRIVATE",
        NONE = "NONE",
        HTML = "html", AVAILABLE_TYPES, OPTIONAL_AVAILABLE_TYPES,
        Wegas = Y.Wegas,
        persistence = Wegas.persistence,
        Base = Y.Base,
        VERSION_ATTR_DEF,
        IDATTRDEF;
    VERSION_ATTR_DEF = {
        type: NUMBER,
        optional: true,
        _inputex: {
            _type: "uneditable",
            wrapperClassName: "inputEx-fieldWrapper inputEx-uneditableField wegas-advanced-feature"
                //_type: HIDDEN
        }
    };
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
    OPTIONAL_AVAILABLE_TYPES = [{
            label: "none",
            value: ""
        }].concat(AVAILABLE_TYPES);
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
            Y.Object.each(this.getMethodCfgs(), function(i, key) { // Push server methods defined in the METHODS static to the proto
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
            var key, scope;
            player = player || Wegas.Facade.Game.get("currentPlayer");
            switch (this.get("scope").get("@class")) {
                case "PlayerScope":
                    key = player.get("id");
                    break;
                case "TeamScope":
                    key = player.get("team").get("id");
                    break;
                case "GameScope":
                    key = player.get("team").get("gameId");
                    break;
                case "GameModelScope":
                    key = 0;
                    break;
            }

            scope = Y.Wegas.Facade.Instance.cache.find("descriptorId", this.get("id"));
            return (scope ? scope.variableInstances[key] : undefined);
            //return this.get("scope").getInstance(player || Wegas.Facade.Game.get("currentPlayer"));

            /*player = player || Wegas.Facade.Game.get("currentPlayer");
             var instance = this.get("scope").getInstance(player);
             if (!instance) {
             this._loadInstance(player);
             instance = this.get("scope").getInstance(player);
             }
             return instance;*/

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
        },
        _loadInstance: function(player) {
            var promise = new Y.Promise(function(resolve, reject) {
                Y.Wegas.Facade.Variable.sendRequest(Y.mix({
                    request: '/' + this.get("id") + '/VariableInstance/playerId' + player.get("id"),
                    cfg: {
                        method: "GET"
                    },
                    on: {
                        success: function(e) {
                            resolve(e.target.entity);
                        }, failure: function(e) {
                            resolve(null);
                        }
                    }
                }));
            });
            this.get("scope").setInstance(player, promise);
        },
        getParent: function() {
            return Y.Wegas.Facade.Variable.cache.findParentDescriptor(this);
        }
    }, {
        ATTRS: {
            version: {
                type: NUMBER,
                optional: false,
                value: 0,
                //writeOnce: "initOnly",
                _inputex: {
                    _type: "uneditable",
                    wrapperClassName: "inputEx-fieldWrapper inputEx-uneditableField wegas-advanced-feature",
                    index: -1
                }
            },
            parentDescriptorId: {
                type: NUMBER,
                optional: true,
                "transient": true,
                _inputex: {
                    _type: HIDDEN
                }
            },
            parentDescriptorType: {
                type: STRING,
                optional: true,
                "transient": true,
                _inputex: {
                    _type: HIDDEN
                }
            },
            visibility: {
                type: STRING,
                valueFn: function() {
                    return Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("type") === "MODEL" ? "INHERITED" : "PRIVATE";
                },
                choices: [{
                        value: "INTERNAL",
                        label: "Internal"
                    }, {
                        value: "PROTECTED",
                        label: "Protected"
                    }, {
                        value: "INHERITED",
                        label: "Inherited"
                    }, {
                        value: "PRIVATE",
                        label: "Private"
                    }],
                _inputex: {
                    maxWritableVisibility: NONE,
                    wrapperClassName: "wegas-advanced-feature"
                }
            },
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
                    maxWritableVisibility: PRIVATE,
                    description: "Alphanumeric characters,'_','$'. Without a digit as first character.<br/>Changing this may break your scripts."
                },
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            scope: {
                valueFn: function() {
                    return new persistence.TeamScope(); // Should the default scope be set
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
                },
                _inputex: {
                    maxWritableVisibility: "PROTECTED"
                }
            }
        },
        EDITMENU: {
            editBtn: {
                index: -1,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: "EditEntityButton"
                }
            },
            copyBtn: {
                index: 10,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: BUTTON,
                    label: "Copy",
                    plugins: [{
                            fn: "DuplicateEntityAction"
                        }]
                }
            },
            deleteBtn: {
                index:20,
                maxVisibility: "PRIVATE", // only visible for private variables
                cfg: {
                    type: "DeleteEntityButton"
                }
            },
            exportBtn: {
                index: 30,
                maxVisibility: "INTERNAL",
                cfg: {
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
                        }
                    ]
                }
            }
        }
    });
    /**
     * Scope mapper
     */
    persistence.Scope = Base.create("Scope", persistence.Entity, [], {
        getInstance: function(player) {
            Y.error("SHOULD BE OVERRIDDEN, abstract!", new Error("getInstance, abstract"), "Wegas.persistance.Scope");
        },
        setInstance: function(player, promise) {
            if (!this.getInstance(player)) {
                this.setPromise(player, promise);
            }
        },
        setPromise: function(player, promise) {
            Y.error("SHOULD BE OVERRIDDEN, abstract!", new Error("setPromise, abstract"), "Wegas.persistance.Scope");
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
        },
        setPromise: function(player, promise) {
            this.get("variableInstances")[0] = promise;
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
        },
        setPromise: function(player, instance) {
            this.get("variableInstances")[String(Wegas.Facade.Game.get("currentGameId"))] = promise;
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
        },
        setPromise: function(player, instance) {
            this.get("variableInstances")[player.get("id")] = promise;
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
        },
        setPromise: function(player, promise) {
            this.get("variableInstances")[player.get("id")] = promise;
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
    persistence.VariableInstance = Base.create("VariableInstance", persistence.Entity, [], {
        getDescriptor: function() {
            return Y.Wegas.Facade.Variable.cache.find("id", this.get("descriptorId"));
        }
    }, {
        ATTRS: {
            version: {
                type: NUMBER,
                optional: false,
                default: 0,
                //writeOnce: "initOnly",
                _inputex: {
                    _type: "uneditable",
                    wrapperClassName: "inputEx-fieldWrapper inputEx-uneditableField wegas-advanced-feature",
                    index: -1
                }
            },
            descriptorId: {
                type: NUMBER,
                _inputex: {
                    _type: HIDDEN
                }
            },
            scopeKey: {
                type: NUMBER,
                _inputex: {
                    _type: HIDDEN
                }
            }
        },
        EDITMENU: {
            editBtn: {
                index: -1,
                maxisibility: "INTERNAL",
                cfg: {
                    type: "EditEntityButton"
                }
            }
        }
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
                        version: VERSION_ATTR_DEF,
                        value: {
                            type: STRING,
                            optional: true,
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
                            required: false
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
                    optional: true,
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
                    version: VERSION_ATTR_DEF,
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
                historySize: {
                    type: NUMBER,
                    value: 20,
                    optional: true,
                    _inputex: {
                        wrapperClassName: "wegas-advanced-feature",
                        label: "Maximum history size"
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
                        version: VERSION_ATTR_DEF,
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
    /**
     * ListDescriptor mapper
     */
    persistence.ListDescriptor = Base.create("ListDescriptor", persistence.VariableDescriptor, [persistence.VariableContainer], {
        flatten: function(filters) {
            var acc = [],
                push = function(item) {
                    if (filters === undefined || filters.length === 0 || filters === item.name || (Y.Lang.isArray(filters) && Y.Array.find(filters, function(filter) {
                        return filter === item.name;
                    }))) {
                        acc.push(item);
                    }
                },
                doFlatten = function(items) {
                    var i, it;
                    for (i = 0; i < items.length; i += 1) {
                        it = items[i];
                        if (persistence.QuestionDescriptor && it instanceof persistence.QuestionDescriptor) {
                            push(it);
                        } else if (it instanceof persistence.ListDescriptor) {
                            doFlatten(it.get(ITEMS));
                        } else {
                            push(it);
                        }
                    }
                };
            doFlatten(this.get(ITEMS));
            return acc;
        },
        getChildByKey: function(key, value, directChildOnly) {
            var needle,
                filterFn = function(it) {
                    var children;
                    if (it.get(key) === value) {
                        needle = it;
                        return false;
                    } else {
                        children = it.get("items");
                        if (children) {
                            if (!directChildOnly) {
                                return Y.Array.every(children, filterFn);
                            }
                        }
                    }
                    return true;
                };
            Y.Array.every(this.get(ITEMS), filterFn);
            return needle;
        },
        getChildByName: function(name) {
            return this.getChildByKey("name", name, true);
        },
        getChildByLabel: function(label) {
            return this.getChildByKey("label", label, true);
        },
        find: function(id) {
            return this.getChildByKey("id", +id, false);
        },
        getTreeEditorLabel: function() {
            return "\u229e " + this.getEditorLabel();
        }
    }, {
        ATTRS: {
            "@class": {
                value: "ListDescriptor"
            },
            /**
             * The currently selected element based on current ListInstance.
             */
            currentItem: {
                "transient": true,
                getter: function() {
                    var inst = this.getInstance();
                    if (!Y.Lang.isUndefined(inst) &&
                        this.get(ITEMS)[inst.get(VALUE)]) {
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
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF
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
        EDITMENU: {
            addBtn: {
                index: 1,
                cfg: {

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
                                        targetClass: "FSMDescriptor" /*,
                                         cfg: {
                                         states: {
                                         1: {
                                         "@class": "State"
                                         }
                                         }
                                         }*/
                                    }, {
                                        type: "AddEntityChildButton",
                                        label: "Inbox",
                                        targetClass: "InboxDescriptor"
                                    }, {
                                        type: "AddEntityChildButton",
                                        label: "String",
                                        targetClass: "StringDescriptor"
                                            //cssClass: "wegas-advanced-feature"
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
                                        targetClass: "DialogueDescriptor" /*,
                                         cfg: {
                                         states: {
                                         1: {
                                         "@class": "DialogueState"
                                         }
                                         }
                                         }*/
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
                        }
                    ]
                }
            },
            sortBtn: {
                index: 2,
                cfg: {
                    type: BUTTON,
                    label: '<span class="wegas-icon wegas-icon-sort"></span>Sort',
                    plugins: [{
                            fn: "SortEntityAction"
                        }]
                }
            }
        }
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
            capped: {
                value: false,
                type: "boolean",
                _inputex: {
                    label: "Limit to one message",
                    description: "Each new message ejects the previous one",
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
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
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF
                }
            }
        },
        METHODS: {
            /*sendMessage: {
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
             elementType: {
             type: "wegasurl",
             label: "",
             required: true
             }
             }]
             },*/
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
                        type: STRING,
                        wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature",
                        label: "Token",
                        scriptType: STRING,
                        description: "like an message identifier, may be used to reference the message within FSM/Trigger condition"
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
            },
            isTokenMarkedAsRead: {
                label: "is token marked as read",
                returns: BOOLEAN,
                "arguments": [{
                        type: HIDDEN,
                        value: SELF
                    }, {
                        type: STRING,
                        scriptType: STRING
                    }
                ]
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
                setter: function(v) {
                    v.sort(function(a, b) {
                        // newer first
                        return b.get("time") - a.get("time");
                    });
                    return v;
                },
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
            token: {},
            date: {},
            time: {
                "transient": true
            },
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
        },
        /*
         * Conditional script to test. Error resolve to true
         * @returns {Promise}
         */
        localEval: function() {
            return new Y.Promise(Y.bind(function(resolve) {
                if (this.get("content") === "") { // empty scripts resolve to true
                    resolve(true);
                    return;
                }
                if (Wegas.Facade.Variable.script["eval"]) {
                    if (!this._inProgress) {
                        this._inProgress = true;
                        Wegas.Facade.Variable.script["eval"](this.get("content"), {
                            on: {
                                success: Y.bind(function(data) {
                                    if (data.response.entity === true) {
                                        resolve(true);
                                    } else {
                                        resolve(false);
                                    }
                                    this._inProgress = false;
                                }, this),
                                failure: Y.bind(function() {
                                    resolve(false);
                                    this._inProgress = false;
                                }, this)
                            }
                        });
                    } else {
                        Y.log("evaluation in progress");
                    }
                }
            }, this));
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
                        version: VERSION_ATTR_DEF,
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
