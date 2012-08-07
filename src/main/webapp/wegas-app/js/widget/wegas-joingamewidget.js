/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-joingamewidget', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    JoinGameWidget, SystemMessage;

    /**
     *
     *  @class Y.Wegas.JoinGameWidget
     *
     */
    JoinGameWidget = Y.Base.create("wegas-joingamewidget", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        // *** Private fields *** //

        // *** Lifecycle Methods *** //
        renderUI: function () {
            var cb = this.get(CONTENTBOX);

            this.msg = new Y.Wegas.SystemMessage();
            this.msg.render(cb);


            this.tokenField = new Y.inputEx.StringField({                       // Render
                required: "true",
                parentEl: cb,
                label: "Enter a key phrase to join a game"
            });
            this.joinGameButton = new Y.Button({
                label: "Join game"
            });
            this.joinGameButton.render(cb);

            this.teamsField = new Y.inputEx.SelectField({                       // Render team selection
                required: "true",
                parentEl: cb,
                label: "Select a new you want to join"
            });
            this.teamsField.addClassName( "inputEx-hidden" );
            this.joinTeamButton = new Y.Button({
                label: "Join team",
                visible: false
            });
            this.joinTeamButton.render(cb);

            this.createTeamField = new Y.inputEx.StringField({                  // Render team creation
                required: "true",
                parentEl: cb,
                label: "OR Create a new team:"
            });
            this.createTeamField.addClassName( "inputEx-hidden" );
            this.createButton = new Y.Button({
                label: "Create team",
                visible: false
            });
            this.createButton.render(cb);
        },

        bindUI: function () {
            this.joinGameButton.on("click", function ( e ) {                    // join a game based on a token
                if (this.tokenField.validate()) {
                    Y.Wegas.GameFacade.rest.sendRequest({
                        request: "/JoinGame/" + this.tokenField.getValue(),
                        callback: {
                            success: Y.bind( function ( e ) {
                                if ( e.response.entity                          // If the returned value is a Team enity
                                    instanceof Y.Wegas.persistence.Team) {
                                    this.sendJoinTeamRequest(                   // it means we can join this team directly
                                        e.response.entity.get( "id" ) );
                                } else {
                                    this.showTeams();                           // otherwise the player can choose or create its team
                                }
                            }, this ),
                            failure: Y.bind( function ( e ) {
                                this.msg.log("error", e.response.results.message || "Invalid token");
                            }, this)
                        }
                    });
                }
            }, this);

            this.joinTeamButton.on("click", function ( e ) {                    // Join an existing team
                if (this.teamsField.validate()) {
                    this.sendJoinTeamRequest( this.teamsField.getValue() )
                }
            }, this);
            this.createButton.on("click", function ( e ) {                      // Create a new team
                if (this.createTeamField.validate()) {
                    var team = new Y.Wegas.persistence.Team({
                        name: this.createTeamField.getValue()
                    });
                    Y.Wegas.GameFacade.rest.post(team.toJSON(), this.currentGame.toJSON(), {
                        success: Y.bind( function ( e ) {
                            this.sendJoinTeamRequest( e.response.entity.get( "id" ) );
                        }, this),
                        failure: Y.bind( function ( e ) {
                            this.msg.log("error", e.response.results.message || "Error creating team");
                        }, this)
                    });
                }
            }, this);
        },

        showTeams: function () {
            this.msg.empty();

            this.joinGameButton.hide();
            this.tokenField.addClassName( "inputEx-hidden" );
            this.joinTeamButton.show();
            this.teamsField.removeClassName( "inputEx-hidden" );
            this.createButton.show();
            this.createTeamField.removeClassName( "inputEx-hidden" );

            this.currentGame = Y.Wegas.GameFacade.rest.getCache()[0];

            var i, teams = this.currentGame.get("teams");

            for (i = 0; i < teams.length; i = i + 1) {
                this.teamsField.addChoice({
                    label: teams[i].get("name"),
                    value: teams[i].get("id")
                });
            }
        },

        sendJoinTeamRequest: function ( teamId ) {
            Y.Wegas.GameFacade.rest.sendRequest({
                request: "/JoinTeam/" + teamId,
                callback: {
                    success: Y.bind( function ( e ) {
                        this.msg.log("success", "Game joined, it has been added to your games");

                        Y.Wegas.RegisteredGamesFacade.rest.clearCache();
                        Y.Wegas.RegisteredGamesFacade.sendInitialRequest();

                        this.createButton.hide();
                        this.createTeamField.addClassName( "inputEx-hidden" );
                        this.joinTeamButton.hide();
                        this.teamsField.addClassName( "inputEx-hidden" );
                        this.joinGameButton.hide();
                        this.tokenField.addClassName( "inputEx-hidden" );
                    }, this),
                    failure: Y.bind( function ( e ) {
                        this.msg.log("error", "Error joinging team");
                    }, this)
                }
            });
        },
        destructor: function () {
            this.tokenField.destroy();
            this.teamsField.destroy();
        }
    });

    Y.namespace('Wegas').JoinGameWidget = JoinGameWidget;

    SystemMessage = Y.Base.create("wegas-systemmessage", Y.Widget, [], {

        //CONTENT_TEMPLATE: null,

        log: function ( level, msg ) {
            var bb = this.get("boundingBox");
            this.empty();

            bb.setContent('<span class="icon"></span><span class="content">' + msg + '</span>' );
            bb.addClass(level);
        },

        empty: function () {
            var bb = this.get("boundingBox");
            bb.removeClass("success");
            bb.removeClass("error");
            bb.removeClass("info");
            bb.removeClass("info");
        }
    }, {
        CSS_PREFIX:"wegas-systemmessage"
    });
    Y.namespace('Wegas').SystemMessage = SystemMessage;
});
