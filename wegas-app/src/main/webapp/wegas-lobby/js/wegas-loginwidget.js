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
        Wegas = Y.Wegas, LoginWidget;

    /**
     * @name Y.Wegas.LoginWidget
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @class class to manage the login of a user.
     * @constructor
     * @description Widget to display some forms relative to 'login' like
     *  login itself, forgot password and create a new user.
     */
    LoginWidget = Y.Base.create("wegas-loginwidget", Y.Widget, [Y.WidgetChild, Wegas.Widget], {
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
                        <h1 class='title'>Want to use Wegas?</h1>\n\
                        <div class='contact'><a href=\"http://www.albasim.ch/en/contact/contact\">Contact us</a></div>\n\
                    </div>\n\
                    <div class='main right ask-pass'>\n\
                        <h1 class='title'>Get a new password</h1>\n\
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
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description render du submit button.
         * display link to display other form than default one.
         * Call 'redirect' function if user is alread logged.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX), token, p,
                askPassNode = cb.one(".ask-pass"),
                redirect = decodeURIComponent(Wegas.Helper.getURLParameter("redirect"));

            if (redirect.indexOf("token=") > -1) {// If the user is trying to acces a specific game
                Y.Array.find(redirect.split("?")[1].split("&"), function(c) {
                    p = c.split("=");
                    if (p[0] === "token") {
                        return token = p[1];
                    }
                });
                cb.one(".main.left").setContent("<h1>Want to test this game ?</h1><p class='wegas-testgame'>Please login as guest or with your personal account.</p>");
                Wegas.Facade.Game.sendRequest({
                    request: "/FindByToken/" + token,
                    on: {
                        success: Y.bind(function(e) {
                            cb.one(".main.left").append("<div class=login-gameInformation>" + Wegas.GameInformation.renderGameInformation(e.response.entities[0]) + "</div>");
                        }, this),
                        failure: Y.bind(this.defaultFailureHandler, this)
                    }
                });
            } else {
                var content = ["<h1>Welcome to Wegas</h1>\n\
                        <p>A <b>Web Game Authoring System</b> for rapid development of serious games without programming skills.</p>"
                        + "<ul class='description'><li>Create and edit your games</li>"
                        + "<li>Share your games with other trainers</li>"
                        + "<li>Use your games during training sessions or in distant e-learning programs</li></ul>"
                        + "<h2>Sample games</h1>"
                        + '<div class="wegas-login-thumb"><ul>'];

                Y.Array.each(Wegas.Facade.PublicGames.cache.findAll(), function(g) {
                    var add = "";
                    switch (g.get("token")) {
                        case "proggame":
                            add = '| <a href="#" class="wegas-light-gallery" >Screenshots'
                                + '<img data-src="wegas-lobby/images/wegas-proggame-1.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-proggame-2.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-proggame-3.png" style="display:none">'
                                + '</a>';
                            break
                        case "virtualpatient":
                            add = '| <a href="#" class="wegas-light-gallery" >Screenshots'
                                + '<img data-src="wegas-lobby/images/wegas-virtualpatient-1.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-virtualpatient-2.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-virtualpatient-3.png" style="display:none">'
                                + '</a>';
                            break;
                        case "leaderway":
                            add = '| <a href="#" class="wegas-light-gallery" >Screenshots'
                                + '<img data-src="wegas-lobby/images/wegas-leaderway-1.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-leaderway-2.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-leaderway-3.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-leaderway-4.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-leaderway-6.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-leaderway-7.png" style="display:none">'
                                + '<img data-src="wegas-lobby/images/wegas-leaderway-8.png" style="display:none">'
                                + '</a>';
                            break;
                    }

                    content.push('<li><div class="article-link"><span class="text">'
                        + '<span class="article-title">' + g.get("gameModelName") + '</span>'
                        + '<span class="description">' + g.get("description") + '</span>'
                        + '<span class="links"><a href="game.html?token=' + g.get("token") + '&al=true">Start playing</a> '
                        + add
                        + "</span></span>"
                        + '<span class="image"><span class="image-offset">'
                        + '<img src="' + (g.get("properties.imageUri") || "wegas-lobby/images/wegas-game-thumb.png") + '" /></span></span></div></li>');
                });
                content.push('</ul></div>');
                cb.one(".main.left").setContent(content.join(""));
            }

            // Create and append login form
            this.loginForm = new Y.inputEx.Group({
                fields: [{
                        name: "email",
                        required: true,
                        type: "string",
                        typeInvite: "Email or username",
                        className: "inputEx-Field email"
                    }, {
                        name: "password",
                        required: true,
                        type: "password",
                        typeInvite: "Password", //                              //Does not work in inputex
                        capsLockWarning: true,
                        wrapperClassName: "inputEx-fieldWrapper password"
                    }, {
                        type: "boolean",
                        name: "remember",
                        rightLabel: "&nbsp;Remember me",
                        className: "inputEx-Field remember",
                        value: true
                    }],
                parentEl: cb.one(".login")
            });
            this.loginButton = new Y.Button({
                label: "Log in"
            }).render(cb.one(".login"));
            cb.one(".login").append('<a class="forgot">Forgot password?</a>');

            // Create and append "sign in" from
            this.createAccountForm = new Y.inputEx.Group({
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
                        className: "inputEx-Field firstname"
                    }, {
                        name: "lastname",
                        required: true,
                        showMsg: true,
                        typeInvite: "Last name",
                        className: "inputEx-Field lastname"
                    }, {
                        name: "email",
                        required: true,
                        type: "email",
                        showMsg: true,
                        typeInvite: "Email",
                        wrapperClassName: 'inputEx-fieldWrapper email'
                    }, {
                        name: "password",
                        //strengthIndicator: true,
                        capsLockWarning: true,
                        id: "password",
                        required: true,
                        type: "password",
                        showMsg: true,
                        typeInvite: "Password", //                              // Does not work in inputex, c.f. hack below
                        wrapperClassName: "inputEx-fieldWrapper password"
                            //}, {
                            //    name: "passwordConfirm",
                            //    showMsg: true,
                            //    required: true,
                            //    confirm: "password",
                            //    type: "password",
                            //    typeInvite: "Password confirmation" //            // Does not work in inputex, c.f. hack below
                    }],
                parentEl: cb.one(".signup")
            });
            this.signUpButton = new Y.Button({
                label: "Sign in"
            }).render(cb.one(".signup"));
            this.guestLoginButton = new Wegas.Button({
                label: "Log in as guest"
            }).render(cb.one(".signup-zone .guestlogin"));
            this.guestTeacherLoginButton = new Wegas.Button({
                label: "Log in as guest teacher"
            }).render(cb.one(".signup-zone .guestlogin"));

            // Create, append and hide from to ask a new password.
            this.sendNewPasswordForm = new Y.inputEx.Group({
                fields: [{
                        name: "email",
                        required: true,
                        type: "email",
                        typeInvite: "Email",
                        className: "inputEx-Field email"
                    }],
                parentEl: askPassNode
            });
            this.askPassButton = new Y.Button({
                label: "Submit"
            }).render(askPassNode);
            askPassNode.append('<a class="return">Create an account</a>');
            askPassNode.hide();
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

            cb.delegate("click", Y.bind(this.changeRightForms, this, true), ".forgot");// Display password recovery form on link click
            cb.delegate("click", Y.bind(this.changeRightForms, this, false), ".return");// Display back create account form on link click

            this.loginButton.on("click", function() {                           // Log in click event
                if (this.loginForm.validate()) {
                    var data = this.loginForm.getValue();
                    this.login(data.email, data.password, data.remember);
                } else {
                    this.showMessageBis("error", "Invalid email, username or password", 4000);
                }
            }, this);

            this.signUpButton.on("click", function() {                          // Sign up click event
                if (this.createAccountForm.validate()) {
                    this.createAccount(this.createAccountForm.getValue());
                } else {
                    this.showMessageBis("error", "Please correct form fields", 4000);
                }
            }, this);

            this.guestLoginButton.on("click", Y.bind(this.loginRequest, this,
                "/GuestLogin/"));                                               // Guest login click even
            this.guestTeacherLoginButton.on("click", Y.bind(this.loginRequest, this,
                "/TeacherGuestLogin/"));                                        // Teacher guest login click event

            this.askPassButton.on("click", function() {                         // Password recovery click event
                if (this.sendNewPasswordForm.validate()) {
                    var data = this.sendNewPasswordForm.getValue();
                    this.showOverlay();
                    this.sendNewPassword(data.email);
                }
            }, this);

            cb.on("key", Y.bind("fire", this.loginButton, "click"), "enter");   // Log in on "enter" key press
            //this.after("render", cb.one("input").focus, cb.one("input"));     // Focus on log in input by default
            //cb.one("input").focus();                                          // Focus on log in input by default
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
            cb.one(".ask-pass").toggleView(showAskForm);
            cb.one(".signup-zone").toggleView(!showAskForm);
            cb.one(".forgot").toggleView(!showAskForm);
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
            this.loginRequest("/Authenticate/?email=" + email + "&password=" + password + "&remember=" + remember);
        },
        loginRequest: function(url) {
            Wegas.Facade.User.sendRequest({
                request: url,
                cfg: {
                    method: "POST"
                },
                on: {
                    success: Y.bind(function(e) {
                        //this.showMessage("success", "Login successful");
                        window.location = Wegas.Helper.getURLParameter("redirect") || Wegas.app.get("base");
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Email, username or password not found.", 6000);
                        //this.showMessage("error", e.response.results.message || "Guest login failed", 6000);
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
            Wegas.Facade.User.sendRequest({
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
            Wegas.Facade.User.sendRequest({
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
        }
    });
    Wegas.LoginWidget = LoginWidget;

    /**
     * @Hack because "typeInvite" and password don't work (typeInvite is hidden)
     * Change color property (in grey) when input is not focused (black else)
     */
    Y.inputEx.PasswordField.prototype.updateTypeInvite = function() {
        var divEl = Y.one(this.divEl);
        if (!this._fakePass && this.options.typeInvite) {
            this._fakePass = Y.Node.create("<input type='text'>");
            this._fakePass.set("value", this.options.typeInvite);
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
                divEl.addClass("inputEx-typeInvite");
                Y.one(this.el).hide();
                this._fakePass.show();
                this.el.value = this.options.typeInvite;
                // important for setValue to work with typeInvite
            } else {
                Y.one(this.el).show();
                this._fakePass.hide();
                divEl.removeClass("inputEx-typeInvite");
            }
            // field focused : remove type invite
        } else {
            if (divEl.hasClass("inputEx-typeInvite")) {
                // remove text
                this.el.value = "";
                // remove the "empty" state and class
                this.previousState = null;
                Y.one(this.el).show();
                this._fakePass.hide();
                divEl.removeClass("inputEx-typeInvite");
            }
        }
    };
});
