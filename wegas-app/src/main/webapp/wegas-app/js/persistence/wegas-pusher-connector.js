/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global Pusher:true */
YUI.add('wegas-pusher-connector', function(Y) {
    "use strict";

    var PusherDataSource, Wegas = Y.Wegas, pusherInstance;

    /**
     * PusherConnector singleton for each applicationKey
     * @name Y.Wegas.util.PusherConnector
     * @constructor
     * @param {Object} config, requires applicationKey
     * @returns {Instance}
     */
    PusherDataSource = Y.Base.create("PusherDataSource", Wegas.DataSource, [], {
        /* @lends Y.Wegas.util.PusherConnector# */

        /*
         * life cycle method
         * @private
         * @function
         * @param {Object} cfg
         * @returns {undefined}
         */
        initializer: function(cfg) {
            this.pusherInit(cfg);
            //this.pusher = new Pusher('732a1df75d93d028e4f9');
        },
        pusherInit: function(cfg) {
            if (!window.Pusher || pusherInstance) {
                //Y.later(100, this.pusherInit, this, cfg);
                return;
            }
            Pusher.log = Y.log;                                                 // Enable pusher logging - don't include this in production
            document.WEB_SOCKET_DEBUG = true;                                   // Flash fallback logging - don't include this in production
            pusherInstance = new Pusher(cfg.applicationKey, {authEndpoint: Y.Wegas.app.get("base") + "rest/Pusher/auth"});
            pusherInstance.connection.bind('error', function(err) {
                if (err.data && err.data.code === 4004) {
                    Y.log("Pusher daily limit", "error", "Y.Wegas.util.PusherConnector");
                }
            });
            pusherInstance.subscribe('Game-' + Wegas.Facade.Game.get("currentGameId")).bind_all(Y.bind(this.eventReceived, this));
            pusherInstance.subscribe('Team-' + Wegas.Facade.Game.get("currentTeamId")).bind_all(Y.bind(this.eventReceived, this));
            pusherInstance.subscribe('Player-' + Wegas.Facade.Game.get("currentPlayerId")).bind_all(Y.bind(this.eventReceived, this));
        },
        /**
         * @function
         * @private
         * @param {type} event
         * @param {type} data
         * @returns {undefined}
         */
        eventReceived: function(event, data) {
            if (event.indexOf("pusher") !== 0) {                               //ignore pusher specific event
                this.publish(event, {
                    emitFacade: false
                });
                this.fire(event, data);
            }
        },
        /**
         *
         * @param channel
         * @returns {*|EventHandle}
         */
        subscribe: function(channel) {
            return pusherInstance.subscribe(channel);
        },
        /**
         * @function
         * @public
         * @param {String} channel (Game | Team | Player)
         * @param {Object} data to send
         * @param {String} event to send
         * @returns {undefined}
         */
        triggerCustomEvent: function(channel, data, event) {
            var id;
            if (channel === "Game") {
                id = Wegas.Facade.Game.get("currentGameId");
            } else if (channel === "Team") {
                id = Wegas.Facade.Game.get("currentTeamId");
            } else {
                id = Wegas.Facade.Game.get("currentPlayerId");
            }
            this.sendRequest({
                request: "Send/" + channel + "/" + id + "/" + event,
                cfg: {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Managed-Mode': 'false'
                    },
                    data: data
                }
            });
        },
        /*
         * life cycle method
         * @private
         * @function
         * @returns {undefined}
         */
        destructor: function() {
            this.pusher.disconnect();
            //delete this.constructor.INSTANCES[this.get("applicationKey")];
        }
    }, {
        /* @lends Y.Wegas.util.PusherConnector */
        /**
         * Store running instances.
         * @private
         * @field
         */
        INSTANCES: {},
        ATTRS: {
            applicationKey: {
                initOnly: true,
                validator: Y.Lang.isString
            }
        }
    });
    Wegas.PusherDataSource = PusherDataSource;
    //new PusherConnectorFactory({applicationKey: "732a1df75d93d028e4f9"});
});
