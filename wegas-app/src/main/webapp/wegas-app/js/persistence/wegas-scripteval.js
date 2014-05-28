/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add('wegas-scripteval', function(Y) {
    "use strict";
    var ScriptEval, Variable;

    function buildItems(entity, acc) {                                  // Recursively build items lists
        var j, items;
        if (entity instanceof Y.Wegas.persistence.ListDescriptor) {
            items = entity.get("items");
            acc.items = [];
            for (j in items) {
                if (items.hasOwnProperty(j)) {
                    acc.items.push(Y.JSON.parse(Y.JSON.stringify(items[j].getInstance())));
                    buildItems(items[j], acc.items[acc.items.length - 1]);
                }
            }
        }
    }

    ScriptEval = Y.Base.create("ScriptEval", Y.Plugin.Base, [], {
        context: null,
        upToDate: false,
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
        eval: function(script, cb) {
            var result, url;
            if (cb instanceof Function) {
                cb = {
                    success: cb
                };
            }
            try {
                result = this.localEval(script);
            } catch (error) {
                this.run(null, {
                    cfg: {
                        method: "POST",
                        data: script,
                        headers: {
                            'Managed-Mode': 'false'
                        }
                    },
                    on: {
                        success: function(response) {
                            if (cb && cb.success instanceof Function) {
                                cb.success(Y.JSON.parse(response.responseText));
                            }
                        },
                        failure: function(response) {
                            var result;
                            try {
                                result = Y.JSON.parse(response.responseText);
                            } catch (e) {
                                result = null;
                            }
                            if (cb && cb.failure instanceof Function) {
                                cb.failure(result);
                            }
                        }
                    }
                });
                return;
            }            
            this.fire("evaluated", result);
            if (cb && cb.success instanceof Function) {
                cb.success(result);
            }
        },
        run: function(script, cfg) {
            this.get("host").sendRequest(Y.mix(cfg, {
                request: "/Script/Run/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    data: script
                }
            }));
        },
        /**
         * Tries to evaluate the script locally, using variables cache
         * @param {String} script The script to eval localy
         * @return {Any} value locally evaluated
         */
        localEval: function(script) {
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
                    buildItems(data[i], this.context[data[i].get('name')]);

//                if (data[i] instanceof Y.Wegas.persistence.ListDescriptor) {
//                    this.context[data[i].get('name')].items = [];
//                    for (j in data[i].get("items")) {
//                        this.context[data[i].get('name')].items.push(JSON.parse(JSON.stringify(data[i].get("items")[j].getInstance())));
//                    }
//                }
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
                self: Y.Wegas.Facade.Game.cache.getCurrentPlayer(),
                gameModel: Y.Wegas.Facade.GameModel.cache.getCurrentGameModel()
            });
        }

    }, {
        NS: "script",
        NAME: "scriptEval"
    });
    Variable = {
        find: function(gameModel, name) {
            return Y.Wegas.Facade.Variable.cache.find("name", (Y.Lang.isString(gameModel)) ? gameModel : name);
        }
    };
    Y.namespace('Plugin').ScriptEval = ScriptEval;

});
