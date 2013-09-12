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
                this.handlers.push(Y.Wegas.Facade.VariableDescriptor.after("update", this.conditionEval, this));
                this.conditionEval();
            }, this);
            this.bind();
        },
        bind: function() {
            this.handlers.push(Y.Wegas.Facade.VariableDescriptor.script.on("evaluated", function(e, o, id) {
                if (id === this._yuid) {
                    this.get('host').set('disabled', o);
                }
            }, this));
        },
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
        conditionEval: function() {
            var conditionValid;
            if (Y.Wegas.Facade.VariableDescriptor.script) {
                conditionValid = Y.Wegas.Facade.VariableDescriptor.script.scopedEval(this.get("condition").content, this._yuid);
                if (conditionValid.io === undefined) {
                    this.get('host').set('disabled', conditionValid);
                }
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
