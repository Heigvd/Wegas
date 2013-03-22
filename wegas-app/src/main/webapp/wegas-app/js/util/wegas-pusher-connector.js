/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-pusher-connector', function(Y) {
    "use strict";
    /**
     * PusherConnector singleton for each applicationKey
     * @name Y.Wegas.util.PusherConnector
     * @constructor
     * @param {Object} config, requires applicationKey
     * @returns {Instance}
     */
    var EVENT_PREFIX = "pusherConnector",
            PusherConnectorFactory = function(config) {
        if (config && config.hasOwnProperty("applicationKey")) {
            if (Y.Lang.isUndefined(this.constructor.INSTANCES[config.applicationKey])) {
                PusherConnectorFactory.superclass.constructor.apply(this, arguments);
                this.constructor.INSTANCES[config.applicationKey] = this;
                this._yuievt.config = {
                    prefix: EVENT_PREFIX
                };
            }
        } else {
            Y.log("An applicationKey is required to connect", "error", "Y.Wegas.util.PusherConnector");
            return;
        }
        return this.constructor.INSTANCES[config.applicationKey];
    };

    Y.extend(PusherConnectorFactory, Y.Base, {
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
            if (!Pusher) {
                Y.later(100, this.pusherInit, this, cfg);
                return;
            }
            Pusher.log = Y.log;    // Enable pusher logging - don't include this in production
            document.WEB_SOCKET_DEBUG = true;// Flash fallback logging - don't include this in production
            this.pusher = new Pusher(cfg["applicationKey"]);
            this.pusher.connection.bind('error', function(err) {
                if (err.data.code === 4004) {
                    Y.log("Pusher daily limit", "error", "Y.Wegas.util.PusherConnector");
                }
            });
            this.gameChannel = this.pusher.subscribe('Game-' + Y.Wegas.app.get("currentGame"));
            this.teamChannel = this.pusher.subscribe('Team-' + Y.Wegas.app.get("currentTeam"));
            this.playerChannel = this.pusher.subscribe('Player-' + Y.Wegas.app.get("currentPlayer"));
            this.pusher.bind_all(Y.bind(this.eventReceived, this));
        },
        /**
         * @function
         * @private
         * @param {type} event
         * @param {type} data
         * @returns {undefined}
         */
        eventReceived: function(event, data) {
            if (event.indexOf("pusher:") !== 0) {                               //ignore pusher specific event
                this.publish(event, {
                    emitFacade: false
                });
                this.fire(event, data);
            }
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
                id = Y.Wegas.app.get("currentGame");
            } else if (channel === "Team") {
                id = Y.Wegas.app.get("currentTeam");
            } else {
                id = Y.Wegas.app.get("currentPlayer");
            }
            Y.io(Y.Wegas.app.get("base") + "rest/Pusher/Send/" + channel + "/" + id + "/" + event, {
                method: 'POST',
                data: Y.JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
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
            delete this.constructor.INSTANCES[this.get("applicationKey")];
        }
    }, {/* @lends Y.Wegas.util.PusherConnector */
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
        },
        getConnector: function(applicationKey) {
            if (Y.Lang.isUndefined(applicationKey)) {
                for (var i in PusherConnectorFactory.INSTANCES) {
                    return PusherConnectorFactory.INSTANCES[i];
                }
                return null;
            }
            return new PusherConnectorFactory({applicationKey: applicationKey});
        }


    });

    Y.namespace('Wegas').PusherConnectorFactory = {getConnector: PusherConnectorFactory.getConnector};
    //new PusherConnectorFactory({applicationKey: "732a1df75d93d028e4f9"});
});

