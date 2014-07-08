/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add('wegas-scripteval', function(Y) {
    "use strict";

    var ScriptEval, Variable, Wegas = Y.Wegas;

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
            this.publish("evaluated");
            this.publish("failure");
        },
        /**
         *  A localEval with server fallback.
         *
         *  @param script The script to evaluate
         *  @param cb A callback object, containing success, failure function or just a function as success callback. First parameter passed will be result
         */
        eval: function(script, cfg) {
            var result;

            if (cfg instanceof Function) {                                      // Normalize callback argument
                cfg = {
                    on: {
                        success: cfg
                    }
                };
            }

            try {
                result = this.localEval(script);                                // Try to do local eval
            } catch (error) {                                                   // And if there is an error  
                this.remoteEval(script, cfg);                                   // Use server fallback
                return;                                                         // and stop the method
            }

            this.fire("evaluated", result);
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
        remoteEval: function(script, cfg) {
            if (Y.Lang.isString(script)) {                                      // Normalize script argument
                script = {
                    "@class": "Script",
                    content: script
                };
            }

            this.get("host").sendRequest(Y.mix(cfg || {}, {
                request: "/Script/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    data: script
                }
            }));
        },
        /**
         * Sugar
         */
        run: function(script, cfg) {
            this.remoteEval(script, cfg);
        },
        /**
         * Tries to evaluate the script locally, using variables cache
         * @param {String} script The script to eval localy
         * @return {Any} value locally evaluated
         */
        localEval: function(script) {
            if (Y.Lang.isObject(script)) {                                      // Normalize script argument
                script = script.content;
            }
            /*jslint evil: true */
            if (!this.upToDate) {                                               //Only compute if new value
                this._buildContext();
            }
            if (script.indexOf("return ") === -1) {
                script = "return " + script;
            }
            return (new Function("with(this) { " + script + ";}")).call(this.context);
        },
        /**
         * @function
         * @private
         * @returns {undefined}
         */
        _buildContext: function() {
            var i, data = this.get("host").data;
            this.upToDate = true;
            this.context = {};

            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    this.context[data[i].get('name')] = Y.JSON.parse(Y.JSON.stringify(data[i].getInstance()));
                    this.buildItems(data[i], this.context[data[i].get('name')]);
                    //if (data[i] instanceof Wegas.persistence.ListDescriptor) {
                    //    this.context[data[i].get('name')].items = [];
                    //    for (j in data[i].get("items")) {
                    //        this.context[data[i].get('name')].items.push(JSON.parse(JSON.stringify(data[i].get("items")[j].getInstance())));
                    //    }
                    //}
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
                self: Wegas.Facade.Game.cache.getCurrentPlayer(),
                gameModel: Wegas.Facade.GameModel.cache.getCurrentGameModel()
            });
        },
        buildItems: function(entity, acc) {                                     // Recursively build items lists
            var j, items;
            if (entity instanceof Wegas.persistence.ListDescriptor) {
                items = entity.get("items");
                acc.items = [];
                for (j in items) {
                    if (items.hasOwnProperty(j)) {
                        acc.items.push(Y.JSON.parse(Y.JSON.stringify(items[j].getInstance())));
                        this.buildItems(items[j], acc.items[acc.items.length - 1]);
                    }
                }
            }
        }
    }, {
        NS: "script",
        NAME: "scriptEval"
    });
    Y.Plugin.ScriptEval = ScriptEval;

    Variable = {
        find: function(gameModel, name) {
            return Wegas.Facade.Variable.cache.find("name", (Y.Lang.isString(gameModel)) ? gameModel : name);
        }
    };
});
