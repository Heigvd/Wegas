/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-csseditor', function (Y) {
    var CONTENTBOX = 'contentBox',
        CSSEditor;

    CSSEditor = Y.Base.create("wegas-csseditor", Y.Widget, [Y.WidgetChild,  Y.Wegas.Widget], {

        destroyer: function () {
        },

        renderUI: function () {

            var cb = this.get(CONTENTBOX),
                form,
                value = Y.Wegas.app._customCSSText || '';


           /* function showFormMsg(cssClass, msg) {															// Form msgs logic
                var msgNode = element.one('.yui3-alba-formmsg');
                if (lastCssClass) msgNode.removeClass('yui3-alba-formmsg-'+lastCssClass);
                msgNode.addClass('yui3-alba-formmsg-'+cssClass);
                msgNode.setStyle('display', 'block');
                msgNode.one('.yui3-alba-formmsg-content').setContent(msg);
                lastCssClass = cssClass;
            }*/

            form = new Y.inputEx.Form({
                parentEl: cb._node,
                fields: [{
                    name: 'text',
                    type: 'ace',
                    height: "100%",
                    language: "css",
                    value: value
                }],
                buttons: [{
                    type: 'submit',
                    value: 'Preview',
                    onClick: function (e) {																	// e === clickEvent (inputEx.widget.Button custom event)
                        //FIXME find a way to destroy the style sheet
                        Y.Wegas.app._customCSSStyleSheet.disable();
                        Y.Wegas.app._customCSSStyleSheet = new Y.StyleSheet(form.getValue().text);

                        //showFormMsg('success', 'CSS has been updated.');
                        return false;																		// stop clickEvent, to prevent form submitting
                    }
                },{
                    type: 'submit',
                    value: 'Save',
                    onClick: function (e) {
                        alert("Not yet implemented.");
                        return false;																		// stop clickEvent, to prevent form submitting
                    }
                }]
            });
            Y.Wegas.app._customCSSForm = form;
        },
        bindUI: function () {
        },
        syncUI: function () {
        }
    }, {
        ATTRS : {
            classTxt: {
                value: "CSSEditor"
            },
            type: {
                value: "CSSEditor"
            }
        }
    });


    Y.namespace('Wegas').CSSEditor = CSSEditor;
});