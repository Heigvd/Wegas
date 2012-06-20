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
            value = Y.Wegas.app._customCSSText || '',
            el = this.get("parent").get('panelNode').one(".wegas-tab-toolbar");

            form = new Y.inputEx.AceField({
                parentEl: cb._node,
                name: 'text',
                type: 'ace',
                height: "100%",
                language: "css",
                value: value
            });
            Y.Wegas.app._customCSSForm = form;
            
            this.newButton = new Y.Button({
                label: "Preview",
                on: {
                    click: Y.bind(function () {
                        Y.Wegas.app._customCSSStyleSheet.disable();
                        Y.Wegas.app._customCSSStyleSheet = new Y.StyleSheet(form.getValue());

                        // showFormMsg('success', 'CSS has been updated.');
                    }, this)
                }
            }).render(el);

            this.saveButton = new Y.Button({
                label: "Save",
                disabled: true
            }).render(el);
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