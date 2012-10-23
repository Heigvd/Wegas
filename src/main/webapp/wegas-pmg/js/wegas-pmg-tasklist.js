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

    Tasklist = Y.Base.create( "wegas-pmg-tasklist", Y.Wegas.PmgDatatable, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable], {
        
        handlers:null,
        
        //*** Private Methods ***/
        checkRealization: function(){
            var i, cb = this.get(CONTENTBOX), tasks, taskDesc, taskInst, realized, allRow;
            if(this.data == null
                || this.data.length == 0
                || this.get("columnValues").indexOf('realized')<=-1){
                return; 
            }
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("variables"));
            allRow = cb.all(".yui3-datatable-data tr");
            allRow.removeClass("notstarted").removeClass("started").removeClass("completed");
            allRow.each(function (node){
                for(i=0; i<tasks.get('items').length; i++){
                    taskDesc = tasks.get('items')[i];
                    taskInst = taskDesc.getInstance();
                    realized = (taskInst.get('properties').realized)?taskInst.get('properties').realized:null;
                    if(realized){
                        if(node.one("*").getContent() == taskDesc.get('name')){
                            if(realized >= 100){
                                node.addClass("completed");
                            } else if(realized > 0){
                                node.addClass("started");
                            } else{
                                node.addClass("notstarted");
                            }
                            break;
                        }
                    }
                }
            });
        },
        
        displayDescription: function(e){
            var i, name, tasks, node, divDesc, taskDesc, description;
            node = e.currentTarget;
            if(this.get("viewDescription") == "false"
                || node.one(".description")
                || node.get("className").indexOf("cell-gantt")>-1) return;
            name = node.ancestor().one("*").getContent();
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("variables"));
            if(!name || !tasks) return;
            for (i = 0; i < tasks.get('items').length; i++) {
                taskDesc = tasks.get('items')[i];
                if(taskDesc.get('name') === name){
                    description = taskDesc.get("description");
                    break;
                } 
            }
            divDesc = Y.Node.create("<div class='description'></div>");
            divDesc.append("<p class='task_name'>"+name+"</p>").append("<p class='content'>"+description+"</p>");
            node.append(divDesc);
        },
        
        removeDescription: function(e){
            var disappearAnim, node;
            node = this.get(CONTENTBOX).one('.description');
            if(!node) return;
            disappearAnim = new Y.Anim({
                node: node,
                to: {
                    opacity: 0
                },
                duration: 0.2
            });
            disappearAnim.run();
            disappearAnim.on('end', function(){
                node.remove();
            });
        },
        
        initializer: function(){
            this.handlers = new Array();
        },   
        
        renderUI: function(){
            Tasklist.superclass.renderUI.apply(this);
        },
        
        bindUI: function(){
            Tasklist.superclass.bindUI.apply(this);
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.handlers.push(this.datatable.after('sort', this.syncUI, this));
            this.handlers.push(this.datatable.delegate('click', function (e) {
                this.displayDescription(e);
            }, '.yui3-datatable-data td', this));
            this.handlers.push(this.datatable.delegate('mouseout', function (e) {
                this.removeDescription(e);  
            }, '.yui3-datatable-data tr', this));
        },
        
        syncUI: function(){
            Tasklist.superclass.syncUI.apply(this);
            this.checkRealization();
        },
        
        destructor: function(){
            var i;
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            } 
        }  

    }, {
        ATTRS : {
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