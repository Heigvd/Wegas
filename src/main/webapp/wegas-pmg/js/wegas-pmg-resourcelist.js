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

    var CONTENTBOX = "contentBox", Resourcelist;

    Resourcelist = Y.Base.create( "wegas-pmg-resourcelist", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable], {
        
        handlers:null,
    
        initializer: function(){
            this.handlers = new Array();
        },   
        
        renderUI: function(){
            
        },
        
        bindUI: function(){
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
        },
        
        syncUI: function(){

        }

    }, {
        ATTRS : {

        }
    });

    Y.namespace( "Wegas" ).PmgResourcelist = Resourcelist;
});