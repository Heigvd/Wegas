/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
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
        ITEMS = "items",
        Wegas = Y.namespace("Wegas"), persistence = Y.namespace("Wegas.persistence"),
        Base = Y.Base, Entity,
        IDATTRDEF;

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
                type: STRING,
                optional: true, // The id is optional for entites that have not been persisted
                writeOnce: "initOnly",
                setter: function(val) {
                    return val * 1;
                },
                _inputex: {
                    _type: "uneditable",
                    wrapperClassName: "inputEx-fieldWrapper inputEx-uneditableField wegas-advanced-feature",
                    index: -2
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
            refId: {
                type: STRING,
                optional: true, // The refId is optional for entites that have not been persisted
                writeOnce: "initOnly",
                setter: function(val) {
                    return val * 1;
                },
                _inputex: {
                    _type: "uneditable",
                    wrapperClassName: "inputEx-fieldWrapper inputEx-uneditableField wegas-advanced-feature",
                    index: -1
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
         *  ex:
         editBtn: {
         index: -1,
         maxVisibility: "INTERNAL", // button will be visible up to this visibility, unspecified means INHERITED
         cfg: {
         buttonConfigHere : {}
         }
         },
         */
        EDITMENU: {},
        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {},
        ATTRS_DEF: {
            VISIBILITY: {
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
                    maxWritableVisibility: "NONE",
                    wrapperClassName: "wegas-advanced-feature"
                }
            },
        }
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

    /**
     * ManagedResponse mapper
     */
    persistence["ManagedResponse"] = Base.create("ManagedResponse", Entity, [], {}, {
        ATTRS: {
            deletedEntities: {
                value: []
            },
            updatedEntities: {
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

    persistence.VariableContainer = function() {};
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
            return Y.Wegas.Facade.Variable.cache.findById(this.get("itemsIds")[i]);
        },
        size: function() {
            return this.get("itemsIds").length;
        }
    });
    persistence.VariableContainer.ATTRS = {
        itemsIds: {
            type: ARRAY,
            value: [],
            "transient": true,
            _inputex: {
                _type: HIDDEN
            }
        },
        items: {
            type: ARRAY,
            value: [],
            "transient": true,
            _inputex: {
                _type: HIDDEN
            },
            /*
             * one would use setter, but more complicated to keep up to date
             * @param {type} val
             * @returns {undefined}
             */
            getter: function() {
                return Y.Array.map(this.get('itemsIds'), Y.Wegas.Facade.Variable.cache.findById, Y.Wegas.Facade.Variable.cache);
            }
        }
    };


    /**
     * GameModel mapper
     */
    persistence.GameModel = Base.create("GameModel", persistence.Entity, [persistence.VariableContainer], {}, {
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
                    fields: [
                        {
                            name: "guestAllowed",
                            type: "boolean",
                            label: "Guest allowed ?"
                        },
                        {
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
                        }, {
                            name: "iconUri",
                            label: "Icon",
                            type: "hidden"
                        }, {
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
            type: {
                type: STRING
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
        }
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
        }
    });
    persistence.DebugGame = persistence.Game;

    /**
     * Team mapper
     */
    persistence.Team = Base.create("Team", persistence.Entity, [], {
        getPlayerByStatus: function(statuses) {
            var i, player;

            if (!Array.isArray(statuses)) {
                statuses = [statuses];
            }

            for (i in this.get("players")) {
                player = this.get("players")[i];
                if (statuses.indexOf(player.get("status")) >= 0) {
                    return player;
                }
            }

            return null;

        },
        getLivePlayer: function() {
            return this.getPlayerByStatus("LIVE");
        },
        getStatus: function() {
            if (this.isLive()) {
                return "LIVE";
            } else if (this.getPlayerByStatus(["PROCESSING", "SEC_PROCESSING"])) {
                return "PROCESSING";
            } else if (this.getPlayerByStatus(["WAITING", "RESCHEDULED"])) {
                return "WAITING";
            } else {
                return "FAILED";
            }

        },
        /**
         * is the team live? ie does it contains at least one live player ?
         * @returns {Boolean}
         */
        isLive: function() {
            return this.getLivePlayer() !== null;
        }
    }, {
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
            declaredSize: {
                "transient": true
            },
            status: {
                "transient": true
            },
            players: {
                value: [],
                _inputex: {
                    _type: HIDDEN
                }
            },
            gameId: IDATTRDEF
        }
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
            },
            verifiedId: {
                "transient": true
            },
            homeOrg: {
                "transient": true
            },
            status: {
                "transient": true
            }
        }
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
                            }]
                    }
                }
            }
        },
        NEW_EDITMENU: {
            editBtn: {
                index: -1,
                cfg: {
                    type: "EditEntityButton",
                    label: "Edit group"
                }
            },
            deleteBtn: {
                index: 30,
                cfg: {
                    type: "DeleteEntityButton"
                }
            }
        }
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
                            }]
                    }
                },
                _inputex: {
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                }
            }
        },
        NEW_EDITMENU: {
            editBtn: {
                index: -1,
                cfg: {
                    type: "EditEntityButton",
                    label: "Edit user"
                }
            },
            deleteBtn: {
                index: 30,
                cfg: {
                    type: "DeleteEntityButton"
                }
            }
        }
    });

    /**
     * AaiAccount mapper
     */
    persistence.AaiAccount = Base.create("AaiAccount", persistence.Entity, [], {
        getPublicName: function() {
            return this.get(NAME);
        }
    }, {
        ATTRS: {
            "@class": {
                value: "AaiAccount"
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
                            }]
                    }
                },
                _inputex: {
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                }
            }
        },
        NEW_EDITMENU: {
            editBtn: {
                index: -1,
                cfg: {
                    type: "EditEntityButton",
                    label: "Edit user"
                }
            },
            deleteBtn: {
                index: 30,
                cfg: {
                    type: "DeleteEntityButton"
                }
            }
        }
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
        NEW_EDITMENU: {
            editBtn: {
                index: -1,
                cfg: {
                    type: "EditEntityButton",
                    label: "Edit user"
                }
            },
            deleteBtn: {
                index: 30,
                cfg: {
                    type: "DeleteEntityButton"
                }
            }
        }
    });
});
