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
YUI.add('wegas-entity', function(Y) {
    'use strict';
    var STRING = 'string',
        NUMBER = 'number',
        HIDDEN = 'hidden',
        ARRAY = 'array',
        NAME = 'name',
        SELECT = 'select',
        BUTTON = 'Button',
        TEXT = 'text',
        HTML = 'html',
        ITEMS = 'items',
        GROUP = 'group',
        Wegas = Y.namespace('Wegas'),
        persistence = Y.namespace('Wegas.persistence'),
        Base = Y.Base,
        Entity,
        IDATTRDEF = {
            type: STRING,
            optional: true, //                                                  // The id is optional for entites that
            // have not been persisted
            view: {
                type: HIDDEN
            }
        },
        PERMISSION = {
            optional: true,
            type: ARRAY,
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        view: {type: 'hidden'}
                    },
                    '@class': {
                        value: 'Permission',
                        view: {type: 'hidden'}
                    },
                    value: {
                        type: 'string',
                        view: {
                            label: 'Value'
                        }
                    }
                }
            },
            view: {
                className: 'wegas-advanced-feature'
            }
        };

    /**
     * @class Entity is used to represent db objects
     * @name Y.Wegas.persistence.Entity
     * @extends Y.Base
     * @augments Y.Wegas.Editable
     * @constructor
     */
    Entity = Base.create(
        'Entity',
        Base,
        [Wegas.Editable],
        {},
        {
            ATTRS: {
                initialized: {
                    transient: true
                },
                destroyed: {
                    transient: true
                },
                id: {
                    type: NUMBER,
                    optional: true, // The id is optional for entites that have not been persisted
                    writeOnce: 'initOnly',
                    setter: function(val) {
                        return val * 1;
                    },
                    index: -2,
                    view: {
                        type: 'uneditable',
                        className: 'wegas-advanced-feature',
                        label: 'Id'
                    }
                },
                '@class': {
                    value: 'null',
                    required: true,
                    writeOnce: 'initOnly',
                    type: STRING,
                    view: {
                        type: HIDDEN
                    }
                },
                refId: {
                    type: STRING,
                    optional: true, // The refId is optional for entites that have not been persisted
                    writeOnce: "initOnly",
                    index: -1,
                    view: {
                        type: "uneditable",
                        className: "wegas-advanced-feature",
                        label: "RefId"
                    }
                },
                label: {
                    transient: true,
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
                REF_ID: {
                    type: STRING,
                    optional: true, // The refId is optional for entites that have not been persisted
                    writeOnce: "initOnly",
                    index: -1,
                    view: {
                        type: "uneditable",
                        className: "wegas-advanced-feature",
                        label: "RefId"
                    }
                },
                VISIBILITY: {
                    type: STRING,
                    valueFn: function() {
                        return Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("type") === "MODEL" ? "INHERITED" : "PRIVATE";
                    },
                    view: {
                        type: SELECT,
                        choices: [{
                                value: "INTERNAL",
                                label: "Model"
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
                        maxWritableVisibility: "NONE",
                        label: "Visibility",
                        className: "wegas-entity--visibility-attribute"
                    }
                },
            }
        });
    persistence.Entity = Entity;

    /**
     *
     */
    persistence.DefaultEntity = Base.create(
        'DefaultEntity',
        Entity,
        [],
        {
            initializer: function(cfg) {
                this.set('val', cfg);
            },
            toJSON: function() {
                return this.get('val');
            }
        },
        {
            ATTRS: {
                val: {}
            }
        }
    );

    /**
     * ManagedResponse mapper
     */
    persistence['ManagedResponse'] = Base.create(
        'ManagedResponse',
        Entity,
        [],
        {},
        {
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
        }
    );

    /**
     *
     */
    persistence.EntityUpdatedEvent = Base.create(
        'EntityUpdatedEvent',
        persistence.Entity,
        [],
        {},
        {
            ATTRS: {
                updatedEntities: {
                    value: []
                }
            }
        }
    );

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
            view: {
                type: HIDDEN
            }
        },
        items: {
            type: ARRAY,
            value: [],
            "transient": true,
            view: {
                type: HIDDEN
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
    persistence.GameModel = Base.create("GameModel", persistence.Entity, [persistence.VariableContainer], {
        dependsOnModel: function() {
            return this.get("type") === "SCENARIO" && this.get("basedOnId") > 0;
        }
    }, {
        EDITORNAME: "Scenario",
        ATTRS: {
            name: {
                type: STRING,
                view: {
                    label: 'Name',
                    className: 'editor-form-gamemodel-name'
                }
            },
            basedOnId: {
                type: NUMBER,
                view: {
                    type: 'uneditable',
                    className: 'wegas-advanced-feature',
                    label: 'model id'
                }
            },
            basedOnName: {
                type: STRING,
                view: {
                    type: 'uneditable',
                    className: 'wegas-advanced-feature',
                    label: 'model name'
                }
            },
            games: {
                type: ARRAY,
                value: [],
                transient: true
            },
            scriptLibrary: {
                value: {},
                transient: true
            },
            clientScriptLibrary: {
                value: {},
                transient: true
            },
            cssLibrary: {
                value: {},
                transient: true
            },
            properties: {
                type: 'object',
                value: {},
                properties: {
                    guestAllowed: {
                        type: "boolean",
                        view: {label: "Guest allowed?"}
                    },
                    freeForAll: {
                        type: 'boolean',
                        view: {
                            label: 'Game is played',
                            type: 'select',
                            choices: [
                                {
                                    value: true,
                                    label: 'individually'
                                },
                                {
                                    value: false,
                                    label: 'in team'
                                }
                            ]
                        }
                    },
                    scriptUri: {
                        type: STRING,
                        view: {label: 'Server scripts'}
                    },
                    clientScriptUri: {
                        type: STRING,
                        view: {label: 'Client scripts'}
                    },
                    cssUri: {
                        type: STRING,
                        view: {label: 'Stylesheets'}
                    },
                    pagesUri: {
                        type: STRING,
                        view: {label: 'Pages'}
                    },
                    // still in use ??
                    imageUri: {
                        type: STRING,
                        view: {
                            type: 'hidden',
                            label: 'Image uri',
                            className: 'wegas-advanced-feature'
                        }
                    },
                    iconUri: {
                        type: STRING,
                        view: {
                            type: 'uneditable',
                            label: 'Icon uri',
                            className: 'wegas-advanced-feature',
                            description: 'Use the lobby to edit the icon'
                        }
                    },
                    // still in use ??
                    websocket: {
                        type: STRING,
                        view: {
                            type: 'hidden',
                            label: 'Websocket'
                        }
                    }
                }
            },
            description: {
                type: STRING,
                view: {
                    type: 'html',
                    label: 'Description'
                }
            },
            comments: {
                type: [STRING, 'null'],
                index: 100,
                view: {
                    type: 'textarea',
                    className: 'wegas-comments',
                    placeholder: 'Optional comments'
                }
            },
            type: {
                type: STRING
            },
            canView: {
                transient: true
            },
            canEdit: {
                transient: true
            },
            canDuplicate: {
                transient: true
            },
            canInstantiate: {
                transient: true
            },
            createdTime: {
                transient: true
            },
            createdByName: {
                transient: true
            }
        }
    });


    /**
     * Game mapper
     */
    persistence.Game = Base.create(
        'Game',
        persistence.Entity,
        [],
        {},
        {
            ATTRS: {
                gameModelId: {
                    type: STRING,
                    view: {
                        type: HIDDEN
                    }
                },
                name: {
                    type: STRING,
                    view: {
                        className: 'wegas-game-name',
                        label: 'Name'
                    }
                },
                gameModelName: {
                    //"transient": true
                    type: STRING,
                    view: {
                        type: 'uneditable',
                        label: 'Scenario',
                        className: 'wegas-game-scenario'
                    }
                },
                createdByName: {
                    transient: true
                },
                createdTime: {
                    transient: true
                },
                updatedTime: {
                    transient: true
                },
                gameModel: {
                    //                                                      // Extended view only
                    transient: true
                },
                properties: {
                    transient: true
                },
                teams: {
                    transient: true,
                    value: []
                },
                shareLabel: {
                    type: STRING,
                    optional: true,
                    view: {
                        type: 'uneditable',
                        label: 'Game access',
                        className: 'wegas-game-subtitle'
                    }
                },
                access: {
                    type: STRING
                },
                token: {
                    type: STRING
                },
                keys: {
                    type: ARRAY,
                    value: []
                },
                accountkeys: {
                    type: ARRAY,
                    value: []
                },
                playersCount: {
                    transient: true,
                    getter: function() {
                        var count = 0;
                        Y.Array.each(this.get('teams'), function(t) {
                            if (!(t instanceof persistence.DebugTeam)) {
                                count += t.get('players').length;
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
            '@class': {
                value: 'Team'
            },
            name: {
                type: STRING
            },
            notes: {
                value: '',
                view: {
                    type: HIDDEN
                }
            },
            declaredSize: {
                transient: true
            },
            status: {
                "transient": true
            },
            players: {
                value: [],
                view: {
                    type: HIDDEN
                }
            },
            gameId: IDATTRDEF
        }
    });
    /**
     *
     */
    persistence.DebugTeam = Base.create(
        'DebugTeam',
        persistence.Team,
        [],
        {},
        {}
    );

    /**
     * Player mapper
     */
    persistence.Player = Base.create(
        'Player',
        persistence.Entity,
        [],
        {},
        {
            ATTRS: {
                name: {
                    type: STRING
                },
                teamId: IDATTRDEF,
                userId: {
                    transient: true
                },
                team: {
                    transient: true,
                    getter: function() {
                        return Wegas.Facade.Game.cache.find(
                            'id',
                            this.get('teamId')
                            );
                    }
                },
                verifiedId: {
                    transient: true
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
    persistence.User = Base.create(
        'User',
        persistence.Entity,
        [],
        {
            getMainAccount: function() {
                return this.get('accounts')[0];
            }
        },
        {
            ATTRS: {
                name: {
                    type: STRING,
                    transient: true,
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
                },
                roles: {
                    value:[],
                    transient:true,
                    type: "array"
                }
            }
        }
    );

    /**
     * Role mapper
     */
    persistence.Role = Base.create(
        'Role',
        persistence.Entity,
        [],
        {},
        {
            ATTRS: {
                name: {
                    type: STRING
                },
                description: {
                    transient: true,
                    type: STRING,
                    format: TEXT,
                    optional: true
                },
                permissions: PERMISSION
            },
            EDITMENU: {
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
    persistence.JpaAccount = Base.create(
        'JpaAccount',
        persistence.Entity,
        [],
        {
            getPublicName: function() {
                return this.get(NAME);
            }
        },
        {
            ATTRS: {
                '@class': {
                    value: 'JpaAccount'
                },
                name: {
                    transient: true,
                    getter: function() {
                        if (this.get('firstname') || this.get('lastname')) {
                            return (
                                this.get('firstname') +
                                ' ' +
                                (this.get('lastname') || '')
                                );
                        } else {
                            return this.get('email');
                        }
                    }
                },
                firstname: {
                    type: STRING,
                    view: {
                        label: 'First name'
                    }
                },
                lastname: {
                    label: 'Last name',
                    type: STRING,
                    view: {
                        label: 'Last name'
                    }
                },
                email: {
                    type: STRING,
                    view: {
                        type: 'string'
                    }
                },
                username: {
                    type: STRING,
                    optional: true,
                    view: {
                        label: 'Username',
                        description: 'Can be used to log in'
                    }
                },
                hash: {
                    transient: true
                },
                password: {
                    type: STRING,
                    optional: true,
                    view: {
                        type: 'password',
                        label: 'Password',
                        strengthIndicator: false,
                        capsLockWarning: true,
                        description: 'Leave blank for no change'
                    }
                },
                passwordConfirm: {
                    type: STRING,
                    optional: true,
                    errored: function(val, formVal) {
                        if (val !== formVal.password) {
                            return 'Passwords do not match';
                        }
                    },
                    view: {
                        type: 'password',
                        label: 'Confirm password'
                    }
                },
                roles: {
                    optional: true,
                    type: ARRAY,
                    items: {
                        type: STRING
                    },
                    view: {
                        label: 'Groups'
                    }
                },
                permissions: PERMISSION
            },
            EDITMENU: {
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
    persistence.AaiAccount = Base.create(
        'AaiAccount',
        persistence.Entity,
        [],
        {
            getPublicName: function() {
                return this.get(NAME);
            }
        },
        {
            ATTRS: {
                '@class': {
                    value: 'AaiAccount'
                },
                name: {
                    transient: true,
                    getter: function() {
                        if (this.get('firstname') || this.get('lastname')) {
                            return (
                                this.get('firstname') +
                                ' ' +
                                (this.get('lastname') || '')
                                );
                        } else {
                            return this.get('email');
                        }
                    }
                },
                firstname: {
                    type: STRING,
                    view: {
                        label: 'First name'
                    }
                },
                lastname: {
                    label: 'Last name',
                    type: STRING,
                    view: {
                        label: 'Last name'
                    }
                },
                email: {
                    type: STRING,
                    view: {
                        type: 'email'
                    }
                },
                roles: {
                    optional: true,
                    type: ARRAY,
                    items: {
                        type: STRING,
                        choices: []
                    },
                    view: {
                        label: 'Groups'
                    }
                },
                permissions: PERMISSION
            },
            EDITMENU: {
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
    persistence.GuestJpaAccount = Base.create(
        'GuestJpaAccount',
        persistence.Entity,
        [],
        {
            getPublicName: function() {
                return 'Guest';
            }
        },
        {
            ATTRS: {
                '@class': {
                    value: 'GuestJpaAccount'
                },
                permissions: {
                    transient: true,
                    value: []
                }
            },
            EDITMENU: {
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
