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
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */


YUI.add('wegas-editor', function(Y) {
    "use strict";

    /**
    * @name Y.Wegas.Editor
    * @extends Y.Wegas.App
    * @class  Base class for wegas, handle initialisation of editor
    * @constructor
    * @param Object cfg
    * @description create a new wegas-editor
    */
    var Editor = Y.Base.create("wegas-editor", Y.Wegas.App, [], {

        /** 
         * @methodOf Y.Wegas.Editor#
         * @private
         * @name initializer
         * @description Lifecycle methods
         */
        initializer: function () {
            Y.Wegas.editor = this;
        },
        destructor : function () {
        }

        // *** Private methods *** //

    }, {
        /**
         * @memberOf Y.Wegas.Editor#
         * @name attrributes
         * @description
         * <p><strong>Method</strong></p>
         * <ul>
         *    <li>editorMenus : 
         *        This field is used to globally override Entities edition menus.
         *        Use the target class name as the key.
         *    </li>
         *    <li>editorForms : 
         *        This field is used to globally override Entities edition forms.
         *        Use the target class name as the key.
         *    </li>
         * </ul>
         */
        ATTRS: {
            /**
            * This field is used to globally override Entities edition menus.
            * Use the target class name as the key.
            */
            editorMenus: {
                value: {}
            },
            /**
            * This field is used to globally override Entities edition forms.
            * Use the target class name as the key.
            */
            editorForms: {
                value: {}
            }

        }
    });

    Y.namespace('Wegas').Editor = Editor;

});