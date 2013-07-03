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

    Datatable = Y.Base.create("wegas-pmg-datatable", Y.Wegas.DataTable, [Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        datatable: null,
        data: null,
        // *** Lifecycle Methods *** //
        initializer: function() {
            var i, ct = this.get("columnsCfg"), columnTitles = new Array();
            this.handlers = {};
            this.data = [];

            columnTitles.push({
                key: "_id",
                label: "_id"
            });                                                                 //First column is always the name (but not displayed)
            for (i = 0; i < ct.length; i++) {                                         //construct Datatable's columns
                ct[i].newname = ct[i].name.replace(".", "");
                columnTitles.push(
                        {
                            key: ct[i].newname,
                            label: ct[i].title,
                            sortable: true,
                            allowHTML: true
                        }
                );
            }

            this.datatable = new Y.DataTable({//Using simple database
                columns: columnTitles
            });
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            if (!this.datatable)
                return;
            this.datatable.render(cb);
        },
        bindUI: function() {
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("response", this.syncUI, this);
        },
        syncUI: function() {
            if (this.datatable === null || this.get("variables") === null)
                return;
            this.datatable.set("data", []);
            this.getData();
            this.datatable.addRows(this.data);
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i++) {
                this.handlers[i].detach();
            }
            this.datatable.destroy();
        },
        //*** Private Methods ***/
        getData: function() {
            var i, j, variableDesc, variableInst, oneRowDatas, data, splitedName,
                    ct = this.get("columnsCfg"), variables = this.get('variable.evaluated');
            
            if (!variables || variables === null || !variables instanceof Y.Wegas.persistence.ListDescriptor){
                this.showMessage("error", "Variable is not a ListDescriptor");
                return;
            }
            
            for (i = 0; i < variables.get('items').length; i++) {
                variableDesc = variables.get('items')[i];
                variableInst = variableDesc.getInstance();
                oneRowDatas = {};
                oneRowDatas["_id"] = variableDesc.get("id");
                for (j = 0; j < ct.length; j++) {
                    splitedName = ct[j].name.split(".");
                    if (ct[j].variableType === "descriptor"){
                        data = this.find(variableDesc, splitedName);
                    } else {
                        data = this.find(variableInst, splitedName);
                    }
                    
                    oneRowDatas[ct[j].newname] = data;
                }
                this.data.push(oneRowDatas);
            }
        },
        find: function (variableType, splitedName){
            var data = "", i, label, classLab;
            if (splitedName.length === 2){
                if (variableType.get(splitedName[0])[splitedName[1]]){
                    return variableType.get(splitedName[0])[splitedName[1]];  
                } else if (variableType.get(splitedName[0]).length){
                    for (i=0; i<variableType.get(splitedName[0]).length; i++){
                        data = data + "<p class='test'>"+ variableType.get(splitedName[0])[i].get(splitedName[1]) +"</p>";
                    }
                    return data;
                }
                return " - ";
            } else if (typeof variableType.get(splitedName[0]) === 'object') {
                for (label in variableType.get(splitedName[0])){
                    if (variableType.get(splitedName[0])[label]._state) {
                        data = data + "<p>";
                        for (classLab in variableType.get(splitedName[0])[label]._state.data){
                            data = data + "<span class='"+ classLab +"'>"+ variableType.get(splitedName[0])[label].get(classLab)+ " </span>";
                        }
                        data = data + "</p>";
                    } else {
                        data = data + "<p class='"+ label +"'>"+ variableType.get(splitedName[0])[label] +"</p>";
                    }
                    
                }
                return data;
                return variableType.get(splitedName[0]);
            } else if (variableType.get(splitedName[0])) {
                return variableType.get(splitedName[0]);
            } else {
                return " - ";
            }
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
            variableType: {
                value:{}
            },
            defaultSort: {
                value: null,
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });

    Y.namespace("Wegas").PmgDatatable = Datatable;
});