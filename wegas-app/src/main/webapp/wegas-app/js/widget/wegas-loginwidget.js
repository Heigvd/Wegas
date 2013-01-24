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

YUI.add('wegas-loginwidget', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    LoginWidget;

    /**
     *
     *  @class Y.Wegas.JoinGameWidget
     *
     */
    LoginWidget = Y.Base.create("wegas-loginwidget", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        // *** Private fields *** //
        defaultRedirect: "wegas-app/view/lobby.html",
        // *** Lifecycle Methods *** //

        renderUI: function() {
            var cb = this.get(CONTENTBOX),
            cUser = Y.Wegas.app.get("currentUser");

            if (cUser.accounts[0]["@class"] !== "GuestAccount") {
                this.showMessage("success", "You are already logged in.", 4000);
                this.redirect();
            }

            this.loginForm = new Y.inputEx.Group({
                fields: [{
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

            this.createAccountForm = new Y.inputEx.Group({
                parentEl: cb,
                fields: [{
                    name: "id",
                    type: "hidden"
                }, {
                    name: "@class",
                    required: true,
                    type: "hidden",
                    value: "JpaAccount"
                }, {
                    label: "First name",
                    name: "firstname",
                    required: true,
                    type: "string",
                    showMsg: true
                }, {
                    label: "Last name",
                    name: "lastname",
                    required: true,
                    type: "string",
                    showMsg: true
                }, {
                    label: "Email",
                    name: "email",
                    required: true,
                    type: "email",
                    showMsg: true
                }, {
                    label: "Password",
                    name: "password",
                    strengthIndicator: true,
                    capsLockWarning: true,
                    id: "password",
                    required: true,
                    type: "password",
                    showMsg: true
                }, {
                    label: "Password (confirm)",
                    name: "passwordConfirm",
                    showMsg: true,
                    required: true,
                    confirm: "password",
                    type: "password"
                }]
            });

            this.sendNewPasswordForm = new Y.inputEx.Group({
                fields: [{
                    name: "email",
                    label: "Email",
                    required: true,
                    type: "email"
                }],
                parentEl: cb
            });

            this.loginButton = new Y.Button();
            this.loginButton.render(cb);
            cb.append('<div class="links" style="margin-left: 136px;margin-top:10px;">'
                + '<p><a class="alt-link" href="#"></a></p>'
                + '<p><a class="send-new-password" href="#">Forgot your password?</a></p>'
                + '</div>');
        },
        bindUI: function() {
            var cb = this.get(CONTENTBOX);

            cb.one(".alt-link").on("click", this.toggleCreateAccount, this);

            cb.one(".send-new-password").on("click", this.toggleSendNewPassword, this);

            this.loginButton.on("click", this.onSubmit, this);
            this.on("keypress", function(e) {
                if (e.domEvent.keyCode === 13) {
                    this.loginButton.fire("click");
                }
            });
            this.after("render", function(e) {
                cb.one("input").focus();
            });
        },
        syncUI: function() {
            this.set("mode", this.get("mode"));
        },
        toggleCreateAccount: function() {
            if (this.get("mode") === "login") {
                this.set("mode", "createaccount");
            } else {
                this.set("mode", "login");
            }
        },
        toggleSendNewPassword: function() {
            if (this.get("mode") === "login") {
                this.set("mode", "sendNewPassword");
            } else {
                this.set("mode", "login");
            }
        },
        onSubmit: function(e) {
            var data;
            if (this.get("mode") === "login") {                                 // Join a game based on a token
                if (!this.loginForm.validate()) {
                    return;
                }
                data = this.loginForm.getValue();
                this.doLogin(data.email, data.password, data.remember);

            } else if (this.get("mode") === "createaccount") {
                if (!this.createAccountForm.validate()) {
                    return;
                }
                data = this.createAccountForm.getValue();
                this.createAccount(data);

            } else if (this.get("mode") === "sendNewPassword") {
                if (!this.sendNewPasswordForm.validate()) {
                    return;
                }
                data = this.sendNewPasswordForm.getValue();
                this.showOverlay();
                this.sendNewPassword(data.email);
            }
        },
        doLogin: function(email, password, remember) {
            Y.Wegas.UserFacade.rest.sendRequest({
                request: "/Authenticate/?email=" + email
                + "&password=" + password
                + "&remember=" + remember,
                cfg: {
                    method: "POST"
                },
                on: {
                    success: Y.bind(function(e) {
                        this.showMessage("success", "Login successful", 4000);
                        this.redirect();
                        return;
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Email/password combination not found", 4000);
                    }, this)
                }
            });
        },
        createAccount: function(data) {
            Y.Wegas.UserFacade.rest.sendRequest({
                request: "/Signup/",
                cfg: {
                    method: "POST",
                    data: data
                },
                on: {
                    success: Y.bind(function(e) {
                        this.showMessage("success", "User created, you can now use it to login", 4000);
                        this.set("mode", "login");
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Error creating user", 4000);
                    }, this)
                }
            });
        },
        sendNewPassword: function(email) {
            Y.Wegas.UserFacade.rest.sendRequest({
                request: "/SendNewPassword/?email=" + email,
                cfg: {
                    method: "POST"
                },
                on: {
                    success: Y.bind(function(e) {
                        this.hideOverlay();
                        this.showMessage("success", "Your new password had been sent", 4000);
                        this.set("mode", "login");
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        this.showMessage("error", e.response.results.message || "Error sent new password", 4000);
                    }, this)
                }
            });
        },
        redirect: function() {
            window.location = this.getRedirect();
        },
        getRedirect: function() {
            return this.getQueryParameter("redirect") || (Y.Wegas.app.get("base") + this.defaultRedirect);
        },
        /**
         * Returns a parameter from the GET parameters.
         */
        getQueryParameter: function(name) {
            var i, pair, query = window.location.search.substring(1),
            vars = query.split("&");

            for (i = 0; i < vars.length; i = i + 1) {
                pair = vars[i].split("=");
                if (pair[0] === name) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return null;
        }

    }, {
        ATTRS: {
            mode: {
                value: "login",
                setter: function(val) {
                    var cb = this.get(CONTENTBOX);

                    if (val === "login") {
                        //this.loginForm.clear();
                        this.loginForm.show();
                        this.createAccountForm.hide();
                        this.sendNewPasswordForm.hide();
                        this.loginButton.set("label", "Login");
                        cb.one(".alt-link").setContent("Create a new user");
                        cb.one(".send-new-password").show();
                    } else if (val === 'createaccount') {
                        this.loginForm.hide();
                        this.createAccountForm.show();
                        this.sendNewPasswordForm.hide();
                        //this.createAccountForm.clear();
                        this.loginButton.set("label", "Submit");
                        cb.one(".alt-link").setContent("Login with existing account");
                        cb.one(".send-new-password").hide();
                    } else {
                        this.loginForm.hide();
                        this.createAccountForm.hide();
                        this.sendNewPasswordForm.show();
                        this.loginButton.set("label", "Submit");
                        cb.one(".alt-link").setContent("Return to the login page");
                        cb.one(".send-new-password").hide();
                    }
                }
            }
        }
    });

    Y.namespace('Wegas').LoginWidget = LoginWidget;
});
