/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add( "wegas-pmg-datatable", function ( Y ) {
    "use strict";

    var CONTENTBOX = "contentBox", Datatable;

    Datatable = Y.Base.create( "wegas-pmg-datatable", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable], {
        
        handlers:null,
        datatable:null,
        data:null,
        
        //*** Private Methods ***/
        getData: function(){
            var i, j, variables, variableDesc, variableInst, oneRowDatas,
            ct = this.get("columnTitles"), cv = this.get("columnValues");
            if(cv == null) return;
            variables = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("variables"));
            for (i = 0; i < variables.get('items').length; i++) {
                variableDesc = variables.get('items')[i];
                variableInst = variableDesc.getInstance();
                oneRowDatas = {};
                oneRowDatas["_name"] = variableDesc.get("name"); 
                for (j = 0; j< ct.length; j++) {
                    if(variableDesc.get(cv[j])){
                        oneRowDatas[ct[j]] = variableDesc.get(cv[j]);
                    }else if(variableInst.get(cv[j])){
                        oneRowDatas[ct[j]] = variableInst.get(cv[j]);
                    }else {
                        oneRowDatas[ct[j]] = variableInst.get('properties')[cv[j]];
                    }
                }
                this.data.push(oneRowDatas);
            }
        },
        
        // *** Lifecycle Methods *** //
        initializer: function(){
            var i, ct = this.get("columnTitles"), columnTitles = new Array();
            this.handlers = new Array(); 
            this.data = new Array();
            if(ct == null || ct.length == 0 || ct.length != this.get("columnValues").length) return;
            columnTitles.push({
                key:"_name", 
                label:"_name"
            });                                                                 //First column is always the name (but not displayed)
            for(i=0; i<ct.length; i++){                                         //construct Datatable's columns
                columnTitles.push(
                {
                    key:ct[i],
                    label:ct[i]
                }
                );
            }
            this.datatable = new Y.DataTable({
                columns: columnTitles
            });
        },
        
        renderUI: function(){
            var cb = this.get(CONTENTBOX);
            if(!this.datatable) return;
            this.datatable.render(cb);
        },
        
        bindUI: function(){
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
        },
        
        syncUI: function(){
            if(this.datatable == null || this.get("variables") == null) return;
            this.data.length = 0;
            this.getData();
            this.datatable.addRows(this.data);
        },
        
        destructor: function(){
            var i;
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            } 
            this.datatable.destroy();
        }  

    }, {
        ATTRS : {
            variables:{
                value: null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            columnTitles:{
                validator: Y.Lang.isArray
            },
            columnValues:{
                validator: Y.Lang.isArray
            }
        }
    });

    Y.namespace( "Wegas" ).PmgDatatable = Datatable;
});