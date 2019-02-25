/* global YUI */

YUI.add("wegas-mbenefits-confirm", function(Y) {
    "use strict";

    /**
     *  @class
     *  @name Y.Plugin.MBConfirmExecuteScriptAction
     *  @extends Y.Plugin.ConfirmExecuteScriptAction
     *  @constructor
     */
    var MBConfirmExecuteScriptAction = Y.Base.create('MBConfirmExecuteScriptAction', Y.Plugin.ConfirmExecuteScriptAction, [],
        {
            _getText : function(attr){
                var theVar = this.get(attr + ".evaluated");
                if (theVar instanceof Y.Wegas.persistence.ListDescriptor){
                    return theVar.getLabel();
                } else {
                    return theVar.getInstance().getValue();
                }
             },
            getMessage: function() {
                if (this.get("time") && this.get("time.evaluated").getValue() > 0){
                    return this._getText("stillTimeMessage");
                } else {
                    return this._getText("message");
                }
            },
            execute: function() {
                if (!this.get("host").get('disabled')) {
                    Y.Wegas.Panel.confirm(this.getMessage(),
                        Y.bind(Y.Plugin.ConfirmExecuteScriptAction.superclass.execute, this));
                }
            }
        },
        {
            NS: 'ExecuteScriptAction',
            ATTRS: {
                time: {
                    type: "object",
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: "Time left",
                        classFilter: ["NumberDescriptor"]
                    }
                },
                message: {
                    type: "object",
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: "Message no time left",
                        classFilter: [
                            "TextDescriptor", "StringDescriptor", // use the value
                            "ListDescriptor" // use the label
                        ]
                    }
                },
                stillTimeMessage: {
                    type: "object",
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: "Message still time left",
                        classFilter: [
                            "TextDescriptor", "StringDescriptor", // use the value
                            "ListDescriptor" // use the label
                        ]
                    }
                }
            }
        }
    );
    Y.Plugin.MBConfirmExecuteScriptAction = MBConfirmExecuteScriptAction;
});
