/**
 * @module inputex-url
 */
YUI.add("wegas-inputex-permissionselect",function(Y){

    var inputEx = Y.inputEx;

    /**
     * Adds an url regexp, and display the favicon at this url
     * @class inputEx.UrlField
     * @extends inputEx.StringField
     * @constructor
     * @param {Object} options inputEx.Field options object
     * <ul>
     *   <li>favicon: boolean whether the domain favicon.ico should be displayed or not (default is true, except for https)</li>
     * </ul>
     */
    Y.namespace("inputEx.Wegas").PermissionSelect = function(options) {
        inputEx.Wegas.PermissionSelect.superclass.constructor.call(this,options);
    };
    Y.extend(inputEx.Wegas.PermissionSelect, inputEx.Field,  {
        setOptions: function (options) {
            inputEx.Wegas.PermissionSelect.superclass.setOptions.call(this, options );
            this.options.permissions = options.permissionsChoices;
            this.options.roles = options.roles;
            this.options.targetEntityId = options.targetEntityId;
            this.value = {};
        },
        
        renderComponent: function (){
            this.fireUpdatedEvt();
            
            this.roleSelect = new Y.inputEx.Wegas.RoleSelect({
                parentEl: this.fieldContainer
            });

            this.roleSelect.on("updated", function (val) {
                
                if (this.value.id !== val.id) {
                    Y.Wegas.UserFacade.rest.deleteAllRolePermissions(this.value.id, this.options.targetEntityId);
                }
                 
                this.value.id = val.id;
                this.value.permissions = [];
                this.checkboxValue();
                this.fireUpdatedEvt();
            }, this);
            
            var logDiv = Y.Node.create("<div></div>").addClass("permissionList");
            this.fieldContainer.div = this.fieldContainer.appendChild(logDiv.getDOMNode());
            this.permissionsCheckBoxes = [];
            Y.Array.forEach(this.options.permissions, function (item, i){
                var splitedPermissions = item.name.split(":");
                var box = new Y.inputEx.CheckBox({
                    rightLabel: splitedPermissions[1],
                    name: splitedPermissions[0]+":"+splitedPermissions[1],
                    value: false,
                    parentEl: this.fieldContainer.div,
                    className: "eachPermissions"
                });
                
                box.on("updated", function(e, field){
                    if (field.getValue()){
                        Y.Wegas.UserFacade.rest.sendRequest({    
                            request: "/AddPermission/" + this.roleSelect.getValue().id + "/" + field.options.name +":" + this.options.targetEntityId,
                            cfg: {
                                method: "POST"
                            }
                        });
                    } else {
                        Y.Wegas.UserFacade.rest.sendRequest({    
                            request: "/DeletePermission/" + this.roleSelect.getValue().id + "/" + field.options.name +":gm151",
                            cfg: {
                                method: "POST"
                            }
                        });
                    }                    
                    this.fireUpdatedEvt();
                }, this);
                this.permissionsCheckBoxes.push(box)
            }, this);
            
            this.checkboxValue();
        },
        getValue: function () {
            this.value.id = this.roleSelect.getValue().id;
            return this.value;
        },
        setValue: function (val, sendUpdatedEvent) {
            inputEx.Wegas.PermissionSelect.superclass.setValue.call(this, val, sendUpdatedEvent);
            this.roleSelect.setValue(val, false);
            this.value = val;           
            this.checkboxValue();
        },
        checkboxValue: function () {
            Y.Array.forEach(this.permissionsCheckBoxes, function(box, i){
                box.setValue(false, false);
            });

            //this.roleSelect.setValue(this.getValue(), false);
            Y.Array.forEach(this.getValue().permissions, function(perm, i) {
                var splitedPermissions = perm.split(":");
                Y.Array.forEach(this.permissionsCheckBoxes, function(box, i) {
                    if (box.options.rightLabel == splitedPermissions[1]) {
                        box.setValue(true, false);
                    }
                },this);
            }, this);
        },
        
        destroy: function () {
            inputEx.Wegas.PermissionSelect.superclass.destroy.call(this);
            this.roleSelect.destroy();
        }
        
    });
    
    inputEx.registerType("permissionsselect", inputEx.Wegas.PermissionSelect );             // Register this class as "wegasurl" type




    var CONTENTBOX = "contentBox", RolePermissionList;

    RolePermissionList = Y.Base.create("wegas-text", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget ], {
        renderUI: function () {
            
            this.plug(Y.Plugin.WidgetToolbar);
            
            //var b = this.toolbar.add({type: "Button", label: "New"});
            //b.on("click", function () {
            //    console.log("mm");
            //});  
            
            var gmId = 151;
            Y.Wegas.UserFacade.rest.sendRequest({    
                request: "/GameModelPermissions/" + gmId,
                cfg: {
                    method: "GET"
                },
                on: {
                    success: Y.bind(function (e) {
                        var data = e.response.results.entities,
                        acc = [];
                        
                        Y.Array.forEach(data, function(role, i) {
                            acc.push(role.get("val"));
                        }, this);
                        
                        this.permsField = new PermissionList({
                            //listLabel: 'Websites',
                            elementType: {
                                type: 'permissionsselect',
                                permissionsChoices: [{
                                    name: "GameModel:Add"
                                },{
                                    name: "GameModel:Edit"
                                },{
                                    name: "GameModel:Delete"
                                },{
                                    name: "GameModel:Create"
                                }],
                                targetEntityId: "gm" + gmId,
                                roles: acc,
                                className: "role-permissions"
                            },                    
                            useButtons: true,
                            value: acc,                 
                            parentEl: this.get(CONTENTBOX).getDOMNode(),
                            className: "roleBox"
                        });
                        this.permsField.on("updated", this.sync, this);
                        
//                        this.get(CONTENTBOX).one(".roleBox img").hide();
                    }, this),
                    failure: function (id, result) {
                    }
                }
            });            
        },
        sync: function(){
            var list = this.permsField.getRoleIds();
            
            Y.Array.forEach(this.permsField.subFields, function(eachSubfield, i) {
                Y.Array.forEach(eachSubfield.roleSelect.choicesList, function(role, i) {
                    if (eachSubfield.roleSelect.getValue().id === role.value 
                        || list.indexOf( role.value) === -1){
                        eachSubfield.roleSelect.showChoice(role); 
                    } else {
                        eachSubfield.roleSelect.hideChoice(role);   
                    }
                }, this);
            }, this);
        }
    }, {
        ATTRS: {
            data: {}
        }
    });

    Y.namespace("Wegas").RolePermissionList = RolePermissionList;
    
    
    /**
     * @fixme @hack override to had event
     */
    
    var PermissionList = function(options) {
        PermissionList.superclass.constructor.call(this,options);
    };
    
    Y.extend(PermissionList, inputEx.ListField,  {
        
        getRoleIds: function () {
            var list = [];
            Y.Array.forEach(this.subFields, function(field) {
                var roleWithPermission = field.getValue();
                list.push(roleWithPermission.id);
            }, this);
            return list;
        },
        
       
        onAddButton: function() {
            PermissionList.superclass.onAddButton.apply(this, arguments);
            
            var newField = this.subFields[this.subFields.length - 1],
            filter = this.getRoleIds(), 
            i= 0;
            
            while (filter.indexOf(newField.getValue().id) > -1 
                && i < newField.roleSelect.choicesList.length) {
                newField.setValue({
                    id:  newField.roleSelect.choicesList[i].value
                });
                i++;
            }
        },

        onDelete: function(e) {  
            var elementDiv = e.target._node.parentNode;

            var subFieldEl = elementDiv.childNodes[this.options.useButtons ? 1 : 0];
            for(var i = 0 ; i < this.subFields.length ; i++) {
                if(this.subFields[i].getEl() == subFieldEl) {                    
                    Y.Wegas.UserFacade.rest.deleteAllRolePermissions(this.subFields[i].roleSelect.getValue().id, this.subFields[i].options.targetEntityId);          
                    break;
                }
            }
            
            PermissionList.superclass.onDelete.apply(this, arguments);
        }
    });
    
    inputEx.registerType("permissionslist", PermissionList );             // Register this class as "wegasurl" type
});
