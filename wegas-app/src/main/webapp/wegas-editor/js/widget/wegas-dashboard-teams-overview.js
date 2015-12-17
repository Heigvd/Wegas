/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * Wegas Team Dashboard - Extends of Basic Dashboard
 * @author Raphaël Schmutz <raph@hat-owl.cc>
 */
/*global tinyMCE*/
YUI.add('wegas-teams-overview-dashboard', function(Y) {
    "use strict";

    Y.Wegas.TeamsOverviewDashboard = Y.Base.create("wegas-teams-overview-dashboard", Y.Wegas.TeamsDashboard, [], {
        BOUNDING_TEMPLATE: "<div class='dashboard dashboard--teams-overview' />",
        initializer: function() {
            Y.Array.each(this.get("cardsData"), function(data) {
                data.blocs = this._getBlocs(data.team);
            }, this);
        },
        syncUI: function() {
            return Y.Wegas.TeamsOverviewDashboard.superclass.constructor.prototype.syncUI.apply(this, arguments)
                .then(Y.bind(function(cardsData) {
                    this.each(function(item, index) {
                        item.plug(Y.Wegas.TeamCardDetails, {
                            team: cardsData[index].team
                        });
                    });
                }, this));
        },
        _getBlocs: function(team) {
            var blocs = [];
            this._addActionsBlocs(blocs, team);
            return blocs;
        },
        _addActionsBlocs: function(blocs, team) {
            var bloc = {
                "title": "Actions",
                "type": "action",
                "items": [{
                    "icon": "action-impacts",
                    "label": "Impacts",
                    "do": function() {
                        new Y.Wegas.ImpactsTeamModal({
                            "team": team
                        }).render();
                    }
                }, {
                    "icon": "action-email",
                    "label": "Send real E-Mail",
                    "do": function() {
                        new Y.Wegas.EmailTeamModal({
                            "team": team,
                            "on": {
                                "email:sent": function() {
                                    this.close();
                                }
                            }
                        }).render();
                    }
                }, {
                    "icon": "info-view",
                    "label": "View playing session",
                    "do": function() {
                        window.open("game-lock.html?id=" + team.get("players")[0].get("id"), "_blank");
                    }
                }]
            };
            blocs.push(bloc);
            this._addOriginalBloc(team.get("id"), bloc);
        }
    });

    Y.Wegas.TeamCardDetails = Y.Base.create("wegas-team-card-details", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        TITLE_TEMPLATE: "<span class='card__title__content'></span>",
        LINK_TEMPLATE: "<a href='#' class='card__title__link card__title__link--close'>Details</a>",
        BASE_TEMPLATE: "<div class='wrapper__bloc-details bloc-details--close'>" + "<div class='bloc-details__notes'><textaedrea class='infos-comments' placeholder='Enter a comment here'></textarea></div>" + "</div>",
        TEAM_LIST_TEMPLATE: "<div class='bloc-details__players'>" + "<h3>Players</h3>" + "<ul class='bloc-details__players__list'></ul>" + "</div>",
        PLAYER_TEMPLATE: "<li class='bloc-details__player'></li>",
        _saveNotes: function(context) {
            context.get("team").set("notes", context.get("editor").getContent());
            Y.Wegas.Facade.Game.cache.put(context.get("team").toObject("players"), {});
        },
        initializer: function() {
            this.handles = [];
            this.afterHostEvent("render", function() {
                var teamList,
                    game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                    base = Y.Node.create(this.BASE_TEMPLATE),
                    title = this.get("host").get("contentBox").one(".card__title").addClass("card__title--detailed"),
                    titleContent = title.getContent(),
                    detailLink = Y.Node.create(this.LINK_TEMPLATE);
                title.empty();
                title.append(Y.Node.create(this.TITLE_TEMPLATE).setContent(titleContent));
                title.append(detailLink);

                this.get("host").get("boundingBox").append(base);
                if (!game.get("properties.freeForAll")) {
                    base.addClass("bloc-details--team");
                    this.get("host").get("contentBox").addClass("card--team");
                    teamList = Y.Node.create(this.TEAM_LIST_TEMPLATE);
                    Y.Array.each(this.get("team").get("players"), function(player) {
                        player = Y.Node.create(this.PLAYER_TEMPLATE).append(player.get("name"));
                        teamList.one(".bloc-details__players__list").append(player);
                    }, this);
                    base.prepend(teamList);
                }

                this.handles.push(
                    detailLink.on("click", function(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!this.get("editor")) {
                            this.set("editor", true);
                            tinyMCE.init({
                                "width": "100%",
                                "height": "100%",
                                "menubar": false,
                                "statusbar": false,
                                "toolbar": "bold italic | alignleft aligncenter alignright alignjustify | bullist numlist",
                                "selector": "#" + this.get("host").get("boundingBox").get("id") + " .infos-comments",
                                "setup": Y.bind(function(mce) {
                                    var saveTimer,
                                        context = this;
                                    mce.on('init', function(args) {
                                        context.set("editor", args.target);
                                        if (context.get("team").get("notes")) {
                                            context.get("editor").setContent(context.get("team").get("notes"));
                                        } else {
                                            context.get("editor").setContent("<i>Notes</i>");
                                        }
                                    });
                                    mce.on('keyup', function() {
                                        clearTimeout(saveTimer);
                                        saveTimer = setTimeout(context._saveNotes, 500, context);
                                    });
                                }, this)
                            });
                        }
                        this.get("host").get("contentBox").toggleClass("card__detailed");
                        detailLink.toggleClass("card__title__link--close");
                        detailLink.toggleClass("card__title__link--open");
                        base.toggleClass("bloc-details--open");
                        base.toggleClass("bloc-details--close");
                    }, this)
                );
            });
        },
        destructor: function() {
            var editor = this.get("editor");
            this.set("editor", null);
            if (editor && editor.destroy) {
                editor.remove();
            }
            Y.Array.each(this.handles, function(handle) {
                handle.detach();
            });
        }
    }, {
        NS: "TeamCardDetails",
        ATTRS: {
            team: {}
        }
    });

    Y.Wegas.ImpactsTeamModal = Y.Base.create("wegas-impacts-team-modal", Y.Wegas.Modal, [], {
        initializer: function() {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                team = this.get("team"),
                actions;

            if (game && team) {
                actions = [{
                    "types": ["primary"],
                    "label": "Apply impact",
                    "do": function() {
                        this.item(0).run(this);
                    }
                }, {
                    "label": "Cancel",
                    "do": function() {
                        this.close();
                    }
                }, {
                    "label": "View src",
                    "types": ["secondary", "advanced"],
                    "do": function() {
                        this.item(0).viewSrc();
                    }
                }];
                this.set("title", game.get("properties.freeForAll") ?
                    "Impact player \"" + team.get("players")[0].get("name") + "\"" :
                    "Impact team \"" + team.get("name") + "\"");
                this.add(new Y.Wegas.CustomConsole({
                    player: team.get("players")[0],
                    statusNode: Y.Node.create("<span></span>")
                }));
                this.set("actions", actions);
            }
        }
    }, {
        "ATTRS": {
            "team": {}
        }
    });

    Y.Wegas.EmailTeamModal = Y.Base.create("wegas-email-team-modal", Y.Wegas.Modal, [], {
        initializer: function() {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                team = this.get("team"),
                actions;

            if (game && team) {
                actions = [{
                    "types": ["primary"],
                    "label": "Send",
                    "do": function() {
                        this.item(0).send();
                    }
                }, {
                    "label": 'Cancel',
                    "do": function() {
                        this.close();
                    }
                }];
                this.set("title", game.get("properties.freeForAll") ?
                    "Send real E-Mail to player \"" + team.get("players")[0].get("name") + "\"" :
                    "Send real E-Mail to players of team \"" + team.get("name") + "\"");
                this.set("icon", game.get("properties.freeForAll") ? "user" : "group");
                this.add(new Y.Wegas.SendMail({
                    "players": team.get("players"),
                    "statusNode": Y.Node.create("<span></span>")
                }));
                this.set("actions", actions);
            }
        }
    }, {
        "ATTRS": {
            "team": {}
        }
    });
});
