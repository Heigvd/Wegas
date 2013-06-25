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

YUI.add('wegas-sharerole', function(Y) {
    var CONTENTBOX = 'contentBox',
            ShareRole = Y.Base.create("wegas-sharerole", Y.Widget, [Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Widget], {
        
        renderUI: function() {
            var el = this.get(CONTENTBOX),
                e = this.get("entity");          
            
            if (e instanceof Y.Wegas.persistence.GameModel) {
                this.targetEntityId = "gm" + e.get("id");
            } else {
                this.targetEntityId = "g" + e.get("id");
            }  
            
            this.visibility = new Y.inputEx.SelectField({
                label: 'Visibility',
                choices: [
                    {value: 'Private', label: 'Private'},
                    {value: 'Link', label: 'Link to share'},
                    {value: 'Public', label: 'Public'}
                ],
                parentEl: el
            });
            
            this.link = new Y.inputEx.StringField({
                label: 'Link',
                parentEl: el
            });

            var url = Y.Wegas.app.get("base") + "game.html?token=" + this.get("entity").get("token");
            this.link.setValue(url);
            
            this.linkVisibility(this.visibility.getValue());
            this.loading();
        },
                
        bindUI: function() {
            this.visibility.on("updated", function(value){
                this.linkVisibility(value);
                Y.Wegas.Facade.User.cache.deleteAllRolePermissions(this.get('role'), this.targetEntityId);
                if (value === "Public"){
                    Y.Array.forEach(this.get('permsList'), function (permission) {
                        if (permission.name === "Public"){
                            this.addPermission(permission.value);
                        }
                    }, this);
                } else if (value === "Link"){
                    Y.Array.forEach(this.get('permsList'), function (permission) {
                        if (permission.name === "Link"){
                            this.addPermission(permission.value);
                        }
                    }, this);
                }
            }, this);
        },
                
        loading: function() {
            Y.Wegas.Facade.User.sendRequest({
                request: "/FindPermissionByInstance/" + this.targetEntityId,
                on: {
                    success: Y.bind(function (e) {
                        var data = e.response.results.entities;
                        Y.Array.forEach(data, function (role) {
                            if (role.get('val').name === this.get('role')) {
                                Y.Array.forEach(role.get('val').permissions, function (resultPerm) {
                                    var splitedPerm = resultPerm.split(":");
                                    Y.Array.forEach(this.get('permsList'), function (permFromList) {
                                        if (splitedPerm[0] + ":" + splitedPerm[1] === permFromList.value){
                                            this.visibility.setValue(permFromList.name, false);
                                            this.linkVisibility(permFromList.name);
                                        }
                                    }, this);
                                }, this);
                            }
                        }, this);
                    }, this),
                    failure: Y.bind(function (e) {
                        this.fire("exception", e.response.results);
                    }, this)
                }
            });
        },
       
        linkVisibility: function(selectValue) {
            if (selectValue === "Private"){
                this.link.hide();
            } else {
                this.link.show();
            }
        },
        
        addPermission: function(permission) {
            console.log(permission);
            Y.Wegas.Facade.User.sendRequest({
                request: "/AddPermission/" + this.get('role') + "/" + permission +":" + this.targetEntityId,
                cfg: {
                    method: "POST"
                }
            });
        }
    }, {
        ATTRS: {
            role: {
                value: "Public"
            },
            entity: {},
            permsList: {
                value: []
            }
        }
    });


    Y.namespace('Wegas').ShareRole = ShareRole;
});