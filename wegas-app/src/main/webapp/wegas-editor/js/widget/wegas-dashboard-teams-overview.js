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

    var GUEST = "Guest",
        CONTENTBOX = "contentBox";

    Y.Wegas.TeamsOverviewDashboard = Y.Base.create("wegas-teams-overview-dashboard", Y.Wegas.TeamsDashboard, [], {
        BOUNDING_TEMPLATE: "<div class='dashboard dashboard--teams-overview' />",
        initializer: function() {
            Y.Array.each(this.get("cardsData"), function(data) {
                data.blocs = this._getBlocs(data.team);
            }, this);

            var ctx = this;
            Y.on('refresh', function () {
                ctx.syncUI();
            });
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
                "cardBlocType": "action",
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
        BASE_TEMPLATE: "<div class='wrapper__bloc-details bloc-details--close'>" + "<div class='bloc-details__notes'><textarea class='infos-comments' placeholder='Enter a comment here'></textarea></div>" + "</div>",
        TEAM_LIST_TEMPLATE: "<div class='bloc-details__players'>" + "<h3>Players</h3>" + "<ul class='bloc-details__players__list'></ul>" + "</div>",
        SIZE_TEMPLATE: "<span></span>",
        PLAYER_TEMPLATE: "<li class='bloc-details__player' title='✘ Unverified identity'></li>",
        VERIFIED_PLAYER_TEMPLATE: "<li class='bloc-details__player verified'></li>",
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
                    title = this.get("host").get(CONTENTBOX).one(".card__title").addClass("card__title--detailed"),
                    titleContent = title.getContent(),
                    detailLink = Y.Node.create(this.LINK_TEMPLATE),
                    team = this.get("team"),
                    realSize = team.get("players").length,
                    declSize = team.get("declaredSize");
                title.empty();
                title.append(Y.Node.create(this.TITLE_TEMPLATE).setContent(titleContent));
                title.append(detailLink);

                this.get("host").get("boundingBox").append(base);
                if (!game.get("properties.freeForAll")) {
                    base.addClass("bloc-details--team");
                    this.get("host").get(CONTENTBOX).addClass("card--team");
                    teamList = Y.Node.create(this.TEAM_LIST_TEMPLATE);
                    if (declSize>0) {
                        teamList.one("h3").setContent("Players "+realSize+"&nbsp;of&nbsp;"+declSize);
                    }
                    Y.Array.each(this.get("team").get("players"), function(player) {
                        var playerNode;
                        if (player.get("verifiedId") === true) {
                            playerNode = Y.Node.create(this.VERIFIED_PLAYER_TEMPLATE).append(player.get("name"));
                            playerNode.set("title", '✔ verified ' + player.get("homeOrg").toUpperCase() + ' member');
                        } else {
                            playerNode = Y.Node.create(this.PLAYER_TEMPLATE).append(player.get("name"));
                        }
                        teamList.one(".bloc-details__players__list").append(playerNode);
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
                        this.get("host").get(CONTENTBOX).toggleClass("card__detailed");
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
                gameLevel = team.get("@class") === "Game",
                actions;

            // Return the first player of each team (in Team mode, impacted variables are shared among team members)
            function allFirstPlayers(game){
                var gamePlayers = [];
                var arr = game.get("teams"),
                    len = arr.length;
                for (var i = 0; i < len; i++) {
                    var t = arr[i];
                    if (t.get("@class") !== "DebugTeam" && t.get("players").length) {
                        gamePlayers = gamePlayers.concat(t.get("players")[0]);
                    }
                };
                return gamePlayers;
            }

            if (game && team) {
                actions = [{
                    "types": ["primary"],
                    "label": "Apply impact",
                    "do": function() {
                        this.item(0).run(this);
                        Y.later(1500, this, function() { // Wait at least 1000+200 ms for the modale to close (see wegas-console-custom.js)
                            Y.fire("refresh");
                        });
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
                this.set("title", gameLevel ?
                    "Global impact on game \"" + game.get("name") + "\"" :
                    game.get("properties.freeForAll") ?
                        "Impact player \"" + team.get("players")[0].get("name") + "\"" :
                        "Impact team \"" + team.get("name") + "\"");
                this.add(new Y.Wegas.CustomConsole({
                    player: gameLevel ? allFirstPlayers(game) : team.get("players")[0],
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
                gameLevel = team.get("@class") === "Game",
                actions;

            function allPlayers(game){
                var gamePlayers = [];
                Y.Array.each(game.get("teams"), function(t){
                    if (t.get("@class") !== "DebugTeam" && t.get("players").length)
                        gamePlayers = gamePlayers.concat(t.get("players"));
                });
                return gamePlayers;
            }

            if (game && team) {

                var ctx = this,
                    cb = ctx.get(CONTENTBOX);

                actions = [{
                    "types": ["primary"],
                    "label": "Send",
                    "do": function () {
                        this.item(0).send();
                    }
                }, {
                    "label": 'Cancel',
                    "do": function () {
                        this.close();
                    }
                }];
                ctx.set("title", gameLevel ?
                "Send real E-Mail to all players of game \"" + game.get("name") + "\"" :
                    game.get("properties.freeForAll") ?
                    "Send real E-Mail to player \"" + team.get("players")[0].get("name") + "\"" :
                    "Send real E-Mail to players of team \"" + team.get("name") + "\"");
                ctx.set("icon", game.get("properties.freeForAll") ? "user" : "group");
                ctx.set("actions", actions);

                cb.append('<div class="wegas-status-bar wegas-status-bar-hidden"><div class="results">Fetching e-mail addresses ...</div><div class="status"></div></div>');
                cb.one(".wegas-status-bar").removeClass("wegas-status-bar-hidden");
                cb.one(".status").addClass("status--running");

                this._getEmails(gameLevel ? null : team).then(function(emailsArray){
                    var modal = cb.get("parentNode");

                    modal.one(".wegas-status-bar").addClass("wegas-status-bar-hidden");
                    modal.one(".status").removeClass("status--running");

                    var emailsString = ctx.formatEmails(emailsArray),
                        hasGuests = emailsArray.indexOf(GUEST)!==-1;

                    if (emailsString.length===0){
                        cb.prepend('<div class="wegas-warning">There are only anonymous players (without e-mail)</div>');
                        // Hide the "Send" button in the footer of the modal:
                        modal.one(".modal__footer").one(".button--primary").hide();
                        return;
                    }

                    ctx.add(new Y.Wegas.SendMail({
                        "players": gameLevel ? allPlayers(game) : team.get("players"),
                        "statusNode": Y.Node.create("<span></span>"),
                        "emails": emailsString
                    }));
                    ctx.add(new Y.Wegas.Button({
                        label: '<i class="fa fa-envelope-o" style="font-size:120%">&nbsp;</i> Download e-mail addresses',
                        cssClass: "wegas-emailsbutton",
                        on: {
                            click: Y.bind(function (e) {
                                ctx.displayEmails(emailsArray);
                            }, ctx)
                        }
                    }));

                    if (hasGuests) {
                        var nbGuests = 0;
                        emailsArray.forEach(function (email) {
                            if (email === GUEST) {
                                nbGuests++;
                            }
                        });
                        var guestsOfPlayers = nbGuests + ' of ' + emailsArray.length,
                            verb = emailsArray.length===1 ? ' is anonymous ' : ' are anonymous ',
                            players = nbGuests===1 ? ' player ' : ' players ';
                        cb.prepend('<div class="wegas-warning">NB: ' + guestsOfPlayers + players + verb + ' (no e-mail)</div>');
                    }
                });
            }
        },

        // Returns the promise of an array of emails as strings
        _getEmails: function (team) {
            var ctx = this;
            return new Y.Promise(function (resolve, reject) {
                var gameId = Y.Wegas.Facade.Game.cache.getCurrentGame().get("id"),
                    requestURL;
                if (team) {
                    requestURL = Y.Wegas.app.get("base") + "rest/Extended/User/Emails/" + gameId + "/" + team.get("id");
                } else {
                    requestURL = Y.Wegas.app.get("base") + "rest/Extended/User/Emails/" + gameId;
                }

                Y.io(requestURL, {
                    cfg: {
                        method: "GET",
                        headers: {
                            "Managed-Mode": true
                        }
                    },
                    on: {
                        success: Y.bind(function (rId, xmlHttpRequest) {
                            resolve(JSON.parse(xmlHttpRequest.response));
                        }, this),
                        failure: Y.bind(function (rId, xmlHttpRequest) {
                            resolve("PERMISSION-ERROR");
                        }, this)
                    }
                });
            });
        },

        // @param emailsArray: emails as an array of strings (with guests denoted by "Guest").
        displayEmails: function(emailsArray){
            var newTab = window.open("", "_blank");

            var nbValidEmails = 0,
                nbGuests = 0,
                mailtoHref = "mailto:",
                mailtoText = "";

            emailsArray.forEach(function (email) {
                if (email===GUEST){
                    nbGuests++;
                    return;
                }
                if (++nbValidEmails === 1) {
                    mailtoHref += email;
                    mailtoText += email;
                } else {
                    mailtoHref += ',' + email;
                    mailtoText += ', ' + email;
                }
            });

            newTab.document.write('<html><head><title>E-mail lists</title></head><body style="font-size:13px; font-family:Verdana, Geneva, sans-serif;">');
            if (nbValidEmails > 0) {
                if (nbValidEmails > 1) {
                    newTab.document.write('<b>Standard syntax:</b><br/>');
                }
                newTab.document.write('<a href="' + mailtoHref + '?subject=Serious%20Game"><pre>' + mailtoText + "</pre></a>");
                if (nbValidEmails > 1) {
                    newTab.document.write('<br/>&nbsp;<br/>');
                    mailtoHref = mailtoHref.replace(/,/g, ";");
                    mailtoText = mailtoText.replace(/,/g, ";");
                    newTab.document.write('<b>Microsoft Outlook syntax:</b><br/>');
                    newTab.document.write('<a href="' + mailtoHref + '?subject=Serious%20Game"><pre>' + mailtoText + "</pre></a>");
                }
            } else {
                newTab.document.write('No registered user<br/>&nbsp;');
            }
            if (nbGuests > 0) {
                newTab.document.write('<br/><span style="color:red">Attention:</span> ' + nbGuests + ' anonymous player'+(nbGuests>1 ? 's' : '')+', i.e. without e-mail.');
            }
            newTab.document.close();
        },

        // @param emailsArray: emails as an array of strings (with guests denoted by "Guest").
        formatEmails: function(emailsArray){
            var nbValidEmails = 0,
                mailtoText = "";

            emailsArray.forEach(function (email) {
                if (email===GUEST){
                    return;
                }
                if (++nbValidEmails === 1) {
                    mailtoText += email;
                } else {
                    mailtoText += ', ' + email;
                }
            });
            return mailtoText;
        }
    }, {
        "ATTRS": {
            "team": {}
        }
    });
}, 'V1.0', {
    requires: ['node', 'event']
});
