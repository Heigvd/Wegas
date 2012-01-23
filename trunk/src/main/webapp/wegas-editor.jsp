<!DOCTYPE html >
<!--<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
-->
<html> 
    <head>  
        <title>WeGAS - 0.1</title> 
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> 
        <meta http-equiv="Content-Language" content="en" />
        <meta name="description" content="" /> 
        <meta name="keywords" content="" />     
        <meta name="robots" content="index, follow" /> 
        <meta name="contact" content="fx@red-agent.com" /> 
        <meta name="audience" content="General" /> 
        <meta name="distribution" content="Global" /> 
        <meta name="revisit-after" content="30 days" /> 
        <link rel="icon" type="image/ico" href="/favicon.ico" /> 


        <!-- YUI -->

        <!--	Online version -->
        <!--<link rel="stylesheet" type="text/css" 
                        href="http://yui.yahooapis.com/combo?3.3.0/build/cssfonts/fonts-min.css&3.3.0/build/cssreset/reset-min.css&3.3.0/build/cssgrids/grids-min.css&3.3.0/build/cssbase/base-min.css&3.3.0pr3/build/widget/assets/skins/sam/widget.css&3.3.0pr3/build/node-menunav/assets/skins/sam/node-menunav.css&" charset="utf-8" /> 
            <link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/assets/skins/sam/skin.css">   -->

        <link rel="stylesheet" type="text/css" href="lib/yui3/build/cssfonts/fonts-min.css" />
        <link rel="stylesheet" type="text/css" href="lib/yui3/build/cssreset/reset-min.css" />
        <link rel="stylesheet" type="text/css" href="lib/yui3/build/widget/assets/skins/sam/widget.css" />

        <link rel="stylesheet" type="text/css" href="lib/wireit/css/WireIt.css" /> 
        <!--	<link type='text/css' rel='stylesheet' href='lib/inputex/css/inputEx.css' />-->

        <meta id="customstyles" /> 
        <!--<link rel="stylesheet" type="text/css" href="wegas-core/assets/wegas-admin.css" /> 
        
        <link rel="stylesheet" type="text/css" href="/src/redcms-base/assets/redcms-base.css" /> 
        <link rel="stylesheet" type="text/css" href="/src/redcms-base/assets/skin/sam/redcms-base-skin-sam.css" />
        -->

    </head> 
    <body class="yui3-skin-sam yui-skin-sam " > 

        <!-- YUI Base -->
        <!--<script type="text/javascript" src="http://yui.yahooapis.com/combo?3.3.0pr3/build/yui/yui-min.js&3.3.0pr3/build/loader/loader-min.js"></script> 
        -->
        <script type="text/javascript" src="lib/yui3/build/yui/yui.js"></script> 
        <script type="text/javascript" src="lib/yui3/build/loader/loader.js"></script> 

        <!-- Inputex Base -->
        <script src="lib/inputex/build/loader.js"  type='text/javascript'></script>

        <!-- Atmosphere jquery -->
        <script type="text/javascript" src="jquery/jquery-1.6.4.js"></script>
        <script type="text/javascript" src="jquery/jquery.form.js"></script>
        <script type="text/javascript" src="jquery/jquery.atmosphere.js"></script>


        <script type="text/javascript" >
            YUI_config.groups.inputex.base = 'lib/inputex/build/';		// Hack fix inputex loading path so it uses local files
	    
            var Config = {
                base : '/Wegas/',
                layoutSrc: 'data/editor-layout.json',
                lang : 'en-US',
                debug : true,
		
                currentGameModel: 1,
                //dataSrc : './data/data-asprojectmanagment.json',
                dataSources: {
                    gameModel: {
                        source: "rs/gm",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: ".",
                                        resultFields: ["name", "id", "@class", "errors"]
                                    }
                                }
                            }
                        ]
                    },
                    type: {
                        source: "rs/gm/1/type",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: "."
                                    }
                                }
                            }
                        ]
                    },
                    "VariableInstance": {
                        source: "rs/gm/1/var",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: "."
                                    }
                                }
                            }
                        ]
                    },
                    "VariableDescriptor": {
                        source: "rs/gm/1/vardesc",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: "."
                                    }
                                }
                            }
                        ]
                    },
                    "User": {
                        source: "rs/user",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: "."
                                    }
                                }
                            }
                        ]
                    },
                    "Team": {
                        source: "rs/gm/1/team",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: "."
                                    }
                                }
                            }
                        ]
                    }
                },
		
		
                // DEPRECATED FROM HERE
                loggedIn : true,
                /*gameDesigns: [
                    { name: 'Empty Project', scenarios: ["Default"], dataSrc: './data/alba-emptyproject-data.json', url: './alba-prototype-emptyproject.html'},
                    { name: 'Alba-ProjectManagment', scenarios: ["Artos"], dataSrc: './data/alba-project-data.json', url: './alba-prototype-projectmanagment.html'},
                    { name: 'Alba-Ladder&Snakes', scenarios: ["Default"], dataSrc: './data/alba-laddergame-data.json', url: './alba-prototype-ladder&snakes.html'}
                ],*/
                adminMenus: {
                    AlbaPages: [
                        { text: "Add page", adminForm: "AlbaPageWidget", op:'addChild' },
                    ],
                    AlbaSubpages: [
                        {
                            text: "Add",
                            submenu:  {
                                id: "AlbaSubpages",
                                itemdata: [
                                    { text: "List element", adminForm: "AlbaListWidget", op:'addChild' },
                                    { text: "Variable display element", adminForm: "AlbaVariableWidget", op:'addChild' },
                                    { text: "Link element", adminForm: "AlbaLinkWidget", op:'addChild' },
                                    { text: "Text element", adminForm: "AlbaTextWidget", op:'addChild' },
                                    { text: "Tabview element", adminForm: "AlbaTabView", op:'addChild' },
                                    { text: "Dynamic area element", adminForm: "AlbaDisplayAreaWidget", op:'addChild' }
                                ]
                            }	
                        }
                    ],
                    AlbaPageWidget: [
                        {
                            text: 'Edit',
                            op: 'edit',
                            adminForm: "AlbaPageWidget"
                        },
                        {
                            text: "Add",
                            submenu:  {
                                id: "AlbaSubpages",
                                itemdata: [
                                    { text: "List element", adminForm: "AlbaListWidget", op:'addChild' },
                                    { text: "Variable display element", adminForm: "AlbaVariableWidget", op:'addChild' },
                                    { text: "Link element", adminForm: "AlbaLinkWidget", op:'addChild' },
                                    { text: "Text element", adminForm: "AlbaTextWidget", op:'addChild' },
                                    { text: "Tabview element", adminForm: "AlbaTabView", op:'addChild' },
                                    { text: "Dynamic area element", adminForm: "AlbaDisplayAreaWidget", op:'addChild' }
                                ]
                            }	
                        }
                    ],
                    AlbaStateMachines: [
                        {
                            text: "Add story",
                            op: 'addChild',
                            adminForm: "AlbaStateMachine"
                        },
                        /*{ text: "Delete", op: 'delete' }*/
                    ],
                    AlbaStateMachine: [
                        {
                            text: 'Open',
                            op: 'openStateMachine'
                        },
                        {
                            text: 'Add story node',
                            op: 'addChild',
                            adminForm: "AlbaState"
                        },
                        {
                            text: 'Edit',
                            op: 'edit',
                            adminForm: "AlbaStateMachine"
                        }
                    ],
                    AlbaState: [
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaState"
                        },
                        /*{ text: "Delete", op: 'delete' }*/
                    ],
                    AlbaTransition: [
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaTransition"
                        },
                        /*{ text: "Delete", op: 'delete' }*/
                    ],
                    AlbaTextWidget: [
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaTextWidget"
                        },
                        { text: "Delete", op: 'delete' }
                    ],
                    AlbaLinkWidget: [
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaLinkWidget"
                        },
                        { text: "Delete", op: 'delete' }
                    ],
                    AlbaTab: [
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaLinkWidget"
                        },
                        { text: "Delete", op: 'delete' }
                    ],
                    AlbaProjectTab: [
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaProjectTab"
                        },
                        { text: "Delete", op: 'delete' }
                    ],
                    AlbaDisplayAreaWidget: [
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaDisplayAreaWidget"
                        },
                        { text: "Delete", op: 'delete' }
                    ],	
                    AlbaVariableWidget: [
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaVariableWidget"
                        },
                        { text: "Delete", op: 'delete' }
                    ],
                    AlbaTabView:[
			
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaTabView"
                        },
                        {
                            text: "Add",
                            submenu: {
                                id: "AlbaTabViewAdd",
                                itemdata: [
                                    { text: "Tab element", adminForm: "AlbatTab", op: 'addChild'},
                                    { text: "AlbaProject tab element", adminForm: "AlbaProjectTab", op: 'addChild'}
                                ]
                            }
                        },
                        { text: "Delete", op: 'delete' }
                    ],
                    AlbaListWidget:[
			
                        {
                            text: "Edit",
                            op: 'edit',
                            adminForm: "AlbaListWidget"
                        },
                        {
                            text: "Add",
                            submenu:  {
                                id: "AlbaListWidgetAdd",
                                itemdata: [
                                    { text: "List element", adminForm: "AlbaListWidget", op:'addChild' },
                                    { text: "Variable display element", adminForm: "AlbaVariableWidget", op:'addChild' },
                                    { text: "Link element", adminForm: "AlbaLinkWidget", op:'addChild' },
                                    { text: "Text element", adminForm: "AlbaTextWidget", op:'addChild' },
                                    { text: "Tabview element", adminForm: "AlbaTabView", op:'addChild' },
                                    { text: "Dynamic area element", adminForm: "AlbaDisplayAreaWidget", op:'addChild' }
                                ]
                            }	
                        },
                        { text: "Delete", op: 'delete' }
                    ]
                },
                forms: {
		    
                    /*********************************************************** Types Forms */
		   
                    "GameModel" : [ 
                        { name: 'id', label:'Id', type: 'hidden'/*, required: true*/ },
                        { name: 'name', label:'Name'},
                        { name: '@class', value:'GameModel', type: 'hidden'}
                    ],
                    "Team" : [ 
                        { name: 'id', label:'Id', type: 'hidden'},
                        { name: '@class', value:'Team', type: 'hidden'},
                        { name: 'name', label:'Name'},
                        // { name: 'token', label:'Token'},
                    ],
                    "VariableDescriptor" : [
                        { name: 'id', label:'Id', type: 'hidden'},
                        { name: '@class', type: 'hidden', value: 'StringVariableDescriptor'},
                        { name: 'name', label:'Name'},
                        { name: 'scope', type:'group', fields: [
                                { name: 'id', label:'Id', type: 'hidden'},
                                { name: '@class', value:'UserScope', type: 'hidden'}
                            ]},
                        { name: 'defaultVariableInstance', type:'group', fields: [
                                { name: '@class', value:'StringVariableInstance', type: 'hidden'},
                                { name: 'id', label:'Id', type: 'hidden'},
                                { name: 'content', label: 'DefaultValue'}
                            ]},
                        { type: 'select', 
                            label: 'Variable Type',
                            choices: [{ value: "StringVariableInstance", label: 'String' }, { value: "DoubleVariableInstance", label: 'Number'}],
                            interactions: [
                                {
                                    valueTrigger: "StringVariableInstance",
                                    actions: [
                                        {
                                            name: "franceCitiesSelect",
                                            action: "show"
                                        },
                                        {
                                            name: "USACitiesSelect",
                                            action: "hide"
                                        },
                                    ]
                                },
                                {
                                    valueTrigger: "DoubleVariableInstance",
                                    actions: [
                                        {
                                            name: "franceCitiesSelect",
                                            action: "hide"
                                        },
                                        {
                                            name: "USACitiesSelect",
                                            action: "show"
                                        },
                                    ]
                                }
                            ]
                        },
                        {type: 'select', label: 'Select your city', name: 'franceCitiesSelect', choices: [{ value : "Paris" }, { value: "Lyon" }, { value: "Marseille" }] },
                        {type: 'select', label: 'Select your city', name: 'USACitiesSelect', choices: [{ value: "NewYork" }, { value: "Chicago" }, { value: "LA" }, { value: "San Francisco" }] }
   
                    ],
                    "StringVariableDescriptor" : [
                        { name: 'id', label:'Id', type: 'hidden'},
                        { name: '@class', type: 'hidden', value: 'StringVariableDescriptor'},
                        { name: 'name', label:'Name'},
                        { name: 'scope', type:'group', fields: [
                                { name: 'id', label:'Id', type: 'hidden'},
                                { name: '@class', value:'UserScope', type: 'hidden'}
                            ]},
                        { name: 'defaultVariableInstance', type:'group', fields: [
                                { name: '@class', value:'StringVariableInstance', type: 'hidden'},
                                { name: 'id', label:'Id', type: 'hidden'},
                                { name: 'content', label: 'DefaultValue'}
                            ]}
                    ],
                    
                    "StringVariableInstance" : [
                        { name: 'id', type: 'hidden'},
                        { name: '@class', type: 'hidden', value: 'StringVariableInstance'},
                        { name: 'content', label:'Value'}
                    ],
                    "User" : [ 
                        { name: 'id', label:'Id', type: 'hidden'},
                        { name: 'name', label:'Name'},
                        { name: 'email', label:'E-mail'},
                        { name: 'password', type: 'password', label: 'New password', showMsg: true,  id: 'firstPassword', strengthIndicator: true, capsLockWarning: true },
                        { type: 'password', label: 'Confirmation', showMsg: true, confirm: 'firstPassword' },
                        { name: '@class', label:'Class', type: 'hidden'}
                    ],
                    "VarDesc" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: '@class', label:'Class'},
                        {type: 'group',
                            name: 'cardinality',
                            label: 'cardinality',
                            fields: [
                                { name: '@class', label:'Cardinality class'},
                                { name: 'enumName', label:'Cardinality enum name', invite:"optional"},
                            ]
                        }
                    ],
                    "Var" : [
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: '@class', label:'Class'},
                        { type: 'list',
                            name: 'instanceIndex', 
                            listLabel: 'Items',
                            elementType: 
                                {type: 'group',
                                fields: [
                                    { name: '@class', label:'Instance class'},
                                    { name: 'id', label:'Instance id', invite:"optional"},
                                    { name: 'name', label:'Instance name', invite:"optional"},
                                ]
                            }	
                        }
                    ],
                    "Integer" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: 'min', label:'Min'},
                        { name: 'max', label:'Max'}, 
                        { name: 'minIncluded', label:'minIncluded', type: 'boolean'}, 
                        { name: 'maxIncluded', label:'maxIncluded', type: 'boolean'}, 
                        { name: 'default', label:'default'},
                        { name: '@class', label:'Class'}
                    ],
                    "String" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: 'pattern', label:'pattern'},
                        { name: '@class', label:'Class'}
                    ],
                    "Text" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: '@class', label:'Class'}
                    ],
                    "Enum" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { type: 'list',
                            name: 'items', 
                            listLabel: 'Items',
                            elementType: {
                                type: 'group',
                                name: 'fields',
                                //collapsible: true,
                                //legend: 'Phone number',
                                fields: [
                                    { name: 'id', label:'Item id', required: true },
                                    { name: 'name', label:'Item name'},
                                    { name: '@class', label:'Class', value: "EnumItem"}
                                ]
                            }
                        },
                        { name: '@class', label:'Class'}
                    ],
                    "Double" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: '@class', label:'Class'}
                    ],
                    "Boolean" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: '@class', label:'Class'}
                    ],
                    "Media" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: 'mediaType', label:'mediaType'},
                        { name: '@class', label:'Class'}
                    ],
                    "Complex" : [ 
                        { name: 'id', label:'Id', required: true },
                        { name: 'name', label:'Name'},
                        { name: '@class', label:'Class'}
                    ],
		    
                    /*********************************************************** Widgets Forms */
                    AlbaPageWidget: [
                        { name: 'id', label: 'ID', required: true },
                        { name: 'name', label: 'Name'},
                        /*{ name: 'uri', label: 'Uri'},*/
                        { name: 'type', value:'AlbaPageWidget', type: 'hidden'},
                        { name: 'cssClass', label: 'CSS class'}
                    ],
                    AlbaStateMachine: [
                        { name: 'id', label: 'ID', required: true },
                        { name: 'name', label: 'Name'},
                        { name: 'type', value:'AlbaStateMachine', type: 'hidden'}
                    ],
                    AlbaState: [ 
                        { name: 'id', label: 'ID', required: true },
                        { name: 'name', label: 'Name'},
                        { name: 'active', type:'boolean', label: 'Active'},
                        { name: 'enterAction', type:'text', label: 'On node enter', rows: 3, cols: 60},
                        { name: 'exitAction', type:'text', label: 'On node exit', rows: 3, cols: 60},
                        { name: 'type', value:'AlbaState', type: 'hidden'}
                        /*
                        { name: 'condition', type:'text', label: 'Condition', rows: 3, cols: 60},
                        { name: 'text',  type:'text', label: 'Description', cols: 60},
                        {type: 'select', label: 'Title', name: 'title', choices: ['Mr','Mrs','Ms'] },
                        {type:'email', label: 'Email', name: 'email'},
                        {type:'url', label: 'Website',name:'website'},
                        {type:'datetime', label: 'Date', name: 'date'},
                        {type:'colorpicker', label: 'Color', name: 'color'},
                        {type:'html', label: 'Text', name: 'any'},
                        {type: 'list', label: 'Test',	listLabel: 'Websites', elementType: { type: 'select', choices:  ['http://www.neyric.com', 'http://www.ajaxian.com', 'http://www.google.com', 'http://www.yahoo.com', 'http://javascript.neyric.com/blog', 'http://javascript.neyric.com/wireit', 'http://neyric.github.com/inputex']	}, value: ['http://www.neyric.com', 'http://www.ajaxian.com', 'http://www.google.com', 'http://www.yahoo.com'], useButtons: true  }
                         */
                    ],
                    AlbaTransition: [
                        { name: 'inputTrigger', label: 'Triggering link element',  metatype: 'widgetselect', targetType: 'AlbaLinkWidget,AlbaProjectTab'},
                        { name: 'transitionCondition', type:'text', label: 'Transition condition',rows: 3, cols: 60},
                        { name: 'transitionAction', type:'text', label: 'On transition', rows: 8, cols: 60},
                        { name: 'type', value:'AlbaTransition', type: 'hidden'}
			
                    ],
                    AlbaVariable: [
                        { name: 'id', label: 'ID', required: true },
                        // name: 'name', label: 'Nom', required: true },
                        { name: 'value', label: 'Valeur', required: true },
                        { name: 'type', value:'AlbaVariable', type: 'hidden'}
                    ],
                    AlbaText: [
                        { name: 'id', label: 'ID', required: true },
                        { name: 'text', label: 'Texte', type: 'html', opts: {width:'100%'} },
                        //	{ name: 'text', type:'text', label: 'Texte',rows: 8, cols: 60}
                        { name: 'type', value:'AlbaText', type: 'hidden'}
                    ],
		 
                    /***************************************************************************** WIDGETS FORMS *******************************/
                    AlbaListWidget: [
                        { name: 'id', label: 'ID', required: true },
                        { name: 'direction', label: 'Direction', type: 'select', choices: [  
                                { value: 'vertical', label: 'Vertical' }, 
                                { value: 'horizontal', label: 'Horizontal' } 
                            ] }, 
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'AlbaListWidget', type: 'hidden'}
                    ],
                    AlbaVariableWidget: [
                        { name: 'id', label: 'ID', required: true },
                        { name: 'label', label: 'Label'},
                        { name: 'variable', label: 'Target variable'},		
                        { name: 'view', label: 'Display mode', type: 'select', choices: [  
                                { value: 'text', label: 'Text' }, 
                                { value: 'button', label: 'Boxes' } 
                            ] }, 
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'AlbaVariableWidget', type: 'hidden'}
                    ],
                    AlbaLinkWidget: [
                        { name: 'id', label: 'ID', required: true },
                        /*{ name: 'name', label: 'Name'},*/
                        { name: 'label', label: 'Label'},
                        { name: 'targetArea', label: 'Targeted dynamic area element', metatype: 'widgetselect', targetType: 'AlbaDisplayAreaWidget' },
                        { name: 'targetSubpageId', label: 'Page fragment to display', metatype: 'subpageselect'},
                        /*{ name: 'isStoryEvent', label: 'Sends story event', type: 'boolean'},*/
                        { name: 'inputAction', label: 'On click', type:'text', rows: 8, cols: 60 },
                        { name: 'view', label: 'Display mode', type: 'select', choices: [  
                                { value: 'text', label: 'Text' }, 
                                { value: 'button', label: 'Button' } 
                            ] }, 
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'AlbaLinkWidget', type: 'hidden'}
                    ],
                    AlbaTextWidget: [
                        { name: 'id', label: 'ID', required: true },
                        //{ name: 'content', label: 'Content', type: 'text'},
                        { name: 'content', label: 'Content', type: 'html', opts: {width:'100%'} },
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'AlbaTextWidget', type: 'hidden'}
                    ],
                    AlbaDisplayAreaWidget:[
                        { name: 'id', label: 'ID', required: true },
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'AlbaDisplayAreaWidget', type: 'hidden'}
                    ],
                    AlbaTabView: [
                        { name: 'id', label: 'ID', required: true },
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'AlbaTabView', type: 'hidden'}
                    ],
                    AlbaTab: [
                        { name: 'id', label: 'ID', required: true },
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'AlbaTab', type: 'hidden'}
                    ],
                    AlbaProjectTab: [
                        { name: 'id', label: 'ID', required: true },
                        /*{ name: 'name', label: 'Nom', required: true },*/
                        { name: 'label', label: 'Label', required: true },
                        //{ name: 'text', label: 'Texte', type:'text', rows: 8, cols: 60 },
                        { name: 'text', label: 'Texte',  type: 'html', opts: {width:'100%'} },
			
                        { name: 'inputAction', label: 'On click', type:'text', rows: 8, cols: 60 },
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'AlbaProjectTab', type: 'hidden'}
                    ]
                }
            };
        </script> 

        <script type="text/javascript" src="wegas-base/js/wegas-bootstrap.js"></script>

    </body>
</html> 

