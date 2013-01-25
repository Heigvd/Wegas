/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
YUI.add('wegas-scripteval', function(Y) {
    "use strict";

    var ScriptEval;

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
         *  the id should be generated and returned  by the function, not passed as a
         *  a parameter
         *
         *  @param script The script to evaluate
         *  @param id The transaction id
         *  @param cb A callback object, containing success, failure and scope objects
         */
        scopedEval: function(script, id, cb) {
            var result, response, url;

            try {
                result = this.localEval(script);
                this.fire("evaluated", result, id);
                if (cb && cb.success) {
                    cb.success.call(cb.scope || this, result);
                }
                return result;
            } catch (error) {
                url = Y.Wegas.VariableDescriptorFacade.get("source") + "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer');
                return Y.io(url, {
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
                            this.fire("evaluated", Y.JSON.parse(response.responseText), id);
                        }, this, id),
                        failure: Y.bind(function(id, req_id, response) {
                            try {
                                this.fire("failure", Y.JSON.parse(response.responseText), id);
                            } catch (e) {
                                this.fire("failure", null, id);
                            }
                        }, this, id)
                    }
                });
            }
        },
        /**
         * Tries to evaluate the script locally, using variables cache
         * @param {String} script The script to eval localy
         */
        localEval: function(script) {
            if (!this.upToDate) {                                                 //Only compute if new value
                this.buildContext();
            }
            return (new Function("with(this) { return " + script + ";}")).call(this.context);
        },
        buildContext: function() {
            var i, j, data = this.get("host").data;
            this.upToDate = true;
            this.context = {};
            for (i in data) {
                this.context[data[i].get('name')] = JSON.parse(JSON.stringify(data[i].getInstance()));
                if (data[i] instanceof Y.Wegas.persistence.ListDescriptor) {
                    this.context[data[i].get('name')].items = [];
                    for (j in data[i].get("items")) {
                        this.context[data[i].get('name')].items.push(JSON.parse(JSON.stringify(data[i].get("items")[j].getInstance())));
                    }
                }
            }
            /*SANDBOX*/
            Y.mix(this.context, {
                window: undefined,
                Y: undefined,
                YUI: undefined
            });
        }

    }, {
        NS: "script",
        NAME: "scriptEval"
    });

    Y.namespace('Plugin').ScriptEval = ScriptEval;

});

