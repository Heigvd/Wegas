/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @DEPRECATED Only used in old version of the programming game.
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-popup', function(Y) {

    /**
     *  @class Show a message when the host widget is rendered, useful for welcome messages
     *  messages
     *  @name Y.Plugin.Popup
     *  @extends Y.Plugin.Base
     *  @constructor
     *
     *  @deprecated Use Y.Wegas.Panel instead
     */
    var Popup = Y.Base.create("wegas-popup", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            this.afterHostEvent("render", function() {
                this.get("host").showMessage("info", this.get("content"));
            });
        }
    }, {
        NS: "Popup",
        NAME: "Popup",
        ATTRS: {
            content: {
                type: "string",
                format: "html",
                _inputex: {
                    label: "Welcome message"
                }
            }
        }
    });
    Y.Plugin.Popup = Popup;
});
