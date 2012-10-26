/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add( "wegas-pmg-resourcelist", function ( Y ) {
    "use strict";

    var CONTENTBOX = "contentBox", ResourceList;

    ResourceList = Y.Base.create( "wegas-pmg-resourcelist", Y.Wegas.PmgGantt, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable], {
        
        handlers:null,
        menu:null,
        menuDetails:null,
        drag:null,
        drop:null,
        
        addButtonsAssignement:function(){
            var cb = this.get(CONTENTBOX);
            cb.all(".yui3-datatable-data tr .yui3-datatable-col-assignements").each(function(node){
                node.append("<div class='assignement'></div>");
                node.one('.assignement').append("<span class='assign'></span>");
                node.one('.assignement').append("<span class='remove'></span>");
                node.addClass('noDescription');
            });
        },
        
        createMenu: function(e, add){
            var i, tasks, resources, resourceDesc, resourceName;
            resourceName = e.target.ancestor().ancestor().ancestor().one('*').getContent();
            resources = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get('variables'));
            for (i = 0; i < resources.get('items').length; i++) {
                if(resources.get('items')[i].get('name') == resourceName){
                    resourceDesc = resources.get('items')[i];
                    break;
                }
            }
            this.menu.removeAll();
            tasks = this.getTasks(resourceDesc, add);
            if(!tasks || tasks.lenght <= 0) return
            this.menu.add(tasks);
            this.menu.attachTo(e.target);
        },
        
        compareTask: function(a,b) {
            var sort = (this.get("taskSortBy") || "name");
            if(a.get(sort)){
                if(a.get(sort) < b.get(sort)) return -1;
                if(a.get(sort) > b.get(sort)) return 1;
            }else if(a.getInstance().get(sort)){
                if(a.getInstance().get(sort) < b.getInstance().get(sort)) return -1;
                if(a.getInstance().get(sort) > b.getInstance().get(sort)) return 1;
            }else {
                if(a.getInstance().get('properties')[sort] < b.getInstance().get('properties')[sort]) return -1;
                if(a.getInstance().get('properties')[sort] > b.getInstance().get('properties')[sort]) return 1;
            }
            return 0;
        },
        
        getTasks:function(resourceDesc, add){
            //add is a boolean to determine if target is remove or add a task
            //you can only add a task which isn't already added. 
            //you can only remove a task which is added. 
            var i, tasks, items, taskDesc, array = new Array(), no;
            if(!this.get("taskList")) return;
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("taskList"));
            items = tasks.get('items');
            items.sort(Y.bind(this.compareTask, this));
            for (i = 0; i < items.length; i++) {
                taskDesc = items[i];
                no = (taskDesc.getInstance().get('properties').no || "");
                array.push({
                    type: "Button",
                    label: no+". "+(taskDesc.get("label") || taskDesc.get("name") || "undefined"),
                    data: {
                        resource : resourceDesc,
                        task: taskDesc
                    }
                });
            }
            return array;
        },
        
        onMenuClick:function(e){
            var data = e.target.get("data");
            console.log('to do...')
            console.log(e.target.get("data"), data.resource.get('name'), data.task.get('name'));
        },
        
        taskToCell: function(){     
            var goingUp = false, lastX = 0;                                     //temporary to test "drag" feature
            var node, cb = this.get(CONTENTBOX);
            node = cb.one('.yui3-datatable-data .yui3-datatable-col-assignements');
            node.append("<div class='tasks'></div>");
            node.one('.tasks').append('<span class="task">t</span>');
            node.one('.tasks').append('<span class="task">e</span>');
            node.one('.tasks').append('<span class="task">s</span>');
            node.one('.tasks').append('<span class="task">t</span>');
            node.one('.tasks').append('<span class="task">1</span>');
            node.one('.tasks').append('<span class="task">2</span>');
            node.all('.task').each(function(v, k){
                this.drag.push(new Y.DD.Drag({
                    node: v,
                    //Make it Drop target and pass this config to the Drop constructor
                    target: {
                        padding: '0 0 0 20'
                    }
                }).plug(Y.Plugin.DDProxy, {
                    //Don't move the node at the end of the drag
                    moveOnEnd: false
                }).plug(Y.Plugin.DDConstrained, {
                    //Keep it inside the #play node
                    constrain2node: v.ancestor()
                }));
            }, this);
            node.all('.tasks').each(function(v, k) {
                this.drop.push(new Y.DD.Drop({
                    node: v
                }));
            }, this);
            
            
            //Listen for all drop:over events
            this.handlers.push(Y.DD.DDM.on('drop:over', function(e) {
                //Get a reference to our drag and drop nodes
                var drag = e.drag.get('node'),
                drop = e.drop.get('node');
            
                //Are we dropping on a span node?
                if (drop.get('tagName').toLowerCase() === 'span') {
                    //Are we not going up?
                    if (!goingUp) {
                        drop = drop.get('nextSibling');
                    }
                    //Add the node to this list
                    e.drop.get('node').get('parentNode').insertBefore(drag, drop);
                    //Resize this nodes shim, so we can drop on it later.
                    e.drop.sizeShim();
                }
            }));
            
            
            //Listen for all drag:drag events
            this.handlers.push(Y.DD.DDM.on('drag:drag', function(e) {
                //Get the last y point
                var x = e.target.lastXY[0];
                //is it greater than the lastY var ? (-1, debbug leftmost element)
                if (x-1 < lastX) {
                    //We are going up
                    goingUp = true;
                } else {
                    //We are going down.
                    goingUp = false;
                }
                //Cache for next check
                lastX = x;
            }));
            
            
            //Listen for all drag:start events
            this.handlers.push(Y.DD.DDM.on('drag:start', function(e) {
                //Get our drag object
                var drag = e.target;
                //Set some styles here
                drag.get('node').setStyle('opacity', '.25');
                drag.get('dragNode').set('innerHTML', drag.get('node').get('innerHTML'));
                drag.get('dragNode').setStyles({
                    opacity: '.5',
                    borderColor: drag.get('node').getStyle('borderColor'),
                    backgroundColor: drag.get('node').getStyle('backgroundColor')
                });
            }));
            
            
            //Listen for a drag:end events
            this.handlers.push(Y.DD.DDM.on('drag:end', function(e) {
                var drag = e.target;
                //Put our styles back
                drag.get('node').setStyles({
                    visibility: '',
                    opacity: '1'
                });
            }));
            
            
            this.handlers.push(Y.DD.DDM.on('drag:drophit', function(e) {
                var drop = e.drop.get('node'),
                drag = e.drag.get('node');

                //if we are not on an span, we must have been dropped on a div
                if(drop.get('tagName').toLowerCase() !== 'span'){
                    if (!drop.contains(drag)) {
                        drop.appendChild(drag);
                    }
                }

            }));
        },
    
        initializer: function(){
            this.handlers = new Array();
            this.menu = new Y.Wegas.Menu();
            this.menuDetails = new Y.Wegas.Menu({
                width: "250px"
            });
            this.drag = new Array();
            this.drop = new Array();
        },
        
        renderUI: function(){
            var i, columns;
            ResourceList.superclass.renderUI.apply(this);
            columns = this.datatable.head.columns[0];
            for(i=0; i<columns.length; i++){
                if(columns[i].key == 'week1'){
                    break;
                }
            }
            this.datatable.addColumn({
                key:'assignements',
                label:"Assignements"
            }, i);
        },
        
        bindUI: function(){
            ResourceList.superclass.bindUI.apply(this);
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            
            this.handlers.push(this.datatable.delegate('click', function(e) {            // fill the "add" menu on click
                this.createMenu(e, true);
            }, '.yui3-datatable-data .assignement .assign', this));
            
            this.handlers.push(this.datatable.delegate('click', function(e) {            // fill the "remove" menu on click
                this.createMenu(e, false);
            }, '.yui3-datatable-data .assignement .remove', this));
            
            this.handlers.push(this.menu.on("button:mouseenter", function(e) {           // align the menu
                this.menuDetails.set("align", {
                    node: this.menu.get("boundingBox"),
                    points: (e.details[0].domEvent.clientX > Y.DOM.winWidth()/2) ?
                    ["tr", "tl"] : ["tl", "tr"]
                });
                this.menuDetails.show();
                this.menuDetails.get("contentBox").setHTML('<div style="padding:5px 10px"><i>No description</i></div>');
            }, this));
            
            this.handlers.push(this.menu.on("visibleChange", function(e){                 // When the menu is hidden, hide the details panel
                if (!e.newVal) {
                    this.menuDetails.hide();
                }
            }, this));
            
            this.handlers.push(this.menu.on("button:click", this.onMenuClick, this));     // assign a task to a resource
        },
        
        syncUI: function(){
            ResourceList.superclass.syncUI.apply(this);
            this.addButtonsAssignement();
            this.taskToCell();                                                  //temporary
        },
        
        destructor: function(){
            var i;
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            } 
            for (i=0; i<this.drag.length;i++) {
                this.drag[i].destroy();
            } 
            for (i=0; i<this.drop.length;i++) {
                this.drop[i].destroy();
            } 
            this.menu.destroy();
            this.menuDetails.destroy();
        } 
        
    }, {
        ATTRS : {
            taskList:{
                value: null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            taskSortBy:{
                value: null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });

    Y.namespace( "Wegas" ).PmgResourcelist = ResourceList;
});