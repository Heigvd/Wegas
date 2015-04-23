angular.module('wegas.service.viewInfos', [])
	.service('ViewInfos', function () {
		var service = this;
		service.name = "Workspace";	
		service.editName = function(newName){
			service.name = newName;
		};
	})
;