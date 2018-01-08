/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * @fileoverview New version of Form widget to replace inputex, not in use yet.
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('form-rte', function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", BOUNDINGBOX = "boundingBox",
            RichTextEditor;

    /**
     * 
     */
    RichTextEditor = Y.Base.create("form-rte", Y.Textarea, [], {
        renderUI: function() {
            RichTextEditor.superclass.renderUI.call(this);
            if (!RichTextEditor.init) {
                RichTextEditor.init = true;
                tinymce.init(this.get("tinymceCfg"));
            }
            Y.once("domready", function() {
                //tinymce.createEditor(this.el.id, {});
                tinymce.execCommand('mceAddEditor', false, this.get("inputNode").get("id"));
            }, this);
        },
        destructor: function() {
            tinymce.remove("#" + this.el.id);
        }
    }, {
        ATTRS: {
            inputNode: {
                readonly: true,
                getter: function() {
                    return this.get(CONTENTBOX).one("textarea");
                }
            },
            value: {
                setter: function(value, name, cfg) {
                    if (!cfg || !cfg.internal) {
                        this.get("inputNode").set("value", value);

                        //if (value) {
                        //    value = value.replace(
                        //            new RegExp("data-file=\"([^\"]*)\"", "gi"),
                        //            "src=\"" + Y.Wegas.Facade.File.getPath() + "$1\""
                        //            + " href=\"" +  Y.Wegas.Facade.File.getPath() + "$1\"");// @hack Place both href and src so it will work for both <a> and <img> elements
                        //}

                        var tmceI = tinyMCE.get(this.get("inputNode").get("id"));
                        if (tmceI) {
                            tmceI.setContent(value);
                        }
                    }
                    return value;
                },
                /**
                 * Get the html string
                 * @return {String} the html string
                 */
                getter: function() {
                    //var path = Y.Plugin.CRDataSource.getFullpath("")
                    tinyMCE.triggerSave();
                    return this.get("inputNode").get("value");
//                            .replace(new RegExp("((src|href)=\".*/rest/File/GameModelId/.*/read([^\"]*)\")", "gi"), "data-file=\"$3\"")// Replace absolute path with injector style path
//                            .replace(new RegExp("((src|href)=\".*/rest/GameModel/.*/File/read([^\"]*)\")", "gi"), "data-file=\"$3\"");// Replace absolute path with injector style path

                }
            },
            tinymceCfg: {
                value: {
                    plugins: [
                        "autolink autoresize link image lists code media table contextmenu paste"
                                //textcolor wordcount autosave advlist charmap print preview hr anchor pagebreak spellchecker directionality
                    ],
                    toolbar1: "bold italic bullist | link image media | code",
                    // formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect fontsizeselect styleselectspellchecker template
                    // contextmenu: "link image inserttable | cell row column deletetable | formatselect forecolor",
                    menubar: false,
                    statusbar: false,
                    relative_urls: false,
                    toolbar_items_size: 'small',
                    //file_browser_callback: this.onFileBrowserClick,
                    image_advtab: true,
                    autoresize_min_height: 35,
                    autoresize_max_height: 500,
                    content_css: [
                        // "http://yui.yahooapis.com/combo?3.17.2/build/cssreset/cssreset-min.css&amp;3.17.2/build/cssfonts/cssfonts-min.css&amp;3.17.2/build/cssgrids/cssgrids-min.css",
                        // Y.Wegas.app.get("base") + "wegas-app/css/wegas-app-min.css"
                        //Y.Wegas.app.get("base") + "wegas-editor/css/wegas-inputex-rte.css"
                    ],
                    style_formats: [{// Style formats
                            title: 'Title 1',
                            block: 'h1'
                        }, {
                            title: 'Title 2',
                            block: 'h2'
                                    // styles : {
                                    //    color : '#ff0000'
                                    // }
                        }, {
                            title: 'Title 3',
                            block: 'h3'
                        }, {
                            title: 'Normal',
                            inline: 'span'
                        }]}
            }
        }
    });
    Y.RichTextEditor = RichTextEditor;
});
