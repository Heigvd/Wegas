/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
YUI.add('wegas-scripteval', function(Y) {
    "use strict";

    var ScriptEval, Variable,
        Wegas = Y.Wegas,
        Promise = Y.Promise;
    
    ScriptEval = Y.Base.create("ScriptEval", Y.Plugin.Base, [], {
        /**
         *
         */
        initializer: function() {
            this.context = undefined;
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
                Y.log("Delegate script eval after localEval failure: " + JSON.stringify(script));
                this.remoteEval(script, cfg, player, contextId); // Use server fallback
                return; // and stop the method
            }

            if (cfg && cfg.on && cfg.on.success instanceof Function) {
                cfg.on.success({//                                              // Make the result from the local eval look like a server response
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
         * Serialize a function which can be eval(uated)
         * Global scope and closure are lost.
         * Native functions can't be serialized
         * @template Arguments
         * @template ReturnValue
         * @param {(...args:Arguments[]) => ReturnValue} fn function to serialize
         * @param {...Arguments} args additional arguments to pass to the function (serialized)
         * @returns {string} serialized function call
         */
        serializeFn: function (fn, args) {
            var boundaryMarker = '\u2029'; // Char which shouldn't be used...
            var serialArgs = JSON.stringify(
                Array.prototype.slice.call(arguments, 1),
                function(key, value) {
                    if (typeof value === 'function') {
                        return (
                            boundaryMarker +
                            value.toString() +
                            boundaryMarker
                        );
                    } else if (typeof value === 'string') {
                        // In case boundaryMarker is really used... escape it
                        return value.replace(
                            new RegExp(boundaryMarker, 'g'),
                            '\\u2029'
                        );
                    }
                    return value;
                }
            ).replace(
                // rewrite string function as function
                new RegExp(
                    '"' + boundaryMarker + '(.*)' + boundaryMarker + '"',
                    'g'
                ),
                function(m, g1) {
                    return JSON.parse('"' + g1 + '"');
                }
            );
            return '(' + fn.toString() + ').apply(null,' + serialArgs + ')';
        },
        /**
         * Serialize a function and executs it on the server.
         * Global scope and closure are lost.
         * Native functions can't be serialized.
         * 
         * Server global variables are available in function's body
         * function can optionally take some arguments which are serialized along 
         * @template Arguments
         * @template ReturnValue
         * @param {(...args:Arguments[]) => ReturnValue} fn function to execute on server
         * @param {...Arguments} _args additional arguments passed to the function
         * @returns {PromiseLike<ReturnValue>} server return value;
         */
        remoteFnEval: function(fn, _args) {
            if (typeof fn !== 'function') {
                throw new TypeError('First argument must be a function');
            }
            var args = arguments;
            return new Promise(function (resolve, reject) {
                this.remoteEval(
                    '[' + this.serializeFn.apply(this, args) + ']', // Wrap into an array to be sure to have if as first element
                    {
                        on: {
                            success: function (res) {
                                resolve(res.response.entity);
                            },
                            failure: reject,
                        },
                    }
                );
            }.bind(this));
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
            if (!this.context || this.context.self !== p) { //Only compute if new value
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
            // AST, nope ?
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
            this.context = {
                window: undefined,
                Y: Y,
                YUI: undefined,
                PageLoader: Y.Wegas.PageLoader,
                VariableDescriptorFacade: Variable,
                Variable: Variable,
                self: player,
                gameModel: Wegas.Facade.GameModel.cache.getCurrentGameModel()
            };
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
