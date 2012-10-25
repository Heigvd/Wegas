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

YUI.add('wegas-loginwidget', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    LoginWidget;

    /**
     *
     *  @class Y.Wegas.JoinGameWidget
     *
     */
    LoginWidget = Y.Base.create( "wegas-loginwidget", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget ], {

        // *** Private fields *** //
        defaultRedirect: "wegas-app/view/lobby.html",

        // *** Lifecycle Methods *** //

        renderUI: function () {
            var cb = this.get(CONTENTBOX),
            cUser = Y.Wegas.app.get( "currentUser" );

            if ( cUser.accounts[0][ "@class"] != "GuestAccount" ) {
                this.showMessage( "success", "You are already logged in.", 4000 );
                this.redirect();
            }

            this.loginForm = new Y.inputEx.Group({
                fields:[{
                    name: "email",
                    label: "Email",
                    required: true,
                    type: "email"
                }, {
                    name: "password",
                    label: "Password",
                    required: true,
                    type: "password",
                    capsLockWarning: true
                }, {
                    label: "",
                    type: "boolean",
                    name: "remember",
                    rightLabel: "&nbsp;Remember me"
                }],
                parentEl: cb
            });

            var newEntity = new Y.Wegas.persistence.JpaAccount(),
            formCfg = newEntity.getFormCfg();
            this.createAccountForm = Y.inputEx( formCfg );

            formCfg.parentEl = cb;
            this.createAccountForm = new Y.inputEx.Group({
                parentEl: cb,
                fields:[{
                    name: "id",
                    type: "hidden"
                },{
                    name:"@class",
                    required: true,
                    type: "hidden",
                    value: "JpaAccount"
                },{
                    label: "First name",
                    name: "firstname",
                    required: true,
                    type: "string",
                    showMsg: true
                },{
                    label: "Last name",
                    name: "lastname",
                    required:true,
                    type: "string",
                    showMsg: true
                },{
                    label: "Email",
                    name: "email",
                    required: true,
                    type: "email",
                    showMsg: true
                },{
                    label: "Password",
                    name: "password",
                    strengthIndicator: true,
                    capsLockWarning: true,
                    id: "password",
                    required: true,
                    type: "password",
                    showMsg: true
                },{
                    label: "Password (confirm)",
                    name: "passwordConfirm",
                    showMsg: true,
                    required: true,
                    confirm: "password",
                    type: "password"
                }]
            });

            this.loginButton = new Y.Button();
            this.loginButton.render( cb );

            cb.append( '&nbsp;or <a class="alt-link" href="#"></a>');
        },

        bindUI: function () {
            var cb = this.get( CONTENTBOX );

            cb.one( ".alt-link" ).on( "click", this.toggleMode, this );

            this.loginButton.on( "click", function ( e ) {                      // join a game based on a token

                if ( this.get( "mode" ) == "login" ) {
                    if ( !this.loginForm.validate() ) return;

                    var value = this.loginForm.getValue();
                    this.doLogin( value.email, value.password, value.remember );

                } else {
                    if ( !this.createAccountForm.validate() ) return;

                    Y.Wegas.UserFacade.rest.sendRequest({
                        request: "/Signup/",
                        cfg: {
                            method: "POST",
                            data: this.createAccountForm.getValue()
                        },
                        callback: {
                            success: Y.bind( function ( e ) {
                                this.showMessage( "success", "User created, you can now use it to login", 4000 );
                                this.set( "mode", "login" );
                            }, this ),
                            failure: Y.bind( function ( e ) {
                                this.showMessage( "error", e.response.results.message || "Error creating user", 4000 );
                            }, this)
                        }
                    });
                }
            }, this);
        },

        syncUI: function () {
            this.set( "mode", this.get( "mode" ) );
        },

        toggleMode: function () {
            if ( this.get( "mode" ) === "login") {
                this.set( "mode", "createaccount")
            } else {
                this.set( "mode", "login" );
            }
        },

        doLogin: function ( email, password, remember ) {
            Y.Wegas.UserFacade.rest.sendRequest({
                request: "/Authenticate/?email=" + email
                + "&password=" + password
                + "&remember=" + remember,
                cfg: {
                    method: "POST"
                },
                callback: {
                    success: Y.bind( function ( e ) {
                        this.showMessage( "success", "Login successful", 4000 );
                        this.redirect();
                        return;
                    }, this ),
                    failure: Y.bind( function ( e ) {
                        this.showMessage( "error", e.response.results.message || "Email/password combination not found", 4000 );
                    }, this)
                }
            });
        },

        redirect: function () {
            window.location = this.getRedirect();
        },

        getRedirect: function () {
            return this.getQueryParameter( "redirect" ) ||
            ( Y.Wegas.app.get( "base" ) + this.defaultRedirect );
        },

        /**
         * Returns a parameter from the GET parameters.
         */
        getQueryParameter: function ( name ) {
            var query = window.location.search.substring( 1 ),
            vars = query.split( "&" ),
            i, pair;

            for ( i = 0; i < vars.length; i = i + 1 ) {
                pair = vars[i].split( "=" );
                if ( pair[0] === name ) {
                    return decodeURIComponent( pair[1] );
                }
            }
            return null;
        }

    }, {
        ATTRS: {
            mode: {
                value: "login",
                setter: function ( val ) {
                    var cb = this.get(CONTENTBOX);

                    if ( val == "login" ) {
                        //this.loginForm.clear();
                        this.loginForm.show();
                        this.createAccountForm.hide();
                        this.loginButton.set( "label", "Login" );
                        cb.one( ".alt-link" ).setContent( "create a new user" );
                    } else {
                        this.loginForm.hide();
                        this.createAccountForm.show();
                        //this.createAccountForm.clear();
                        this.loginButton.set( "label", "Submit" );
                        cb.one( ".alt-link" ).setContent( "login with existing account" );
                    }
                }
            }
        }
    });

    Y.namespace('Wegas').LoginWidget = LoginWidget;
});
