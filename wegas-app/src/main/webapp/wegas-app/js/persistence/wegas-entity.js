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
YUI.add('wegas-entity', function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "name",
            BUTTON = "Button", TEXT = "text", HTML = "html",
            GROUP = "group",
            IDATTRDEF = {
        type: STRING,
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: HIDDEN
        }
    }, Wegas = Y.namespace("Wegas"), Entity;

    /**
     * @class Entity is used to represent db objects
     * @name Y.Wegas.persistence.Entity
     * @extends Y.Base
     * @augments Y.Wegas.Editable
     * @constructor
     */
    Entity = Y.Base.create("Entity", Y.Base, [Wegas.Editable], {}, {
        _buildCfg: {
            //statics: ["EDITMENU"],
            custom: {
                //HASH: function (prop, Receiver, Supplier) {
                //Entity.ENTITIES_HASH[Receiver.name] = true;
                //var c = Supplier.constructor;
                //while (!Receiver.EDITMENU && c) {
                //    if (c.EDITMENU) {                                         // Add to attributes
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
            id: {
                type: STRING,
                optional: true, // The id is optional for entites that have not been persisted
                writeOnce: "initOnly",
                setter: function(val) {
                    return val * 1;
                },
                _inputex: {
                    wrapperClassName: 'wegas-advanced-feature',
                    index: -2,
                    disable: true
                }
            },
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
                    return val || this.get(NAME);
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
    Wegas.persistence.DefaultEntity = Y.Base.create("DefaultEntity", Entity, [], {
        initializer: function(cfg) {
            this.set("val", cfg);
        },
        toJSON: function() {
            return this.get("val");
        }
    }, {
        ATTRS: {
            val: {}
        }
    });
    Wegas.persistence.RestException = Wegas.persistence.DefaultEntity;

    /**
     * Page response mapper
     */
    Wegas.persistence.WidgetEntity = Y.Base.create("WidgetEntity", Entity, [], {
        initializer: function(cfg) {
            Wegas.persistence.WidgetEntity.superclass.initializer.apply(this, arguments);
            this.__cfg = cfg;
        },
        toJSON: function() {
            return this.__cfg;
        }
    });

    /**
     * ServerResponse mapper
     */
    Wegas.persistence["ManagedModeResponseFilter$ServerResponse"] = Y.Base.create("ManagedModeResponseFilter$ServerResponse", Entity, [], {}, {
        ATTRS: {
            entities: {
                value: []
            },
            events: {
                value: []
            }
        }
    });
    Wegas.persistence.EntityUpdatedEvent = Y.Base.create("EntityUpdatedEvent", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            updatedEntities: {
                value: []
            }
        }
    });

    /**
     * GameModel mapper
     */
    Wegas.persistence.GameModel = Y.Base.create("GameModel", Wegas.persistence.Entity, [], {}, {
        EDITORNAME: "Game model",
        ATTRS: {
            name: {
                type: STRING
            },
            games: {
                type: ARRAY,
                value: [],
                "transient": true
            },
            scriptLibrary: {
                value: {},
                "transient": true
            },
            clientScriptLibrary: {
                value: {},
                "transient": true
            },
            cssLibrary: {
                value: {},
                "transient": true
            },
            properties: {
                value: {},
                getter: function(value, name) {
                    var key = name.split(".")[1];
                    if (Y.Lang.isString(value[key]) &&
                            (key === "freeForAll"
                                    || key === "allowCreateTeam"
                                    || key === "allowJoinTeam")) {
                        value[key] = (value[key] === "true") ? true : false;
                    }
                    return value;
                },
                _inputex: {
                    _type: "object",
                    useButtons: true,
                    required: false,
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true,
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            canView: {
                "transient": true
            },
            canEdit: {
                "transient": true
            },
            canDuplicate: {
                "transient": true
            },
            canInstantiate: {
                "transient": true
            },
            createdTime: {
                "transient": true
            },
            createdByName: {
                "transient": true
            }
        },
        EDITMENU: [{
                type: BUTTON,
                label: "Edit",
                cssClass: "editor-exploreGameModel-button",
                plugins: [{
                        fn: "EditEntityAction"
                    }, {
                        fn: "OpenTabActionSec",
                        cfg: {
                            label: "Share",
                            tabSelector: '#rightTabView',
                            wchildren: [{
                                    type: "ShareUser",
                                    permsList: [{
                                            rightLabel: "Edit",
                                            value: "GameModel:View,Edit,Delete,Duplicate,Instantiate"
                                        }, {
                                            rightLabel: "Copy",
                                            value: "GameModel:Duplicate"
                                        }, {
                                            rightLabel: "Host",
                                            value: "GameModel:Instantiate"
                                        }]
                                }]
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Open in editor",
                plugins: [{
                        fn: "OpenGameAction"
                    }]
            }, {
                type: "DeleteEntityButton",
                label: "Delete",
                cssClass: "editor-deleteGameModel-button"
            }, {
                type: BUTTON,
                label: "More",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: [{
                                    type: BUTTON,
                                    label: "Make a copy",
                                    cssClass: "editor-duplicateGameModel-button",
                                    plugins: [{
                                            fn: "DuplicateEntityAction"
                                        }]
                                }, {
                                    type: BUTTON,
                                    label: "Permissions",
                                    cssClass: "wegas-advanced-feature",
                                    plugins: [{
                                            fn: "OpenTabAction",
                                            cfg: {
                                                emptyTab: true,
                                                wchildren: [{
                                                        type: "RolePermissionList",
                                                        permsList: [{
                                                                name: "GameModel:View"
                                                            }, {
                                                                name: "GameModel:Edit",
                                                                value: "GameModel:View,Edit,Delete"
                                                            }, {
                                                                name: "GameModel:Duplicate",
                                                                value: "GameModel:Duplicate"
                                                            }, {
                                                                name: "GameModel:Instantiate",
                                                                value: "GameModel:Instantiate"
                                                            }]
                                                    }],
                                                tabSelector: '#rightTabView'
                                            }
                                        }]
                                }]
                        }
                    }]
            }]
    });

    /**
     * Game mapper
     */
    Wegas.persistence.Game = Y.Base.create("Game", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            gameModelId: {
                type: STRING,
                _inputex: {
                    _type: "hidden"
                }
            },
            gameModel: {//                                                      // Extended-view only
                "transient": true
            },
            name: {
                type: STRING
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true,
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            createdBy: {
                "transient": true
            },
            teams: {
                "transient": true,
                value: []
            },
            createdTime: {
                "transient": true
            },
            updatedTime: {
                "transient": true
            },
            visibility: {
                "transient": true,
                type: STRING,
                choices: [
                    //{value: 'Private', label: 'Only people in the list s join'},
                    {value: 'Public', label: 'Game is visible in the lobby.'},
                    {value: 'Link', label: 'Player need the link to join. '}],
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            access: {
                type: STRING,
                value: "ENROLMENTKEY",
                choices: [{
                        value: "URL",
                        label: "Public game"
                    }, {
                        value: "OPEN",
                        label: "Anyone with the link can join"
                    }, {
                        value: "ENROLMENTKEY",
                        label: "Players need an enrolment key to join"
                    }, {
                        value: "SINGLEUSAGEENROLMENTKEY",
                        label: "Each player/team needs an unique enrolment key to join"
                    }, {
                        value: "CLOSE",
                        label: "Game does not accept new players"
                    }],
                _inputex: {
                    value: "ENROLMENTKEY",
                    interactions: [{
                            valueTrigger: "OPEN", // this action will run when this field value is set to OPEN
                            actions: [
                                {name: 'key', action: 'hide'},
                                {name: 'keys', action: 'hide'}]
                        }, {
                            valueTrigger: "URL", // this action will run when this field value is set to OPEN
                            actions: [
                                {name: 'key', action: 'hide'},
                                {name: 'keys', action: 'hide'}]
                        }, {
                            valueTrigger: "ENROLMENTKEY",
                            actions: [
                                {name: 'key', action: 'show'},
                                {name: 'keys', action: 'hide'}]
                        }, {
                            valueTrigger: "SINGLEUSAGEENROLMENTKEY",
                            actions: [
                                {name: 'key', action: 'hide'},
                                {name: 'keys', action: 'show'}]
                        }, {
                            valueTrigger: "CLOSE",
                            actions: [
                                {name: 'key', action: 'hide'},
                                {name: 'keys', action: 'hide'}]
                        }]
                }
            },
            key: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: "Enrolment key",
                    description: "Player can join this game by using the enrolment key in the lobby or using <br />the link below.<br />"
                            + "The key can be used to join multiple times."
                }
            },
            keys: {
                type: ARRAY,
                value: [],
                _inputex: {
                    label: "Enrolment keys",
                    _type: "enrolementkeylist",
                    description: "Player can join this game using an enrolment key as user name/password<br /> on the log in screen or by entering it in the lobby.<br />"
                            + "Each key can be used by only one team/player."
                }
            },
            token: {
                type: STRING,
                optional: true,
                _inputex: {
                    description: "Leave blank for automatic generation",
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            playersCount: {
                "transient": true,
                getter: function() {
                    var count = 0;
                    Y.Array.each(this.get("teams"), function(t) {
                        count += t.get("players").length;
                    });
                    return count;
                }
            }
        },
        EDITMENU: [{
                type: BUTTON,
                label: "Edit",
                plugins: [
                    //{
                    //    fn: "EditEntityAction"
                    //},
                    {
                        fn: "OpenTabAction",
                        cfg: {
                            label: "Game",
                            emptyTab: true,
                            tabSelector: '#rightTabView',
                            wchildren: [{
                                    type: "List",
                                    children: [{
                                            type: "EditEntityForm"
                                        }, {
                                            type: "ShareRole",
                                            permsList: [{
                                                    name: "Public",
                                                    value: "Game:View"
                                                }, {
                                                    name: "Link",
                                                    value: "Game:Token"
                                                }
                                                //, {
                                                //    name: "TeamToken",
                                                //    value: "Game:TeamToken"
                                                //}
                                            ]
                                        }
                                    ]
                                }]
                        }
                    },
                    {
                        fn: "OpenTabActionThi",
                        cfg: {
                            label: "Teams",
                            tabSelector: '#rightTabView',
                            wchildren: [{
                                    type: "TeamTreeView"
                                }]
                        }
                    },
                    {
                        fn: "OpenTabActionSec",
                        cfg: {
                            label: "Share",
                            tabSelector: '#rightTabView',
                            wchildren: [{
                                    type: "ShareUser",
                                    plugins: [{
                                            fn: "WidgetToolbar",
                                            cfg: {
                                                children: [{type: "Text"}]
                                            }
                                        }],
                                    permsList: [{
                                            rightLabel: "Play",
                                            value: "Game:View"
                                        }, {
                                            rightLabel: "Admin",
                                            value: "Game:View,Edit"
                                        }
                                        //, {
                                        //    label: "Token",
                                        //    value: "Game:Token"
                                        //}
                                    ]
                                }]
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Open",
                plugins: [{
                        fn: "OpenGameAction",
                        cfg: {
                            editorUrl: "wegas-app/view/host.html?"
                        }
                    }]
            }, {
                type: "DeleteEntityButton",
                label: "Delete"
            }, {
                type: BUTTON,
                label: "More",
                cssClass: "wegas-advanced-feature",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: [{
                                    type: BUTTON,
                                    label: "Create a model based on this game",
                                    disabled: true
                                }, {
                                    type: "JoinOrResumeButton",
                                    label: "Join",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: BUTTON,
                                    label: "Permissions",
                                    cssClass: "editor-shareGame-button wegas-advanced-feature",
                                    plugins: [{
                                            fn: "OpenTabAction",
                                            cfg: {
                                                emptyTab: true,
                                                wchildren: [{
                                                        type: "RolePermissionList",
                                                        permsList: [{
                                                                name: "Game:View"
                                                            }, {
                                                                name: "Game:Edit",
                                                                value: "Game:Edit,View"
                                                            }]
                                                    }],
                                                tabSelector: '#rightTabView'
                                            }
                                        }]
                                }, {
                                    type: "AddEntityChildButton",
                                    label: "Add team",
                                    targetClass: "Team",
                                    cssClass: "wegas-advanced-feature"
                                }, {
                                    type: "Linkwidget"
                                }]
                        }
                    }]
            }
        ]
    });

    Wegas.persistence.DebugGame = Wegas.persistence.Game;

    /**
     * Team mapper
     */
    Wegas.persistence.Team = Y.Base.create("Team", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            '@class': {
                value: "Team"
            },
            name: {
                type: STRING
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
                type: BUTTON,
                label: "Open",
                plugins: [{
                        fn: "OpenGameAction",
                        cfg: {
                            editorUrl: "wegas-app/view/host.html?"
                        }
                    }]
            }, {
                type: "DeleteEntityButton"
            }, {
                type: "JoinOrResumeButton",
                cssClass: "wegas-advanced-feature",
                label: "Join"
            }, {
                type: "EditEntityButton",
                label: "Edit",
                cssClass: "wegas-advanced-feature"
            }, {// We allow the player to open its pages with the widget
                type: BUTTON,
                label: "View as",
                cssClass: "wegas-advanced-feature",
                plugins: [{
                        fn: "OpenGameAction",
                        cfg: {
                            editorUrl: "wegas-app/view/play.html?"
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Add player",
                cssClass: "wegas-advanced-feature",
                plugins: [{
                        fn: "AddEntityChildAction",
                        cfg: {
                            targetClass: "Player"
                        }
                    }]
            }
            //, {
            //    type: "Linkwidget"
            //}
        ]
    });

    /**
     * Player mapper
     */
    Wegas.persistence.Player = Y.Base.create("Player", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: STRING
            },
            teamId: IDATTRDEF,
            userId: {
                "transient": true
            }
        },
        EDITMENU: [{
                type: BUTTON,
                label: "Open",
                plugins: [{
                        fn: "OpenGameAction",
                        cfg: {
                            editorUrl: "wegas-app/view/host.html?"
                        }
                    }]
            }, {
                type: "DeleteEntityButton",
                cssClass: "editor-deletePlayer-button"
            }, {
                type: "EditEntityButton",
                label: "Edit",
                cssClass: "editor-playerProperties-button"
            }]
    });

    /**
     * User mapper
     */
    Wegas.persistence.User = Y.Base.create("User", Wegas.persistence.Entity, [], {
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
    Wegas.persistence.Role = Y.Base.create("Role", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: STRING
            },
            description: {
                "transient": true,
                type: STRING,
                format: TEXT,
                optional: true
            },
            permissions: {
                optional: true,
                type: ARRAY,
                items: {
                    _inputex: {
                        _type: GROUP,
                        fields: [{
                                name: "id",
                                type: HIDDEN,
                                value: null
                            }, {
                                name: "@class",
                                type: HIDDEN,
                                value: "Permission"
                            }, {
                                name: "value"
                            }, {
                                name: "inducedPermission",
                                value: null
                            }]
                    }
                },
                _inputex: {
                    useButtons: true,
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
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
    Wegas.persistence.JpaAccount = Y.Base.create("JpaAccount", Wegas.persistence.Entity, [], {
        getPublicName: function() {
            return this.get("name");
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
            name: {
                getter: function(val) {
                    if (this.get("firstname") || this.get("lastname")) {
                        return this.get("firstname") + " " + (this.get("lastname") || "");

                    } else {
                        return this.get("email");
                    }
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
            hash: {
                "transient": true
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
                    choices: [],
                    _inputex: {
                        label: "",
                        _type: "roleselect"
                    }
                },
                _inputex: {
                    label: "Groups",
                    useButtons: true
                }
            },
            permissions: {
                optional: true,
                type: ARRAY,
                items: {
                    _inputex: {
                        _type: GROUP,
                        fields: [{
                                name: "id",
                                type: HIDDEN,
                                value: null
                            }, {
                                name: "@class",
                                type: HIDDEN,
                                value: "Permission"
                            }, {
                                name: "value"
                            }, {
                                name: "inducedPermission",
                                value: ""
                            }]
                    }
                },
                _inputex: {
                    useButtons: true,
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            }
        },
        EDITMENU: [{
                type: "EditEntityButton",
                label: "Edit user"
            }, {
                type: BUTTON,
                disabled: true,
                label: "Permissions"
            }, {
                type: "DeleteEntityButton"
            }]
    });

    /**
     * JpaAccount mapper
     */
    Wegas.persistence.GuestJpaAccount = Y.Base.create("JpaAccount", Wegas.persistence.Entity, [], {
        getPublicName: function() {
            return "Guest";
        }
    }, {
        ATTRS: {
            "@class": {
                type: STRING,
                value: "GuestJpaAccount",
                _inputex: {
                    _type: HIDDEN
                }
            },
            permissions: {
                "transient": true,
                value: []
            }
        },
        EDITMENU: [{
                type: "DeleteEntityButton"
            }]
    });
});
