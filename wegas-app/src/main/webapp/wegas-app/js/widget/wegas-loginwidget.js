/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-loginwidget', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
            LoginWidget;

    /**
     * @name Y.Wegas.LoginWidget
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @class class to manage the login of a user.
     * @constructor
     * @description Widget to display some forms relative to 'login' like
     *  login itself, forgot password and create a new user.
     */
    LoginWidget = Y.Base.create("wegas-loginwidget", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.LoginWidget#
         */
        // *** Private fields *** //
        /**
         * Default link to redirect user
         */
        defaultRedirect: "wegas-app/view/lobby.html",
        /**
         * form group to login
         */
        loginForm: null,
        /**
         * form group to create account
         */
        createAccountForm: null,
        /**
         * form group to send a new password
         */
        sendNewPasswordForm: null,
        /**
         * Button to submit form
         */
        submitButton: null,
        /**
         * Entered email
         */
        email: null,
        /**
         * Reference to each used functions
         */
        handlers: null,
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         * init the submit button.
         * init all the three forms groups
         */
        initializer: function() {
            var cb = this.get(CONTENTBOX);
            this.handlers = {};
            this.submitButton = new Y.Button();
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
        },
        /**
         * @function
         * @private
         * @description render du submit button.
         * display link to display other form than default one.
         * Call 'redirect' function if user is alread logged.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                    cUser = Y.Wegas.app.get("currentUser");

            if (cUser.accounts[0]["@class"] !== "GuestJpaAccount") {
                this.showMessage("success", "You are already logged in.", 4000);
                this.redirect();
            }

            this.submitButton.render(cb);
            cb.append('<div class="links" style="margin-left: 136px;margin-top:10px;">'
                    + '<p><a class="alt-link" href="#"></a></p>'
                    + '<p><a class="send-new-password" href="#">Forgot your password?</a></p>'
                    + '</div>');
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When node alt-link is clicked, do toggleCreateAccount.
         * When node send-new-password is clicked, do toggleSendNewPassword.
         * When submit button is clicked, do onSubmit;
         * When return key is pressed, click on submitButton by a fire event.
         * When widget is render, set focus to 'input' node.
         */
        bindUI: function() {
            var cb = this.get(CONTENTBOX),
                    inputNode = cb.one("input");

            this.handlers.toggleCreateAccount = cb.one(".alt-link").on("click", this.toggleCreateAccount, this);
            this.handlers.toggleSendNewPassword = cb.one(".send-new-password").on("click", this.toggleSendNewPassword, this);

            this.handlers.onSubmit = this.submitButton.on("click", this.onSubmit, this);
            this.handlers.keypress = this.on("keypress", function(e) {
                if (e.domEvent.keyCode === 13) {
                    this.submitButton.fire("click");
                }
            });
            this.handlers.render = this.after("render", inputNode.focus, inputNode);
        },
        /**
         * @function
         * @private
         * @description set the displayed form with the current form
         */
        syncUI: function() {
            this.set("mode", this.get("mode"));
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
        // *** Private methods *** //
        /**
         * @function
         * @private
         * @description toggle mode to createAccount or login one.
         */
        toggleCreateAccount: function() {
            if (this.get("mode") === "login") {
                this.set("mode", "createaccount");
            } else {
                this.set("mode", "login");
            }
        },
        /**
         * @function
         * @private
         * @description toggle mode to sendNewPassword or login one.
         */
        toggleSendNewPassword: function() {
            if (this.get("mode") === "login") {
                this.set("mode", "sendNewPassword");
            } else {
                this.set("mode", "login");
            }
        },
        /**
         * @function
         * @private
         * @param e
         * @description On submit, call function depending on the current mode :
         * Mode login, call function login.
         * Mode createaccount, call function createaccount.
         * Mode sendNewPassword, call function sendNewPassword.
         */
        onSubmit: function(e) {
            var data;
            switch (this.get("mode")) {
                case "login":
                    if (this.loginForm.validate()) {
                        data = this.loginForm.getValue();
                        this.login(data.email, data.password, data.remember);
                    }
                    break;

                case "createaccount":
                    if (this.createAccountForm.validate()) {
                        this.createAccount(this.createAccountForm.getValue());
                    }
                    break;

                case "sendNewPassword":
                    if (this.sendNewPasswordForm.validate()) {
                        data = this.sendNewPasswordForm.getValue();
                        this.showOverlay();
                        this.sendNewPassword(data.email);
                    }
                    break;
            }
        },
        /**
         * @function
         * @private
         * @param email
         * @param password
         * @param remember
         * @description Send REST request to login a user with form's values
         *  informations.
         */
        login: function(email, password, remember) {
            Y.Wegas.Facade.User.sendRequest({
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
        /**
         * @function
         * @private
         * @param data
         * @description Send REST request to create a new account based on the
         *  form's values
         */
        createAccount: function(data) {
            Y.Wegas.Facade.User.sendRequest({
                request: "/Signup/",
                cfg: {
                    method: "POST",
                    data: data
                },
                on: {
                    success: Y.bind(function(data, e) {
                        this.showMessage("success", "User created, you can now use it to login", 4000);
                        //this.set("mode", "login");
                        this.login(data.email, data.password, false);
                    }, this, data),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Error creating user", 4000);
                    }, this)
                }
            });
        },
        /**
         * @function
         * @private
         * @param email
         * @description Send REST request to set and set a new password for
         *  the user.
         */
        sendNewPassword: function(email) {
            Y.Wegas.Facade.User.sendRequest({
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
        /**
         * @function
         * @private
         * @description redirect the user to a page given by the function 'getRedirect'
         */
        redirect: function() {
            window.location = this.getRedirect();
        },
        /**
         * @function
         * @private
         * @return url to redirect
         * @description return redirection given by the function
         *  'getQueryParameter' or by the default redirection.
         */
        getRedirect: function() {
            return this.getQueryParameter("redirect") || (Y.Wegas.app.get("base") + this.defaultRedirect);
        },
        /**
         * @function
         * @private
         * @param name
         * @return null or url
         * @description Returns a parameter from the GET parameters (from
         *  url obviously).
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
        },
        /**
         * @function
         * @private
         * @param form, the setted form.
         * @description Get current value of email field in current view (if defined), and
         * put it in email fields of all views.
         */
        keepEmail: function(form) {
            if (!form || !form.getValue() || !form.getValue().email) {
                return;
            }
            this.email = form.getValue().email;
            this.loginForm.getFieldByName("email").setValue(this.email);
            this.createAccountForm.getFieldByName("email").setValue(this.email);
            this.sendNewPasswordForm.getFieldByName("email").setValue(this.email);
        }

    }, {
        /**  @lends Y.Wegas.LoginWidget# */

        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>Mode: login, createaccount or sendNewPassword, setter change
         *     the mode and thus, the displayed form</li>
         * </ul>
         */
        ATTRS: {
            mode: {
                value: "login",
                setter: function(val) {
                    var cb = this.get(CONTENTBOX), oldVal = this.get("mode");
                    if (oldVal === "login") {
                        this.keepEmail(this.loginForm);
                    } else if (oldVal === "createaccount") {
                        this.keepEmail(this.createAccountForm);
                    } else {
                        this.keepEmail(this.sendNewPasswordForm);
                    }
                    if (val === "login") {
                        //this.loginForm.clear();
                        this.loginForm.show();
                        this.createAccountForm.hide();
                        this.sendNewPasswordForm.hide();
                        this.submitButton.set("label", "Login");
                        cb.one(".alt-link").setContent("Create a new user");
                        cb.one(".send-new-password").show();
                    } else if (val === 'createaccount') {
                        this.loginForm.hide();
                        this.createAccountForm.show();
                        this.sendNewPasswordForm.hide();
                        //this.createAccountForm.clear();
                        this.submitButton.set("label", "Submit");
                        cb.one(".alt-link").setContent("Login with existing account");
                        cb.one(".send-new-password").hide();
                    } else {
                        this.loginForm.hide();
                        this.createAccountForm.hide();
                        this.sendNewPasswordForm.show();
                        this.submitButton.set("label", "Submit");
                        cb.one(".alt-link").setContent("Return to the login page");
                        cb.one(".send-new-password").hide();
                    }
                }
            }
        }
    });
    Y.namespace('Wegas').LoginWidget = LoginWidget;

});
