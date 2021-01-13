/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add("wegas-userpreferences", function(Y) {
    "use strict";

    var UserPreferences = Y.Base.create("wegas-userpreferences", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            this.afterHostEvent("render", function() {
                var k, entity = Y.Wegas.Facade.User.cache.get("currentUser").getMainAccount(),
                    host = this.get("host"),
                    fieldsToIgnore = [];

                host.get("boundingBox").addClass("userPreferences");

                for (k in entity.toObject()) {                                  //hide ineditable fields
                    if (k !== 'firstname' && k !== 'lastname' && k !== 'username'
                        && k !== 'password' && k !== 'submit') {
                        fieldsToIgnore.push(k);
                    }
                }

                host.set("cfg", entity.getFormCfg(fieldsToIgnore))
                    .set("values", entity.toObject());
            });

            this.onHostEvent("submit", function(e) {
                this.get("host").showOverlay();
                this.sendUpdate();
            }, this);
        },
        sendUpdate: function() {
            var user = Y.Wegas.Facade.User.get("currentUser").getMainAccount().toObject(),
                host = this.get("host"),
                updatedAccount = Y.mix(host.get('form').getValue(), user);//need to send an "JpAccount", thus merge account and updates

            Y.Wegas.Facade.User.sendRequest({
                request: "/Account/" + updatedAccount.id,
                cfg: {
                    method: "PUT",
                    data: updatedAccount
                },
                on: {
                    success: Y.bind(function(e) {
                        this.showMessage("success", "Your account has been successfully updated", 4000);
                        this.hideOverlay();
                    }, host),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Error updating user");
                        this.hideOverlay();
                    }, host)
                }
            });
        }
    }, {
        NS: "UserPreferences"
    });
    Y.Plugin.UserPreferences = UserPreferences;
});