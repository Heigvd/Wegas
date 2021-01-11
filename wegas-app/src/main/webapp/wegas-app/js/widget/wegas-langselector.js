/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
YUI.add('wegas-langselector', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', LangSelector;

    LangSelector = Y.Base.create("wegas-langselector", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        CONTENT_TEMPLATE: "<div><select class='wegas-langselector-select'></select></div>",
        bindUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.one('.wegas-langselector-select').on('change', function(e) {
                var lang = e.currentTarget.get('value'),
                    url = window.location.href;

                if (url.indexOf("&lang=") > -1) {
                    location.replace(url.replace(/&lang=[^&]*/i, "&lang=" + lang));
                } else {
                    location.replace(url + "&lang=" + lang);
                }
            });
        },
        syncUI: function() {
            var i, cb = this.get(CONTENTBOX), pageLang, selected = false,
                url = window.location.href,
                browserLang = navigator.language || navigator.userLanguage,
                targetNode = cb.one('.wegas-langselector-select'),
                items = this.get("items");

            if (items === null) {
                return;
            }

            if (url.indexOf("&lang=") > -1) {
                pageLang = url.substring(url.indexOf("&lang=") + 6);
                if (pageLang.indexOf("&") > -1) {
                    pageLang = pageLang.substring(0, pageLang.indexOf("&"));
                }
            }
            for (i = 0; i < items.length; i++) {
                if (!selected) {
                    if (pageLang && (items[i].indexOf(pageLang) > -1 || pageLang.indexOf(items[i]) > -1)) {
                        targetNode.insert("<option selected='selected'>" + items[i] + "</option>");
                        selected = true;
                    } else if ((this.items[i].indexOf(browserLang) > -1 || browserLang.indexOf(items[i]) > -1)
                        && url.indexOf("&lang=") <= -1) {
                        targetNode.insert("<option selected='selected'>" + items[i] + "</option>");
                        selected = true;
                    } else {
                        targetNode.insert("<option>" + items[i] + "</option>");
                    }
                } else {
                    targetNode.insert("<option>" + items[i] + "</option>");
                }
            }
        },
    }, {
        ATTRS: {
            items: {
                value: null,
                validator: Y.Lang.isArray
            }
        }
    });

    Y.Wegas.LangSelector = LangSelector;
});