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
        menuDetails: null,
        handlers: null,
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
            this.onceAfterHostEvent("render", this.bind);
            this.afterHostMethod("syncUI", this.bind);
            this.get("host").datatable.after("sort", this.bind, this);
        },
        bind: function() {
            Y.log("bind()", "log", "Wegas.Tablepopup");
            var i, record, dt = this.get("host").datatable, field, descriptor;

            for (i = 0; i < dt.get("data").size(); i++) {
                dt.getCell([i, this.get("column")]).addClass("popup");
                this.handlers.push(dt.getCell([i, this.get("column")]).on('click', function(e) {
                    dt = this.get("host").datatable;
                    field = this.get("field");
                    record = dt.getRecord(e.target);
                    descriptor = Wegas.Facade.Variable.cache.find("id", record.get("id"));

                    this.menuDetails.attachTo(e.target);

                    if (descriptor.get(field)) {
                        this.display(descriptor.get(field));
                    } else {
                        this.request(descriptor);
                    }
                }, this));

                this.handlers.push(dt.getCell([i, 1]).on('mouseout', function(e) {
                    this.menuDetails.hide();
                }, this));
            }
        },
        request: function(descriptor) {
            Wegas.Facade.Variable.cache.getWithView(descriptor, "Extended", {// Retrieve the object from the server in Export view
                on: Wegas.superbind({
                    success: function(e) {
                        var field = this.get("field");
                        if (e.response.entity.get(field)) {
                            descriptor.set(field, e.response.entity.get(field));
                            this.display(e.response.entity.get(field));
                        } else {
                            this.get("host").showMessage("error", "This information does not exist");
                        }

                    },
                    failure: function(e) {
                        this.get("host").showMessage("error", "An error occurs");
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
            for (i = 0; i < this.handlers.length; i++) {
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
        NS: "tablepopup",
        NAME: "Tablepopup"
    });
    Y.Plugin.Tablepopup = Tablepopup;
});
