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

YUI.add('wegas-sharerole', function(Y) {
    var CONTENTBOX = 'contentBox',
            ShareRole = Y.Base.create("wegas-sharerole", Y.Widget, [Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Widget], {
        /**
         *
         */
        CONTENT_TEMPLATE: "<div><div class=\"title\" >Option 2: Share link</div></div>",
        /**
         *
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                    e = this.get("entity"),
                    //gameModel = (e instanceof Y.Wegas.persistence.Game) ? Y.Wegas.Facade.GameModel.cache.findById(e.get("gameModelId")) : e,
                    visibilityChoices = [
                //{value: 'Private', label: 'Only people in the list can join'},
                {value: 'Link', label: 'Anyone with the link can join'},
                {value: 'Public', label: 'Everybody can join'}
            ];

            this.targetEntityId = (e instanceof Y.Wegas.persistence.GameModel) ? "gm" + e.get("id")
                    : "g" + e.get("id");

            this.visibility = new Y.inputEx.SelectField({
                label: 'Accessibility',
                choices: visibilityChoices,
                parentEl: cb
            });
            (new Y.Node(this.visibility.divEl)).addClass("wegas-advanced-feature");// @fixme

            this.link = new Y.inputEx.StringField({
                wrapperClassName: "inputEx-fieldWrapper wegas-link",
                parentEl: cb,
                description: 'Using this link, players need to log in or create an account, and will then be redirected to the game.',
                value: Y.Wegas.app.get("base") + "game.html?token=" + this.get("entity").get("token")
            });

            this.syncLinkVisibility();
            this.requestPermissions();


            this.set("visible", false);                                         // @HACK Visibility depends on a node in the parent's tree 
            Y.on("available", function() {
                var node = Y.one(".wegas-game-access select"),
                        updatVisibility = function() {
                    this.set("visible", node.get("value") === "ENROLMENTKEY");
                };
                updatVisibility.call(this);
                node.on("valuechange", updatVisibility, this);
            }, ".wegas-game-access select", this);
        },
        bindUI: function() {
            this.updateHandler = Y.Wegas.Facade.Game.after("update", function(){
               this.link.setValue(Y.Wegas.app.get("base") + "game.html?token=" + this.get("entity").get("token"));
            }, this);
            this.visibility.on("updated", function(value) {
                this.syncLinkVisibility(value);
                Y.Wegas.Facade.User.cache.deleteAllRolePermissions(this.get('role'), this.targetEntityId);

                var permission = Y.Array.find(this.get('permsList'), function(p) {
                    return p.name === value;
                });
                if (permission) {
                    Y.Wegas.Facade.User.sendRequest({// Send an add permission request
                        request: "/AddPermission/" + this.get('role') + "/" + permission.value + ":" + this.targetEntityId,
                        cfg: {
                            method: "POST"
                        }
                    });
                }
            }, this);

            //this.link.disable();
            var inputNode = this.get("contentBox").one(".wegas-link input");
            inputNode.on("keypress", function(e) {
                e.preventDefault();
            });                                                                 // Edition not allowed on the input node
            inputNode.on("click", inputNode.select, inputNode);                 // Select whole link on click
        },
        destructor: function() {
            this.link.destroy();
            this.visibility.destroy();
            this.updateHandler.detach();
        },
        requestPermissions: function() {
            this.showOverlay();
            Y.Wegas.Facade.User.sendRequest({
                request: "/FindPermissionByInstance/" + this.targetEntityId,
                on: {
                    success: Y.bind(function(e) {
                        Y.Array.each(e.response.results.entities, function(role) {
                            if (role.get('val').name === this.get('role')) {
                                Y.Array.forEach(role.get('val').permissions, function(resultPerm) {
                                    var splitedPerm = resultPerm.split(":");
                                    Y.Array.forEach(this.get('permsList'), function(permFromList) {
                                        if (splitedPerm[0] + ":" + splitedPerm[1] === permFromList.value) {
                                            this.visibility.setValue(permFromList.name, false);
                                            this.syncLinkVisibility();
                                        }
                                    }, this);
                                }, this);
                            }
                        }, this);
                        this.hideOverlay();
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        syncLinkVisibility: function(selectValue) {
            //if (this.visibility.getValue() === "Private") {
            //    this.link.hide();
            //} else {
            //    this.link.show();
            //}
        }
    }, {
        ATTRS: {
            role: {
                value: "Public"
            },
            entity: {},
            permsList: {
                value: []
            }
        }
    });
    Y.namespace('Wegas').ShareRole = ShareRole;

});