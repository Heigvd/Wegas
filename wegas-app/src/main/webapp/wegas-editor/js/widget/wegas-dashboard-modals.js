/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * Wegas Dashboard - Impact ans sendMail modals
 */
YUI.add('wegas-dashboard-modals', function(Y) {
    "use strict";

    var GUEST = "Guest",
        CONTENTBOX = "contentBox";

    Y.Wegas.ImpactsTeamModal = Y.Base.create("wegas-impacts-team-modal", Y.Wegas.Modal, [], {
        initializer: function() {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                team = this.get("team"),
                gameLevel = team.get("@class") === "Game",
                actions;

            // Return one live player for each team which has such a live player
            // (in Team mode, we assume impacted variables are shared among team members)
            function getOnePlayerPerTeam(game) {
                var gamePlayers = [], player,
                    i, t, teams = game.get("teams"),
                    nbTeams = teams.length;
                for (i = 0; i < nbTeams; i++) {
                    t = teams[i];
                    if (t.get("@class") !== "DebugTeam" && t.get("players").length) {
                        player = t.getLivePlayer();
                        if (player !== null) {
                            gamePlayers.push(player);
                        }
                    }
                }
                return gamePlayers;
            }

            function getAllPlayers(game) {
                var gamePlayers = [], player,
                    i, t, teams = game.get("teams"),
                    nbTeams = teams.length,
                    players, nbPlayers, j;
                for (i = 0; i < nbTeams; i++) {
                    t = teams[i];
                    players = t.get("players");
                    nbPlayers = players.length;
                    if (t.get("@class") !== "DebugTeam" && nbPlayers) {
                        for (j = 0; j < nbPlayers; j++) {
                            player = players[j];
                            if (player !== null && player.get("status") === 'LIVE') {
                                gamePlayers.push(player);
                            }
                        }
                    }
                }
                return gamePlayers;
            }

            if (game && team) {
                actions = [{
                        "types": ["primary"],
                        "label": "Apply impact",
                        "do": function() {
                            this.item(0).run(this);
                            Y.later(1500, this, function() { // Wait at least 1000+200 ms for the modale to close (see wegas-console-custom.js)
                                Y.fire("dashboard:refresh");
                            });
                        }
                    }, {
                        "label": "Cancel",
                        "do": function() {
                            this.close();
                        }
                    }];
                this.set("title", gameLevel ?
                    "Global impact on game \"" + game.get("name") + "\"" :
                    game.get("properties.freeForAll") ?
                    "Impact player \"" + team.get("players")[0].get("name") + "\"" :
                    "Impact team \"" + team.get("name") + "\"");
                this.add(new Y.Wegas.CustomConsole({
                    player: gameLevel ?
                        (this.get("scopeType") === "TeamScope" ?
                            getOnePlayerPerTeam(game) :
                            getAllPlayers(game)) :
                        team.get("players")[0],
                    statusNode: Y.Node.create("<span></span>"),
                    customImpacts: this.get("customImpacts"),
                    showAdvancedImpacts: this.get("showAdvancedImpacts")
                }));
                this.set("actions", actions);
            }
        }
    }, {
        "ATTRS": {
            team: {},
            showAdvancedImpacts: {
                type: "boolean",
                value: true
            },
            customImpacts: {
            },
            scopeType: {
                type: "string",
                value: "TeamScope"
            }
        }
    });

    Y.Wegas.EmailTeamModal = Y.Base.create("wegas-email-team-modal", Y.Wegas.Modal, [], {
        initializer: function() {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                team = this.get("team"),
                gameLevel = team.get("@class") === "Game",
                actions;

            function allPlayers(game) {
                var gamePlayers = [];
                Y.Array.each(game.get("teams"), function(t) {
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
                        "do": function() {
                            this.item(0).send();
                        }
                    }, {
                        "label": 'Cancel',
                        "do": function() {
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

                this._getEmails(gameLevel ? null : team).then(function(emailsArray) {
                    var modal = cb.get("parentNode");

                    modal.one(".wegas-status-bar").addClass("wegas-status-bar-hidden");
                    modal.one(".status").removeClass("status--running");

                    var emailsString = ctx.formatEmails(emailsArray),
                        hasGuests = emailsArray.indexOf(GUEST) !== -1;

                    if (emailsString.length === 0) {
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
                            click: Y.bind(function(e) {
                                ctx.displayEmails(emailsArray);
                            }, ctx)
                        }
                    }));

                    if (hasGuests) {
                        var nbGuests = 0;
                        emailsArray.forEach(function(email) {
                            if (email === GUEST) {
                                nbGuests++;
                            }
                        });
                        var guestsOfPlayers = nbGuests + ' of ' + emailsArray.length,
                            verb = emailsArray.length === 1 ? ' is anonymous ' : ' are anonymous ',
                            players = nbGuests === 1 ? ' player ' : ' players ';
                        cb.prepend('<div class="wegas-warning">NB: ' + guestsOfPlayers + players + verb + ' (no e-mail)</div>');
                    }
                });
            }
        },

        // Returns the promise of an array of emails as strings
        _getEmails: function(team) {
            var ctx = this;
            return new Y.Promise(function(resolve, reject) {
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
                        success: Y.bind(function(rId, xmlHttpRequest) {
                            resolve(JSON.parse(xmlHttpRequest.response));
                        }, this),
                        failure: Y.bind(function(rId, xmlHttpRequest) {
                            resolve("PERMISSION-ERROR");
                        }, this)
                    }
                });
            });
        },

        // @param emailsArray: emails as an array of strings (with guests denoted by "Guest").
        displayEmails: function(emailsArray) {
            var newTab = window.open("", "_blank");

            var nbValidEmails = 0,
                nbGuests = 0,
                mailtoHref = "mailto:",
                mailtoText = "";

            emailsArray.forEach(function(email) {
                if (email === GUEST) {
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

            newTab.document.write('<html><head><title>E-mail lists</title></head><body style="font-size:13px">');
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
                newTab.document.write('<br/><span style="color:red">Attention:</span> ' + nbGuests + ' anonymous player' + (nbGuests > 1 ? 's' : '') + ', i.e. without e-mail.');
            }
            newTab.document.close();
        },

        // @param emailsArray: emails as an array of strings (with guests denoted by "Guest").
        formatEmails: function(emailsArray) {
            var nbValidEmails = 0,
                mailtoText = "";

            emailsArray.forEach(function(email) {
                if (email === GUEST) {
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
});
