/*
 * Wegas
 *
 * http://www.albasim.com/wegas/
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor-action', function (Y) {
    "use strict";

    /**
     *  @class OpenTabAction
     *  @module Wegas
     *  @constructor
     */
    var OpenTabAction = function () {
        OpenTabAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(OpenTabAction, {
        NS: "wegas",
        NAME: "OpenTabAction"
    });

    Y.extend(OpenTabAction, Y.Plugin.Base, {

        tab: null,

        initializer: function () {
            this.afterHostEvent("click", function() {
                Y.Wegas.TabView.findTabAndLoadWidget( this.get("host").get("label"), this.get("tabSelector"), null, this.get("subpage"));
            }, this);
        }
    }, {
        ATTRS: {
            tabSelector: {
                value: '#centerTabView'
            },
            subpage: {}
        }
    });

    Y.namespace("Plugin").OpenTabAction = OpenTabAction;

    /**
     *  @class NewAction
     *  @module Wegas
     *  @constructor
     */
    var NewAction = function () {
        NewAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(NewAction, {
        NS: "wegas",
        NAME: "NewAction"
    });

    Y.extend(NewAction, Y.Plugin.Base, {
        initializer: function () {
            this.afterHostEvent("click", function() {
                Y.Wegas.editor.showAddForm(Y.Wegas.persistence.Entity.revive({
                    "@class": this.get("targetClass")
                }), null, Y.Wegas.app.dataSources[this.get("targetClass")]);
            }, this);
        }
    }, {
        ATTRS: {
            targetClass: { }
        }
    });

    Y.namespace("Plugin").NewAction = NewAction;

    /**
     *  @class NewAction
     *  @module Wegas
     *  @constructor
     */
    var ResetAction = function () {
        ResetAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(ResetAction, {
        NS: "wegas",
        NAME: "ResetAction"
    });

    Y.extend(ResetAction, Y.Plugin.Base, {
        initializer: function () {
            this.afterHostEvent("click", function() {

                Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                    request: '/reset'
                });
            }, this);
        }
    }, {
        ATTRS: {
            targetClass: { }
        }
    });

    Y.namespace("Plugin").ResetAction = ResetAction;
});


