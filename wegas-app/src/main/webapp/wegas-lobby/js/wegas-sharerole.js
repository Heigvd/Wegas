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
                    gameModel = (e instanceof Y.Wegas.persistence.Game) ?
                    Y.Wegas.Facade.GameModel.cache.findById(e.get("gameModelId")) : e;


            if (gameModel.get("properties.freeForAll") !== "true") {
                this.set("visible", false);
            }

            this.targetEntityId = (e instanceof Y.Wegas.persistence.GameModel) ? "gm" + e.get("id")
                    : "g" + e.get("id");

            this.link = new Y.inputEx.StringField({
                wrapperClassName: "inputEx-fieldWrapper wegas-link",
                parentEl: cb,
                description: 'Using this link, player will access game directly',
                value: Y.Wegas.app.get("base") + "game.html?token=" + this.get("entity").get("token")
            });
            this.visibility = new Y.inputEx.SelectField({
                label: 'Accessibility',
                choices: [
                    {value: 'Private', label: 'Only people in the list can join'},
                    {value: 'Link', label: 'Anyone with the link can join'},
                    {value: 'Public', label: 'Everybody can join'}
                ],
                parentEl: cb
            });

            this.syncLinkVisibility();
            this.requestPermissions();
        },
        bindUI: function() {
            this.visibility.on("updated", function(value) {
                this.syncLinkVisibility(value);
                Y.Wegas.Facade.User.cache.deleteAllRolePermissions(this.get('role'), this.targetEntityId);
                if (value === "Public") {
                    Y.Array.each(this.get('permsList'), function(permission) {
                        if (permission.name === "Public") {
                            this.addPermission(permission.value);
                        }
                    }, this);
                } else if (value === "Link") {
                    Y.Array.each(this.get('permsList'), function(permission) {
                        if (permission.name === "Link") {
                            this.addPermission(permission.value);
                        }
                    }, this);
                }
            }, this);

            this.get("contentBox").one(".wegas-link input").on("click", this.link.el.select, this); // Select whole link on click
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
//                this.link.hide();
            } else {
//                this.link.show();
            }
        },
        addPermission: function(permission) {
            Y.Wegas.Facade.User.sendRequest({
                request: "/AddPermission/" + this.get('role') + "/" + permission + ":" + this.targetEntityId,
                cfg: {
                    method: "POST"
                }
            });
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


    var TeamsList = Y.Base.create("wegas-teamslist", Y.Widget, [Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Widget], {
        CONTENT_TEMPLATE: "<div>"
                //+ "<div class=\"title\" >Teams</div>"
                + "<div class=\"yui3-g\" style=\"font-weight:bold\"><div class=\"yui3-u team-name\">Name</div><div class=\"yui3-u team-token\">Token</div>"
                + "<div class=\"yui3-u team-link\"></div></div>"
                + "<div class=\"wegas-teams\"></div>"
                + "<div class=\"description\">To share this game with your student, you must first create the teams and then give the students their team token, which they can use on <a href=\"http://wegas.albasim.ch\">wegas.albasim.ch</a>.</div>"
                + "</div>",
        renderUI: function() {

            if (Y.Wegas.Facade.GameModel.cache.findById(this.get("entity").get("gameModelId")).get("properties.freeForAll") === "true") {
                //this.set("visible", false);
                this.get("parent").set("visible", false);
            }
            this.plug(Y.Plugin.WidgetToolbar);
            this.addButton = this.toolbar.add({
                type: "Button",
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>Add teams"
            });

            //this.addButton = new Y.Wegas.Button({
            //    label: "Add teams",
            //    render: this.get(CONTENTBOX)
            //});
        },
        bindUI: function() {
            var cb = this.get("contentBox");

            cb.delegate("click", function(e) {                                  // Whenever one of the link is clicked
                e.target.select();                                              // select if fully for copy/paster
            }, "input", this);

            this.addButton.on("click", function() {                             // When the "add teams" button is clicker
                var i, name,
                        entity = this.get("entity"),
                        offset = entity.get("teams").length,
                        teams = prompt("How many teams?", 1);

                this.showOverlay();
                this.teamsAcc = [];
                for (i = 0; i < parseInt(teams); i += 1) {                      // add the number amount of teams
                    name = entity.get("name") + "-" + (offset + i + 1);
                    this.teamsAcc.push({
                        "@class": "Team",
                        name: name,
                        token: name
                    });
                }
                this.teamsAcc.reverse();
                this.doCreateTeam();
            }, this);

            this.facadeHandler = Y.Wegas.Facade.Game.on("update", this.syncUI, this);// Update the team list when the datasource is updated
        },
        syncUI: function() {
            var game = this.get("entity"),
                    teamsNode = this.get(CONTENTBOX).one(".wegas-teams");

            teamsNode.empty();

            Y.Array.each(game.get("teams"), function(t) {
                teamsNode.append("<div class=\"yui3-g\"><div class=\"yui3-u team-name\">" + t.get("name") + "</div><div class=\"yui3-u team-token\">" + t.get("token") + "</div>"
                        + "<div class=\"yui3-u team-link\">"
                        //+"<input value=\"" + encodeURI(Y.Wegas.app.get("base") + "game.html?token=" + t.get("token")) + "\" />"
                        + "</div></div>");
            });
            if (game.get("teams").length === 0) {
                teamsNode.append("<em><center><br />No team created yet<br /><br /></em></center>");
            }
        },
        destructor: function() {
            this.addButton.destroy();
            this.facadeHandler.detach();
        },
        doCreateTeam: function() {
            var entity = this.get("entity"), team = this.teamsAcc.pop();

            if (team) {
                Y.Wegas.Facade.Game.cache.post(team, entity.toObject(), {
                    success: Y.bind(this.doCreateTeam, this)
                });
            } else {
                this.hideOverlay();
            }
        }
    }, {
        ATTRS: {
            entity: {}
        }
    });
    Y.namespace('Wegas').TeamsList = TeamsList;
});