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
YUI.add( "wegas-pmg-gantt", function ( Y ) {
    "use strict";

    var CONTENTBOX = "contentBox", Gantt;

    Gantt = Y.Base.create( "wegas-pmg-gantt", Y.Wegas.PmgDatatable, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable], {
        
        handlers:null,
        
        //*** Private Methods ***/
        checkRealization: function(){
            var i, cb = this.get(CONTENTBOX), tasks, taskInst, realized, allRow;
            if(this.data == null
                || this.data.length == 0
                || this.get("columnValues").indexOf('realized')<=-1){
                return; 
            }
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("variables"));
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
            if(this.get("viewDescription") == "false" || e.currentTarget.get("className").indexOf("week")>-1) return;
            name = e.currentTarget.ancestor().one("*").getContent();
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("variables"));
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
                </div>\n");
        },
        
        toggleBooking: function(e){
            var node, week, taskName, booked = false;
            node = e.currentTarget;
            taskName = node.ancestor().one("*").getContent();
            week = node.get("className").substring(node.get("className").indexOf("yui3-datatable-col-week")+23)
            if(week.indexOf(" ")>-1){
                week = week.substring(0, week.indexOf(" "));   
            }
            if(node.get("className").indexOf("booked")>-1){
                node.removeClass("booked");
            } else{
                node.addClass("booked");
                booked = true;
            }
            console.log(taskName, week, booked);
        },
        
        initializer: function(){
            this.handlers = new Array();
        },   
        
        renderUI: function(){
            var i, periods, cb = this.get(CONTENTBOX);
            this.constructor.superclass.renderUI.apply(this);
            periods = this.get("periodsDesc");
            if(!periods)return;
            for(i=periods.get("minValue"); i<=periods.get("maxValue"); i++){
                this.datatable.addColumn({
                    key:'week'+i,
                    label:''+i
                });
            }
        },
        
        bindUI: function(){
            this.constructor.superclass.bindUI.apply(this);
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.handlers.push(this.datatable.delegate('click', function (e) {
                this.displayDescription(e);
            }, '.yui3-datatable-data td', this));
            this.handlers.push(this.datatable.delegate('mouseout', function (e) {
                this.get(CONTENTBOX).all(".description").remove();  
            }, '.yui3-datatable-data tr', this));
            this.handlers.push(this.datatable.delegate('click', function (e) {
                this.toggleBooking(e);
            }, '.yui3-datatable-data .week', this));
        },
        
        syncUI: function(){
            var cb = this.get(CONTENTBOX);
            this.constructor.superclass.syncUI.apply(this);
            this.checkRealization();
            cb.all(".yui3-datatable-data td").each(function (node){
                if(node.get('className').indexOf("yui3-datatable-col-week")>-1){
                    node.addClass("week");
                }
            });
        }

    }, {
        ATTRS : {
            viewDescription:{
                value: true,
                validator: function (b){
                    return b == "false" || b == "true";
                }
            },
            periods: {}, // to change to accept global expresssion or simple variable.
            periodsDesc: {
                getter: function () {
                    return Y.Wegas.VariableDescriptorFacade.rest.findById(
                        Y.Wegas.VariableDescriptorFacade.script.scopedEval( this.get( "periods" ) ) );
                }
            }
        }
    });

    Y.namespace( "Wegas" ).PmgGantt = Gantt;
});