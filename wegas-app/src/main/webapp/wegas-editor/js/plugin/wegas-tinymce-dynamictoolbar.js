/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
tinymce.PluginManager.add('dynamic_toolbar', function(editor) {
    var first = true;
    function showHideToolbar() {
        var toolbar = editor.theme.panel.find('toolbar');
        var resizeY = 0;
        var fullHeight = 26;
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
                fullHeight += 26;
            }
        } else {
            for (i = 0; i < barToHide.length; i += 1) {
                toolbar[barToHide[i] - 1].hide();
                resizeY -= 26;
            }
        }
        if (editor.settings.inline) {
            if (editor.theme.panel.resizeBy) {
                editor.theme.panel.resizeBy(0, resizeY);
                editor.theme.panel.moveBy(0, -resizeY);
            } else {
                editor.theme.panel.getEl().style.height = fullHeight + "px";
                editor.theme.panel.getEl().firstChild.style.height = fullHeight + "px";
            }
        }
    }

    editor.addButton('addToolbarButton', {
        icon: ' fa fa-angle-double-down',
        title: 'More options',
        onclick: showHideToolbar,
        onPostRender: showHideToolbar
    });
});
