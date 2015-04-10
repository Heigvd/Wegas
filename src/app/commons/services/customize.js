angular.module('wegas.service.customize', [])
.factory('Customize', function(Flash) {
	var colors = [
		'orange', 'blue', 'red', 'yellow', 
		'purple','pink', 'green', 'grey'
		],
		icons = [
			{name: "Automobile", icon:"car"},
			{name: "Beer", icon:"beer"}
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