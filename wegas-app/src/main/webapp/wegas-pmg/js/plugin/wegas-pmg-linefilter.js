/*
 * Wegas
 * http://wegas.albasim.ch

 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global YUI*/
YUI.add('wegas-pmg-linefilter', function(Y) {
    "use strict";
    var Wegas = Y.Wegas;

    Y.Plugin.PMGLineFilter = Y.Base.create("wegas-pmg-linefilter", Y.Plugin.Base, [], {
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = [];
            this.handlers.push(this.onceAfterHostEvent("render", function() {
                this.sync();
                this.afterHostMethod("syncUI", this.sync);
            }));
            this.handlers.push(this.get("host").datatable.after("sort", this.sync, this));
        },
        sync: function() {
            var dt = this.get("host").datatable,
                fn = this.get("filterFn");

            dt.data.each(function(row, id) {
                fn.call(this, row, dt.getRow(id));
            }, this);
            this.get("host").fire("filtered");
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(item) {
                item.detach();
            });
        }
    }, {
        NS: "pmglinefilter",
        ATTRS: {
            filterFn: {
                "transient": true, //avoid function serialization
                value: function(data, node) {
                },
                validator: Y.Lang.isFunction
            }
        }
    });

    Y.Plugin.PMGLineCompleteness = Y.Base.create("wegas-pmg-linecompleteness",
        Y.Plugin.PMGLineFilter,
        [Wegas.Plugin,
            Wegas.Editable],
        {},
        {
            NS: "pmglinecompleteness",
            ATTRS: {
                completeClass: {
                    value: "pmg-line-completeness-complete"
                },
                startedClass: {
                    value: "pmg-line-completeness-started"
                },
                filterFn: {
                    value: function(data, node) {
                        var completeness = data.get("instance.properties.completeness");
                        node.removeClass(this.get("completeClass")).removeClass(this.get("startedClass"));
                        if (completeness > 99) {
                            node.addClass(this.get("completeClass"));
                        } else if (completeness > 0) {
                            node.addClass(this.get("startedClass"));
                        }
                    }
                }
            }
        });
});
