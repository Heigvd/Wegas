/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author maxence.laurent gmail.com
 */
/*global YUI, Chartist, I18n */
YUI.add('wegas-chart', function(Y) {
    'use strict';
    var CONTENTBOX = 'contentBox', Chart;
    Chart = Y.Base.create('wegas-chart', Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: '<div>' +
            '<div class="ct-chart">' +
            '</div>' +
            '<div class="legend"></div>' +
            '</div>',
        initializer: function() {
            this.handlers = [];
            if (this.get('xLabelMapper')) {
                this._xLabelMapper = W.Sandbox.eval('(' + this.get('xLabelMapper') + ')');
            }
        },
        bindUI: function() {
            this.handlers.push(
                Y.Wegas.Facade.Variable.after('update', this.syncUI, this)
                );
        },
        renderUI: function() {
            var variables, i, vd, legendNode, label;
            this.options = {
                width: this.get('width'),
                height: this.get(
                    'height'
                    ) /*
                     lineSmooth: Chartist.Interpolation.none(),
                     axisX: {
                     type: Chartist.AutoScaleAxis,
                     onlyInteger: true,
                     },*/,
                axisX: {
                    showLabel: this.get('showXLabels')
                },
                axisY: {
                    type: Chartist.AutoScaleAxis,
                    position: this.get('yLabelPosition'),
                    showLabel: this.get('showYLabels'),
                    labelInterpolationFnc: function(value) {
                        return I18n.formatNumber(value);
                    }
                }
            };
            if (this.get('interpolation') === 'simple') {
                this.options.lineSmooth = Chartist.Interpolation.simple({
                    divisor: 2
                });
            } else if (this.get('interpolation') === 'cardinal') {
                this.options.lineSmooth = Chartist.Interpolation.cardinal({
                    tension: 0.2
                });
            } else if (this.get('interpolation') === 'step') {
                this.options.lineSmooth = Chartist.Interpolation.step({
                    postpone: true
                });
            } else {
                this.options.lineSmooth = Chartist.Interpolation.none();
            }

            if (Y.Lang.isNumber(this.get('low'))) {
                this.options.axisY.low = this.get('low');
            }
            if (Y.Lang.isNumber(this.get('high'))) {
                this.options.axisY.high = this.get('high');
            }

            variables = this.get('variables');
            legendNode = this.get(CONTENTBOX).one('.legend');
            for (i = 0; i < variables.length; i += 1) {
                vd = Y.Wegas.Facade.Variable.cache.find('name', variables[i].name);
                if (this.get('variables')[i].label) {
                    label = Y.Template.Micro.compile(this.get('variables')[i].label || '')();
                } else {
                    label = I18n.t(vd.get('label'));
                }

                legendNode.append('<div>'
                    + '<span class="color ct-series-' + String.fromCharCode(97 + i) + '"></span>' +
                    '<span class="label">' + label + '</span>'
                    + '</div>');
            }
            this.chart;
        },
        syncUI: function() {
            var vd,
                i,
                variables = this.get('variables'),
                history,
                promises = [],
                ctx = this;
            this.data = {labels: [], series: []};
            this.counter = variables.length;
            for (i = 0; i < variables.length; i += 1) {
                vd = Y.Wegas.Facade.Variable.cache.find('name', variables[i].name);
                if (!vd) {
                    this.showMessage('error', 'Variable ' + variables[i].name + ' not found');
                    return;
                }
                promises.push(this.updateHistory(vd, i));
            }

            Y.Promise.all(promises).then(function(a) {
                var v;
                for (i = 0; i < a.length; i += 1) {
                    v = a[i];
                    ctx.updateSerie(v.serie, i, v.label);
                }
            });
        },
        updateSerie: function(serie, i, label) {
            var k, max, data = this.data;
            this.counter -= 1;
            this.data.series.push({
                name: label,
                data: serie
            });
            if (this.counter === 0) {
                data.labels = [];
                max = 0;
                for (k = 0; k < data.series.length; k += 1) {
                    max = Math.max(max, data.series[k].data.length);
                }
                if (this.get('xMinMax.evaluated')) {
                    max = Math.max(
                        max,
                        this.get('xMinMax.evaluated').getValue()
                        );
                }
                for (k = 0; k < max; k++) {
                    if (this._xLabelMapper) {
                        data.labels.push(this._xLabelMapper(k));
                    } else {
                        data.labels.push(k + 1);
                    }
                }

                if (this.chart) {
                    this.chart.update(data);
                } else {
                    this.chart = new Chartist.Line(
                        '#' + this.get(CONTENTBOX).get('id') + ' .ct-chart',
                        this.data,
                        this.options
                        );
                    this.generateTooltip();
                }
            }
        },
        generateTooltip: function() {
            var chart, tooltip, CB = this.get(CONTENTBOX);
            chart = CB.one('.ct-chart');
            chart.append('<div class="tooltip"></div>');
            tooltip = chart.one('.tooltip');
            tooltip.hide();
            // TODO hide
            this.handlers.push(
                CB.delegate(
                    'mouseenter',
                    function(e) {
                        var value, name;
                        name = e.target
                            .getDOMNode()
                            .parentNode.getAttribute('ct:series-name');
                        value = e.target.getAttribute('ct:value');
                        tooltip.setContent(name + '<br />' + I18n.formatNumber(value));
                        tooltip.show();
                    },
                    '.ct-point',
                    this
                    )
                );
            this.handlers.push(
                CB.delegate(
                    'mouseleave',
                    function(e) {
                        this.get(CONTENTBOX).one('.tooltip').hide();
                    },
                    '.ct-point',
                    this
                    )
                );
            this.handlers.push(
                chart.on(
                    'mousemove',
                    function(e) {
                        var tooltip = this.get(CONTENTBOX).one('.tooltip');
                        tooltip.setStyle('left', e.pageX + 10 + 'px');
                        tooltip.setStyle('top', e.pageY + 10 + 'px');
                    },
                    this
                    )
                );
        },
        destructor: function() {
            var i;
            if (this.chart) {
                this.chart.detach();
            }
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
        updateHistory: function(vd, i) {
            var ctx = this,
                promise = Y.Promise(function(resolve, reject) {
                    Y.Wegas.Facade.Variable.cache.getWithView(vd.getInstance(), 'Extended', {
                        on: {
                            success: Y.bind(function(e) {
                                var entity = e.response.entity, label;
                                if (this.get('variables')[i].label) {
                                    label = Y.Template.Micro.compile(
                                        this.get('variables')[i].label || '')();
                                } else {
                                    label = vd.get('label');
                                }
                                resolve({
                                    serie: entity.get('history').concat(entity.get('value')),
                                    label: label
                                });
                            }, ctx),
                            failure: function(r) {
                                Y.error('Error by loading history data');
                                resolve({
                                    serie: [],
                                    label: vd.get('label')
                                });
                            }
                        }
                    }, ctx);
                });
            return promise;
        }
    }, {
        EDITORNAME: 'Chart',
        ATTRS: {
            variables: {
                type: 'array',
                view: {
                    label: 'Variables'
                },
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: "string",
                            view: {
                                type: 'flatvariableselect',
                                label: 'Variable',
                                classFilter: ['NumberDescriptor']
                            }

                        },
                        label: {
                            type: "string",
                            view: {
                                label: 'Label'
                            }
                        }
                    }
                }
            },
            low: {
                type: 'number',
                view: {
                    label: 'Vertical start value'
                }
            },
            high: {
                type: 'number',
                view: {
                    label: 'Vertical end value'
                }
            },
            width: {
                transient: false,
                type: 'string',
                value: '250px',
                index: 100,
                view: {label: 'Width'}
            },
            height: {
                transient: false,
                type: 'string',
                value: '200px',
                index: 100,
                view: {label: 'Height'}
            },
            xMinMax: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Minimum horizontal end value',
                    classFilter: ['NumberDescriptor']
                }
            },
            interpolation: {
                type: 'string',
                value: 'none',
                view: {
                    type: 'select',
                    choices: ['none', 'simple', 'cardinal', 'step'],
                    label: 'Interpolation'
                }
            },
            showXLabels: {
                type: 'boolean',
                value: true,
                view: {label: 'Show x labels'}
            },
            showYLabels: {
                type: 'boolean',
                value: true,
                view: {label: 'Show y labels'}
            },
            yLabelPosition: {
                type: 'string',
                value: 'start',
                view: {type: 'hidden'}
            },
            xLabelMapper: {
                type: 'string',
                value: '',
                view: {type: 'hidden'}
            }
        }
    }
    );
    Y.Wegas.Chart = Chart;
});
