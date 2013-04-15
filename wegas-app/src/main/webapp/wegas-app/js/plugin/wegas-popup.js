/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-popup', function(Y) {

    /**
     *  @class Show a message when the host widget is rendered, useful for welcome
     *  messages
     *  @name Y.Plugin.Popup
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Popup = function() {
        Popup.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Popup, Plugin.Base, {
        initializer: function() {
            if (this.get("content")){
                this.afterHostEvent("render", function() {
                    this.get(HOST).showMessage("info", this.get("content"));
                });
            }

            Y.Wegas.Facade.VariableDescriptor.on(this.get("event"), function(e){
                this.get(HOST).showMessage("info", e.content);
            }, this);
        }
    }, {
        NS: "Popup",
        NAME: "Popup",
        ATTRS: {
            content: {
                type: "string",
                format: "text"
            },
            event: {
                value: "popupEvent",
                type: "string"
            }
        }
    });
    Y.Plugin.Popup = Popup;

});
