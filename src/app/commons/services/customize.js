angular.module('wegas.service.customize', [])
.factory('Customize', function(Flash) {
	var colors = [
		'orange', 'blue', 'red', 'yellow', 
		'purple','pink', 'green', 'grey'
		],
		icons = [
			{name: "Game", key: "gamepad"},
			{name: "Automobile", key:"car"},
			{name: "Beer", key:"beer"}
		];
	return {
		colorsPalette: function(){
			return colors;
		},
		iconsPalette: function(){
			return icons;
		}
	};
});