/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

YUI.add('wegas-shareuser', function(Y) {
    var CONTENTBOX = 'contentBox',
            ShareUser = Y.Base.create("wegas-shareuser", Y.Widget, [Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Widget], {
        
        renderUI: function() {
            var el = this.get(CONTENTBOX),
                i, e = this.get("entity"),
                permissions = [{
                    name: "username", 
                    type: 'string', 
                    readonly: true
                }, {
                    name: "userId",
                    type: "hidden"
                }];

            for (i=0; i<this.get("permsList").length; i++){
                permissions.push({
                    type: 'boolean',
                    label: this.get("permsList")[i].label,
                    name: this.get("permsList")[i].value
                });
            }
            
            this.userList = new UserPermissionList({
                label: 'User list',
                elementType: {
                    type: 'permissiongroup',
                    fields: permissions
                },
                parentEl: el,
                useButtons: true
            });
            
            if (e instanceof Y.Wegas.persistence.GameModel) {
                this.userList.targetEntityId = "gm" + e.get("id");
            } else {
                this.userList.targetEntityId = "g" + e.get("id");
            }
            
            var bThis = this;
            this.field = new Y.inputEx.AutoComplete({
                parentEl: el,
                typeInvite: "e-mail",
                // Format the hidden value (value returned by the form)
                returnValue: function(oResultItem) {
                    this.label = oResultItem.label;
                    return oResultItem.value;
                },
                autoComp: {
                    minQueryLength: 2,
                    maxResults: 30,
                    resultTextLocator: 'label',
                    resultHighlighter: 'phraseMatch',
                    source: "http://localhost:8080/Wegas/rest/User/AutoComplete/{query}",
                    resultListLocator: function (responses) {
                        var i;
                        Y.Array.forEach(bThis.userList.subFields, function (user) {
                            for (i=0; i<responses.length; i++){
                                if (user.getValue().userId === responses[i].value){
                                    responses.splice(responses[i], 1);
                                    break;
                                }
                            }
                        });
                        return responses;
                    }
                }
            });
            
            this.saveButton = new Y.Wegas.Button({
                label: "save",
                cssClass: "wegas-shareUser-save",
                render: el
            });
            
            this.loadingPermissions();
        },
                
        bindUI: function() {
            this.saveButton.on("click", function(){
                if (this.field.getValue() === "") return;
                this.userList.addElement({
                    username: this.field.options.label,
                    userId: parseInt(this.field.getValue()) 
                });
                this.field.setValue("");
            }, this);
        },
        
        loadingPermissions: function() {
            Y.Wegas.Facade.User.sendRequest({
                request: "/FindAccountPermissionByInstance/" + this.userList.targetEntityId,
                cfg: {
                    method: "GET"
                },
                on: {
                    success: Y.bind(function (e) {
                        var data = e.response.results.entities,
                            i, permissions, splitedPerm, newField;
                        Y.Array.forEach(data, function (account) {
                            permissions = account.get('permissions');
                            newField = this.userList.addElement({
                                username: account.get('email'),
                                userId: account.get('id')
                            });
                            
                            Y.Array.forEach(newField.inputs, function (field) {
                                for (i=0; i<permissions.length; i++){
                                    splitedPerm = permissions[i].split(":");
                                    if (splitedPerm[2] === this.userList.targetEntityId){
                                        if (field.options.name === splitedPerm[0] + ":" + splitedPerm[1]){
                                            field.setValue(true, false);
                                        }
                                    }
                                }
                            }, this);                            
                            
                        }, this);
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", "Error loading permissions");
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
            permsList: {
                value: []
            },
            entity: {}
        }
    });
    Y.namespace('Wegas').ShareUser = ShareUser;

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
    Y.extend(UserPermissionList, Y.inputEx.ListField,  {
        /** @lends Y.inputEx.Wegas.UserPermissionList# */
        
        onDelete: function(e) {
            var elementDiv = e.target._node.parentNode,
                subFieldEl = elementDiv.childNodes[this.options.useButtons ? 1 : 0];
            for(var i = 0 ; i < this.subFields.length ; i++) {
               if(this.subFields[i].getEl() === subFieldEl) {  
                  this.deletePermission(this.targetEntityId, this.subFields[i].getValue().userId); //param : entity Id, have userId
                  break;
               }
            }

            UserPermissionList.superclass.onDelete.apply(this, arguments);
        },
        
        deletePermission: function(entityId, userId) {
            Y.Wegas.Facade.User.sendRequest({
                request: "/DeleteAccountPermissionByInstanceAndAccount/" + entityId + "/" + userId,
                cfg: {
                    method: "DELETE"
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
    Y.extend(PermissionGroup, Y.inputEx.Group,  {
       
        /** @lends Y.inputEx.Wegas.PermissionGroup# */
        onChange: function(fieldValue, fieldInstance) {
            console.log(this.getValue());
            if (fieldValue){
                this.addPermission();
            } else {
                this.removePermission();
            }
            PermissionGroup.superclass.onChange.apply(this, arguments);
        },
        
        removePermission: function () {
            console.log("removePerm");
        },
                
        addPermission : function() {
            console.log("addPerm");
        }
    });
    Y.inputEx.registerType("permissiongroup", PermissionGroup);
});