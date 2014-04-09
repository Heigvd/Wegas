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

    var ConditionalDisable = Y.Base.create("wegas-conditionaldisable", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        handlers: null,
        initializer: function() {
            this.handlers = [];
            this.onceAfterHostEvent("render", function() {
                this.conditionEval();
                this.handlers.push(Y.Wegas.Facade.VariableDescriptor.after("update", this.conditionEval, this));
            });
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
                    var attr = this.get("attribute");
                    if (attr === "class") {
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
                    label: 'Disable condition',
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
        NS: "ConditionalDisable",
        NAME: "ConditionalDisable"
    });
    Y.Plugin.ConditionalDisable = ConditionalDisable;

    Y.Plugin.ConditionalDisable2 = Y.Base.create("wegas-conditionaldisable", ConditionalDisable, [], {}, {
        NS: "ConditionalDisable2",
        NAME: "ConditionalDisable2"
    });
    Y.Plugin.ConditionalDisable3 = Y.Base.create("wegas-conditionaldisable", ConditionalDisable, [], {}, {
        NS: "ConditionalDisable3",
        NAME: "ConditionalDisable3"
    });
    Y.Plugin.ConditionalDisable4 = Y.Base.create("wegas-conditionaldisable", ConditionalDisable, [], {}, {
        NS: "ConditionalDisable4",
        NAME: "ConditionalDisable4"
    });

});
