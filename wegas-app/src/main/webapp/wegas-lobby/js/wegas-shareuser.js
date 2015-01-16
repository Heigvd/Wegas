/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-shareuser', function(Y) {
    'use strict';
    var CONTENTBOX = 'contentBox', ShareUser, Wegas = Y.Wegas;

    ShareUser = Y.Base.create("wegas-shareuser", Y.Widget, [Y.WidgetChild, Wegas.Editable, Wegas.Widget], {
        /**
         *
         */
        CONTENT_TEMPLATE: "<div>"
            + "<div class=\"title\">Name<span style=\"width: 152px;display: inline-block;\"></span>Permissions</div>"
            + "<div class=\"wegas-userlist\"></div>"
            + "<div class=\"wegas-adduser\"><div class=\"title\">Add user</div></div></div>",
        /**
         *
         */
        renderUI: function() {
            var el = this.get(CONTENTBOX),
                e = this.get("entity"),
                resultTemplate = "{firstname} {lastname} {username} <p class='email'>{email}</p>",
                permissions = [{
                        name: "username",
                        type: 'markup',
                        readonly: true,
                        className: "username-field"
                    }, {
                        name: "userId",
                        type: "hidden"
                    }],
                autoCompleteCfg = {
                    minQueryLength: 2,
                    maxResults: 30,
                    resultFormatter: function(query, results) {
                        return Y.Array.map(results, function(result) {
                            return Y.Lang.sub(resultTemplate, {
                                firstname: result.highlighted.firstname,
                                lastname: result.highlighted.lastname,
                                email: result.highlighted.email,
                                username: result.highlighted.username
                            });
                        });
                    },
                    resultHighlighter: function(query, results) {
                        var tokens = query.split(" ");
                        return Y.Array.map(results, function(result) {
                            var rH = {};
                            rH['firstname'] = Y.Highlight.all(result.raw.get("firstname"), tokens);
                            rH['lastname'] = Y.Highlight.all(result.raw.get("lastname"), tokens);
                            rH['email'] = Y.Highlight.all(result.raw.get("email"), tokens);
                            if (result.raw.username) {
                                rH['username'] = "(" + Y.Highlight.all(result.raw.get("username"), tokens) + ")";
                            } else {
                                rH['username'] = "";
                            }
                            return rH;
                        });
                    },
                    source: Y.bind(function(query, callback) {
                        this.autocompleteRequest(query, callback);
                    }, this),
                    enableCache: false,
                    resultListLocator: Y.bind(function(responses) {
                        Y.Array.each(this.userList.subFields, function(user) {
                            responses = this.resultListLocator(user.getValue().userId, responses);
                        }, this);
                        return responses;
                    }, this)
                };

            permissions = permissions.concat(Y.Array.map(this.get("permsList"), function(item) {
                item.type = "boolean";
                return item;
            }));

            this.userList = new UserPermissionList({
                elementType: {
                    type: 'permissiongroup',
                    fields: permissions,
                    className: "permission-group"
                },
                parentEl: el.one(".wegas-userlist")
            });

            this.userList.currentWidget = this;

            if (e instanceof Wegas.persistence.GameModel) {
                this.userList.targetEntityId = "gm" + e.get("id");
            } else {
                this.userList.targetEntityId = "g" + e.get("id");
            }

            this.autocompleteValue = [];
            this.typeInviteValue = "e-mail, name or lastname";

            this.searchAccount = new Y.inputEx.ListField({
                parentEl: this.get("contentBox").one(".wegas-adduser"),
                elementType: {
                    type: "group",
                    fields: [{
                            name: "@class",
                            type: "hidden",
                            value: "JpaAccount"
                        }, {
                            name: "id",
                            type: "hidden"
                        }, {
                            name: "firstname",
                            typeInvite: this.typeInviteValue,
                            type: "autocomplete",
                            autoComp: autoCompleteCfg,
                            required: true,
                            allowFreetext: true
                        }, {
                            name: "lastname",
                            type: "string",
                            typeInvite: "",
                            //required: true,
                            readonly: true
                        }, {
                            name: "email",
                            type: "hidden"
                        }]
                }
            });

            this.saveButton = new Wegas.Button({
                label: "Add"
            }).render(el.one(".wegas-adduser"));
            this.clearButton = new Wegas.Button({
                label: "Clear"
            }).render(el.one(".wegas-adduser"));


            this.loadPermissions();
        },
        syncUI: function() {
            this.clearForm();
        },
        updateAutoCompletes: function() {
            Y.one(this.searchAccount.divEl).all(".inputEx-ListField-delButton").remove(true); // Remove delete button
            var i, j, sBtn = this.saveButton;
            for (i = 0; i < this.searchAccount.subFields.length; i++) {
                for (j = 2; j < 3; j += 1) {
                    var field = this.searchAccount.subFields[i].inputs[j];
                    if (!field.wmodified) {
                        field.yEl.ac.after("select", function(e) {
                            this.setValue(e.result.raw.getAttrs());
                            this.disable(true);
                            sBtn.enable();
                        }, this.searchAccount.subFields[i]);
                        field.wmodified = true;
                    }
                }
            }
        },
        autocompleteRequest: function(query, callback) {
            Wegas.Facade.User.sendRequest({
                request: "/AutoComplete/" + query,
                cfg: {
                    method: "POST",
                    data: {
                        rolesList: this.get("roleList")
                    }
                },
                on: {
                    success: Y.bind(function(e) {
                        var data = e.response.results.entities;
                        callback(data);
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        resultListLocator: function(id, responses) {
            var i;
            for (i = 0; i < responses.length; i += 1) {
                if (id === responses[i].value) {
                    responses.splice(i, 1);
                    break;
                }
            }
            return responses;
        },
        /* clean autoComplete field and prepare it for a new search */
        clearForm: function() {
            this.searchAccount.clear();
            this.searchAccount.addElement();
            Y.once("domready", this.updateAutoCompletes, this);
            this.saveButton.disable();
        },
        bindUI: function() {
            this.saveButton.on("click", function() {
                var account;
                if (this.searchAccount.getValue().length === 1 && this.searchAccount.validate()) {
                    account = this.searchAccount.getValue()[0];
                    this.addToUserlist(account.id, account.firstname + " " + account.lastname);
                } else {
                    // nothing to do ?
                }
                this.clearForm();
            }, this);

            this.clearButton.on("click", function() {
                this.clearForm();
            }, this);
        },
        addToUserlist: function(id, label) {
            var accountFind, newPermGroup;
            accountFind = Y.Array.find(this.userList.getValue(), Y.bind(function(item) {
                if (item.userId === id) {
                    return true;
                }
            }), this);

            if (!accountFind) {
                newPermGroup = this.userList.addElement({
                    username: label,
                    userId: id
                });
                this.defaultSelectedPerm(newPermGroup);
            }
        },
        destructor: function() {
            this.searchAccount.destroy();
            this.saveButton.destroy();
            this.clearButton.destroy();
            this.userList.destroy();
        },
        loadPermissions: function() {
            Wegas.Facade.User.sendRequest({
                request: "/FindAccountPermissionByInstance/" + this.userList.targetEntityId,
                on: {
                    success: Y.bind(function(e) {
                        var data = e.response.results.entities,
                            i, permissions, splitedPerm, newField;

                        Y.Array.forEach(data, function(account) {
                            permissions = account.get('permissions');
                            newField = this.userList.addElement({
                                username: account.getPublicName(),
                                userId: account.get('id')
                            });

                            Y.Array.forEach(newField.inputs, function(field) {
                                for (i = 0; i < permissions.length; i += 1) {
                                    splitedPerm = permissions[i].get("val").value.split(":");
                                    if (splitedPerm[2] === this.userList.targetEntityId) {
                                        if (field.options.value === splitedPerm[0] + ":" + splitedPerm[1]) {
                                            field.setValue(true, false);
                                            newField.gameModelAddRight(field.options.value);
                                        }
                                    }
                                }
                            }, this);

                        }, this);
                        this.hideUsersWithoutVisiblePermission();
                    }, this)
                }
            });
        },
        defaultSelectedPerm: function(permGroup) {
            var selectedPerm = this.get("selectedPermsList");
            Y.Array.each(permGroup.inputs, function(input) {
                Y.Array.each(selectedPerm, function(perm) {
                    if (input.options.value === perm) {
                        input.setValue(true);
                    }
                });
            });
        },
        hideUsersWithoutVisiblePermission: function() {
            var i, ii, checkboxes, checked,
                users = this.get(CONTENTBOX).one(".inputEx-ListField-childContainer").get("children");
            for (i = 0; i < users.size(); i += 1) {
                checked = false;
                checkboxes = users.item(i).all(".inputEx-CheckBox");
                for (ii = 0; ii < checkboxes.size(); ii += 1) {
                    if (checkboxes.item(ii).get("children").item(0).get("checked")) {
                        checked = true;
                        break;
                    }
                }
                if (!checked) {
                    users.item(i).addClass("wegas-advanced-feature");
                }
            }
        }
    }, {
        ATTRS: {
            permsList: {
                value: []
            },
            selectedPermsList: {
                value: []
            },
            entity: {},
            roleList: {
                value: []
            }
        }
    });
    Wegas.ShareUser = ShareUser;

    /**
     * @name Y.inputEx.Wegas.UserPermissionList
     * @class
     * @extends Y.inputEx.ListField
     * @constructor
     * @param {Object} options
     */
    var UserPermissionList = function(options) {
        UserPermissionList.superclass.constructor.call(this, options);
    };
    Y.extend(UserPermissionList, Y.inputEx.ListField, {
        /** @lends Y.inputEx.Wegas.UserPermissionList# */

        onDelete: function(e) {
            this.currentWidget.showMessage("success", "Saving...");
            var elementDiv = e.target._node.parentNode, i,
                subFieldEl = elementDiv.childNodes[this.options.useButtons ? 1 : 0];
            for (i = 0; i < this.subFields.length; i += 1) {
                if (this.subFields[i].getEl() === subFieldEl) {
                    this.deletePermission(this.targetEntityId, this.subFields[i].getValue().userId); //param : entity Id, have userId
                    break;
                }
            }

            UserPermissionList.superclass.onDelete.apply(this, arguments);
        },
        deletePermission: function(entityId, userId) {
            Wegas.Facade.User.sendRequest({
                request: "/DeleteAccountPermissionByInstanceAndAccount/" + entityId + "/" + userId,
                cfg: {
                    method: "DELETE"
                },
                on: {
                    success: Y.bind(function() {
                        this.currentWidget.showMessage("success", "All changes saved");
                    }, this),
                    failure: Y.bind(function() {
                        this.currentWidget.showMessage("error", "Error removing permissions");
                    }, this)
                }
            });
        }
    });

    /**
     * @name Y.inputEx.Wegas.PermissionGroup
     * @class
     * @extends Y.inputEx.Group
     * @constructor
     * @param {Object} options
     */
    var PermissionGroup = function(options) {
        PermissionGroup.superclass.constructor.call(this, options);
    };
    Y.extend(PermissionGroup, Y.inputEx.Group, {
        /** @lends Y.inputEx.Wegas.PermissionGroup# */
        onChange: function(fieldValue, fieldInstance) {
            this.getParentField().currentWidget.showMessage("success", "Saving...");
            if (fieldValue) {
                this.addPermission(fieldInstance.options.value + ":" + this.parentField.targetEntityId, this.getValue().userId);
                this.gameModelAddRight(fieldInstance.options.value);
            } else {
                this.removePermission(fieldInstance.options.value + ":" + this.parentField.targetEntityId, this.getValue().userId);
                this.gameModelRemoveRight(fieldInstance.options.value);
            }
            PermissionGroup.superclass.onChange.apply(this, arguments);
        },
        removePermission: function(permission, userId) {
            Wegas.Facade.User.sendRequest({
                request: "/DeleteAccountPermissionByPermissionAndAccount/" + permission + "/" + userId,
                cfg: {
                    method: "DELETE"
                },
                on: {
                    success: Y.bind(function(e) {
                        this.getParentField().currentWidget.showMessage("success", "All changes saved");
                    }, this),
                    failure: Y.bind(function(e) {
                        if (e.response.results.exception !== "javax.persistence.NoResultException") {
                            this.getParentField().currentWidget.showMessage("error", "Error removing permission");
                        }
                    }, this)
                }
            });
        },
        addPermission: function(permission, userId) {
            Wegas.Facade.User.sendRequest({
                request: "/addAccountPermission/" + permission + "/" + userId,
                cfg: {
                    method: "POST"
                },
                on: {
                    success: Y.bind(function(e) {
                        this.getParentField().currentWidget.showMessage("success", "All changes saved");
                    }, this),
                    failure: Y.bind(function(e) {
                        this.getParentField().currentWidget.showMessage("error", "Error adding permission");
                    }, this)
                }
            });
        },
        gameModelAddRight: function(fieldInstance) {                            // @hack (hardcode)
            if (fieldInstance === "GameModel:View,Edit,Delete,Duplicate,Instantiate") { // If GameModel has right edit -> then add the other rights
                this.inputs[3].disable();
                this.inputs[4].disable();
                this.inputs[3].setValue(true, false);
                this.inputs[4].setValue(true, false);
            }
        },
        gameModelRemoveRight: function(fieldInstance) {                         // @hack (hardcode)
            if (fieldInstance === "GameModel:View,Edit,Delete,Duplicate,Instantiate") { // If GameModel hasn't right edit -> then remove the other rights
                this.inputs[3].enable();
                this.inputs[4].enable();
                this.inputs[3].setValue(false, true);
                this.inputs[4].setValue(false, true);
            }
        }
    });
    Y.inputEx.registerType("permissiongroup", PermissionGroup);
});
