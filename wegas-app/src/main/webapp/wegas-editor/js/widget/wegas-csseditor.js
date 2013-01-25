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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-csseditor', function (Y) {
    var CONTENTBOX = 'contentBox',
    CSSEditor;

    CSSEditor = Y.Base.create("wegas-csseditor", Y.Widget, [Y.WidgetChild,  Y.Wegas.Widget], {

        // *** Lifecycle Methods *** //

        renderUI: function () {
            this.plug(Y.Plugin.WidgetToolbar);

            var form, cb = this.get(CONTENTBOX),
            value = Y.Plugin.CSSLoader.customCSSText || '',
            el = this.toolbar.get('header');

            this.form = new Y.inputEx.AceField({
                parentEl: cb._node,
                name: 'text',
                type: 'ace',
                height: "100%",
                language: "css",
                value: value
            });

            this.previewButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-preview\"></span>Preview",
                on: {
                    click: Y.bind(function () {
                        Y.Plugin.CSSLoader.customCSSStyleSheet.disable();
                        Y.Plugin.CSSLoader.customCSSStyleSheet = new Y.StyleSheet(form.getValue());
                        // showFormMessage('success', 'CSS has been updated.');
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
            this.form.destroy();
        }
    });


    Y.namespace('Wegas').CSSEditor = CSSEditor;
});