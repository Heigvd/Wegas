/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global Pusher:true, YUI_config:true, Zlib */
YUI.add('wegas-pusher-connector', function(Y) {
    "use strict";

    var PusherDataSource;

    /**
     * PusherDataSource singleton for each applicationKey
     * @name Y.Wegas.util.PusherDataSource
     * @constructor
     * @param {Object} config, requires applicationKey
     * @returns {Instance}
     */
    PusherDataSource = Y.Base.create("PusherDataSource", Y.Wegas.DataSource, [], {
        /* @lends Y.Wegas.util.PusherDataSource# */

        /*
         * life cycle method
         * @private
         * @function
         * @param {Object} cfg
         * @returns {undefined}
         */
        initializer: function(cfg) {
            this.channel_prefix = {
                "Admin": "private-Role-Administrator",
                "Global": "global-channel",
                "User": "private-User-",
                "Player": "private-Player-",
                "Team": "private-Team-",
                "Game": "private-Game-",
                "GameModel": "private-GameModel-",
                "GameModelEditor": "private-GameModelEditor-"
            };
            this.pusherInstance = null;
            this.pusherInit(cfg);
            //this.pusher = new Pusher('732a1df75d93d028e4f9');
        },
        pusherInit: function(cfg) {
            if (!window.Pusher || this.pusherInstance) {
                //Y.later(100, this.pusherInit, this, cfg);
                return;
            }
            if (YUI_config.debug) {
                Pusher.log = Y.log;                                                            // Enable pusher logging
                document.WEB_SOCKET_DEBUG = true;                                              // Flash fallback logging
            }
            this.pusherInstance = new Pusher(cfg.applicationKey, {
                authEndpoint: Y.Wegas.app.get("base") + "rest/Pusher/auth",
                encrypted: true,
                cluster: cfg.cluster
            });
            this.pusherInstance.connection.bind('error', function(err) {
                if (err.data && err.data.code === 4004) {
                    Y.log("Pusher daily limit", "error", "Y.Wegas.util.PusherConnector");
                }
            });
            this.pusherInstance.connection.bind("state_change", function(state) {
                this._set("status", state.current);
                Y.Wegas.app.set("socketId", this.pusherInstance.connection.socket_id); // Store current socket id into app
            }, this);
            this._set("status", this.pusherInstance.connection.state);

            this.pusherInstance.subscribe(this.channel_prefix.GameModel +
                Y.Wegas.Facade.GameModel.get("currentGameModelId")).bind_global(Y.bind(this.eventReceived, this));
            this.pusherInstance.subscribe(this.channel_prefix.Game +
                Y.Wegas.Facade.Game.get("currentGameId")).bind_global(Y.bind(this.eventReceived, this));

            if (this.get("mode") === "FULL") {
                this.pusherInstance.subscribe(this.channel_prefix.Team +
                    Y.Wegas.Facade.Game.get("currentTeamId")).bind_global(Y.bind(this.eventReceived, this));
                this.pusherInstance.subscribe(this.channel_prefix.Player +
                    Y.Wegas.Facade.Game.get("currentPlayerId")).bind_global(Y.bind(this.eventReceived, this));
            }

            if (this.get("editorChannel")) {
                this.pusherInstance.subscribe(this.channel_prefix.GameModelEditor +
                    Y.Wegas.Facade.GameModel.get("currentGameModelId")).bind_global(Y.bind(this.eventReceived, this));
            }

            this.pusherInstance.subscribe(this.channel_prefix.Global).bind_global(Y.bind(this.eventReceived, this));

            this.pusherInstance.subscribe(this.channel_prefix.User +
                Y.Wegas.Facade.User.get("currentUserId")).bind_global(Y.bind(this.eventReceived, this));
        },
        Utf8ArrayToStr: function(array) {
            // http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
            /* utf.js - UTF-8 <=> UTF-16 convertion
             *
             * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
             * Version: 1.0
             * LastModified: Dec 25 1999
             * This library is free.  You can redistribute it and/or modify it.
             */
            var out, i, len, c;
            var char2, char3;

            out = "";
            len = array.length;
            i = 0;
            while (i < len) {
                c = array[i++];
                switch (c >> 4)
                {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                        // 0xxxxxxx
                        out += String.fromCharCode(c);
                        break;
                    case 12:
                    case 13:
                        // 110x xxxx   10xx xxxx
                        char2 = array[i++];
                        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                        break;
                    case 14:
                        // 1110 xxxx  10xx xxxx  10xx xxxx
                        char2 = array[i++];
                        char3 = array[i++];
                        out += String.fromCharCode(((c & 0x0F) << 12) |
                            ((char2 & 0x3F) << 6) |
                            ((char3 & 0x3F) << 0));
                        break;
                }
            }

            return out;
        },
        gunzip: function(b64Data) {
            var data, ba, i, compressed, zlib, inflated;
            data = atob(b64Data);
            ba = [];
            for (i = 0; i < data.length; i += 1) {
                ba.push(data.charCodeAt(i));
            }
            compressed = new Uint8Array(ba);
            zlib = new Zlib.Gunzip(compressed);
            inflated = zlib.decompress();
            // return String.fromCharCode.apply(null, inflated);
            return this.Utf8ArrayToStr(inflated);
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
            return this.pusherInstance.subscribe(channel);
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
            var id,
                eChannel = channel;
            if (channel === "Game") {
                id = Y.Wegas.Facade.Game.get("currentGameId");
                eChannel = "private-Game" + id;
            } else if (channel === "Team") {
                id = Y.Wegas.Facade.Game.get("currentTeamId");
                eChannel = "private-Game-" + id;
            } else if (channel === "Player") {
                id = Y.Wegas.Facade.Game.get("currentPlayerId");
                eChannel = "private-Player-" + id;
            }
            this.sendRequest({
                request: "SendCustomEvent/" + eChannel + "/" + event,
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
        resume: function() {
            this.pusherInstance.connect();
        },
        disconnect: function() {
            this.pusherInstance.disconnect();
        },
        /*
         * life cycle method
         * @private
         * @function
         * @returns {undefined}
         */
        destructor: function() {
            this.pusherInstance.disconnect();
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
            },
            mode: {
                value: "FULL"
            },
            editorChannel: {
                value: false
            }
        }
    });
    Y.Wegas.PusherDataSource = PusherDataSource;
    //new PusherConnectorFactory({applicationKey: "732a1df75d93d028e4f9"});
});
