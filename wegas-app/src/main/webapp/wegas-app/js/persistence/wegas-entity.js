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
YUI.add('wegas-entity', function(Y) {
    'use strict';
    var STRING = 'string',
        NUMBER = 'number',
        HIDDEN = 'hidden',
        ARRAY = 'array',
        NAME = 'name',
        BUTTON = 'Button',
        TEXT = 'text',
        HTML = 'html',
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
                        view: { type: 'hidden' }
                    },
                    '@class': {
                        value: 'Permission',
                        view: { type: 'hidden' }
                    },
                    value: {
                        type: 'string',
                        view: {
                            label: 'Value'
                        }
                    },
                    inducedPermission: {
                        type: 'string',
                        view: {
                            label: ' Induced permission'
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
                label: {
                    transient: true,
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
        }
    );
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
    persistence.RestException = persistence.DefaultEntity;

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

    /**
     * GameModel mapper
     */
    persistence.GameModel = Base.create(
        'GameModel',
        persistence.Entity,
        [],
        {},
        {
            EDITORNAME: 'Scenario',
            ATTRS: {
                name: {
                    type: STRING,
                    view: {
                        label: 'Name',
                        className: 'editor-form-gamemodel-name'
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
                            view: { label: 'Server scripts' }
                        },
                        clientScriptUri: {
                            type: STRING,
                            view: { label: 'Client scripts' }
                        },
                        cssUri: {
                            type: STRING,
                            view: { label: 'Stylesheets' }
                        },
                        pagesUri: {
                            type: STRING,
                            view: { label: 'Pages' }
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
                        placeholder: 'Comments'
                    }
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
            },
            EDITMENU: []
        }
    );

    /**
     * GameModel root descriptor encapsulation
     */
    persistence.RootDescriptors = Base.create(
        'RootDescriptors',
        persistence.Entity,
        [],
        {},
        {
            EDITORNAME: 'Scenario Root Descriptors',
            ATTRS: {
                items: {
                    type: ARRAY,
                    value: []
                }
            },
            EDITMENU: []
        }
    );

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
            },
            EDITMENU: []
        }
    );
    persistence.DebugGame = persistence.Game;

    /**
     * Team mapper
     */
    persistence.Team = Base.create(
        'Team',
        persistence.Entity,
        [],
        {},
        {
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
                players: {
                    value: [],
                    view: {
                        type: HIDDEN
                    }
                },
                gameId: IDATTRDEF
            },
            EDITMENU: []
        }
    );
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
                    transient: true
                }
            },
            EDITMENU: []
        }
    );

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
            EDITMENU: [
                {
                    type: 'EditEntityButton',
                    label: 'Edit group'
                },
                {
                    type: 'DeleteEntityButton'
                }
            ]
        }
    );

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
            EDITMENU: [
                {
                    type: 'EditEntityButton',
                    label: 'Edit user'
                },
                {
                    type: 'DeleteEntityButton'
                }
            ]
        }
    );

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
            EDITMENU: [
                {
                    type: 'DeleteEntityButton'
                }
            ]
        }
    );

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
            EDITMENU: [
                {
                    type: 'DeleteEntityButton'
                }
            ]
        }
    );
});
