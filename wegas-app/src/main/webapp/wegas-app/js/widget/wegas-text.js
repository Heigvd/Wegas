/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-text', function(Y) {
    'use strict';
    var CONTENTBOX = 'contentBox', Text;

    /**
     * @name Y.Wegas.Text
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class class to display simple String
     * @constructor
     * @description  Display a string (given as ATTRS) in content box
     */
    Text = Y.Base.create(
        'wegas-text',
        Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable],
        {
            /** @lends Y.Wegas.Text# */

            /**
             * @function
             * @private
             * @description set the "content" ATTRS (which set the contentbox)
             */
            syncUI: function() {
                //this.set("content", this.get("content"));
                this.cleanMarkup();
                this.get(CONTENTBOX).setContent(
                    Y.Template.Micro.compile(I18n.t(this.get('content'), {fallback: ''}))());
            },
            cleanMarkup: function() {
                this.get(CONTENTBOX).all('video').each(function(e) {
                    var video = e.getDOMNode();
                    video.pause();
                    video.src = '';
                    video.load();
                });
            },
            setContent: function(content) {
                this.set("content", content);
                this.syncUI();
            },
            getEditorLabel: function() {
                return this.get(CONTENTBOX).get('text');
            },
            destructor: function() {
                this.cleanMarkup();
            }
        },
        {
            /** @lends Y.Wegas.Text */
            EDITORNAME: 'Text',
            /**
             * @field
             * @static
             * @description
             * <p><strong>Attributes</strong></p>
             * <ul>
             *    <li>content: the string to display, the content of this widget's
             *     contentbox. Format html.</li>
             * </ul>
             */
            ATTRS: {
                /**
                 * The string to display, the content of this widget's contentbox
                 * Format html.
                 */
                content: Y.Wegas.Helper.getTranslationAttr({
                    label: "Content",
                    type: "html"
                })
                    /*content: {
                     type: 'string',
                     view: {
                     type: 'html',
                     label: 'Content'
                     }
                     }*/
            }
        }
    );
    Y.Wegas.Text = Text;


    var String = Y.Base.create('wegas-string', Y.Wegas.Text, [], {}, {
        EDITORNAME: 'String',
        ATTRS: {
            content: Y.Wegas.Helper.getTranslationAttr({
                label: "Content",
                type: "string"
            })
        }
    });
    Y.Wegas.String = String;
});
