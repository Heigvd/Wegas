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
YUI.add("wegas-inputex-rte", function (Y) {
    "use strict";

    var inputEx = Y.inputEx;

    /**
     * Wrapper for the Rich Text Editor from YUI
     * @class inputEx.RTEField
     * @extends inputEx.Field
     * @constructor
     * @param {Object} options
     */
    inputEx.RTEField = function (options) {
        inputEx.RTEField.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.RTEField, inputEx.Textarea, {

        destroy: function () {
            inputEx.RTEField.superclass.destroy.call(this);
        },

        /**
         * Set the default values of the options
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function (options) {
            inputEx.RTEField.superclass.setOptions.call(this, options);

            this.options.opts = options.opts || {};
            this.options.typeInvite = null;
        },

        /**
	 * Render the field using the YUI Editor widget
	 */
        renderComponent: function () {
            inputEx.RTEField.superclass.renderComponent.call(this);
            if (!inputEx.RTEField.init) {
                inputEx.RTEField.init = true;
                tinyMCE.init({
                    // General options
                    mode : "none",                                              // "none", "textares"
                    theme : "advanced",                                         // "simple", "advanced"

                    // autolink, lists,spellchecker,pagebreak,style,
                    // layer,table,save,advhr,advimage,advlink,emotions,iespell,
                    // inlinepopups,insertdatetime,preview,media,searchreplace,
                    // print,contextmenu,paste,directionality,fullscreen,noneditable,
                    // visualchars,nonbreaking,xhtmlxtras,template,wordcount,advlist, autosave,visualblocks
                    // 
                    //plugins : "autolink,autoresize,lists,spellchecker,style,layer,table," +
                    //"advimage,advlink,emotions,iespell,inlinepopups,media," +
                    //"searchreplace,contextmenu,fullscreen,visualchars",

                    plugins : "autolink,autoresize,style,table," +
                    "advimage,advlink,iespell,inlinepopups,media," +
                    "contextmenu",

                    // Theme options
                    theme_advanced_buttons1 : "bold,italic,styleselect,link,image,media,|,cleanup,code",

                    // Theme options ( full )
                    //                    theme_advanced_buttons1 : "bold,italic,underline,|,justifyleft,justifycenter,justifyright,justifyfull,styleselect,|,bullist,numlist,|,outdent,indent,|,undo,redo,|,link,unlink,image,media,charmap,emotions,iespell,|,forecolor,backcolor",
                    //                    theme_advanced_buttons2 : "tablecontrols,|,hr,removeformat,cleanup,styleprops,iespell,spellchecker,visualaid,|,insertlayer,moveforward,movebackward,absolute,|,search,replace,|,fullscreen,code",

                    theme_advanced_toolbar_location : "top",
                    theme_advanced_toolbar_align : "left",
                    theme_advanced_statusbar_location : "none",                 // top, bottom, none
                    theme_advanced_resizing : false,
                    relative_urls : false,

                    file_browser_callback: function (field_name, url, type, win) {

                        if (!inputEx.RTEField.filePanel) {
                            inputEx.RTEField.filePanel = new Y.Panel({
                                headerContent: 'Choose a file from library',
                                bodyContent: '',
                                width: 600,
                                height: Y.DOM.winHeight() - 150,
                                zIndex: 303000,
                                modal: true,
                                render: true,
                                centered: true
                            });

                            inputEx.RTEField.filePanel.explorer = new Y.Wegas.FileExplorer().render(inputEx.RTEField.filePanel.getStdModNode(Y.WidgetStdMod.BODY));

                            inputEx.RTEField.filePanel.explorer.on("*:fileSelected", function (e, path) {
                                e.stopImmediatePropagation();
                                e.preventDefault();
                                inputEx.RTEField.filePanel.hide();

                                var win = inputEx.RTEField.filePanel.win,
                                field_name = inputEx.RTEField.filePanel.field_name,
                                targetInput = win.document.getElementById(field_name);
                                targetInput.value = Y.Plugin.CRDataSource.getFullpath(path);  // update the input field

                                if (typeof (win.ImageDialog) !== "undefined") { // are we an image browser
                                    if (win.ImageDialog.getImageData) {         // we are, so update image dimensions...
                                        win.ImageDialog.getImageData();
                                    }

                                    if (win.ImageDialog.showPreviewImage) {     // ... and preview if necessary
                                        win.ImageDialog.showPreviewImage(Y.Plugin.CRDataSource.getFullpath(path));
                                    }
                                }
                                if (win.Media) {                                // If in an editor window
                                    win.Media.formToData("src");                // update the data
                                }
                            });
                        }

                        inputEx.RTEField.filePanel.show();
                        inputEx.RTEField.filePanel.win = win;
                        inputEx.RTEField.filePanel.field_name = field_name;
                        return false;
                    },

                    //content_css : "css/content.css",                              // Example content CSS (should be your site CSS)

                    // Drop lists for link/image/media/template dialogs
                    //                    template_external_list_url : "lists/template_list.js",
                    //                    external_link_list_url : "lists/link_list.js",
                    //                    external_image_list_url : "lists/image_list.js",
                    //                    media_external_list_url : "lists/media_list.js",

                    // Style formats
                    style_formats : [{
                        title : 'Title 1',
                        block : 'h1'
                    },{
                        title : 'Title 2',
                        block : 'h2'
                    //                    styles : {
                    //                        color : '#ff0000'
                    //                    }
                    },{
                        title : 'Title 3',
                        block : 'h3'
                    },{
                        title : 'Normal',
                        inline : 'span'
                    }
                    //{
                    //    title : 'Bold text',
                    //    inline : 'b'
                    //},{
                    //    title : 'Red text',
                    //    inline : 'span',
                    //    styles : {
                    //        color : '#ff0000'
                    //    }
                    //},{
                    //    title : 'Red header',
                    //    block : 'h1',
                    //    styles : {
                    //        color : '#ff0000'
                    //    }
                    //},{
                    //    title : 'Example 1',
                    //    inline : 'span',
                    //    classes : 'example1'
                    //},{
                    //    title : 'Example 2',
                    //    inline : 'span',
                    //    classes : 'example2'
                    //},{
                    //    title : 'Table styles'
                    //},{
                    //    title : 'Table row 1',
                    //    selector : 'tr',
                    //    classes : 'tablerow1'
                    //}

                    ]

                // Replace values for the template plugin
                //template_replace_values : {
                //    username : "Some User",
                //    staffid : "991234"
                //}
                });
            }
            Y.once("domready", function () {
                tinyMCE.execCommand('mceAddControl', false, this.el.id);
            }, this);
        },

        /**
         * Set the html content
         * @param {String} value The html string
         * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the 'updated' event or not (default is true, pass false to NOT send the event)
         */
        setValue: function (value) {
            inputEx.RTEField.superclass.setValue.apply(this, arguments);

            var tmceI = tinyMCE.get(this.el.id);
            if (tmceI) {
                tmceI.setContent(value);
            }
        },

        /**
         * Get the html string
         * @return {String} the html string
         */
        getValue: function () {
            tinyMCE.triggerSave();
            return inputEx.RTEField.superclass.getValue.call(this);
        },

        /**
         * @static
         */
        filePanel: null
    });


    inputEx.registerType("html", inputEx.RTEField, []);                        // Register this class as "html" type

});
