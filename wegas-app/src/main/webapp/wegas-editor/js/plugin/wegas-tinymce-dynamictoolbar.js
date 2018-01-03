/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
tinymce.PluginManager.add('dynamic_toolbar', function(editor) {
    var first = true;
    function showHideToolbar() {
        if (first) {
            this.active(false);
            first = false;
        } else {
            this.active(!this.active());
        }
        var state = this.active(), i, barToHide = editor.settings.hidden_tootlbar;

        if (!barToHide) {
            barToHide = [2];
        }

        if (state) {
            for (i = 0; i < barToHide.length; i += 1) {
                editor.theme.panel._items[0]._items[barToHide[i] - 1].show();
            }
        }
        else {
            for (i = 0; i < barToHide.length; i += 1) {
                editor.theme.panel._items[0]._items[barToHide[i] - 1].hide();
            }
        }
    }

    editor.addButton('addToolbarButton', {
        image: 'wegas-editor/images/more.png',
        title: 'More options',
        onclick: showHideToolbar,
        onPostRender: showHideToolbar
    });
});