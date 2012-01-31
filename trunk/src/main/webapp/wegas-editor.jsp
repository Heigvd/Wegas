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
        <!-- <script type="text/javascript" src="jquery/jquery.form.js"></script>-->
        <script type="text/javascript" src="jquery/jquery.atmosphere.js"></script>


        <script type="text/javascript" >
            YUI_config.groups.inputex.base = 'lib/inputex/build/';		// Hack fix inputex loading path so it uses local files
	    
            var Config = {
                base : 'http://localhost:8080/Wegas/',
                layoutSrc: 'data/editor-layout.json',
                lang : 'en-US',
                debug : true,
                currentGameModel: 1,
                currentTeamId: 1,
                currentUserId: 1,
                css: ['wegas-projectmanagementgame/assets/wegas-projectmanagementgame.css'],
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
                            }, { fn: "DataSourceVariableDescriptorREST" }
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
               
        </script> 

        <script type="text/javascript" src="wegas-base/js/wegas-bootstrap.js"></script>

    </body>
</html> 

