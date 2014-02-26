/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>, Benjamin Gerber <ger.benjamin@gmail.com>
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
        CONTENT_TEMPLATE: "<div><a href=\"https://github.com/Heigvd/Wegas\"><img style=\"position: absolute; top: 0; left: 0; border: 0;\" src=\"https://s3.amazonaws.com/github/ribbons/forkme_left_white_ffffff.png\" alt=\"Fork me on GitHub\"></a>\n\
               <div class='wegas-login-header'>\n\
                    <div class='content'>\n\
                        <div class='left'>\n\
                            <div class='logo'>\n\</div>\n\
                        </div>\n\
                        <div class='right login'></div>\n\
                    </div>\n\
                </div>\n\
                <div class='content'>\n\
                    <div class='main left'>\n\
                      </div>\n\
                    <div class='main right signup-zone'>\n\
                        <h1 class='title'>Create an account</h1>\n\
                        <div class='signup'></div>\n\
                        <h1 class='title'>Try Wegas</h1>\n\
                        <div class='guestlogin'></div>\n\
                    </div>\n\
                    <div class='main right ask-pass-zone'>\n\
                        <h1 class='title'>Get a new password</h1>\n\
                        <div class='ask-pass'></div>\n\
                    </div>\n\
                    <div class='footer'>\n\
                        <div class='partner'>\n\
                            <a href='http://www.heig-vd.ch/' target='_blank'><div class='heigvd'></div></a>\n\
                          </div>\n\
                        <div class='licence'><p>Wegas is an inititive of School of Business <br /> and Engineering Vaud (HEIG-VD) <br /> Wegas is under a MIT licence</p></div>\n\
                        <div class='followus'>\n\
                  <a href='http://www.albasim.com' target='_blank'><div class='albasim'></div></a>\n\
                            </div>\n\
                    </div>\n\
                </div></div>",
        // *** Private fields *** //
        /**
         * Default link to redirect user
         */
        defaultRedirect: "index.html",
        // *** Lifecycle Methods *** //
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
            if (Y.Lang.isNumber(cUser)) {
                //if (cUser && cUser.getMainAccount() instanceof Y.Wegas.persistence.GuestJpaAccount) {
                this.showMessage("success", "You are already logged in.");
                this.redirect();
            }

            if (Y.Wegas.Helper.getURLParameter("redirect").indexOf("token") > -1) {
                cb.one(".main.left").setContent("<h1>Welcome to Wegas</h1>You need to log in or create an account to see this game.");
            } else {
                cb.one(".main.left").setContent("<h1>Welcome to Wegas</h1>\n\
                        <p>WEGAS (Web Game Authoring System) is a web engine for quick development of simulation games.\n\
                         No programming skills is required, you can create your own scenario or adapt an existing one by \n\
                        adding elements from other simulations. Advanced users can even create their own serious game from A\n\
                         to Z!</p>\n\
                        <div class='preview'><img src='../images/wegas-preview.jpg' alt='preview' height='254px' width='633px'/></div>\n");
            }

            this.loginForm = new Y.inputEx.Group({//                            //create and append login form
                fields: [{
                        name: "email",
                        required: true,
                        type: "email",
                        typeInvite: "Email",
                        className: "email"
                    }, {
                        name: "password",
                        required: true,
                        type: "password",
                        typeInvite: "Password", // Does not work in inputex
                        capsLockWarning: true,
                        className: "password"
                    }, {
                        type: "boolean",
                        name: "remember",
                        rightLabel: "&nbsp;Remember me",
                        className: "remember"
                    }],
                parentEl: cb.one(".login"),
                className: "logingroup"
            });
            this.loginButton = new Y.Button({
                label: "Log in",
                render: cb.one(".login")
            });

            cb.one(".login").append('<p class="forgot">Forgot password?</p>');
            cb.one(".logingroup .password").ancestor("div").setStyle("width", "90px");


            this.createAccountForm = new Y.inputEx.Group({//                    // Create and append "sign in" from
                fields: [{
                        name: "id",
                        type: "hidden"
                    }, {
                        name: "@class",
                        required: true,
                        type: "hidden",
                        value: "JpaAccount"
                    }, {
                        name: "firstname",
                        required: true,
                        showMsg: true,
                        typeInvite: "First name",
                        className: "firstname"
                    }, {
                        name: "lastname",
                        required: true,
                        showMsg: true,
                        typeInvite: "Last name",
                        className: "lastname"
                    }, {
                        name: "email",
                        required: true,
                        type: "email",
                        showMsg: true,
                        typeInvite: "Email",
                        className: "email"
                    }, {
                        name: "password",
                        strengthIndicator: true,
                        capsLockWarning: true,
                        id: "password",
                        required: true,
                        type: "password",
                        showMsg: true,
                        typeInvite: "Password", // Does not work in inputex
                        className: "password"
                    }, {
                        name: "passwordConfirm",
                        showMsg: true,
                        required: true,
                        confirm: "password",
                        type: "password",
                        typeInvite: "Password confirmation", // Does not work in inputex
                        className: "passwordc password"
                    }],
                parentEl: cb.one(".signup"),
                className: "signupgroup"
            });
//            Y.all(".password input").setAttribute("placeholder", "Password");
//            Y.all(".passwordc input").setAttribute("placeholder", "Password confirmation");
            //To work with inputex, for css
            cb.one(".signup .email").ancestor("div").setStyle("width", "330px");
            cb.one(".signup .password").ancestor("div").setStyle("width", "330px");

            this.signUpButton = new Y.Button({
                label: "Sign in",
                render: cb.one(".signup")
            });

            this.guestLoginButton = new Y.Wegas.Button({
                label: "Log in as guest",
                render: cb.one(".signup-zone .guestlogin")
            });

            this.sendNewPasswordForm = new Y.inputEx.Group({//                  // Create, append and hide from to ask a new password.
                fields: [{
                        name: "email",
                        required: true,
                        type: "email",
                        typeInvite: "Email",
                        className: "email"
                    }],
                parentEl: cb.one(".ask-pass")
            });
            this.askPassButton = new Y.Button({
                label: "Submit",
                render: cb.one(".ask-pass")
            });
            cb.one(".ask-pass").append('<p class="return">Create an account</p>');
            cb.one(".ask-pass-zone").hide();
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * Bind loginButton with login methode.
         * Bind signUpButton with createAccount methode.
         * Bind askPassButton with sendNewPasswordForm methode.
         * Bind loginButton with logn methode.
         * When return key is pressed, click on submitButton by a fire event.
         * When widget is render, set focus to 'input' node.
         */
        bindUI: function() {
            var cb = this.get(CONTENTBOX);

            cb.delegate("click", function() {
                this.changeRightForms(true);
            }, ".forgot", this);

            cb.delegate("click", function() {
                this.changeRightForms(false);
            }, ".return", this);

            this.loginButton.on("click", function() {
                var data;
                if (this.loginForm.validate()) {
                    data = this.loginForm.getValue();
                    this.login(data.email, data.password, data.remember);
                } else {
                    this.showMessageBis("error", "Invalid email/password combination", 4000);
                }
            }, this);

            this.signUpButton.on("click", function() {
                if (this.createAccountForm.validate()) {
                    this.createAccount(this.createAccountForm.getValue());
                } else {
                    this.showMessageBis("error", "Please correct form fields", 4000);
                }
            }, this);

            this.guestLoginButton.on("click", this.guestLogin, this);

            this.askPassButton.on("click", function() {
                var data;
                if (this.sendNewPasswordForm.validate()) {
                    data = this.sendNewPasswordForm.getValue();
                    this.showOverlay();
                    this.sendNewPassword(data.email);
                }
            }, this);

            cb.on("key", Y.bind("fire", this.loginButton, "click"), "enter");   // Log in on "enter" key press
            //cb.one("input").focus();                                          // Focus on log in input
            this.after("render", cb.one("input").focus, cb.one("input"));       // Focus on log in input
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         * Destroy buttons.
         */
        destructor: function() {
            this.loginButton.destroy();
            this.submitButton.destroy();
            this.askPassButton.destroy();
            this.signUpButton.destroy();
            this.sendNewPasswordForm.destroy();
            this.createAccountForm.destroy();
        },
        // *** Private methods *** //
        /**
         * @function
         * @private
         * @param {boolean} showAskForm 
         * @description if showAskForm is true, hide "signup" form and "forgot Password" <p/> and show "ask password" form
         * do the opposite else.
         */
        changeRightForms: function(showAskForm) {
            var cb = this.get(CONTENTBOX);
            if (showAskForm) {
                cb.one(".ask-pass-zone").show();
                cb.one(".signup-zone").hide();
                cb.one(".forgot").hide();
            } else {
                cb.one(".ask-pass-zone").hide();
                cb.one(".signup-zone").show();
                cb.one(".forgot").show();
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
                        this.showMessage("success", "Login successful");
                        this.redirect();
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Email/password combination not found", 6000);
                    }, this)
                }
            });
        },
        guestLogin: function() {
            Y.Wegas.Facade.User.sendRequest({
                request: "/GuestLogin/",
                cfg: {
                    method: "POST"
                },
                on: {
                    success: Y.bind(function(e) {
                        this.showMessage("success", "Login successful");
                        this.redirect();
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Guest login failed", 6000);
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
                        //this.showMessage("success", "User created", 6000);
                        //this.set("mode", "login");
                        this.login(data.email, data.password, false);
                    }, this, data),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Error creating user");
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
                        this.showMessage("success", "A new password has been sent", 4000);
                        this.changeRightForms(false);
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        this.showMessage("error", e.response.results.message || "Error sending new password", 4000);
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
            return Y.Wegas.Helper.getURLParameter("redirect") || (Y.Wegas.app.get("base") + this.defaultRedirect);
        }
    });
    Y.namespace('Wegas').LoginWidget = LoginWidget;
    /**
     * Hack because "typeInvite" and password work bad (typeInvite is hid)
     * Password field needs a "password" class.
     * Change color property (in grey) when input is not focused (black else)
     */
    Y.inputEx.StringField.prototype.updateTypeInvite = function() {
        var divEl = Y.one(this.divEl);
        if (!this._fakePass && this.options.typeInvite) {
            this._fakePass = Y.Node.create("<input type='text'>");
            this._fakePass.setAttribute("class", this.el.getAttribute("class"));
            this._fakePass.hide();
            Y.one(this.el).ancestor().prepend(this._fakePass);
            this._fakePass.on("focus", function() {
                Y.one(this.el).show();
                this._fakePass.hide();
                Y.one(this.el).focus();
            }, this);
        }

        // field not focused
        if (!divEl.hasClass("inputEx-focused")) {

            // show type invite if field is empty
            if (this.isEmpty()) {
                divEl.addClass("inputEx-typeInvite")
                        .all("input").setStyle("color", "#888");
                if (this.fieldContainer.className.indexOf("password") > -1) {
//                    Y.one(this.el).setAttribute("type", "");
                    Y.one(this.el).hide();
                    this._fakePass.show();
                    this._fakePass.set("value", this.options.typeInvite);
                }
                this.el.value = this.options.typeInvite;

                // important for setValue to work with typeInvite
            } else {
                if (this.fieldContainer.className.indexOf("password") > -1) {
                    //this.el.setAttribute("type", "password");
                    Y.one(this.el).show();
                    this._fakePass.hide();
                }
                divEl.removeClass("inputEx-typeInvite")
                        .one("input").setStyle("color", "#000");
            }

            // field focused : remove type invite
        } else {
            if (divEl.hasClass("inputEx-typeInvite")) {
                // remove text
                this.el.value = "";
                // remove the "empty" state and class
                this.previousState = null;
                if (this.fieldContainer.className.indexOf("password") > -1) {
                    //Y.one(this.el).setAttribute("type", "password");
                    Y.one(this.el).show();
                    this._fakePass.hide();
                }
                divEl.one("input").setStyle("color", "#000");
                divEl.removeClass("inputEx-typeInvite");
            }
        }
    };
});
