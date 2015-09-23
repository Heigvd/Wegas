/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @deprecated 
 */
YUI.add('wegas-pmg-tablepopup', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, Tablepopup;

    /**
     *  @class add a popup on a table column
     *  @name Y.Plugin.Tablepopup
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    Tablepopup = Y.Base.create("wegas-pmg-tablepopup", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Tablepopup */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = [];
            this.menuDetails = new Wegas.Menu({
                width: this.get("width"),
                points: ["tl", "tr"]
            });
            this.bind();
            this.onceAfterHostEvent("render", this.sync);
            this.afterHostMethod("syncUI", this.sync);
            this.get("host").datatable.after("sort", this.sync, this);
        },
        bind: function() {
            Y.log("bind()", "log", "Wegas.Tablepopup");
            var descriptor, field = this.get("field"),
                dt = this.get("host").datatable;

            this.handlers.push(dt.delegate("mouseover", function(e) {
                descriptor = dt.getRecord(e.currentTarget).get("descriptor");
                this.menuDetails.attachTo(e.currentTarget);

                if (descriptor.get(field)) {
                    this.display(descriptor.get(field));
                } else {
                    this.request(descriptor);
                }
            }, ".popup", this));
            this.handlers.push(dt.delegate("mouseout", this.menuDetails.hide, ".popup", this.menuDetails));
        },
        sync: function() {
            var i, dt = this.get("host").datatable;
            for (i = 0; i < dt.get("data").size(); i += 1) {
                dt.getCell([i, this.get("column")]).addClass("popup");
            }
        },
        request: function(descriptor) {
            Wegas.Facade.Variable.cache.getWithView(descriptor, "Extended", {// Retrieve the object from the server in Export view
                on: Wegas.superbind({
                    success: function(e) {
                        var field = this.get("field"),
                            val = e.response.entity.get(this.get("field"));
                        if (val) {
                            descriptor.set(field, val);
                            this.display(val);
                        } else {
                            this.get("host").showMessage("error", "This information does not exist");
                        }
                    },
                    failure: function() {
                        this.get("host").showMessage("error", "An error occured");
                    }
                }, this)
            });
        },
        display: function(value) {
            this.menuDetails.show();
            this.menuDetails.get("contentBox").setHTML('<div style="padding:5px 10px"><p>' + value + '</p></div>');
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        ATTRS: {
            width: {
                type: "string",
                value: "250px"
            },
            field: {
                type: "string",
                value: "description"
            },
            column: {
                value: 1,
                _inputex: {
                    _type: "integer",
                    label: "popup on column"
                }
            }
        },
        NS: "tablepopup"
    });
    Y.Plugin.Tablepopup = Tablepopup;
});
