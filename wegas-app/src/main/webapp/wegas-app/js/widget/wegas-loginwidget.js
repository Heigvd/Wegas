/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
        loginButton: null,
        /**
         * Button to submit form
         */
        signUpButton: null,
        /**
         * Button to submit form
         */
        askPassButton: null,
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
            this.loginButton = new Y.Button({
                label: "Login"
            });
            this.loginButton.get(CONTENTBOX).addClass("loginbutton");

            this.signUpButton = new Y.Button({
                label: "Sign in"
            });
            this.signUpButton.get(CONTENTBOX).addClass("signupbutton");

            this.askPassButton = new Y.Button({
                label: "Submit"
            });
            this.askPassButton.get(CONTENTBOX).addClass("askPass");
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

            //Core of the page
            cb.append("<div class='header'>\n\
                    <div class='content'>\n\
                        <div class='left'>\n\
                            <div class='logo'>\n\
                                <img src='../images/wegas-logo_white.png' alt='logo' height='82px' width:'191px';/>\n\
                            </div>\n\
                        </div>\n\
                        <div class='right login'></div>\n\
                    </div>\n\
                </div>\n\
                <div class='content'>\n\
                    <div class='main left'>\n\
                        <h1>Welcom to Wegas</h1>\n\
                        <p>WEGAS (Web Game Authoring System) is a web engine for quick development of simulation games. No programming skills is required, you can create your own scenario or to adapt an existing by adding elements from other simulations. Advanced users can even create their own serious game from A to Z!</p>\n\
                        <div class='preview'><img src='../images/wegas-preview.jpg' alt='preview' height='200px' width='397px'/></div>\n\
                    </div>\n\
                    <div class='main right signup-zone'>\n\
                        <h1 class='title'>Create an account</h1>\n\
                        <div class='signup'></div>\n\
                    </div>\n\
                    <div class='main right ask-pass-zone'>\n\
                        <h1 class='title'>Get a new password</h1>\n\
                        <div class='ask-pass'></div>\n\
                    </div>\n\
                    <div class='footer'>\n\
                        <div class='partner'>\n\
                            <a href='http://www.heig-vd.ch/' target='_blank'><img src='../images/heigvd-logo.png' alt='Heig-vd' height='54px' width='146px'/></a>\n\
                            <a href='http://www.albasim.com' target='_blank'><img src='../images/albasim-logo.png' alt='Albasim' height='54px' width='48px'/></a>\n\
                        </div>\n\
                        <div class='licence'><p>Wegas is an inititive of School of Business <br /> and Engineering Vaud (HEIG-VD) <br /> Wegas is under a MIT licence</p></div>\n\
                        <div class='followus'>\n\
                            <span>Follow us:</span>\n\
                            <a href='https://github.com/Heigvd/Wegas' target='_blank'><img src='../images/github-icon.png' alt='Github' height='30px' width='30px'/></a>\n\
                        </div>\n\
                    </div>\n\
                </div>");

            //create and append login form
            this.loginForm = new Y.inputEx.Group({
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
                        typeInvite: "Password",
                        capsLockWarning: true,
                        className: "password"
                    }, {
                        label: "",
                        type: "boolean",
                        name: "remember",
                        rightLabel: "&nbsp;Remember me",
                        className: "remember"
                    }],
                parentEl: cb.one(".login"),
                className: "logingroup"
            });
            this.loginButton.render(cb.one(".login"));
            cb.one(".login").append('<p class="forgot">Forgot password?</p>');

            //Create and append "sign in" from
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
                        type: "string",
                        showMsg: true,
                        typeInvite: "First name",
                        className: "firstname"
                    }, {
                        name: "lastname",
                        required: true,
                        type: "string",
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
                        typeInvite: "Password",
                        className: "password"
                    }, {
                        name: "passwordConfirm",
                        showMsg: true,
                        required: true,
                        confirm: "password",
                        type: "password",
                        typeInvite: "Password confirmation",
                        className: "passwordc password"
                    }],
                parentEl: cb.one(".signup"),
                className: "signupgroup"
            });
            //To work with inputex, for css
            cb.one(".signup .email").ancestor("div").setStyle("width", "330px");
            cb.one(".signup .password").ancestor("div").setStyle("width", "330px");
            this.signUpButton.render(cb.one(".signup"));

            //Create, append and hide from to ask a new password.
            this.sendNewPasswordForm = new Y.inputEx.Group({
                fields: [{
                        name: "email",
                        required: true,
                        type: "email",
                        typeInvite: "Email",
                        className: "email"
                    }],
                parentEl: cb.one(".ask-pass"),
                className: "ask-pass-group"
            });
            this.askPassButton.render(cb.one(".ask-pass"));
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
            var cb = this.get(CONTENTBOX),
                    inputNode = cb.one("input");

            this.handlers.onAskingPass = cb.delegate("click", function() {
                this.changeRightForms(true);
            }, ".forgot", this);

            this.handlers.onAskingCreate = cb.delegate("click", function() {
                this.changeRightForms(false);
            }, ".return", this);

            this.handlers.onLogin = this.loginButton.on("click", function() {
                var data;
                if (this.loginForm.validate()) {
                    data = this.loginForm.getValue();
                    this.login(data.email, data.password, data.remember);
                }
            }, this);

            this.handlers.onSignUp = this.signUpButton.on("click", function() {
                if (this.createAccountForm.validate()) {
                    this.createAccount(this.createAccountForm.getValue());
                }
            }, this);

            this.handlers.onAskPass = this.askPassButton.on("click", function() {
                var data;
                if (this.sendNewPasswordForm.validate()) {
                    data = this.sendNewPasswordForm.getValue();
                    this.showOverlay();
                    this.sendNewPassword(data.email);
                }
            }, this);
            this.handlers.keypress = this.on("keypress", function(e) {
                if (e.domEvent.keyCode === 13) {
                    this.loginButton.fire("click");
                }
            });
            this.handlers.render = this.after("render", inputNode.focus, inputNode);
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         * Destroy buttons.
         */
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
            this.submitButton.destroy();
            this.askPassButton.destroy();
            this.signUpButton.destroy();
        },
        // *** Private methods *** //
        /**
         * @function
         * @private
         * @param showAskForm, a boolean
         * @description if showAskForm is true, hide "signup" form and "forgot Password" <p/> and show "ask password" form
         * do the opposite else.
         */
        changeRightForms: function(showAskForm) {
            var cb = this.get(CONTENTBOX);
            if (showAskForm) {
                cb.one(".signup-zone").hide();
                cb.one(".forgot").hide();
                cb.one(".ask-pass-zone").show();
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
                        this.changeRightForms(false);
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
        }

    }, {
        /**  @lends Y.Wegas.LoginWidget# */

        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li> - no one - </li>
         * </ul>
         */
        ATTRS: {}
    });
    Y.namespace('Wegas').LoginWidget = LoginWidget;

    /**
     * Hack because "typeInvite" and password work bad (typeInvite is hid)
     * Password field needs a "password" class.
     */
    Y.inputEx.StringField.prototype.updateTypeInvite = function() {

        // field not focused
        if (!Y.one(this.divEl).hasClass("inputEx-focused")) {

            // show type invite if field is empty
            if (this.isEmpty()) {
                Y.one(this.divEl).addClass("inputEx-typeInvite");
                if (this.fieldContainer.className.indexOf("password") > -1) {
                    this.el.setAttribute("type", "");
                }
                this.el.value = this.options.typeInvite;

                // important for setValue to work with typeInvite
            } else {
                if (this.fieldContainer.className.indexOf("password") > -1) {
                    this.el.setAttribute("type", "password");
                }
                Y.one(this.divEl).removeClass("inputEx-typeInvite");
            }

            // field focused : remove type invite
        } else {
            if (Y.one(this.divEl).hasClass("inputEx-typeInvite")) {
                // remove text
                this.el.value = "";
                // remove the "empty" state and class
                this.previousState = null;
                if (this.fieldContainer.className.indexOf("password") > -1) {
                    this.el.setAttribute("type", "password");
                }
                Y.one(this.divEl).removeClass("inputEx-typeInvite");

            }
        }
    };
});
