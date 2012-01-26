/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/
var	Config = {
	path : "/",
	loggedIn : true,
	lang : 'en',
	//debug : true,
	currentGameId: 0,
	gameDesigns: [
		{ name: 'Empty Project', scenarios: ["Default"], dataSrc: './data/alba-emptyproject-data.json', url: './alba-prototype-emptyproject.html'},
		{ name: 'Alba-ProjectManagment', scenarios: ["Artos"], dataSrc: './data/alba-project-data.json', url: './alba-prototype-projectmanagment.html'},
		{ name: 'Alba-Ladder&Snakes', scenarios: ["Default"], dataSrc: './data/alba-laddergame-data.json', url: './alba-prototype-ladder&snakes.html'}
	],
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
	formFields: {
		/***************************************************************************** VARIABLES FORMS *******************************/
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