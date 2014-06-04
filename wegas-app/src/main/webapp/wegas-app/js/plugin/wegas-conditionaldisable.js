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
    var Wegas = Y.Wegas, Plugin = Y.Plugin, ConditionalDisable;

    ConditionalDisable = Y.Base.create("wegas-conditionaldisable", Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        handlers: null,
        initializer: function() {
            this.handlers = [];
            this.onceAfterHostEvent("render", function() {
                this.conditionEval();
                this.handlers.push(Wegas.Facade.VariableDescriptor.after("update", this.conditionEval, this));
            });
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
        conditionEval: function() {
            if (Wegas.Facade.VariableDescriptor.script) {
                Wegas.Facade.VariableDescriptor.script.eval(this.get("condition").content, Y.bind(function(result) {
                    var attr = this.get("attribute");
                    if (attr === "cssClass") {
                        this.get('host').get("boundingBox").toggleClass(this.get("value"), result);
                    } else {
                        this.get('host').set(this.get("attribute"), result);
                    }
                }, this));
            }
        }
    }, {
        ATTRS: {
            condition: {
                _inputex: {
                    _type: 'script',
                    label: 'Disable if',
                    expects: "condition"
                }
            },
            attribute: {
                type: "string",
                value: "disabled",
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            value: {
                type: "string",
                value: "",
                optional: true,
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            }
        },
        NS: "ConditionalDisable"
    });
    Plugin.ConditionalDisable = ConditionalDisable;

    Plugin.ConditionalDisable2 = Y.Base.create("wegas-conditionaldisable2", ConditionalDisable, [], {}, {
        NS: "ConditionalDisable2"
    });
    Plugin.ConditionalDisable3 = Y.Base.create("wegas-conditionaldisable3", ConditionalDisable, [], {}, {
        NS: "ConditionalDisable3"
    });
    Plugin.ConditionalDisable4 = Y.Base.create("wegas-conditionaldisable4", ConditionalDisable, [], {}, {
        NS: "ConditionalDisable4"
    });
});
