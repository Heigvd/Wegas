/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


/* global I18n */

/**
 * @fileOverview GameModel langueages management widgets
 * @author Maxence
 */
YUI.add('wegas-gamemodel-i18n', function(Y) {
    "use strict";
    var LanguagesManager;
    LanguagesManager = Y.Base.create("wegas-i18n-manager", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        initializer: function() {
            this.handlers = {};
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                if (this.handlers.hasOwnProperty(k)) {
                    this.handlers[k].detach();
                }
            }
        },
        renderUI: function() {
            this.mainVList = new Y.Wegas.FlexList({direction: 'vertical', editable: false});
            this.title = new Y.Wegas.Text({content: I18n.t("i18n.manager.title")});
            this.languages = new Y.Wegas.FlexList({direction: 'horizontal'});
            this.layout = new Y.Wegas.FlexList({direction: 'horizontal'});

            this.treeview = new Y.Wegas.Text({content: "Treeview"});
            this.editor = new Y.Wegas.Text({content: "editor"});

            this.layout.add(this.treeview);
            this.layout.add(this.editor);

            this.mainVList.add(this.title);
            this.mainVList.add(this.languages);
            this.mainVList.add(this.layout);


            this.add(this.mainVList);
        },
        syncUI: function() {
            var gm = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                languages = gm.get("languages"),
                i, lang;
            this.languages.destroyAll();
            for (i in languages) {
                lang = languages[i];
                this.languages.add(new Y.Wegas.Text({
                    content: lang.get("code") + " / " + lang.get("lang")
                }));
            }
        },
        bindUI: function() {
        },
        createNewLanguage: function(code, name) {
            Y.Wegas.Facade.GameModel.sendRequest({
                request: '/' + Y.Wegas.Facade.GameModel.get('currentGameModelId') + "/I18n/Lang",
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "GameModelLanguage",
                        code: code,
                        lang: name
                    }
                },
                on: {
                    success: Y.bind(this.syncUI, this),
                    failure: Y.bind(this.syncUI, this)
                }
            });
        }
    }, {
        EDITORNAME: "Languages Manager",
        ATTRS: {}
    });

    Y.Wegas.LanguagesManager = LanguagesManager;
});
