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
        CONTENT_TEMPLATE: "<div><div class=\"title\" >Player link</div></div>",
        /**
         *
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                    e = this.get("entity"),
                    gameModel = (e instanceof Y.Wegas.persistence.Game) ? Y.Wegas.Facade.GameModel.cache.findById(e.get("gameModelId")) : e,
                    visibilityChoices = [
                {value: 'Private', label: 'Only people in the list can join'},
                {value: 'Link', label: 'Anyone with the link can join.'},
                {value: 'Public', label: 'Everybody can join'}
            ];

            //if (!gameModel.get("properties.freeForAll") && !gameModel.get("properties.freeTeams")) {
            //    this.set("visible", false);
            //}
            if (!gameModel.get("properties.freeForAll")) {                      // For games with teams, add the team enorlement key option
                visibilityChoices.splice(1, 0, {value: 'TeamToken', label: 'Anyone with a team specific enrolement key can join.'});
            }

            this.targetEntityId = (e instanceof Y.Wegas.persistence.GameModel) ? "gm" + e.get("id")
                    : "g" + e.get("id");

            this.visibility = new Y.inputEx.SelectField({
                label: 'Accessibility',
                choices: visibilityChoices,
                parentEl: cb
            });

            this.link = new Y.inputEx.StringField({
                wrapperClassName: "inputEx-fieldWrapper wegas-link",
                parentEl: cb,
                description: 'Using this link, player will access game directly',
                value: Y.Wegas.app.get("base") + "game.html?token=" + this.get("entity").get("token")
            });

            this.syncLinkVisibility();
            this.requestPermissions();
        },
        bindUI: function() {
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

            this.get("contentBox").one(".wegas-link input").on("click", function(e) {
                e.target.select();
            });                                                                 // Select whole link on click
        },
        destructor: function() {
            this.link.destroy();
            this.visibility.destroy();
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
            if (this.visibility.getValue() === "Private") {
                //this.link.hide();
            } else {
                //this.link.show();
            }
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