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

    var CONTENTBOX = "contentBox", Datatable, micro = new Y.Template(),
            TEMPLATES = {
        template: micro.compile('<%= Y.Object.getValue(this, this._field.split(".")) %>'),
        object: micro.compile('<% for(var i in Y.Object.getValue(this, this._field.split("."))){%> <%= Y.Object.getValue(this, this._field.split("."))[i]%> <%} %>'),
        requiredRessource: micro.compile('<% for(var i=0; i< this.length;i+=1){%><p><span class="quantity"><%= this[i].get("quantity") %>x</span> <span class="work"><%= this[i].get("work") %></span> <span class="level"><%= this[i].get("level") %></span></p><%}%>'),
        assignedRessource: micro.compile('<% for(var i = 0; i < this.length; i+=1){ for (var j in this[i].ressourceInstance.get("skillsets")){%> <p><%= this[i].ressourceDescriptor.get("label") %> (<%= j %> <%= this[i].ressourceInstance.get("skillsets")[j]%>)</p><% }} %>')
    };

    Datatable = Y.Base.create("wegas-pmg-datatable", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        // *** Lifecycle Methods *** //
        initializer: function() {
            var i, ct = this.get("columnsCfg");

            for (i = 0; i < ct.length; i += 1) {                                         //construct Datatable's columns
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
            Y.log("renderUI()", "info", "Wegas.PMGDatatable");
            this.datatable.render(this.get(CONTENTBOX));
        },
        bindUI: function() {
            this.updateHandler = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
        },
        syncUI: function() {
            Y.log("syncUI()", "log", "Wegas.Datatable");
            this.datatable.set("data", this.getData());
            // this.datatable.addRows(this.getData());
        },
        destructor: function() {
            Y.log("destructor()", "log", "Wegas.Datatable");
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
            Y.Array.each(variables.get("items"), function(item) {
                if (item.getInstance().get("active")) {
                    oneRowDatas = item.toJSON();
                    oneRowDatas.descriptor = item;
                    oneRowDatas.instance = item.getInstance().toJSON();
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
                    _type: "variableselect"
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
//            };
//        },
        "requieredRessources": function(o) {
            return function(o) {
                return TEMPLATES.requiredRessource(o.data.instance.requirements);
            };
        },
        "assignedRessources": function(o) {
            return function(o) {
                var assignedRessources = o.data.descriptor.findAssociatedRessources("assignments"),
                        data = TEMPLATES.assignedRessource(assignedRessources);
                if (!data) {
                    data = " - ";
                }
                return data;
            };
        },
        "template": function(o) {
            return function(o) {
                var data;
                o.data._field = o.column.field;
                data = TEMPLATES.template(o.data);
                if (!data) {
                    data = " - ";
                }
                return data;
            };
        },
        "object": function() {
            return function(o) {
                var data = "";
                o.data._field = o.column.field;
                data = TEMPLATES.object(o.data);
                if (!data) {
                    data = " - ";
                }
                return data;
            };
        }
    });

    Y.namespace("Wegas").PmgDatatable = Datatable;
});
