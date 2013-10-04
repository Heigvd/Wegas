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
            this.get("host").onceAfter("render", function() {
                this.conditionEval();
                this.handlers.push(Y.Wegas.Facade.VariableDescriptor.after("update", this.conditionEval, this));
            }, this);
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
        conditionEval: function() {
            if (Y.Wegas.Facade.VariableDescriptor.script) {
                Y.Wegas.Facade.VariableDescriptor.script.eval(this.get("condition").content, Y.bind(function(result) {
                    this.get('host').set('disabled', result);
                }, this));
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
