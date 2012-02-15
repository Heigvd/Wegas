<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html >
<html lang="en"> 
    <head>   
        <title>Wegas - 0.2</title> 
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> 
        <meta name="description" content="" /> 
        <meta name="keywords" content="" />     
        <meta name="robots" content="index, follow" /> 
        <meta name="contact" content="fx@red-agent.com" /> 
        <meta name="audience" content="General" /> 
        <meta name="distribution" content="Global" /> 
        <meta name="revisit-after" content="30 days" /> 
        <link rel="icon" type="image/ico" href="/favicon.ico" /> 

        <!-- YUI -->
        <!-- CDN  -->
        <!--<link rel="stylesheet" type="text/css" 
                        href="http://yui.yahooapis.com/combo?3.3.0/build/cssfonts/fonts-min.css&3.3.0/build/cssreset/reset-min.css&3.3.0/build/cssgrids/grids-min.css&3.3.0/build/cssbase/base-min.css&3.3.0pr3/build/widget/assets/skins/sam/widget.css&3.3.0pr3/build/node-menunav/assets/skins/sam/node-menunav.css&" charset="utf-8" /> 
            <link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/assets/skins/sam/skin.css">   -->

        <!-- Self hosted -->
        <link rel="stylesheet" type="text/css" href="lib/yui3/build/cssfonts/fonts-min.css" />
        <link rel="stylesheet" type="text/css" href="lib/yui3/build/cssreset/reset-min.css" />

        <!-- WireIt -->
        <link rel="stylesheet" type="text/css" href="lib/wireit/css/WireIt.css" /> 

        <!-- InputEx -->
        <!-- <link type='text/css' rel='stylesheet' href='lib/inputex/css/inputEx.css' />-->

        <meta id="customstyles" /> 
        <link rel="stylesheet" type="text/css" href="wegas-editor/assets/wegas-editor.css" />

    </head> 
    <body class="yui3-skin-sam yui-skin-sam " > 

        <!-- YUI Base -->
        <!-- CDN -->
        <!--<script type="text/javascript" src="http://yui.yahooapis.com/combo?3.5.0pr1/build/yui/yui-min.js&3.5.0pr1/build/loader/loader-min.js"></script> 
        -->
        <!-- Self hosted -->
        <script type="text/javascript" src="lib/yui3/build/yui/yui.js"></script> 
        <script type="text/javascript" src="lib/yui3/build/loader/loader.js"></script>

        <!-- inputEx Base -->
        <script src="lib/inputex/build/loader.js"  type='text/javascript'></script>

        <!-- Atmosphere jquery -->
        <script type="text/javascript" src="jquery/jquery-1.6.4.js"></script>
        <script type="text/javascript" src="jquery/jquery.atmosphere.js"></script>


        <script type="text/javascript" >
            YUI_config.groups.inputex.base = 'lib/inputex/build/';		// Hack fix inputex loading path so it uses local files
            
            var ScopeForm = [
                { name: 'id', type: 'hidden'},
                { type: 'select', 
                    name: '@class',
                    label: 'Variable is',
                    choices: [
                        { value: "PlayerScope", label: 'different for each user' }, 
                        { value: "TeamScope", label: 'different for each team' }, 
                        { value: "GameModelScope", label: 'the same for everybody' }
                    ]
                }
            ],
            Config = {
                base : 'http://localhost:8080/Wegas/',
                layoutSrc: 'wegas-editor/db/wegas-editor-layout.json',
                lang : 'en-US',
                debug : true,
                currentGameModel: 1,
                currentGame: 1,
                currentTeamId: 1,
                currentUserId: 1,
                loggedIn : true,
                css: ['wegas-projectmanagementgame/assets/wegas-projectmanagementgame.css'],
                dataSources: {
                    "GameModel": {
                        source: "rs/gm",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: "."
                                       // resultFields: ["name", "id", "@class", "errors"]
                                    }
                                }
                            }, { fn: "GameModelDataSourceREST" }
                        ]
                    },
                    "Game": {
                        source: "rs/gm/1/game",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: "."
                                       // resultFields: ["name", "id", "@class", "errors"]
                                    }
                                }
                            }, { fn: "GameDataSourceREST" }
                        ]
                    },
                    "Page": {
                        source: "wegas-projectmanagementgame/db/wegas-pmg-pages.json",
                        plugins: [
                            {
                                fn: "DataSourceJSONSchema", 
                                cfg: {
                                    schema: {
                                        resultListLocator: "."
                                        //resultFields: ["name", "id", "@class"]
                                    }
                                }
                            }, { fn: "DataSourceREST" }
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
                            }, { fn: "DataSourceREST" }
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
                            }, { fn: "DataSourceREST" }
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
                            }, { fn: "VariableDescriptorDataSourceREST" }
                        ]
                    }
                },
                forms: {

                    /*********************************************************** Types Forms */
                    "GameModel" : [ 
                        { name: 'id', type: 'hidden' },
                        { name: 'name', label:'Name', required: true},
                        { name: '@class', value:'GameModel', type: 'hidden'}
                    ],  
                    "Game" : [ 
                        { name: 'id', type: 'hidden' },
                        { name: 'name', label:'Name', required: true},
                        { name: 'token', label:'Token', required: true},
                        { name: '@class', value:'Game', type: 'hidden'}
                    ],
                    "Team" : [ 
                        { name: 'id', type: 'hidden'},
                        { name: '@class', value:'Team', type: 'hidden'},
                        { name: 'name', label:'Name', required: true},
                        // { name: 'token', label:'Token'},
                    ],
                    "Player" : [ 
                        { name: 'id', type: 'hidden'},
                        { name: 'name', label:'Name', required: true},
                        { name: '@class', value:'Player', type: 'hidden'}
                    ],
                    "User" : [ 
                        { name: 'id', type: 'hidden'},
                        { name: 'name', label:'Name', required: true},
                        { name: 'email', label:'E-mail', required: true, regexp: /^[a-z0-9!\#\$%&'\*\-\/=\?\+\-\^_`\{\|\}~]+(?:\.[a-z0-9!\#\$%&'\*\-\/=\?\+\-\^_`\{\|\}~]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,6}$/i },
                        { name: 'password', type: 'password', label: 'New password', showMsg: true,  id: 'firstPassword', strengthIndicator: true, capsLockWarning: true },
                        { type: 'password', label: 'Confirmation', showMsg: true, confirm: 'firstPassword' },
                        { name: '@class', value:'User', type: 'hidden'}
                    ],
                    "StringVariableDescriptor": [
                        { name: 'id', type: 'hidden'},
                        { name: '@class', type: 'hidden', value: 'StringVariableDescriptor'},
                        { name: 'name', label:'Name', required: true},
                        { name: 'scope', type:'group', fields: ScopeForm},
                        { name:'defaultVariableInstance', type:'group', fields: [
                                { name: '@class', value:'StringVariableInstance', type: 'hidden'},
                                { name: 'id', type: 'hidden'},
                                { name: 'value', label: 'Default value'}
                            ]}
                    ],
                    "StringVariableInstance": [
                        { name: '@class', value:'StringVariableInstance', type: 'hidden'},
                        { name: 'id', type: 'hidden'},
                        { name: 'value', label: 'Text'}
                    ],
                    "NumberVariableDescriptor": [
                        { name: 'id', type: 'hidden'},
                        { name: '@class', type: 'hidden', value: 'NumberVariableDescriptor'},
                        { name: 'name', label:'Name', required: true},
                        { name: 'scope', type:'group', fields: ScopeForm},
                        { name:'defaultVariableInstance', type:'group', fields: [
                                { name: '@class', value:'NumberVariableInstance', type: 'hidden'},
                                { name: 'id', type: 'hidden'},
                                { name: 'value', label: 'Default value', regexp: /^[0-9]*$/ }
                            ]}
                    ],
                    "NumberVariableInstance": [
                        { name: '@class', value:'NumberVariableInstance:', type: 'hidden'},
                        { name: 'id', type: 'hidden'},
                        { name: 'value', label: 'Value', regexp: /^[0-9]*$/ }
                    ],
                    "ListVariableDescriptor": [
                        { name: 'id', type: 'hidden'},
                        { name: '@class', type: 'hidden', value: 'ListVariableDescriptor'},
                        { name: 'name', label:'Name', required: true},
                        { name: 'scope', type:'group', fields: ScopeForm},
                        { name:'defaultVariableInstance', type:'group'}
                    ],
                    "ListVariableInstance": [
                        { name: '@class', value:'ListVariableInstance', type: 'hidden'},
                        { name: 'id', type: 'hidden'}
                    ],
                    "MCQVariableDescriptor": [
                        { name: 'id', type: 'hidden'},
                        { name: '@class', type: 'hidden', value: 'MCQVariableDescriptor'},
                        { name: 'scope', type:'group', fields: ScopeForm},
                        { name: 'name', label:'Name', required: true},
                        { name: 'label', label:'Label'},
                        { name: 'allowMultipleReplies', 'label': 'Allow multiple replies', type: 'boolean', value: false},
                        { name:'defaultVariableInstance', type:'group', fields: [
                                { name: '@class', value:'MCQVariableInstance', type: 'hidden'},
                                { name: 'id', type: 'hidden'},
                                { name: 'active', 'label': 'Active by default', type: 'boolean', value: true}
                            ]},
                        { name: 'description', 'type': 'html', label:'Description', opts: {"width":"100%", height: '80px', autoHeight: true, dompath: false }},                                           
                        //{ name: 'description', 'type': 'text', label:'Description', opts: {"width":"100%", height: '100px', autoHeight: true, dompath: false }},                                           
                        {
                            type: 'list',
                            name: 'replies',
                            label: 'Replies',
                            elementType: {
                                type: 'group', fields: [
                                    { name: 'id', type: 'hidden'},
                                    { name: '@class', type: 'hidden', value: 'MCQVariableDescriptorReply'},
                                    { name: 'name', label:'Name', required: true},
                                    { name: 'description', 'type': 'html', label:'Description', opts: {width:'100%', height: '50px', autoHeight: true, dompath: false}},
                                    { name: 'answer', 'type': 'html', label:'Answer', opts: {width:'100%', height: '50px', autoHeight: true, dompath: false}},
                                    { name: 'impact', 'type': 'text', label:'Impact', rows: 3},  
                                ]},
                            useButtons: true
                        }
                    ],
                    "MCQVariableInstance": [
                        { name: '@class', value:'MCQVariableInstance', type: 'hidden'},
                        { name: 'id', type: 'hidden'},
                        { name: 'active', 'label': 'Active', type: 'boolean', value: true}
                    ],
                    
                    

                    /*********************************************************** Widgets Forms */
                    List: [
                        { name: 'label', label: 'Label'},
                        { name: 'direction', label: 'Direction', type: 'select', choices: [  
                                { value: 'vertical', label: 'Vertical' }, 
                                { value: 'horizontal', label: 'Horizontal' } 
                            ] }, 
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'List:', type: 'hidden'}
                    ],
                    VariableDisplay: [
                        { name: 'label', label: 'Label'},
                        { name: 'variable', label: 'Target variable'},		
                        { name: 'view', label: 'Display mode', type: 'select', choices: [  
                                { value: 'text', label: 'Text' }, 
                                { value: 'button', label: 'Boxes' }, 
                                { value: 'gauge', label: 'Gauge' } 
                            ] }, 
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'VariableDisplay:', type: 'hidden'}
                    ],
                    Button: [
                        /*{ name: 'name', label: 'Name'},*/
                        { name: 'label', label: 'Label'},
                        /*{ name: 'targetArea', label: 'Targeted dynamic area element', metatype: 'widgetselect', targetType: 'AlbaDisplayAreaWidget' },
                        { name: 'targetSubpageId', label: 'Page fragment to display', metatype: 'subpageselect'},
                        { name: 'isStoryEvent', label: 'Sends story event', type: 'boolean'},
                        { name: 'inputAction', label: 'On click', type:'text', rows: 8, cols: 60 },*/
                        { name: 'view', label: 'Display mode', type: 'select', choices: [  
                                { value: 'text', label: 'Text' }, 
                                { value: 'button', label: 'Button' } 
                            ] }, 
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'Button', type: 'hidden'}
                    ],
                    Text: [
                        { name: 'content', 'type': 'html', label:'Description', opts: {width:'100%', height: '250px', autoHeight: true, dompath: false}},
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'Text', type: 'hidden'}
                    ],
                    DisplayArea:[
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'DisplayArea', type: 'hidden'}
                    ],
                    TabView: [
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'TabView', type: 'hidden'}
                    ],
                    Tab: [
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'Tab', type: 'hidden'}
                    ],
                    PMGChoiceDisplay: [
                        { name: 'cssClass', label: 'CSS class'},
                        { name: 'type', value:'PMGChoiceDisplay', type: 'hidden'}
                    ]
                }
            };
            
            Config.forms.ListVariableDescriptor.fields = Config.forms.ListVariableInstance
            Config.forms.VariableDescriptor = [
                { name: 'valueselector', label:'Variable is', type: 'keyvalue', availableFields: [
                        {type: 'group', name: 'StringVariableDescriptor', label: 'a string',fields: Config.forms.StringVariableDescriptor}, 
                        {type: 'group', name: 'NumberVariableDescriptor', label: 'a number',fields:  Config.forms.NumberVariableDescriptor },
                        {type: 'group', name: 'MCQVariableDescriptor', label: 'a choice', fields: Config.forms.MCQVariableDescriptor },
                        {type: 'group', name: 'ListVariableDescriptor', label: 'a list',fields:  Config.forms.ListVariableDescriptor }
                    ]
                }
            ];
        </script> 

        <script type="text/javascript" src="wegas-app/js/wegas-bootstrap.js"></script>

    </body>
</html>