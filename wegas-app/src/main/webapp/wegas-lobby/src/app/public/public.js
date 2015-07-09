angular.module('public', [
    'public.login',
    'public.signup',
    'public.password'
])
.config(function ($stateProvider, $translateProvider) {
    $stateProvider
        .state('wegas.public', {
            url: 'public',
            views: {
                'main@': {
                    controller: 'PublicIndexCtrl as publicCtrl',
                    templateUrl: 'app/public/public.tmpl.html'
                },
                "form@wegas.public": {
                    controller: 'PublicLoginCtrl as publicLoginCtrl',
                    templateUrl: 'app/public/login/login.tmpl.html'
                }
            }
        })
    ;
        
    $translateProvider.translations('en', {
        'WEGAS-SLOGAN': "The \"learning by doing\" solution from AlbaSim",
        'LANGUAGE-FRENCH-NAME': "French",
        'LANGUAGE-ENGLISH-NAME': "English",
        'LOGIN-BTN': "Login",
        'LOGIN-INPUT-EMAIL': "email or username",
        'LOGIN-INPUT-PASSWORD': "password",
        'LOGIN-FLASH-EMPTY': 'username/password cannot be empty',
        'CREATE-ACCOUNT-LABEL': "Haven't yet a Wegas account ?",
        'CREATE-ACCOUNT-BTN': "Create account",
        'CREATE-ACCOUNT-TITLE': "Create account",
        'CREATE-ACCOUNT-INPUT-EMAIL': "email",
        'CREATE-ACCOUNT-INPUT-PASSWORD': "password",
        'CREATE-ACCOUNT-INPUT-PASSWORD-AGAIN': "password again",
        'CREATE-ACCOUNT-INPUT-USERNAME': "username",
        'CREATE-ACCOUNT-INPUT-FIRSTNAME': "firstname",
        'CREATE-ACCOUNT-INPUT-LASTNAME': "lastname",
        'CREATE-ACCOUNT-SEND-BTN': "Create account",
        'CREATE-ACCOUNT-FLASH-WRONG-NAME' : "Firstname and lastname are required",
        'CREATE-ACCOUNT-FLASH-WRONG-PASS' : "Your password should contains at least 3 characters",
        'CREATE-ACCOUNT-FLASH-WRONG-PASS2' : "Passwords are different",
        'PASSWORD-BTN': "Password forgotten",
        'PASSWORD-INPUT-EMAIL': "type your email",
        'PASSWORD-TITLE': "Password forgotten",
        'PASSWORD-SEND-BTN': 'Send me a new password',
        'PASSWORD-FLASH-EMPTY': "Please, enter your email",
        'COMMONS-AUTH-PASSWORD-FLASH-SUCCESS':"A new password has been send",
        'COMMONS-AUTH-PASSWORD-FLASH-ERROR':"Error during password generation",
        'COMMONS-AUTH-CREATE-ACCOUNT-FLASH-SUCCESS':"Account created",
        'COMMONS-AUTH-CREATE-ACCOUNT-FLASH-ERROR':"Error during account creation",
        'COMMONS-AUTH-LOGIN-FLASH-SUCCESS':"You are logged",
        'COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT':"Login or password is wrong",
        'COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER':"Server error during connection",
        'COMMONS-AUTH-LOGOUT-FLASH-SUCCESS':"You are deconnected",
        'COMMONS-AUTH-LOGOUT-FLASH-ERROR':"Error when logout",
        'COMMONS-AUTH-GUEST-FLASH-SUCCESS':"Connected as guest",
        'COMMONS-AUTH-GUEST-FLASH-ERROR':"Error during connection"
        
    });
    
    $translateProvider.translations('fr', {        
        'WEGAS-SLOGAN': "La solution \"learning by doing\" développée par AlbaSim",
        'LANGUAGE-FRENCH-NAME': "Français",
        'LANGUAGE-ENGLISH-NAME': "Anglais",
        'LOGIN-BTN': "Connexion",
        'LOGIN-INPUT-EMAIL': "email ou nom d'utilisateur",
        'LOGIN-INPUT-PASSWORD': "mot de passe",
        'LOGIN-FLASH-EMPTY': "Veuillez renseigner l'email et le mot de passe",
        'CREATE-ACCOUNT-LABEL': "Pas encore de compte Wegas ?",        
        'CREATE-ACCOUNT-BTN': "Créer un compte",
        'CREATE-ACCOUNT-TITLE': "Créer un compte",
        'CREATE-ACCOUNT-INPUT-EMAIL': "email",
        'CREATE-ACCOUNT-INPUT-PASSWORD': "mot de passe",
        'CREATE-ACCOUNT-INPUT-PASSWORD-AGAIN': "mot de passe à nouveau",
        'CREATE-ACCOUNT-INPUT-USERNAME': "nom d'utilisateur",
        'CREATE-ACCOUNT-INPUT-FIRSTNAME': "prénom",
        'CREATE-ACCOUNT-INPUT-LASTNAME': "nom de famille",
        'CREATE-ACCOUNT-SEND-BTN': "Créer le compte",
        'CREATE-ACCOUNT-FLASH-WRONG-NAME' : "Le prénom et le nom de famille sont obligatoires",
        'CREATE-ACCOUNT-FLASH-WRONG-PASS' : "Le mot de passe doit contenire au moins 3 charactères",
        'CREATE-ACCOUNT-FLASH-WRONG-PASS2' : "Les champs liés au mot de passe sont differents",
        'PASSWORD-BTN': "Mot de passe oublié",
        'PASSWORD-INPUT-EMAIL': "entrez votre email",
        'PASSWORD-TITLE': "Mot de passe oublié",
        'PASSWORD-SEND-BTN': 'Envoyez moi un nouveau mot de passe',
        'PASSWORD-FLASH-EMPTY': "Merci d'entrer votre email",
        'COMMONS-AUTH-PASSWORD-FLASH-SUCCESS':"Un nouveau mot de passe a été envoyé",
        'COMMONS-AUTH-PASSWORD-FLASH-ERROR':"Erreur durant la génération du mot de passe",
        'COMMONS-AUTH-CREATE-ACCOUNT-FLASH-SUCCESS':"Compte créé",
        'COMMONS-AUTH-CREATE-ACCOUNT-FLASH-ERROR':"Erreur durant la création du compte",
        'COMMONS-AUTH-LOGIN-FLASH-SUCCESS':"Vous êtes connecté",
        'COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT':"Login ou mot de passe incorrect",
        'COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER':"Erreur serveur durant la connexion",
        'COMMONS-AUTH-LOGOUT-FLASH-SUCCESS':"Vous êtes déconnecté",
        'COMMONS-AUTH-LOGOUT-FLASH-ERROR':"Erreur durant la déconnexion",
        'COMMONS-AUTH-GUEST-FLASH-SUCCESS':"Connecté en tant que guest",
        'COMMONS-AUTH-GUEST-FLASH-ERROR':"Erreur durant la connection"
        
    });
 
    if(localStorage.getObject("wegas-config@public")){
        $translateProvider.use(localStorage.getObject("wegas-config@public").language);
    }else{
        localStorage.setObject("wegas-config@public", {
            'language':'en'
        });
        $translateProvider.use('en');
    }
    console.log(localStorage.getObject('wegas-config@public'));
})
.controller('PublicIndexCtrl', function PublicIndexCtrl($scope, $rootScope, $state, $translate, Auth) {
    var ctrl = this;
    console.log(localStorage.getObject("wegas-config@public.language"));
    ctrl.currentLanguage = localStorage.getObject("wegas-config@public").language;
    ctrl.changeLanguage = function(key){
        var config = localStorage.getObject("wegas-config@public");
        config.language = key;
        ctrl.currentLanguage = key;
        $translate.use(key);
        localStorage.setObject("wegas-config@public", config);
    };
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            if(user.isScenarist){
                $state.go("wegas.private.scenarist");
            }else{
                if(user.isTrainer){
                    $state.go("wegas.private.trainer");
                }else{
                    $state.go("wegas.private.player");
                }
            }
        }
    });
});