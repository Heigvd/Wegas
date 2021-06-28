/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview add wegas-dialogue-folder widget, exposed on Y.Wegas.DialogueFolder
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global YUI*/
YUI.add('wegas-dialogue-folder', function(Y) {
    'use strict';
    /**
     * EntityChooser for DialogueDescriptor folder, generating a SimpleDialogue
     * @constructor
     * @extends Y.Wegas.EntityChooser
     */
    var DialogueFolder = Y.Base.create(
        'wegas-dialogue-folder',
        Y.Wegas.EntityChooser,
        [],
        {
            getEditorLabel: function() {
                var variable = this.get('variable.evaluated');
                if (variable && variable.getEditorLabel) {
                    return '' + variable.getEditorLabel();
                }
                return DialogueFolder.EDITORNAME;
            }
        },
        {
            EDITORNAME: 'Dialogue Folder',
            ATTRS: {
                history: {
                    value: false,
                    type: 'boolean',
                    view: { label: 'History' }
                },
                widget: {
                    transient: true,
                    valueFn: function() {
                        var type = 'SimpleDialogue';
                        if (this.get('history')) {
                            type = 'HistoryDialog';
                        }
                        return {
                            type: type
                        };
                    }
                },
                widgetAttr: {
                    transient: true,
                    value: 'dialogueVariable',
                    type: 'string'
                },
                classFilter: {
                    transient: true,
                    value: ['DialogueDescriptor']
                }
            }
        }
    );
    Y.Wegas.DialogueFolder = DialogueFolder;
});
