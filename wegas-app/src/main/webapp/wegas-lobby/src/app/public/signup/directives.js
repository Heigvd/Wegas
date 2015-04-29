angular.module('public.signup.directives', [])
    .directive('publicSignupIndex', function() {
        return {
        	scope: {
                close: "&"
            },
            controller: 'PublicSignupController as publicSignupCtrl',
    		templateUrl: 'app/public/signup/directives.tmpl/index.html'
        };
    })
    .controller('PublicSignupController', function PublicSignupController($scope, Auth, Flash) {
        var ctrl = this;
        ctrl.newUser = {
        	email:"",
        	username:"",
        	p1:"",
        	p2:"",
        	firstname:"",
        	lastname:""
        };
	    ctrl.signup = function () {
	        if (ctrl.newUser.p1 && ctrl.newUser.p1.length > 3) {
	        	if(ctrl.newUser.firstname && ctrl.newUser.firstname.length > 0 && ctrl.newUser.lastname && ctrl.newUser.lastname.length > 0){
		            if (ctrl.newUser.p1 === ctrl.newUser.p2) {
		                Auth.signup(ctrl.newUser.email, ctrl.newUser.username, ctrl.newUser.p1, ctrl.newUser.firstname, ctrl.newUser.lastname).then(function(response) {
		                    response.flash();
		                    if(!response.isErroneous()){
			                    $scope.close();
		                    }
		                });
		            } else {
		                Flash('danger', 'Passwords are different');
		            }
		        }else{
	                Flash('danger', 'Firstname and lastname are required');
		        }
	        } else {
	            Flash('danger', 'Your password should contains at least 3 characters');
	        }
	    }
    });