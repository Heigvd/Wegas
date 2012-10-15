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
YUI.add( "wegas-pmg-tasklist", function ( Y ) {
    "use strict";

    var CONTENTBOX = "contentBox", Tasklist;

    Tasklist = Y.Base.create( "wegas-pmg-tasklist", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable ], {
        
        handlers:null,
        datatable:null,
        data:null,
        
        //*** Private Methods ***/
        getData: function(){
            var i, j, tasks, taskDesc, taskInst, oneRowDatas,
            ct = this.get("columnTitle"), cv = this.get("columnValue");
            if(cv == null) return;
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("tasks"));
            for (i = 0; i < tasks.get('items').length; i++) {
                taskDesc = tasks.get('items')[i];
                taskInst = taskDesc.getInstance();
                oneRowDatas = {};
                oneRowDatas["_name"] = taskDesc.get("name"); 
                for (j = 0; j< ct.length; j++) {
                    if(taskDesc.get(cv[j])){
                        oneRowDatas[ct[j]] = taskDesc.get(cv[j]);
                    }else if(taskInst.get(cv[j])){
                        oneRowDatas[ct[j]] = taskInst.get(cv[j]);
                    }else {
                        oneRowDatas[ct[j]] = taskInst.get('properties')[cv[j]];
                    }
                }
                this.data.push(oneRowDatas);
            }
        },
        
        checkRealization: function(){
            var i, cb = this.get(CONTENTBOX), tasks, taskInst, realized, allRow;
            if(this.data == null
                || this.data.length == 0
                || this.get("columnValue").indexOf('realized')<=-1){
                return; 
            }
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("tasks"));
            allRow = cb.all(".yui3-datatable-data tr");
            allRow.removeClass("started").removeClass("completed");
            for(i=0; i<tasks.get('items').length; i++){
                taskInst = tasks.get('items')[i].getInstance();
                realized = (taskInst.get('properties').realized)?taskInst.get('properties').realized:null;
                if(realized){
                    if(realized > 0 && realized < 100){
                        allRow.item(i).addClass("started");
                    }
                    if(realized == 100){
                        allRow.item(i).addClass("completed");
                    }
                }
            }
        },
        
        displayDescription: function(e){
            var i, name, tasks, taskDesc, description;
            if(this.get("viewDescription") == "false") return;
            name = e.currentTarget.ancestor().one("*").getContent()
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("tasks"));
            if(!name || !tasks) return;
            for (i = 0; i < tasks.get('items').length; i++) {
                taskDesc = tasks.get('items')[i];
                if(taskDesc.get('name') === name){
                    description = taskDesc.get("description");
                    break;
                } 
            }
            e.currentTarget.append("\
                <div class='description'>\n\
                    <p class='task_name'>"+name+"</p>\n\
                    <p class='description'>"+description+"</p>\n\
                </div>")
        },
        
        // *** Lifecycle Methods *** //
        initializer: function(){
            var i, ct = this.get("columnTitle"), columnTitle = new Array();
            this.handlers = new Array(); 
            this.data = new Array();
            if(ct == null || ct.length == 0 || ct.length != this.get("columnValue").length) return;
            columnTitle.push({
                key:"_name", 
                label:"_name"
            });                      //First column is always the name (but not displayed)
            for(i=0; i<ct.length; i++){                                         //construct Datatable's columns
                columnTitle.push(
                {
                    key:ct[i],
                    label:ct[i]
                }
                );
            }
            this.datatable = new Y.DataTable({
                columns: columnTitle
            });
        },
        
        renderUI: function(){
            var cb = this.get(CONTENTBOX);
            if(this.datatable == null) return;
            this.datatable.render(cb);
        },
        
        bindUI: function(){
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.handlers.push(this.datatable.delegate('click', function (e) {
                this.displayDescription(e);
            }, '.yui3-datatable-data td', this));
            this.handlers.push(this.datatable.delegate('mouseout', function (e) {
                this.get(CONTENTBOX).all(".description").remove();  
            }, '.yui3-datatable-data tr', this));
        },
        
        syncUI: function(){
            if(this.datatable == null || this.get("tasks") == null) return;
            this.data.length = 0;
            this.getData();
            this.datatable.addRows(this.data);
            this.checkRealization();
        },
        
        destroy: function(){
            var i;
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            } 
            this.datatable.destroy();
        }  

    }, {
        ATTRS : {
            tasks:{
                value: null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            columnTitle:{
                validator: Y.Lang.isArray
            },
            columnValue:{
                validator: Y.Lang.isArray
            },
            viewDescription:{
                value: true,
                validator: function (b){
                    return b == "false" || b == "true";
                }
            },
            viewAssignements:{                                                  //todo
                value: true,
                validator: function (b){
                    return b == "false" || b == "true";                               
                }
            }
        }
    });

    Y.namespace( "Wegas" ).PmgTasklist = Tasklist;
});