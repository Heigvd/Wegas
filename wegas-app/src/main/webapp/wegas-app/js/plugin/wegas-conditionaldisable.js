/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-conditionaldisable', function(Y) {
    'use strict';
    var Wegas = Y.Wegas, Plugin = Y.Plugin, ConditionalDisable;

    ConditionalDisable = Y.Base.create(
        'wegas-conditionaldisable',
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
                            var attr = this.get('attribute'),
                                host = this.get('host'),
                                result = e.response.entity;
                            if (attr === 'cssClass') {
                                host
                                    .get('boundingBox')
                                    .toggleClass(this.get('value'), result || false);
                            } else {
                                if (
                                    this.get('attribute') === 'disabled' &&
                                    host._enable &&
                                    host._disable
                                ) {
                                    if (result) {
                                        host._disable('ConditionalDisable');
                                    } else {
                                        host._enable('ConditionalDisable');
                                    }
                                } else {
                                    this.get('host').set(
                                        this.get('attribute'),
                                        result
                                    );
                                }
                            }
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
                        label: 'Disable if'
                    }
                },
                attribute: {
                    type: 'string',
                    value: 'disabled',
                    required: true,
                    view: {
                        label: 'Attribute',
                        className: 'wegas-advanced-feature'
                    }
                },
                value: {
                    type: 'string',
                    value: '',
                    view: {
                        label: 'Value',
                        className: 'wegas-advanced-feature'
                    }
                }
            },
            NS: 'ConditionalDisable'
        }
    );
    Plugin.ConditionalDisable = ConditionalDisable;

    Plugin.ConditionalDisable2 = Y.Base.create(
        'wegas-conditionaldisable2',
        ConditionalDisable,
        [],
        {},
        {
            NS: 'ConditionalDisable2'
        }
    );
    Plugin.ConditionalDisable3 = Y.Base.create(
        'wegas-conditionaldisable3',
        ConditionalDisable,
        [],
        {},
        {
            NS: 'ConditionalDisable3'
        }
    );
    Plugin.ConditionalDisable4 = Y.Base.create(
        'wegas-conditionaldisable4',
        ConditionalDisable,
        [],
        {},
        {
            NS: 'ConditionalDisable4'
        }
    );
});
