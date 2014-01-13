/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

YUI.add('wegas-console-wysiwyg', function(Y) {
    var CONTENTBOX = 'contentBox',
            WysiwygConsole, Plugin = Y.Plugin;

    WysiwygConsole = Y.Base.create("wegas-console-wysiwyg", Y.Wegas.Console, [Y.WidgetChild, Y.Wegas.Widget], {
        renderUI: function() {
            this.plug(Plugin.WidgetToolbar);

            var cb = this.get(CONTENTBOX);

            this.srcField = new Y.inputEx.WysiwygScript({
                parentEl: cb,
                className: "editor-animator-impactlist"
            });
            cb.append('<div class="results"></div>');
            this.srcField.el.rows = 8;
            this.srcField.el.cols = 100;

            this.runButton();
        },
        bindUI: function() {
            var treeView, cGameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(), i,
                    playerId, selected = 0;
            this.get("parent").on("selectedChange", function(e) {
                treeView = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team").treeView;
                if (e.newVal !== 1) {
                    treeView.unplug(Plugin.CheckBoxTV);
                    for (i = 0; i < treeView.size(); i++) {
                        if (treeView.item(i).get("selected")){
                            selected = i;
                            break;
                        }
                    }
                    treeView.deselectAll();
                    treeView.item(selected).set("selected", 2);
                    // Select only first team or player
                    if (cGameModel.get("properties.freeForAll")) {
                        playerId = treeView.item(selected).get("data").entity.get("id");
                    } else {
                        playerId = treeView.item(selected).get("data").entity.get("players")[0].get("id");
                    }
                    Y.Wegas.app.set('currentPlayer', playerId);
                } else {
                    treeView.plug(Plugin.CheckBoxTV);
                }
                
            });
        },
        runButton: function() {
            var el = this.toolbar.get('header');

            this.runButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>Run script",
                on: {
                    click: Y.bind(function() {
                        this.multiExecuteScript({
                            "@class": "Script",
                            language: "JavaScript",
                            content: this.srcField.getValue().content
                        }, this.playerList());
                    }, this)
                }
            }).render(el);
        },
        playerList: function() {
            var cGameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                    treenodes = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team .yui3-treeview-content")._items,
                    playerList = [], i, playerId;          
            
            if (cGameModel.get("properties.freeForAll")) {
                // all selected player
                for (i = 0; i < treenodes.length; i++) {
                    if (treenodes[i].get("selected")){
                        playerId = treenodes[i].get("data").entity.get("id");
                        playerList.push(playerId);
                    }
                }
            } else {
                // select only the first player of the team
                for (i = 0; i < treenodes.length; i++) {
                    if (treenodes[i].get("selected") && treenodes[i].get("data").entity.get("players").length > 0) {
                        playerId = treenodes[i].get("data").entity.get("players")[0].get("id");
                        playerList.push(playerId);
                    }
                }
            }
            return playerList;
        }
    });

    Y.namespace('Wegas').WysiwygConsole = WysiwygConsole;
});
