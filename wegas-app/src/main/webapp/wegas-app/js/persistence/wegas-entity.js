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
YUI.add("wegas-entity", function(Y) {
    "use strict";

    var STRING = "string",
        NUMBER = "number",
        HIDDEN = "hidden",
        ARRAY = "array",
        NAME = "name",
        BUTTON = "Button",
        TEXT = "text",
        HTML = "html",
        GROUP = "group",
        Wegas = Y.namespace("Wegas"),
        persistence = Y.namespace("Wegas.persistence"),
        Base = Y.Base, Entity,
        IDATTRDEF = {
            type: STRING,
            optional: true, //                                                  // The id is optional for entites that
            // have not been persisted
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
                type: NUMBER,
                optional: true, // The id is optional for entites that have not been persisted
                writeOnce: "initOnly",
                setter: function(val) {
                    return val * 1;
                },
                index: -2,
                view: {
                    type: "uneditable",
                    className: "wegas-advanced-feature"                    
                }
            },
            "@class": {
                value: "null",
                required: true,
                writeOnce: "initOnly",
                type: STRING,
                view: {
                    type: HIDDEN
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
     * ManagedResponse mapper
     */
    persistence["ManagedResponse"] = Base.create("ManagedResponse", Entity, [], {}, {
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
                type: STRING,
                _inputex: {
                    wrapperClassName: "inputEx-fieldWrapper editor-form-gamemodel-name"
                }
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
                            label: "in team"
                        }]
                    }, { /*
                        name: "imageUri",
                        label: "Thumbnail",
                        type: "wegasurl"
                    }, {
                        name: "iconUri",
                        label: "Icon",
                        type: "wegasurl"
                    }, {*/
                        name: "scriptUri",
                        label: "Server scripts",
                        wrapperClassName: "inputEx-fieldWrapper"
                    }, {
                        name: "clientScriptUri",
                        label: "Client scripts",
                        wrapperClassName: "inputEx-fieldWrapper"
                    }, {
                        name: "cssUri",
                        label: "Stylesheets",
                        wrapperClassName: "inputEx-fieldWrapper"
                    }, {
                        name: "pagesUri",
                        label: "Pages",
                        wrapperClassName: "inputEx-fieldWrapper"
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
            comments: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: "text",
                    wrapperClassName: "wegas-comments",
                    index: 100
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
        EDITMENU: []
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
                    wrapperClassName: "inputEx-fieldWrapper inputEx-uneditableField wegas-game-scenario"
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
            gameModel: { //                                                      // Extended view only
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
                        actions: [{
                            name: "token",
                            action: "show"
                        },
                            {
                                name: "keys",
                                action: "hide"
                            },
                            {
                                name: "accountkeys",
                                action: "hide"
                            }]
                    }, {
                        valueTrigger: "SINGLEUSAGEENROLMENTKEY",
                        actions: [{
                            name: "token",
                            action: "hide"
                        },
                            {
                                name: "keys",
                                action: "show"
                            },
                            {
                                name: "accountkeys",
                                action: "show"
                            }]
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
        EDITMENU: []
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
            notes: {
                value: "",
                _inputex: {
                    _type: HIDDEN
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
        EDITMENU: []
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
            },
            team: {
                "transient": true,
                getter: function() {
                    return Wegas.Facade.Game.cache.find("id", this.get("teamId"));
                }
            }
        },
        EDITMENU: []
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
            return this.get(NAME);
        }
    }, {
        ATTRS: {
            "@class": {
                value: "JpaAccount"
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
                    strengthIndicator: false,
                    capsLockWarning: true,
                    id: "password",
                    typeInvite: null,
                    description: "Leave blank for no change"
                }
            },
            passwordConfirm: {
                type: STRING,
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
                value: "GuestJpaAccount"
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
