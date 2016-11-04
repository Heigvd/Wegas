/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add('wegas-scripteval', function(Y) {
    "use strict";

    var ScriptEval, Variable,
        Wegas = Y.Wegas,
        buildItems = function(entity, acc) { // Recursively build items lists
            var j, items;
            if (entity instanceof Wegas.persistence.ListDescriptor) {
                items = entity.get("items");
                acc.items = [];
                for (j in items) {
                    if (items.hasOwnProperty(j)) {
                        acc.items.push(Y.JSON.parse(Y.JSON.stringify(items[j].getInstance())));
                        buildItems(items[j], acc.items[acc.items.length - 1]);
                    }
                }
            }
        };

    ScriptEval = Y.Base.create("ScriptEval", Y.Plugin.Base, [], {
        /**
         *
         */
        initializer: function() {
            this.context = {};
            this.upToDate = false;
            this.afterHostEvent("response", function(e) {
                this.upToDate = false;
            }, this);
            this.publish("failure");
        },
        /**
         *  A localEval with server fallback.
         *
         *  @param script The script to evaluate
         *  @param cb A callback object, containing success, failure function or just a function as success callback.
         *     First parameter passed will be result
         */
        eval: function(script, cfg, player, contextId) {
            var result;

            if (cfg instanceof Function) { // Normalize callback argument
                cfg = {
                    on: {
                        success: cfg
                    }
                };
            }

            try {
                result = this.localEval(script, player); // Try to do local eval
            } catch (error) { // And if there is an error
                this.remoteEval(script, cfg, player, contextId); // Use server fallback
                return; // and stop the method
            }

            if (cfg && cfg.on && cfg.on.success instanceof Function) {
                cfg.on.success({ //                                              // Make the result from the local eval look like a server response
                    response: {
                        entity: result
                    }
                });
            }
        },
        /**
         *
         * @param {type} script
         * @param {type} cfg
         */
        remoteEval: function(script, cfg, player, contextId) {
            var playerId;
            if (player) {
                playerId = player.get("id");
            }
            if (Y.Lang.isString(script)) { // Normalize script argument
                script = {
                    "@class": "Script",
                    content: script
                };
            }

            this.get("host").sendRequest(Y.mix(cfg || {}, {
                request: "/Script/Run/" + (playerId || Wegas.Facade.Game.get('currentPlayerId')) + (contextId ? "/" + contextId : ""),
                cfg: {
                    method: "POST",
                    data: script
                }
            }));
        },
        /**
         * Sugar
         */
        run: function(script, cfg, player, contextId) {
            this.remoteEval(script, cfg, player, contextId);
        },
        /**
         * Tries to evaluate the script locally, using variables cache
         * @param {String} script The script to eval localy
         * @return {Any} value locally evaluated
         */
        localEval: function(script, player) {
            var p = player || Wegas.Facade.Game.cache.getCurrentPlayer();
            if (!this.upToDate || this.context.self !== p) { //Only compute if new value
                this._buildContext(p);
            }

            if (Y.Lang.isObject(script) && script.content) { // Normalize script argument
                script = script.content;
            }
            /*jslint evil: true */
            if (Y.Lang.isFunction(script)) {
                return (new Function(Y.Object.keys(this.context), "return (" + script.toString() + "())")).apply({},
                    Y.Object.values(this.context));
            }
            if (script.indexOf("return") === -1) {
                script = "return " + script;
            }
            return (new Function(Y.Object.keys(this.context), script)).apply({}, Y.Object.values(this.context));
        },
        /**
         * @function
         * @private
         * @returns {undefined}
         */
        _buildContext: function(player) {
            var i,
                data = this.get("host").data, j;
            this.upToDate = true;
            this.context = {};

            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    this.context[data[i].get('name')] = Y.JSON.parse(Y.JSON.stringify(data[i].getInstance(player)));
                    buildItems(data[i], this.context[data[i].get('name')]);
                //                    if (data[i] instanceof Wegas.persistence.ListDescriptor) {
                //                        this.context[data[i].get('name')].items = [];
                //                        for (j in data[i].get("items")) {
                //                            if (data[i].get("items").hasOwnProperty(j)) {
                //                                this.context[data[i].get('name')].items.push(JSON.parse(JSON.stringify(data[i].get("items")[j].getInstance(player))));
                //                            }
                //                        }
                //                    }
                }
            }
            /*SANDBOX*/
            Y.mix(this.context, {
                window: undefined,
                Y: undefined,
                YUI: undefined
            });
            /*Extend functionalities (mirror server)*/
            Y.mix(this.context, {
                VariableDescriptorFacade: Variable,
                Variable: Variable,
                self: player,
                gameModel: Wegas.Facade.GameModel.cache.getCurrentGameModel()
            });
        },
        /**
         * Check current gameModel's script for errors
         * @param {Function} callback
         * @param {Function} errorCallback callback on failure
         * @returns Request id
         */
        checkGameModel: function(callback, errorCallback) {
            return this.get("host").sendRequest({
                request: "/Script/Test/",
                cfg: {
                    method: "GET",
                    updateCache: false,
                    headers: {
                        "Managed-Mode": false
                    }
                },
                on: {
                    success: function(e) {
                        if (Y.Lang.isFunction(callback)) {
                            callback(e.serverResponse);
                        }
                    },
                    failure: function(e) {
                        if (Y.Lang.isFunction(errorCallback)) {
                            errorCallback(e.serverResponse);
                        }
                    }
                }
            });
        }
    }, {
        NS: "script"
    });
    Y.Plugin.ScriptEval = ScriptEval;

    Variable = {
        find: function(gameModel, name) {
            return Wegas.Facade.Variable.cache.find("name", (Y.Lang.isString(gameModel)) ? gameModel : name);
        }
    };
});
