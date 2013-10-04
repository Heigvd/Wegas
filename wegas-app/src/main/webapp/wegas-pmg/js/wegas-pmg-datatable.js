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


            for (i = 0; i < ct.length; i += 1) {                                //construct Datatable's columns
                Y.mix(ct[i], {
                    sortable: true,
                    allowHTML: true
                });
                if (Y.Lang.isString(ct[i].sortFn)) {
                    ct[i].sortFn = Datatable.Sort[ct[i].sortFn](ct[i]);
                }
            }

            this.datatable = new Y.DataTable({//Using simple database
                bodyView: Y.Wegas.PMGBodyView,
                columns: ct
                        //recordType: PMGDatatableModel,
                        //sortable: true
            });
        },
        renderUI: function() {
            Y.log("renderUI()", "info", "Wegas.PMGDatatable");
            this.datatable.render(this.get(CONTENTBOX));
        },
        bindUI: function() {
            this.updateHandler =
                    Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
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
        },
        Sort: {
            objectsort: function(col) {
                return function(a, b, dir) {
                    var aa = Y.Object.values(a.get(col.key))[0] || '',
                            bb = Y.Object.values(b.get(col.key))[0] || '';

                    if (typeof(aa) === "string" && typeof(bb) === "string") {// Not case sensitive
                        aa = aa.toLowerCase();
                        bb = bb.toLowerCase();
                    }
                    return (dir) ? aa < bb : aa > bb;
                };
            }
        }
    });
    Y.namespace("Wegas").PmgDatatable = Datatable;

    Y.mix(Y.DataTable.BodyView.Formatters, {
        requieredRessources: function(o) {
            return function(o) {
                return TEMPLATES.requiredRessource(o.data.instance.requirements);
            };
        },
        assignedRessources: function(o) {
            return function(o) {
                var assignedRessources = o.data.descriptor.findAssociatedRessources("assignments"),
                        data = TEMPLATES.assignedRessource(assignedRessources);
                if (!data) {
                    data = " - ";
                }
                return data;
            };
        },
        template: function(o) {
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
        rounded: function() {
            return function(o) {
                return Math.round(+o.value);
            };
        },
        object: function() {
            return function(o) {
                var i, ret = [];
                for (i in o.value) {
                    ret.push(o.value[i]);
                }
                return ret.join("");
            };
        },
        "object-old": function() {
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
//        }
    });

    //var PMGDatatableModel = Y.Base.create('pmgdatatablemodel', Y.Model, [], {
    //    get: function(a) {
    //        console.log("get", a);
    //        return PMGDatatableModel.superclass.get.apply(this, arguments);
    //    }
    //}, {
    //    ATTRS: {}
    //});
    //Y.namespace("Wegas").PMGDatatableModel = PMGDatatableModel;

    Y.namespace("Wegas").PMGBodyView = Y.Base.create("pmg-bodyview", Y.DataTable.BodyView, [], {
        _createRowHTML: function(model, index, columns) {
            var data = model.toJSON(),
                    clientId = model.get('clientId'),
                    values = {
                rowId: this._getRowId(clientId),
                clientId: clientId,
                rowClass: (index % 2) ? this.CLASS_ODD : this.CLASS_EVEN
            },
            host = this.host || this,
                    i, len, col, token, value, formatterData;
            for (i = 0, len = columns.length; i < len; ++i) {
                col = columns[i];
                value = (col.key) ? model.get(col.key) : null;                                     // @modified
                //value = data[col.key];
                token = col._id || col.key;

                values[token + '-className'] = '';

                if (col._formatterFn) {
                    formatterData = {
                        value: value,
                        data: data,
                        column: col,
                        record: model,
                        className: '',
                        rowClass: '',
                        rowIndex: index
                    };
                    value = col._formatterFn.call(host, formatterData);// Formatters can either return a value
                    if (value === undefined) {// or update the value property of the data obj passed
                        value = formatterData.value;
                    }
                    values[token + '-className'] = formatterData.className;
                    values.rowClass += ' ' + formatterData.rowClass;
                }
                if (!values.hasOwnProperty(token) || data.hasOwnProperty(col.key)) {// if the token missing OR is the value a legit value
                    if (value === undefined || value === null || value === '') {
                        value = col.emptyCellValue || '';
                    }
                    values[token] = col.allowHTML ? value : Y.Escape.html(value);
                }
            }
            values.rowClass = values.rowClass.replace(/\s+/g, ' ');// replace consecutive whitespace with a single space
            return Y.Lang.sub(this._rowTemplate, values);// @modified
        },
        refreshCell: function(cell, model, col) {
            var content,
                    formatterFn,
                    formatterData,
                    data = model.toJSON();
            cell = this.getCell(cell);
            model || (model = this.getRecord(cell));
            col || (col = this.getColumn(cell));

            if (col.nodeFormatter) {
                formatterData = {
                    cell: cell.one('.' + this.getClassName('liner')) || cell,
                    column: col,
                    data: data,
                    record: model,
                    rowIndex: this._getRowIndex(cell.ancestor('tr')),
                    td: cell,
                    value: model.get(col.key)                                       // @Modified
                            //value: data[col.key]
                };
                keep = col.nodeFormatter.call("host", formatterData);
                if (keep === false) {
                    cell.destroy(true);
                }
            } else if (col.formatter) {
                if (!col._formatterFn) {
                    col = this._setColumnsFormatterFn([col])[0];
                }
                formatterFn = col._formatterFn || null;
                if (formatterFn) {
                    formatterData = {
                        value: model.get(col.key), // @Modified
                        //value: data[col.key],
                        data: data,
                        column: col,
                        record: model,
                        className: '',
                        rowClass: '',
                        rowIndex: this._getRowIndex(cell.ancestor('tr'))
                    };
                    content = formatterFn.call(this.get('host'), formatterData);// Formatters can either return a value ...
                    if (content === undefined) {// ... or update the value property of the data obj passed
                        content = formatterData.value;
                    }
                }
                if (content === undefined || content === null || content === '') {
                    content = col.emptyCellValue || '';
                }
            } else {
                content = model.get(col.key) || col.emptyCellValue || '';
            }

            cell.setHTML(col.allowHTML ? content : Y.Escape.html(content));
            return this;
        }
    });
});
