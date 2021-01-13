/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-googletranslate', function(Y) {
    "use strict";

    /**
     *  @name Y.Wegas.GoogleTranslate
     *  @class
     *  @extend Y.Widget
     *  @augments Y.Wegas.Widget
     *  @augemtns Y.Wegas.Editable
     *  @constructor
     */
    var GoogleTranslate = Y.Base.create("wegas-translate", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable], {
        renderUI: function() {
            if (Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.googleTranslateId")) {
                window.googleTranslateElementInit = Y.bind(function() {            // Js element
                    if (this.loaded)
                        return;
                    this.loaded = true;
                    new google.translate.TranslateElement({
                        autoDisplay: false,
                        multilanguagePage: true,
                        //pageLanguage: 'en',
                        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
                            //layout: google.translate.TranslateElement.FloatPosition.TOP_RIGHT
                            //layout: google.translate.TranslateElement.FloatPosition.BOTTOM_RIGHT
                    }, this.get("contentBox").generateID());
                }, this);

                Y.use("googletranslate");
            }

            //var bb = this.get("host").get("boundingBox"),                         // Sectional update
            //cb = this.get("host").get("contentBox");
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
    Y.Wegas.GoogleTranslate = GoogleTranslate;

});
