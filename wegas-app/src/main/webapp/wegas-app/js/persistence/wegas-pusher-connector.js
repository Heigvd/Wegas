/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global Pusher:true, YUI_config:true, Zlib */
YUI.add('wegas-pusher-connector', function(Y) {
    "use strict";

    var PusherDataSource, Wegas = Y.Wegas, pusherInstance;

    /**
     * PusherDataSource singleton for each applicationKey
     * @name Y.Wegas.util.PusherDataSource
     * @constructor
     * @param {Object} config, requires applicationKey
     * @returns {Instance}
     */
    PusherDataSource = Y.Base.create("PusherDataSource", Wegas.DataSource, [], {
        /* @lends Y.Wegas.util.PusherDataSource# */

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
            if (YUI_config.debug) {
                Pusher.log = Y.log;                                                            // Enable pusher logging
                document.WEB_SOCKET_DEBUG = true;                                              // Flash fallback logging
            }
            pusherInstance = new Pusher(cfg.applicationKey, {
                authEndpoint: Y.Wegas.app.get("base") + "rest/Pusher/auth",
                encrypted: true
            });
            pusherInstance.connection.bind('error', function(err) {
                if (err.data && err.data.code === 4004) {
                    Y.log("Pusher daily limit", "error", "Y.Wegas.util.PusherConnector");
                }
            });
            pusherInstance.connection.bind("state_change", function(state) {
                this._set("status", state.current);
                Y.Wegas.app.set("socketId", pusherInstance.connection.socket_id); // Store current socket id into app
            }, this);
            this._set("status", pusherInstance.connection.state);

            pusherInstance.subscribe('GameModel-' +
                Wegas.Facade.GameModel.get("currentGameModelId")).bind_all(Y.bind(this.eventReceived, this));
            pusherInstance.subscribe('Game-' +
                Wegas.Facade.Game.get("currentGameId")).bind_all(Y.bind(this.eventReceived, this));
            pusherInstance.subscribe('Team-' +
                Wegas.Facade.Game.get("currentTeamId")).bind_all(Y.bind(this.eventReceived, this));
            pusherInstance.subscribe('Player-' +
                Wegas.Facade.Game.get("currentPlayerId")).bind_all(Y.bind(this.eventReceived, this));

            pusherInstance.subscribe('presence-global').bind_all(Y.bind(this.eventReceived, this));
        },
        gunzip: function(data) {
            var ba, i, compressed, zlib, inflated;
            ba = [];
            for (i = 0; i < data.length; i += 1) {
                ba.push(data.charCodeAt(i));
            }
            compressed = new Uint8Array(ba);
            zlib = new Zlib.Gunzip(compressed);
            inflated = zlib.decompress();
            return String.fromCharCode.apply(null, inflated);
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
                if (event.match(/\.gz$/)) {
                    event = event.replace(/\.gz$/, "");
                    data = this.gunzip(data);
                }
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
        /* @lends Y.Wegas.util.PusherDataSource */
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
            },
            status: {
                readOnly: true
            }
        }
    });
    Wegas.PusherDataSource = PusherDataSource;
    //new PusherConnectorFactory({applicationKey: "732a1df75d93d028e4f9"});
});
