var require={
    "waitSeconds": 15,
    "baseUrl": "wegas-admin/js",
    "shim": {
       "ember": {
            "deps": ["jquery"],
            "exports": "Ember"
        },
        "bootstrap": {"deps": ["jquery"]},
        "ember-data": {
            "deps": ["ember"],
            "exports": "DS"
        },
        "jquery": {exports: "jQuery"}
    },
    "paths": {
        "lib": "../lib",
        "jquery": "http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min",
        "bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min",
        "ember-template-compiler":"http://builds.emberjs.com/tags/v1.10.0/ember-template-compiler",
        "ember": "https://cdnjs.cloudflare.com/ajax/libs/ember.js/1.10.0/ember.min",
        "ember-data": "https://cdnjs.cloudflare.com/ajax/libs/ember-data.js/1.0.0-beta.14.1/ember-data.min"
    }

};
require.config(require);