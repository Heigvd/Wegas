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


YUI.add('wegas-editor', function(Y) {
    "use strict";

    var Editor = Y.Base.create("wegas-editor", Y.Wegas.App, [], {

        // *** Lifecycle Methods *** //

        initializer: function () {
            Y.Wegas.editor = this;
        },
        destructor : function () {
        }

        // *** Private methods *** //

    }, {
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