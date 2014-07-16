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
YUI.add("wegas-entity", function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "name",
        BUTTON = "Button", TEXT = "text", HTML = "html", GROUP = "group",
        Wegas = Y.namespace("Wegas"), persistence = Y.namespace("Wegas.persistence"),
        Base = Y.Base, Entity,
        IDATTRDEF = {
            type: STRING,
            optional: true, // The id is optional for entites that have not been persisted
            _inputex: {
                _type: HIDDEN
            }
        };

    /**
     * @class Entity is used to represent db objects
     * @name Y.Wegas.persistence.Entity
     * @extends Y.Base
     * @augments Y.Wegas.Editable
     * @constructor
     */
    Entity = Base.create("Entity", Base, [Wegas.Editable], {}, {
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
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature",
                    index: -2,
                    disable: true
                }
            },
            "@class": {
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
    persistence.Entity = Entity;

    /**
     *
     */
    persistence.DefaultEntity = Base.create("DefaultEntity", Entity, [], {
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
    persistence.RestException = persistence.DefaultEntity;

    /**
     * ServerResponse mapper
     */
    persistence["ManagedModeResponseFilter$ServerResponse"] = Base.create("ManagedModeResponseFilter$ServerResponse", Entity, [], {}, {
        ATTRS: {
            entities: {
                value: []
            },
            events: {
                value: []
            }
        }
    });

    /**
     * 
     */
    persistence.EntityUpdatedEvent = Base.create("EntityUpdatedEvent", persistence.Entity, [], {}, {
        ATTRS: {
            updatedEntities: {
                value: []
            }
        }
    });

    /**
     * GameModel mapper
     */
    persistence.GameModel = Base.create("GameModel", persistence.Entity, [], {}, {
        EDITORNAME: "Scenario",
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
                _inputex: {
                    required: false,
                    fields: [{
                            name: "freeForAll",
                            type: "radio",
                            label: "Game is played",
                            value: false,
                            choices: [{
                                    value: true,
                                    label: "individually"
                                }, {
                                    value: false,
                                    label: "in teams"
                                }]
                        }, {
                            name: "imageUri",
                            label: "Thumbnail",
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                        }, {
                            name: "iconUri",
                            label: "Icon",
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                        }, {
                            name: "scriptUri",
                            label: "Server scripts",
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                        }, {
                            name: "clientScriptUri",
                            label: "Client scripts",
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                        }, {
                            name: "cssUri",
                            label: "Stylesheets",
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                        }, {
                            name: "pagesUri",
                            label: "Pages",
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                        }, {
                            name: "websocket",
                            label: "Websocket",
                            wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                        }]
                }
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true
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
                plugins: [{
                        fn: "EntityEditMenu"
                    }, {
                        fn: "OpenTabAction",
                        cfg: {
                            label: "Details",
                            emptyTab: true,
                            tabSelector: "#rightTabView",
                            wchildren: [{
                                    type: "EditEntityForm"
                                }]
                        }
                    }, {
                        fn: "OpenTabActionSec",
                        cfg: {
                            label: "Share",
                            tabSelector: "#rightTabView",
                            wchildren: [{
                                    type: "ShareUser",
                                    cssClass: "editor-scenarist-share",
                                    permsList: [{
                                            rightLabel: "Edit",
                                            value: "GameModel:View,Edit,Delete,Duplicate,Instantiate"
                                        }, {
                                            rightLabel: "Create scenario",
                                            value: "GameModel:Duplicate"
                                        }, {
                                            rightLabel: "Create game",
                                            value: "GameModel:Instantiate"
                                        }],
                                    roleList: ["Administrator", "Scenarist"]
                                }]
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Open",
                plugins: [{
                        fn: "OpenGameAction"
                    }]
            }, {
                type: BUTTON,
                label: "Copy",
                cssClass: "editor-duplicateGameModel-button",
                plugins: [{
                        fn: "DuplicateEntityAction"
                    }]
            }, {
                type: "DeleteEntityButton",
                label: "Delete",
                cssClass: "editor-deleteGameModel-button"
            }, {
                type: BUTTON,
                label: "More",
                cssClass: "wegas-advanced-feature",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: [{
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
                                                tabSelector: "#rightTabView"
                                            }
                                        }]
                                }, {
                                    type: BUTTON,
                                    label: "Print",
                                    cssClass: "wegas-advanced-feature",
                                    plugins: [{
                                            fn: "WidgetMenu",
                                            cfg: {
                                                menuCfg: {
                                                    points: ["tl", "tr"]
                                                },
                                                event: "mouseenter",
                                                children: [{
                                                        type: BUTTON,
                                                        label: "html",
                                                        cssClass: "wegas-advanced-feature",
                                                        plugins: [{
                                                                fn: "OpenGameAction",
                                                                cfg: {
                                                                    editorUrl: "print.html?"
                                                                }
                                                            }]
                                                    }, {
                                                        type: BUTTON,
                                                        label: "pdf",
                                                        cssClass: "wegas-advanced-feature",
                                                        plugins: [{
                                                                fn: "OpenGameAction",
                                                                cfg: {
                                                                    editorUrl: "print.html?outputType=pdf&"
                                                                }
                                                            }]
                                                    }
                                                ]
                                            }
                                        }]
                                }
                            ]
                        }
                    }]
            }]
    });

    /**
     * Game mapper
     */
    persistence.Game = Base.create("Game", persistence.Entity, [], {}, {
        ATTRS: {
            gameModelId: {
                type: STRING,
                _inputex: {
                    _type: HIDDEN
                }
            },
            name: {
                type: STRING,
                _inputex: {
                    wrapperClassName: "inputEx-fieldWrapper wegas-game-name"
                }
            },
            gameModelName: {
                //"transient": true
                type: STRING,
                _inputex: {
                    _type: "uneditable",
                    label: "Scenario",
                    wrapperClassName: "inputEx-fieldWrapper wegas-game-scenario"
                }
            },
            description: {
                type: STRING,
                format: TEXT,
                optional: true,
                _inputex: {
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                }
            },
            createdByName: {
                "transient": true
            },
            createdTime: {
                "transient": true
            },
            updatedTime: {
                "transient": true
            },
            gameModel: {//                                                      // Extended view only
                "transient": true
            },
            properties: {
                "transient": true
            },
            teams: {
                "transient": true,
                value: []
            },
            shareLabel: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: "uneditable",
                    label: "Game access",
                    wrapperClassName: "inputEx-fieldWrapper wegas-game-subtitle"
                }
            },
            access: {
                type: STRING,
                choices: [{
                        value: "SINGLEUSAGEENROLMENTKEY",
                        label: "Restricted number of players may join"
                    }, {
                        value: "ENROLMENTKEY",
                        label: "Unlimited number of players may join"
                    }],
                _inputex: {
                    _type: "radio",
                    label: "",
                    wrapperClassName: "inputEx-fieldWrapper wegas-game-access",
                    interactions: [{
                            valueTrigger: "ENROLMENTKEY",
                            actions: [{name: "token", action: "show"},
                                //{name: "url", action: "show"},
                                {name: "keys", action: "hide"},
                                {name: "accountkeys", action: "hide"}]
                        }, {
                            valueTrigger: "SINGLEUSAGEENROLMENTKEY",
                            actions: [{name: "token", action: "hide"},
                                //{name: url, action: hide},
                                {name: "keys", action: "show"},
                                {name: "accountkeys", action: "show"}]
                        }]
                }
            },
            token: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: "Option 1: Player accesses through his account",
                    wrapperClassName: "inputEx-fieldWrapper wegas-game-token",
                    description: "Players log in and joins game with an <b>enrolment key</b>.<br />"
                        + "The enrolment key can be used by an unlimited number of players."
                }
            },
            keys: {
                type: ARRAY,
                value: [],
                _inputex: {
                    label: "Option 1: Player accesses through his account",
                    wrapperClassName: "inputEx-fieldWrapper wegas-game-keys",
                    _type: "enrolmentkeylist",
                    description: "Players log in and joins game with an <b>enrolment key</b>.<br />"
                        + "Each enrolment key can be used only once."
                }
            },
            accountkeys: {
                type: ARRAY,
                value: [],
                _inputex: {
                    _type: "accountkeylist",
                    label: "Option 2: Player accesses with username/password",
                    wrapperClassName: "inputEx-fieldWrapper wegas-game-users",
                    index: 2,
                    description: "Player directly joins the game with username/password.<br />"
                        + " Each username/password can be used only once."
                }
            },
            playersCount: {
                "transient": true,
                getter: function() {
                    var count = 0;
                    Y.Array.each(this.get("teams"), function(t) {
                        if (!(t instanceof persistence.DebugTeam)) {
                            count += t.get("players").length;
                        }
                    });
                    return count;
                }
            }
        },
        EDITMENU: [{
                type: BUTTON,
                label: "Edit",
                plugins: [{
                        fn: "EntityEditMenu"
                    }, {
                        fn: "OpenTabAction",
                        cfg: {
                            label: "Details",
                            emptyTab: true,
                            tabSelector: "#rightTabView",
                            wchildren: [{
                                    type: "List",
                                    cssClass: "wegas-lobby-editgame",
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
                                                }]
                                        }]
                                }]
                        }
                    }, {
                        fn: "OpenTabActionSec",
                        cfg: {
                            label: "Share",
                            tabSelector: "#rightTabView",
                            wchildren: [{
                                    type: "ShareUser",
                                    cssClass: "editor-trainer-share",
                                    permsList: [{
                                            rightLabel: "Admin",
                                            value: "Game:View,Edit"
                                        }],
                                    roleList: ["Teacher", "Administrator", "Scenarist"],
                                    selectedPermsList: ["Game:View,Edit"]
                                }]
                        }
                    }, {
                        fn: "OpenTabActionThi",
                        cfg: {
                            label: "Players",
                            tabSelector: "#rightTabView",
                            wchildren: [{
                                    type: "TeamTreeView",
                                    plugins: [{
                                            fn: "EditorTVContextMenu"
                                        }, {
                                            fn: "EditorTVToolbarMenu"
                                        }]
                                }]
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Open",
                plugins: [{
                        fn: "OpenGameAction",
                        cfg: {
                            editorUrl: "host.html?"
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
                                                tabSelector: "#rightTabView"
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
    persistence.DebugGame = persistence.Game;

    /**
     * Team mapper
     */
    persistence.Team = Base.create("Team", persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
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
                type: "EditEntityButton",
                label: "Edit",
                cssClass: "wegas-advanced-feature"
            }, {
                type: BUTTON,
                label: "View",
                plugins: [{
                        fn: "OpenGameAction",
                        cfg: {
                            editorUrl: "host.html?"
                        }
                    }]
            }, {
                type: "DeleteEntityButton"
            }, {
                type: "JoinOrResumeButton",
                cssClass: "wegas-advanced-feature",
                label: "Join"
            }, {// We allow the player to open its pages with the widget
                type: BUTTON,
                label: "View as",
                cssClass: "wegas-advanced-feature",
                plugins: [{
                        fn: "OpenGameAction",
                        cfg: {
                            editorUrl: "play.html?"
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
        ]
    });
    /**
     * 
     */
    persistence.DebugTeam = Base.create("DebugTeam", persistence.Team, [], {}, {});

    /**
     * Player mapper
     */
    persistence.Player = Base.create("Player", persistence.Entity, [], {}, {
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
                type: "EditEntityButton",
                label: "Edit",
                cssClass: "editor-playerProperties-button"
            }, {
                type: BUTTON,
                label: "View",
                plugins: [{
                        fn: "OpenGameAction",
                        cfg: {
                            editorUrl: "host.html?"
                        }
                    }]
            }, {
                type: "DeleteEntityButton",
                cssClass: "editor-deletePlayer-button"
            }]
    });

    /**
     * User mapper
     */
    persistence.User = Base.create("User", persistence.Entity, [], {
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
    persistence.Role = Base.create("Role", persistence.Entity, [], {}, {
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
    persistence.JpaAccount = Base.create("JpaAccount", persistence.Entity, [], {
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
                "transient": true,
                getter: function() {
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
                    _type: "email"
                }
            },
            username: {
                type: STRING,
                optional: true,
                _inputex: {
                    description: "Can be used to log in"
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
                    label: "Groups"
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
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
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
     * GuestJpaAccount mapper
     */
    persistence.GuestJpaAccount = Base.create("GuestJpaAccount", persistence.Entity, [], {
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
    /*
     * GameAccount mapper
     */
    persistence.GameAccount = Base.create("GameAccount", persistence.JpaAccount, [], {}, {
        ATTRS: {
            token: {
                value: "",
                "transient": true
            }
        }
    });
});
