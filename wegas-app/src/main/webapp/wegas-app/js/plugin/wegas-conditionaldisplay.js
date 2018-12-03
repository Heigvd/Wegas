/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author jarle.hulaas@heig-vd.ch
 */
YUI.add('wegas-conditionaldisplay', function(Y) {
    'use strict';
    var Wegas = Y.Wegas, Plugin = Y.Plugin, ConditionalDisplay;

    ConditionalDisplay = Y.Base.create(
        'wegas-conditionaldisplay',
        Plugin.Base,
        [Wegas.Plugin, Wegas.Editable],
        {
            handlers: null,
            initializer: function() {
                this.handlers = [];
                this.onceAfterHostEvent('render', function() {
                    this.conditionEval();
                    this.handlers.push(
                        Wegas.Facade.Variable.after(
                            'update',
                            this.conditionEval,
                            this
                        )
                    );
                });
            },
            destructor: function() {
                for (var i = 0; i < this.handlers.length; i += 1) {
                    this.handlers[i].detach();
                }
            },
            conditionEval: function() {
                if (Wegas.Facade.Variable.script) {
                    Wegas.Facade.Variable.script.eval(
                        this.get('condition'),
                        Y.bind(function(e) {
                            this.get('host').get("boundingBox").toggleView(e.response.entity);
                        }, this)
                    );
                }
            }
        },
        {
            ATTRS: {
                condition: {
                    type: ['null', 'object'],
                    view: {
                        type: 'scriptcondition',
                        label: 'Display only if'
                    }
                }
            },
            NS: 'ConditionalDisplay'
        }
    );
    Plugin.ConditionalDisplay = ConditionalDisplay;
});
