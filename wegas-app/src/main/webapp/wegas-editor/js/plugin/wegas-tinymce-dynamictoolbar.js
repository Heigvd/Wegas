/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
tinymce.PluginManager.add('dynamic_toolbar', function(editor) {
    var first = true;
    function showHideToolbar() {
        var toolbar = editor.theme.panel.find('toolbar');
        var resizeY = 0;
        if (first) {
            this.active(false);
            first = false;
        } else {
            this.active(!this.active());
        }
        var state = this.active(),
            i,
            barToHide = editor.settings.hidden_tootlbar;

        if (!barToHide) {
            barToHide = [2];
        }
        if (state) {
            for (i = 0; i < barToHide.length; i += 1) {
                toolbar[barToHide[i] - 1].show();
                resizeY += 26;
            }
        } else {
            for (i = 0; i < barToHide.length; i += 1) {
                toolbar[barToHide[i] - 1].hide();
                resizeY -= 26;
            }
        }
        if (editor.settings.inline) {
            editor.theme.panel.resizeBy(0, resizeY);
            editor.theme.panel.moveRel(editor.getBody(), 'tl-bl');
        }
    }

    editor.addButton('addToolbarButton', {
        image: 'wegas-editor/images/more.png',
        title: 'More options',
        onclick: showHideToolbar,
        onPostRender: showHideToolbar
    });
});
