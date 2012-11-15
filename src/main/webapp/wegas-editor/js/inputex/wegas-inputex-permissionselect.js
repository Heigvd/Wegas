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
            this.options.roles = options.roles
        },
        
        renderComponent: function (){
            this.roleSelect = new Y.inputEx.Wegas.RoleSelect({
                parentEl: this.fieldContainer
            });
            
            this.roleSelect.on("updated", this.checkboxValue, this);
            
            
            this.permissionsCheckBoxes = [];
            Y.Array.forEach(this.options.permissions, function (item, i){
                var splitedPermissions = item.name.split(":");
                var box = new Y.inputEx.CheckBox({
                    rightLabel: splitedPermissions[1],
                    name: splitedPermissions[0]+":"+splitedPermissions[1],
                    value: false,
                    parentEl: this.fieldContainer
                });
                box.on("updated", function(){
                    if (this.getValue()){
                        console.log("Appel fonction add");
                    } else {
                        console.log("Appel fonction delete");
                    }
                }, this);
                this.permissionsCheckBoxes.push(box)
            }, this);
            
            this.checkboxValue();
        },
        getValue: function () {
            return this.value;
        },
        setValue: function (val, sendUpdatedEvent) {
            inputEx.Wegas.PermissionSelect.superclass.setValue.call(this, val, sendUpdatedEvent);
            this.value = val;           
            this.checkboxValue();
        },
        checkboxValue: function () {
            Y.Array.forEach(this.permissionsCheckBoxes, function(box, i){
                box.setValue(false);
            });
            if (!this.value) {
                return;
            }
            this.roleSelect.setValue(this.getValue(), false);
            
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




    var CONTENTBOX = "contentBox", Text2;

    Text2 = Y.Base.create("wegas-text", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget ], {
        renderUI: function () {
            this.get("contentBox").setHTML("test");
            
            Y.Wegas.UserFacade.rest.sendRequest({    
                request: "/GameModelPermissions/151",
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
                        
                        this.permsField = new Y.inputEx.ListField({
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
                                roles: acc
                            },                    
                            useButtons: true,
                            value: acc,                 
                            parentEl: this.get(CONTENTBOX).getDOMNode()
                        });
                    }, this),
                    failure: function (id, result) {
                    }
                }
            });            
        }
    });

    Y.namespace("Wegas").Test2 = Text2;
});
