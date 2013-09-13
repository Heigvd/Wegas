/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add("wegas-pmg-datatable", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Datatable;

    Datatable = Y.Base.create("wegas-pmg-datatable", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        datatable: null,
        data: null,
        // *** Lifecycle Methods *** //
        initializer: function() {
            var i, ct = this.get("columnsCfg");
            this.handlers = {};
            this.data = [];

            for (i = 0; i < ct.length; i++) {                                         //construct Datatable's columns
                Y.mix(ct[i], {
                    sortable: true,
                    allowHTML: true
                });
            }

            this.datatable = new Y.DataTable({//Using simple database
                columns: ct
            });
        },
        renderUI: function() {
            this.datatable.render(this.get(CONTENTBOX));
        },
        bindUI: function() {
            this.updateHandler = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
        },
        syncUI: function() {
            this.datatable.set("data", []);
            this.datatable.addRows(this.getData());
        },
        destructor: function() {
            this.updateHandler.detach();
            this.datatable.destroy();
        },
        //*** Private Methods ***/
        getData: function() {
            var oneRowDatas,
                    variables = this.get('variable.evaluated'),
                    data = [];

            if (!variables) {
                this.showMessage("error", "Could not find variable");
                return [];
            } else if (!variables instanceof Y.Wegas.persistence.ListDescriptor) {
                this.showMessage("error", "Variable is not a ListDescriptor");
                return [];
            }

            for (i = 0; i < items.length; i++) {
                if (items[i].getInstance().get("active") !== false) {
                    var oneRowDatas = items[i].toJSON();
                    oneRowDatas.descriptor = items[i];
                    oneRowDatas.instance = items[i].getInstance().toJSON();
                    data.push(oneRowDatas);
                }
            });
            return data;
        }
    }, {
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable"
                }
            },
            columnsCfg: {
                validator: Y.Lang.isArray
            },
            defaultSort: {
                value: null,
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });
    Y.mix(Y.DataTable.BodyView.Formatters, {
//        "instance": function(o) {
//            return function(o) {
//                return o.data.instance[o.column.field];
//            }
//        },
//        "map": function(o) {
//            return function(o) {
//                var i, names = o.column.key.split("."),
//                    data = o.data;
//                for (var i = 0; i < names.length; i += 1) {
//                    data = data[names[i]];
//                }
//
//                if (!data)
//                    data = " - ";
//                return data;
//            }
//        },
        "requieredRessources": function(o) {
            return function(o) {
                var i, data = "";
                for (i = 0; i < o.data.instance["requirements"].length; i++) {
                    data = data + "<p>";
                    data = data + "<span class='quantity'>" + o.data.instance.requirements[i].get("quantity") + "x</span> ";
                    data = data + "<span class='work'>" + o.data.instance["requirements"][i].get("work") + " </span> ";
                    data = data + "<span class='level'>" + o.data.instance["requirements"][i].get("level") + " </span> ";
                    data = data + "</p>";
                }
                return data;
            }
        },
        "assignedRessources": function(o) {
            return function(o) {
                var assignedRessources = o.data.descriptor.findAssociatedRessources("assignments"),
                        data = "", i, t;
                for (i = 0; i < assignedRessources.length; i++) {
                    for (t in assignedRessources[i].ressourceInstance.get("skillsets")) {
                        data = data + "<p>" + t + " " + assignedRessources[i].ressourceInstance.get("skillsets")[t] + "</p>";
                    }
                }
                if (!data)
                    data = " - ";
                return data;
            }
        },
        "template": function(o) {
            return function(o) {
                var data = "";
                var micro = new Y.Template();
                    data = micro.render('<%= this.' + o.column.field + ' %>', o.data);
                if (!data)
                    data = " - ";
                return data;
            }
        },
        "object": function() {
            return function(o) {
                var data = "";
                var micro = new Y.Template();
                data = micro.render('<% for(var i in this.' + o.column.field + '){%> <%= this.' + o.column.field + '[i]%> <%} %>', o.data);
                if (!data)
                    data = " - ";
                return data;
            }
        }
    });

    Y.namespace("Wegas").PmgDatatable = Datatable;
});
