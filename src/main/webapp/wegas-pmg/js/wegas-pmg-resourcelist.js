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
YUI.add( "wegas-pmg-resourcelist", function ( Y ) {
    "use strict";

    var CONTENTBOX = "contentBox", ResourceList;

    ResourceList = Y.Base.create( "wegas-pmg-resourcelist", Y.Wegas.PmgGantt, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable], {
        
        handlers:null,
        menu:null,
        
        addButtonsAssignement:function(){
            var cb = this.get(CONTENTBOX);
            cb.all(".yui3-datatable-data tr .yui3-datatable-col-assignements").each(function(node){
                node.append("<span class='assignement'></span>");
                node.addClass('noDescription');
            });
        },
        
        makeMenu:function(e){
            this.menu.removeAll();                                      // Populate the menu
            this.menu.add([{
                type: "Button",
                label: "Imposer un mandat"
            }]);
            this.menu.attachTo(e.target);
        },
        
        showTasks:function(e){
            console.log(e.currentTarget);
            console.log(this.menu.getAttrs());
        },
    
        initializer: function(){
            this.handlers = new Array();
            this.menu = new Y.Wegas.Menu();
        },   
        
        renderUI: function(){
            var i, columns;
            ResourceList.superclass.renderUI.apply(this);
            columns = this.datatable.head.columns[0];
            for(i=0; i<columns.length; i++){
                if(columns[i].key == 'week1'){
                    break;
                }
            }
            this.datatable.addColumn({
                key:'assignements',
                label:"Assignements"
            }, i);
        },
        
        bindUI: function(){
            var cb = this.get(CONTENTBOX)
            ResourceList.superclass.bindUI.apply(this);
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.handlers.push(this.datatable.delegate('click', function (e) {
                this.showTasks(e);
                this.makeMenu(e);
            }, '.yui3-datatable-data .assignement', this));
//            this.handlers.push(cb.delegate("click", function (e) {
//                this.makeMenu(e);
//            }, ".assignement", this));
        },
        
        syncUI: function(){
            ResourceList.superclass.syncUI.apply(this);
            this.addButtonsAssignement();
        },
        
        destructor: function(){
            var i;
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            } 
            this.menu.destroy();
        }  

    }, {
        ATTRS : {

    }
    });

    Y.namespace( "Wegas" ).PmgResourcelist = ResourceList;
});