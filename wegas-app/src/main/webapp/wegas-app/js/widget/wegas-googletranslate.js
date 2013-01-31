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

YUI.add('wegas-googletranslate', function (Y) {
    "use strict";

    /**
     *  @class NewEntityAction
     *  @module Wegas
     *  @constructor
     */
    var GoogleTranslate = Y.Base.create("wegas-translate", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable], {


        renderUI: function () {
//            new google.translate.TranslateElement({
//                pageLanguage: 'en',
//                //multilanguagePage: true
//                //autoDisplay: false
//                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
//            //layout: google.translate.TranslateElement.FloatPosition.TOP_RIGHT
//            //layout: google.translate.TranslateElement.FloatPosition.BOTTOM_RIGHT
//            }, this.get("contentBox").generateId());

        //body{top: 0px !important;}
        //.goog-te-banner-frame,.goog-te-balloon-frame{display:none !important;}
        //font{background: transparent !important; color: inherit !important;}

        //var bb = this.get("host").get("boundingBox"),
        //cb = this.get("host").get("contentBox");
        //
        ////cb.addClass("wegas-translate");
        //bb.append("<div class=\"wegas-translate-control\" lang=\"en\"></div>"
        //+"<div class=\"wegas-translate\" >Coucou</div>");
        //new google.translate.SectionalElement({
        //    sectionalNodeClassName: 'wegas-translate',
        //    controlNodeClassName: 'wegas-translate-control',
        //    background: 'transparent'
        //}, 'google_sectional_element');
        }
    });

    Y.namespace("Wegas").GoogleTranslate = GoogleTranslate;
});
