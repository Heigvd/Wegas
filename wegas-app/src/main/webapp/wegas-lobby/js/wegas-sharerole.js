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
    "use strict";
        var CONTENTBOX = 'contentBox', ShareRole;

    ShareRole = Y.Base.create("wegas-sharerole", Y.Widget, [Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Widget], {
        /**
         *
         */
        CONTENT_TEMPLATE: "<div><div class=\"title\" >Option 2: Player accesses with link</div></div>",
        /**
         *
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                e = this.get("entity");

            this.targetEntityId = (e instanceof Y.Wegas.persistence.GameModel) ? "gm" + e.get("id")
                : "g" + e.get("id");

            this.visibility = new Y.inputEx.SelectField({
                label: 'Accessibility',
                choices: [
                    //{value: 'Private', label: 'Only people in the list can join'},
                    {value: 'Link', label: 'Anyone with the link can join'},
                    {value: 'Public', label: 'Everybody can join'}
                ],
                parentEl: cb
            });
            Y.one(this.visibility.divEl).addClass("wegas-advanced-feature");    // @Hack Hide this field, not available
                                                                                // for regular users
            //this.requestPermissions();                                        // and do not request permissions

            this.link = new Y.inputEx.StringField({
                wrapperClassName: "inputEx-fieldWrapper wegas-link",
                parentEl: cb,
                description: '' +
                    "Players directly join the game by using the <b>link</b>.<br />"
                    + "The url can be used by an unlimited number of players.",
                value: Y.Wegas.app.get("base") + "game.html?token=" + this.get("entity").get("token")
            });

            this.syncLinkVisibility();

            this.set("visible", false);                                         // @HACK Visibility depends on a node
                                                                                // in the parent's tree
            Y.on("available", function(e, n) {
                var updatVisibility = function() {
                    this.set("visible", !Y.one(".wegas-game-access input").get("checked"));
                };
                updatVisibility.call(this);
                Y.all(".wegas-game-access input").on("change", updatVisibility, this);
            }, ".wegas-game-access input", this);
        },
        bindUI: function() {
            this.updateHandler = Y.Wegas.Facade.Game.after("update", function() {
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
            var inputNode = this.get(CONTENTBOX).one(".wegas-link input");
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
                                Y.Array.each(role.get('val').permissions, function(resultPerm) {
                                    var splitedPerm = resultPerm.split(":");
                                    Y.Array.each(this.get('permsList'), function(permFromList) {
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
    Y.Wegas.ShareRole = ShareRole;

});
