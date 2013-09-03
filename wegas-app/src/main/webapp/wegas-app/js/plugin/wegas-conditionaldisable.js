/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-conditionaldisable', function(Y) {
    "use strict";
    
    var Wegas = Y.Wegas,
    ConditionalDisable = Y.Base.create("wegas-conditionaldisable", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        
        handlers: null,

        initializer: function() {
            this.handlers = [];
            this.handlers.push(Y.Wegas.Facade.VariableDescriptor.after("update", this.conditionEval, this));
            this.conditionEval();
        },
        
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
                
        conditionEval: function(){                                              // @fixme Do local condition eval
            if (this.get('condition')){
                Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/Script/Run/" + Wegas.app.get('currentPlayer'),
                    cfg: {
                        method: "POST",
                        data: Y.JSON.stringify(this.get('condition'))
                    },
                    on: {
                        success: Y.bind(function(e) {
                            this.get('host').set('disabled', e.response.results.entities[0]);
                        }, this),
                        failure: Y.bind(function(e) {
                            this.get('host').showMessage("error", "Disable condition error");
                        }, this)
                    }
                });
            }
        }
    }, {
        ATTRS: {
            condition: {
                _inputex: {
                    _type: 'script',
                    label: 'Disable condition',
                    expects: "condition"
                }
            }
        },
        NS: "ConditionalDisable",
        NAME: "ConditionalDisable"
    });
    Y.namespace("Plugin").ConditionalDisable = ConditionalDisable;

});
