/* global xapi */
/* exported Log */
var surveyXapi = (function() {
    var Verbs = {
        initialized: 'http://adlnet.gov/expapi/verbs/initialized',
        completed: 'http://adlnet.gov/expapi/verbs/completed',
        answered: 'http://adlnet.gov/expapi/verbs/answered',
    };
    var Activities = {
        survey: 'act:wegas/survey'
    };
    /**
     * @param {keyof typeof Verbs} verb
     * @param {keyof typeof Activities} activity
     * @param {(string | number)=} param
     */
    function statement(verb, activity, param) {
        return xapi.userStatement(
            Verbs[verb],
            xapi.activity(
                Activities[activity] + (param != null ? '/' + param : '')
            )
        );
    }
    /**
     * @param {any} stmt
     */
    function post(stmt) {
        xapi.post(stmt);
    }

    /**
     * @param {string} value
     * @param {string} kind 
     * @param {string} survname
     * @param {string} inputname
     */
    function buildInputStatement(value, kind, survname, inputname) {
        var statement = surveyXapi.statement('answered', 'survey', survname + '/' + kind + '/' + inputname);
        statement.setResult(xapi.result(value));
        return statement;
    }
    
    /**
     * @param {string} survname
     */
    function surveyCompleted(survname) {
        var statement = surveyXapi.statement('completed', 'survey', survname);
        return statement;
    }

    /**
     * @param {string} survname
     */
    function surveyInitialized(survname) {
        var statement = surveyXapi.statement('initialized', 'survey', survname);
        return statement;
    }

    /*
     * Dummy function for testing import of library
     */
    function testLib() {
        return;
    }
    
    return {
        statement: statement,
        post: post,
        textInput: function(value, survname, inputname){
           return buildInputStatement(value, 'text', survname, inputname);
        },
        numberInput: function(value, survname, inputname){
           return buildInputStatement(value, 'number', survname, inputname);
        },
        choiceInput: function(value, survname, inputname){
           return buildInputStatement(value, 'choice', survname, inputname);
        },
        surveyCompleted: surveyCompleted,
        surveyInitialized: surveyInitialized,
        testLib: testLib
    };
})();
