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
YUI.add('wegas-entity', function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array",
    IDATTRDEF = {
        type: STRING,
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: HIDDEN
        }
    }, Editable = Y.Wegas.Editable, Entity;

    /**
     * @class Entity is used to represent db objects
     * @name Y.Wegas.persistence.Entity
     * @extends Y.Base
     * @augments Y.Wegas.Editable
     * @constructor
     */
    Entity = Y.Base.create("Entity", Y.Base, [Editable], {}, {

        _buildCfg: {
            //statics: ["EDITMENU"],
            custom: {
        //HASH: function (prop, Receiver, Supplier) {
        //Entity.ENTITIES_HASH[Receiver.name] = true;
        //var c = Supplier.constructor;
        //while (!Receiver.EDITMENU && c) {
        //    if (c.EDITMENU) {                                                  // Add to attributes
        //        Receiver.EDITMENU = c.EDITMENU
        //    }
        //    c = c.superclass ? c.superclass.constructor : null;
        //}
        //}
        }
        },

        ATTRS: {
            initialized: {
                "transient": true
            },
            destroyed: {
                "transient": true
            },
            id: Y.mix(IDATTRDEF, {
                writeOnce: "initOnly",
                setter: function(val) {
                    return val * 1;
                }
            }),
            '@class': {
                value: "null",
                writeOnce: "initOnly",
                type: STRING,
                _inputex: {
                    _type: HIDDEN
                }
            },
            label: {
                "transient": true,
                getter: function(val) {
                    return val || this.get("name");
                }
            },
            editorLabel: {
                "transient": true,
                getter: function(val) {
                    return val || this.get("name");
                }
            }
        },

        /**
         *  Defines edition menu to be used in editor
         */
        EDITMENU: [],

        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {}
    });
    Y.namespace('Wegas.persistence').Entity = Entity;

    /**
     *
     */
    Y.Wegas.persistence.DefaultEntity = Y.Base.create("DefaultEntity", Entity, [], {
        initializer: function(cfg) {
            this.set("val", cfg);
        }
    }, {
        ATTRS: {
            val: {}
        }
    });
    Y.Wegas.persistence.RestException = Y.Wegas.persistence.DefaultEntity;

    /**
     * Page response mapper
     */
    Y.Wegas.persistence.WidgetEntity = Y.Base.create("WidgetEntity", Entity, [], {
        initializer: function(cfg) {
            Y.Wegas.persistence.WidgetEntity.superclass.initializer.apply(this, arguments);
            this.__cfg = cfg;
        },
        toJSON: function() {
            return this.__cfg;
        }
    });

    /**
     * ServerResponse mapper
     */
    Y.Wegas.persistence["ManagedModeResponseFilter$ServerResponse"] = Y.Base.create("ManagedModeResponseFilter$ServerResponse", Entity, [], {}, {
        ATTRS: {
            entities: {
                value: []
            },
            events: {
                value: []
            }
        }
    });
    Y.Wegas.persistence.EntityUpdatedEvent = Y.Base.create("EntityUpdatedEvent", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            updatedEntities: {
                value: []
            }
        }
    });

    /**
     * GameModel mapper
     */
    Y.Wegas.persistence.GameModel = Y.Base.create("GameModel", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: STRING
            },
            games: {
                type: ARRAY,
                value: [],
                _inputex: {
                    _type: HIDDEN
                }
            },
            widgetsUri: {
                type: STRING,
                /* choices: [{
                 value: "wegas-leaderway/db/wegas-leaderway-pages.json",
                 label: "Leaderway"
                 }, {
                 value: "wegas-crimesim/db/wegas-crimesim-pages.json",
                 label: "Crimesim"
                 }, {
                 value: "wegas-mmo/db/wegas-leaderway-mmo.json",
                 label: "Programming Game"
                 }],*/
                _inputex: {
                    label: "Layout"
                }
            },
            cssUri: {
                type: STRING,
                _inputex: {
                    label: "CSS Stylesheet"
                }
            },
            scriptLibrary: {
                value: {},
                _inputex: {
                    _type: HIDDEN
                }
            }
        },
        EDITMENU: [{
            type: "Button",
            label: "Properties",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                fn: "EditEntityAction"
            }]
        //    {
        //    fn: "LoadTreeviewNodeAction",
        //    cfg: {
        //        tabId: "gamesTreeViewTab"
        //    }
        //},
        }, {
            type: "Button",
            label: "Edit",
            plugins: [{
                fn: "OpenGameAction"
            }]
        }, {
            type: "Button",
            label: "Duplicate",
            cssClass: "editor-duplicateGameModel-button",
            plugins: [{
                fn: "DuplicateEntityAction"
            }]
        }, {
            type: "Button",
            label: "Share",
            cssClass: "editor-shareGameModel-button",
            plugins: [{
                fn: "OpenTabAction",
                cfg: {
                    wchildren: [{
                        type: "RolePermissionList",
                        permsList: [{
                            name: "GameModel:View"
                        }, {
                            name: "GameModel:Edit"
                        }, {
                            name: "GameModel:Duplicate"
                        }, {
                            name: "GameModel:Delete"
                        }]
                    }],
                    tabSelector: '#rightTabView'
                }
            }]
        }, {
            type: "DeleteEntityButton",
            cssClass: "editor-deleteGameModel-button"
        }]
    //{
    //    type: "Button",
    //    label: "Open in editor",
    //    plugins: [{
    //        fn: "OpenGameAction"
    //    }]
    //},
    //    {
    //    type: "AddEntityChildButton",
    //    label: "Add game",
    //    childClass: "Game"
    //},
    //{
    //    type: "EditEntityButton",
    //    label: "Properties"
    //},
    });

    /**
     * Game mapper
     */
    Y.Wegas.persistence.Game = Y.Base.create("Game", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: STRING
            },
            token: {
                type: STRING,
                optional: true,
                _inputex: {
                    description: "Leave blank for automatic generation"
                }
            },
            createdBy: {
                "transient": true
            },
            gameModelId: {
                type: STRING
            },
            teams: {
                type: ARRAY,
                value: [],
                _inputex: {
                    _type: HIDDEN
                }
            },
            createdTime: {
                "transient": true,
                type: STRING,
                _inputex: {
                    _type: HIDDEN
                }
            },
            updatedTime: {
                "transient": true,
                type: STRING,
                _inputex: {
                    _type: HIDDEN
                }
            }
        },
        EDITMENU: [{
            type: "EditEntityButton",
            label: "Properties",
            cssClass: "editor-gameProperties-button"
        }, {
            type: "Button",
            label: "View",
            plugins: [{
                fn: "OpenGameAction"
            }]
        }, {
            type: "AddEntityChildButton",
            label: "Add team",
            cssClass: "editor-addTeam-button",
            targetClass: "Team"
        }, {
            type: "Button",
            label: "Share",
            cssClass: "editor-shareGame-button",
            plugins: [{
                fn: "OpenTabAction",
                cfg: {
                    wchildren: [{
                        type: "RolePermissionList",
                        permsList: [{
                            name: "Game:View"
                        }, {
                            name: "Game:Edit"
                        }, {
                            name: "Game:Token"
                        }]
                    }],
                    tabSelector: '#rightTabView'
                }
            }]
        }, {
            type: "DeleteEntityButton",
            cssClass: "editor-deleteGame-button"
        }, {
            type: "Linkwidget",
            cssClass: "editor-playerlink-button"
        }]
    });

    /**
     * Team mapper
     */
    Y.Wegas.persistence.Team = Y.Base.create("Team", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            '@class': {
                value: "Team"
            },
            name: {
                type: STRING
            },
            token: {
                type: STRING,
                optional: true,
                _inputex: {
                    description: "Leave blank for automatic generation"
                }
            },
            players: {
                value: [],
                _inputex: {
                    _type: HIDDEN
                }
            },
            gameId: IDATTRDEF
        },
        EDITMENU: [{
            type: "EditEntityButton",
            label: "Properties",
            cssClass: "editor-teamProperties-button"
        }, {
            type: "Button",
            label: "View as",
            plugins: [{
                fn: "OpenGameAction"
            }]
        },
        //{            // We allow the player to open its pages with the widget
        //    type: "Button",
        //    label: "Open",
        //    plugins: [{
        //        fn: "OpenGameAction",
        //        cfg: {
        //            editorUrl: "wegas-app/view/play.html?"
        //        }
        //    }]
        //},
        {
            type: "Button",
            label: "Add player",
            cssClass: "editor-addPlayer-button",
            plugins: [{
                fn: "AddEntityChildAction",
                cfg: {
                    targetClass: "Player"
                }
            }]
        }, {
            type: "DeleteEntityButton",
            cssClass: "editor-deleteTeam-button"
        }]
    });

    /**
     * Player mapper
     */
    Y.Wegas.persistence.Player = Y.Base.create("Player", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: STRING
            },
            teamId: IDATTRDEF
        },
        EDITMENU: [{
            type: "EditEntityButton",
            label: "Properties",
            cssClass: "editor-playerProperties-button"
        }, {
            type: "Button",
            label: "View as",
            plugins: [{
                fn: "OpenGameAction"
            }]
        }, {
            type: "DeleteEntityButton",
            cssClass: "editor-deletePlayer-button"
        }]
    });

    /**
     * User mapper
     */
    Y.Wegas.persistence.User = Y.Base.create("User", Y.Wegas.persistence.Entity, [], {
        getMainAccount: function() {
            return this.get("accounts")[0];
        }
    }, {
        ATTRS: {
            name: {
                type: STRING,
                "transient": true,
                getter: function(val) {
                    if (this.getMainAccount()) {
                        return this.getMainAccount().getPublicName();
                    }
                    return val;
                }
            },
            password: {
                type: STRING
            },
            accounts: {
                type: ARRAY

            }
        }
    });
    /**
     * Role mapper
     */
    Y.Wegas.persistence.Role = Y.Base.create("Role", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: STRING
            },
            description: {
                type: STRING,
                format: "text",
                optional: true
            },
            permissions: {
                optional: true,
                type: ARRAY,
                items: {
                    type: STRING,
                    _inputex: {
                        label: ""
                    }
                },
                _inputex: {
                    useButtons: true
                }
            }
        },
        EDITMENU: [{
            type: "EditEntityButton",
            label: "Edit group"
        }, {
            type: "DeleteEntityButton"
        }]
    });
    /**
     * JpaAccount mapper
     */
    Y.Wegas.persistence.JpaAccount = Y.Base.create("JpaAccount", Y.Wegas.persistence.Entity, [], {
        getPublicName: function() {
            if (this.get("firstname")) {
                return this.get("firstname") + " " + this.get("lastname");

            } else {
                return this.get("email") + " " + this.get("lastname");
            }
        }

    }, {
        ATTRS: {
            "@class": {
                type: STRING,
                value: "JpaAccount",
                _inputex: {
                    _type: HIDDEN
                }
            },
            firstname: {
                type: STRING,
                _inputex: {
                    label: "First name"
                }
            },
            lastname: {
                label: "Last name",
                type: STRING,
                _inputex: {
                    label: "Last name"
                }
            },
            email: {
                type: STRING,
                _inputex: {
                    label: "Email",
                    _type: "email"
                }
            },
            password: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: "password",
                    label: "Password",
                    strengthIndicator: true,
                    capsLockWarning: true,
                    id: "password",
                    typeInvite: null,
                    description: "Leave blank for no change"
                }
            },
            passwordConfirm: {
                type: STRING,
                //"transient": true,
                optional: true,
                _inputex: {
                    _type: "password",
                    label: "Confirm password",
                    showMsg: true,
                    confirm: "password",
                    typeInvite: null
                }
            },
            roles: {
                optional: true,
                type: ARRAY,
                items: {
                    type: STRING,
                    choices: [{
                        value: 1,
                        label: 'Administrator'
                    }, {
                        value: 4,
                        label: 'Scenarist'
                    }, {
                        value: 5,
                        label: 'Animator'
                    }],
                    _inputex: {
                        label: "",
                        _type: "roleselect"
                    }
                },
                _inputex: {
                    useButtons: true
                }
            }
        },
        EDITMENU: [{
            type: "EditEntityButton",
            label: "Edit user"
        }, {
            type: "Button",
            disabled: true,
            label: "Permissions"
        }, {
            type: "DeleteEntityButton"
        }]
    });

    /**
     * VariableDescriptor mapper
     */
    Y.Wegas.persistence.VariableDescriptor = Y.Base.create("VariableDescriptor", Y.Wegas.persistence.Entity, [], {
        getInstance: function(playerId) {
            playerId = playerId || Y.Wegas.app.get('currentPlayer');
            return this.get("scope").getInstance(playerId);
        },
        getPrivateLabel: function() {
            return this.get("editorLabel");
        },
        getPublicLabel: function() {
            return this.get("label");
        }
    }, {
        ATTRS: {
            label: {
                type: STRING,
                "transient": false,
                getter: function(val) {
                    return val || this.get("name");
                }
            },
            editorLabel: {
                type: STRING,
                optional: true,
                "transient": false,
                _inputex: {
                    label: "Editor label"
                },
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                },
                getter: function(val) {
                    return val || this.get("label");
                }
            },
            name: {
                value: null,
                type: STRING,
                optional: true,
                _inputex: {
                    label: "Script alias"
                },
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            scope: {
                valueFn: function() {
                    return new Y.Wegas.persistence.TeamScope();                 // Should the default scope be set server or client side?
                },
                validator: function(o) {
                    return o instanceof Y.Wegas.persistence.Scope;
                },
                type: "object",
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
                            value: "GameModelScope",
                            label: 'the same for everybody'
                        }],
                        _inputex: {
                            label: 'Variable is'
                        }
                    }
                }
            },
            defaultInstance: {
                value: null,
                validator: function(o) {
                    return o instanceof Y.Wegas.persistence.VariableInstance;
                }
            }
        },
        EDITMENU: [{
            type: "EditEntityButton"
        }, {
            type: "Button",
            label: "Duplicate",
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
    Y.Wegas.persistence.Scope = Y.Base.create("Scope", Y.Wegas.persistence.Entity, [], {
        getInstance: function() {
            Y.error("SHOULD BE OVERRIDDEN, abstract!", new Error("getInstance, abstract"), "Y.Wegas.persistance.Scope");
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
                "transient": true
            }
        }
    });
    /**
     * GameModelScope mapper
     */
    Y.Wegas.persistence.GameModelScope = Y.Base.create("GameModelScope", Y.Wegas.persistence.Scope, [], {
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
    Y.Wegas.persistence.GameScope = Y.Base.create("GameScope", Y.Wegas.persistence.Scope, [], {
        getInstance: function() {
            return this.get("variableInstances")[0];
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
    Y.Wegas.persistence.TeamScope = Y.Base.create("TeamScope", Y.Wegas.persistence.Scope, [], {
        getInstance: function(playerId) {
            return this.get("variableInstances")[Y.Wegas.app.get('currentTeam')];
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
    Y.Wegas.persistence.PlayerScope = Y.Base.create("PlayerScope", Y.Wegas.persistence.Scope, [], {
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
    Y.Wegas.persistence.VariableInstance = Y.Base.create("VariableInstance", Y.Wegas.persistence.Entity, [], {}, {
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
     * StringDescriptor mapper
     */
    Y.Wegas.persistence.StringDescriptor = Y.Base.create("StringDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {}, {
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
    Y.Wegas.persistence.StringInstance = Y.Base.create("StringInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
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
     * NumberDescriptor mapper
     */
    Y.Wegas.persistence.NumberDescriptor = Y.Base.create("NumberDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {}, {
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
                    value: "self"
                }, {
                    type: STRING,
                    value: 1
                }]
            },
            setValue: {
                label: "set",
                arguments: [{
                    type: HIDDEN,
                    value: "self"
                }, {
                    type: STRING,
                    value: 1
                }]
            },
            getValue: {
                label: "value",
                returns: "number",
                arguments: [{
                    type: HIDDEN,
                    value: "self"
                }]
            }
        }
    });
    /**
     * NumberInstance mapper
     */
    Y.Wegas.persistence.NumberInstance = Y.Base.create("NumberInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "NumberInstance"
            },
            value: {
                type: STRING,
                _inputex: {
                    regexp: /^[0-9]*$/
                }
            }
        }
    });
    /**
     * ListDescriptor mapper
     */
    Y.Wegas.persistence.ListDescriptor = Y.Base.create("ListDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {
        /**
         * Extend clone to add transient childs
         */
        clone: function() {
            var object = Y.Wegas.Editable.prototype.clone.call(this), i;
            object.items = [];
            for (i in this.get("items")) {
                object.items.push(this.get("items")[i].clone());
            }
            return object;
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
                    if (this.get("items").length > 0) {
                        return this.get("items")[this.getInstance().get("value")];
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
        EDITMENU: [{
            type: "EditEntityButton"
        }, {
            type: "Button",
            label: "Add",
            plugins: [{
                "fn": "WidgetMenu",
                "cfg": {
                    "menuCfg": {
                        points: ["tl", "tr"]
                    },
                    "event": "mouseenter",
                    "children": [{
                        "type": "AddEntityChildButton",
                        "label": "Number",
                        "targetClass": "NumberDescriptor"
                    }, {
                        "type": "AddEntityChildButton",
                        "label": STRING,
                        "targetClass": "StringDescriptor"
                    }, {
                        "type": "AddEntityChildButton",
                        "label": "List",
                        "targetClass": "ListDescriptor"
                    }, {
                        "type": "AddEntityChildButton",
                        "label": "Question",
                        "targetClass": "QuestionDescriptor"
                    }, {
                        "type": "AddEntityChildButton",
                        "label": "Trigger",
                        "targetClass": "TriggerDescriptor"
                    }, {
                        "type": "AddEntityChildButton",
                        "label": "Resource (Leaderway, CEP Game)",
                        "targetClass": "ResourceDescriptor"
                    }, {
                        "type": "AddEntityChildButton",
                        "label": "Dialogue (Leaderway)",
                        "targetClass": "DialogueDescriptor"
                    }, {
                        "type": "AddEntityChildButton",
                        "label": "Task (Leaderway)",
                        "targetClass": "TaskDescriptor"
                    }]
                }
            }]
        }, {
            type: "Button",
            label: "Duplicate",
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
    Y.Wegas.persistence.ListInstance = Y.Base.create("ListInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "ListInstance"
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
                            _type: HIDDEN,
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
                    type: HIDDEN,
                    value: "self"
                }, {
                    type: STRING,
                    label: "from",
                    scriptType: STRING
                }, {
                    type: STRING,
                    label: "title",
                    scriptType: STRING
                }, {
                    type: "text",
                    label: "Content",
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
                returns: "boolean",
                arguments: [{
                    type: HIDDEN,
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
                type: ARRAY,
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
                format: "text",
                setter: function(v) {
                    this._result = null;
                    return v;
                }
            }
        }
    });
});
