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
    var Injector;
    Injector = Y.Base.create("wegas-injector", Y.Base, [], {
        initializer: function(){
            this.eventHandler = Y.delegate("DOMSubtreeModified", function(e){

                if(this._modified){
                    return;
                }
                this._modified = true;
                Y.later(20, this, function(){
                    //var HTML = Y.one("#maindisplayarea").getHTML().replace(/\${ContentPath}/g, "hahaha");
                    this._modified = false;
                    //Y.one("#maindisplayarea").setHTML(HTML);
                });


            }, "#maindisplayarea", "*", this);
        }
    });
    Y.namespace("Wegas").Injector = Injector;
});
