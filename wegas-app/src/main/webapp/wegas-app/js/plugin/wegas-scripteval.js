/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add('wegas-scripteval', function(Y) {
    "use strict";
    var ScriptEval, VariableDescriptorFacade;

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
                this.fire("evaluated", result);
                if (cb && cb.success instanceof Function) {
                    cb.success(result);
                }
            } catch (error) {
                url = Y.Wegas.Facade.VariableDescriptor.get("source") + "/Script/Run/" + Y.Wegas.app.get('currentPlayer');
                Y.io(url, {
                    headers: {
                        'Content-Type': 'application/json; charset=iso-8859-1',
                        'Managed-Mode': 'false'
                    },
                    sync: false,
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": script
                    }),
                    on: {
                        success: Y.bind(function(id, req_id, response) {
                            if (cb && cb.success instanceof Function) {
                                cb.success(Y.JSON.parse(response.responseText));
                            }
                        }, this),
                        failure: Y.bind(function(id, req_id, response) {
                            var result;
                            try {
                                result = Y.JSON.parse(response.responseText);
                            } catch (e) {
                                result = null;
                            }
                            if (cb && cb.failure instanceof Function) {
                                cb.failure(result);
                            }
                        }, this)
                    }
                });
            }
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
            return (new Function("with(this) { return " + script + ";}")).call(this.context);
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
                VariableDescriptorFacade: VariableDescriptorFacade,
                self: Y.Wegas.Facade.Game.cache.getCurrentPlayer(),
                gameModel: Y.Wegas.Facade.GameModel.cache.getCurrentGameModel()
            });
        }

    }, {
        NS: "script",
        NAME: "scriptEval"
    });
    VariableDescriptorFacade = {
        find: function(gameModel, name) {
            return Y.Wegas.Facade.VariableDescriptor.cache.find("name", name);
        }
    };
    Y.namespace('Plugin').ScriptEval = ScriptEval;

});
