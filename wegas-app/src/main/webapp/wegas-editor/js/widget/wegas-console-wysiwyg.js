/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
*/

/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
*/

YUI.add('wegas-console-wysiwyg', function (Y) {
    var CONTENTBOX = 'contentBox',
    WysiwygConsole;

    WysiwygConsole = Y.Base.create("wegas-console-wysiwyg", Y.Wegas.Console, [Y.WidgetChild,  Y.Wegas.Widget], {

        renderUI: function () {
            this.plug(Y.Plugin.WidgetToolbar);

            var cb = this.get(CONTENTBOX);

            this.srcField = new Y.inputEx.WysiwygScript({
                parentEl: cb,
                className: "editor-animator-impactlist"
            });
            cb.append('<div class="results"></div>');
            this.srcField.el.rows = 8;
            this.srcField.el.cols = 100;

            this.runButton();
        },

        runButton: function () {
            var el = this.toolbar.get('header');

            this.runButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>Run script",
                on: {
                    click: Y.bind(function () {
                        this.executeScript({
                            "@class": "Script",
                            language: "JavaScript",
                            content: this.srcField.getValue().content
                        });
                    }, this)
                }
            }).render(el);
        }
    });

    Y.namespace('Wegas').WysiwygConsole = WysiwygConsole;
});
