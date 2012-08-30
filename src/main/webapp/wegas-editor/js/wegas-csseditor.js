/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-csseditor', function (Y) {
    var CONTENTBOX = 'contentBox',
    CSSEditor;

    CSSEditor = Y.Base.create("wegas-csseditor", Y.Widget, [Y.WidgetChild,  Y.Wegas.Widget], {

        // *** Lifecycle Methods *** //

        renderUI: function () {
            this.plug( Y.Plugin.WidgetToolbar );

            var cb = this.get(CONTENTBOX),
            form,
            value = Y.Wegas.app._customCSSText || '',
            el = this.toolbar.get('header');

            form = new Y.inputEx.AceField({
                parentEl: cb._node,
                name: 'text',
                type: 'ace',
                height: "100%",
                language: "css",
                value: value
            });
            Y.Wegas.app._customCSSForm = form;

            this.previewButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-preview\"></span>Preview",
                on: {
                    click: Y.bind(function () {
                        Y.Wegas.app._customCSSStyleSheet.disable();
                        Y.Wegas.app._customCSSStyleSheet = new Y.StyleSheet(form.getValue());
                        // showFormMsg('success', 'CSS has been updated.');
                    }, this)
                }
            }).render(el);

            this.saveButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-save\"></span>Save",
                disabled: true
            }).render(el);
        },
        destructor: function () {
            this.previewButton.destroy();
            this.saveButton.destroy();
        }
    });


    Y.namespace('Wegas').CSSEditor = CSSEditor;
});