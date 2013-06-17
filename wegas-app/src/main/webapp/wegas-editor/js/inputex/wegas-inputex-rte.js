/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-rte", function (Y) {
    "use strict";

    var inputEx = Y.inputEx, RTEField;

    /**
     * @class Wrapper for the Rich Text Editor from YUI
     * @name Y.inputEx.Wegas.RTEField
     * @extends Y.inputEx.Textarea
     * @constructor
     * @param {Object} options
     */
    RTEField = function (options) {
        RTEField.superclass.constructor.call(this, options);
    };

    Y.extend(RTEField, inputEx.Textarea, {

        destroy: function () {
            RTEField.superclass.destroy.call(this);
        },

        /**
         * Set the default values of the options
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function (options) {
            RTEField.superclass.setOptions.call(this, options);

            this.options.opts = options.opts || {};
            this.options.typeInvite = null;
        },

        /**
	 * Render the field using the YUI Editor widget
	 */
        renderComponent: function () {
            RTEField.superclass.renderComponent.call(this);
            if (!RTEField.init) {
                RTEField.init = true;
                tinyMCE.init({
                    content_css : ["http://yui.yahooapis.com/combo?3.10.3/build/cssfonts/fonts-min.css&amp;3.10.3/build/cssreset/reset-min.css&amp;3.7.2/build/cssgrids/grids-min.css&amp;3.7.2/build/widget-base/assets/skins/sam/widget-base.css", "../../wegas-app/css/wegas-app.css"],
                    mode : "none",                                              // "none", "textares"
                    theme : "advanced",                                         // "simple", "advanced"
                    plugins: "autolink,autoresize,style,table," +
                    "advimage,advlink,iespell,inlinepopups,media," +
                    "contextmenu",
                    theme_advanced_buttons1 : "bold,italic,styleselect,link,image,media,|,cleanup,code",
                    theme_advanced_toolbar_location : "top",
                    theme_advanced_toolbar_align : "left",
                    theme_advanced_statusbar_location : "none",                 // top, bottom, none
                    theme_advanced_resizing : false,
                    relative_urls : false,
                    file_browser_callback: this.onFileBrowserClick,
                    style_formats : [{                                          // Style formats
                        title : 'Title 1',
                        block : 'h1'
                    }, {
                        title : 'Title 2',
                        block : 'h2'
                    // styles : {
                    //    color : '#ff0000'
                    // }
                    }, {
                        title : 'Title 3',
                        block : 'h3'
                    }, {
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

                //content_css : "css/content.css",                              // Example content CSS (should be your site CSS)
                // template_external_list_url : "lists/template_list.js",   // Drop lists for link/image/media/template dialogs
                // external_link_list_url : "lists/link_list.js",
                // external_image_list_url : "lists/image_list.js",
                // media_external_list_url : "lists/media_list.js",
                // Replace values for the template plugin
                // template_replace_values : {
                //    username : "Some User",
                //    staffid : "991234"
                // }
                // plugins: autolink, lists,spellchecker,pagebreak,style,
                // layer,table,save,advhr,advimage,advlink,emotions,iespell,
                // inlinepopups,insertdatetime,preview,media,searchreplace,
                // print,contextmenu,paste,directionality,fullscreen,noneditable,
                // visualchars,nonbreaking,xhtmlxtras,template,wordcount,advlist, autosave,visualblocks
                // Theme options ( full )
                // theme_advanced_buttons1 : "bold,italic,underline,|,justifyleft,justifycenter,justifyright,justifyfull,styleselect,|,bullist,numlist,|,outdent,indent,|,undo,redo,|,link,unlink,image,media,charmap,emotions,iespell,|,forecolor,backcolor",
                // theme_advanced_buttons2 : "tablecontrols,|,hr,removeformat,cleanup,styleprops,iespell,spellchecker,visualaid,|,insertlayer,moveforward,movebackward,absolute,|,search,replace,|,fullscreen,code",
                });
            }
            Y.once("domready", function () {
                tinyMCE.execCommand('mceAddControl', false, this.el.id);
            }, this);
        },

        onFileBrowserClick: function (field_name, url, type, win) {
            if (!RTEField.filePanel) {
                RTEField.filePanel = new Y.Panel({
                    headerContent: 'Choose a file from library',
                    bodyContent: '',
                    width: 600,
                    height: Y.DOM.winHeight() - 150,
                    zIndex: 303000,
                    modal: true,
                    render: true,
                    centered: true
                });

                RTEField.filePanel.explorer = new Y.Wegas.FileExplorer().
                render(RTEField.filePanel.getStdModNode(Y.WidgetStdMod.BODY));

                RTEField.filePanel.explorer.on("*:fileSelected", function (e, path) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    RTEField.filePanel.hide();

                    var win = RTEField.filePanel.win,
                    field_name = RTEField.filePanel.field_name,
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

            RTEField.filePanel.show();
            RTEField.filePanel.win = win;
            RTEField.filePanel.field_name = field_name;
            return false;
        },

        /**
         * Set the html content
         * @param {String} value The html string
         * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the 'updated' event or not (default is true, pass false to NOT send the event)
         */
        setValue: function (value) {
            var tmceI = tinyMCE.get(this.el.id);

            if (value) {
                value = value.replace(
                    new RegExp("data-file=\"([^\"]*)\"", "gi"), "src=\"" + Y.Plugin.CRDataSource.getFullpath("") + "$1\"");
            }
            RTEField.superclass.setValue.call(this, value);

            if (tmceI) {
                tmceI.setContent(value);
            }
        },

        /**
         * Get the html string
         * @return {String} the html string
         */
        getValue: function () {
            //var path = Y.Plugin.CRDataSource.getFullpath("")
            var reg = new RegExp("((src|href)=\".*/rest/File/GameModelId/.*/read([^\"]*)\")", "gi"); // Replace absolute path with injector style path
            tinyMCE.triggerSave();
            //return RTEField.superclass.getValue.call(this).replace(reg, "data-file=\"$3\" $1");
            return RTEField.superclass.getValue.call(this).replace(reg, "data-file=\"$3\"");
        },

        /**
         * @static
         */
        filePanel: null
    });

    inputEx.registerType("html", RTEField, []);                                 // Register this class as "html" type
});
