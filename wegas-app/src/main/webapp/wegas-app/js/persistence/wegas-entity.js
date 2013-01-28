/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-entity', function(Y) {
    "use strict";

    var IDATTRDEF = {
        type: "string",
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: "hidden"
        }
    }, Editable = Y.Wegas.Editable, Entity;

    /**
     * Entity is used to represent db objects.
     */
    Entity = Y.Base.create("Entity", Y.Base, [Editable], {
        initializer: function() {

        }

    }, {
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
                type: 'string',
                _inputex: {
                    _type: 'hidden'
                }
            },
            "label": {
                "transient": true,
                getter: function(val) {
                    return val || this.get("name");
                }
            },
            "editorLabel": {
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
                type: "string"
            },
            games: {
                type: "array",
                value: [],
                _inputex: {
                    _type: 'hidden'
                }
            },
            widgetsUri: {
                type: "string",
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
                type: "string",
                _inputex: {
                    label: "CSS Stylesheet"
                }
            },
            scriptLibrary: {
                value: {},
                _inputex: {
                    _type: "hidden"
                }
            }
        },
        EDITMENU: [{
                type: "Button",
                label: "Properties",
                cssClass: "editor-exploreGameModel-button",
                plugins: [{
                        fn: "LoadTreeviewNodeAction",
                        cfg: {
                            tabId: "gamesTreeViewTab"
                        }
                    }, {
                        fn: "EditEntityAction"
                    }]
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
                            children: [{
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
                type: "string"
            },
            token: {
                type: "string",
                optional: true
            },
            teams: {
                type: "array",
                value: [],
                _inputex: {
                    _type: "hidden"
                }
            }
        },
        EDITMENU: [{
                type: "EditEntityButton",
                label: "Properties",
                cssClass: "editor-gameProperties-button"
            }, {
                type: "Button",
                label: "View in editor",
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
                            children: [{
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
                type: "string"
            },
            token: {
                type: "string",
                optional: true
            },
            players: {
                value: [],
                _inputex: {
                    _type: "hidden"
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
                type: "string"
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
                type: "string",
                "transient": true,
                getter: function(val) {
                    if (this.getMainAccount()) {
                        return this.getMainAccount().getPublicName();
                    }
                    return val;
                }
            },
            password: {
                type: "string"
            },
            accounts: {
                type: "array"

            }
        }
    });
    /**
     * Role mapper
     */
    Y.Wegas.persistence.Role = Y.Base.create("Role", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string"
            },
            description: {
                type: "string",
                format: "text",
                optional: true
            },
            permissions: {
                optional: true,
                type: "array",
                items: {
                    type: "string",
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
                type: "string",
                value: "JpaAccount",
                _inputex: {
                    _type: 'hidden'
                }
            },
            firstname: {
                type: "string",
                _inputex: {
                    label: "First name"
                }
            },
            lastname: {
                label: "Last name",
                type: "string",
                _inputex: {
                    label: "Last name"
                }
            },
            email: {
                type: "string",
                _inputex: {
                    label: "Email",
                    _type: "email"
                }
            },
            password: {
                type: "string",
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
                type: "string",
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
                type: "array",
                items: {
                    type: "string",
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
            }
            //        , {
            //            type: "DeleteEntityButton"
            //        }
        ]
                //EDITFORM : [{
                //    name: 'name',
                //    label:'Name',
                //    required: true
                //}, {
                //    name: 'password',
                //    type: 'password',
                //    label: 'New password',
                //    showMsg: true,
                //    id: 'firstPassword',
                //    strengthIndicator: true,
                //    capsLockWarning: true
                //}, {
                //    type: 'password',
                //    label: 'Confirmation',
                //    showMsg: true,
                //    confirm: 'firstPassword'
                //}]
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
                type: "string",
                "transient": false,
                getter: function(val) {
                    return val || this.get("name");
                }
            },
            editorLabel: {
                type: "string",
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
                type: "string",
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
                        type: "string",
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
                type: "string",
                _inputex: {
                    _type: "hidden"
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
                        type: "string",
                        _inputex: {
                            value: 'StringInstance',
                            _type: 'hidden'
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: "string",
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
                type: "string"
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
                type: "string",
                optional: true,
                _inputex: {
                    label: 'Minimum'
                }
            },
            maxValue: {
                type: "string",
                optional: true,
                _inputex: {
                    label: 'Maximum'
                }
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: "string",
                        _inputex: {
                            value: 'NumberInstance',
                            _type: 'hidden'
                        }
                    },
                    id: IDATTRDEF,
                    value: {
                        type: "string",
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
                        type: "hidden",
                        value: "self"
                    }, {
                        type: "string",
                        value: 1
                    }]
            },
            setValue: {
                label: "set",
                arguments: [{
                        type: "hidden",
                        value: "self"
                    }, {
                        type: "string",
                        value: 1
                    }]
            },
            getValue: {
                label: "value",
                returns: "number",
                arguments: [{
                        type: "hidden",
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
                type: "string",
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
                type: "array",
                value: [],
                "transient": true,
                _inputex: {
                    _type: "hidden"
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
                        type: "string",
                        _inputex: {
                            value: 'ListInstance',
                            _type: "hidden"
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
                                    "label": "String",
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
            moralHistory: {
                type: "array"
            },
            confidenceHistory: {
                type: "array"
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
