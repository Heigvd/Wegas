/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

YUI.add( "wegas-injector", function ( Y ) {
    "use strict";
    var Injector,
    parser = function(element){
        var dico = {
            UserName : Y.Wegas.app.get("currentUser").name,
            PlayerName : Y.Wegas.GameFacade.rest.getCurrentPlayer().get("name"),
            TeamName : Y.Wegas.GameFacade.rest.getCurrentTeam().get("name"),
            ContentPath : Y.Wegas.app.get("dataSources").File.source + "read"
        },
        regExp = /\${([^}]*)}/g,
        html = element.getHTML();
        if(regExp.test(html)){
            element.setHTML(html.replace(regExp, function(gr0, gr1){
                return dico[gr1];
            }));
        }
    };

    Injector = Y.Base.create("wegas-injector", Y.Base, [], {

        initializer: function(){
            this.eventHandler = Y.delegate("DOMSubtreeModified", function (e){
                parser(e.currentTarget);
            }, this.get("observe"), "*");
        },

        destructor: function(){
            this.eventHandler.detach();
        }
        
    }, {
        ATTRS:{
            observe:{
                value: ".body"
            }
        }
    });

    Y.namespace("Wegas").Injector = Injector;
});
