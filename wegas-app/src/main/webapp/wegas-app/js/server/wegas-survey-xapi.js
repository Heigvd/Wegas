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
     * @param {string} html
     * @param {string} survname
     * @param {string} inputname
     */
    function textInput(html, survname, inputname) {
        var statement = surveyXapi.statement('answered', 'survey', survname + '/text/' + inputname);
        var result = xapi.result(html);
        statement.setResult(result);
        return statement;
    }

    /**
     * @param {string} value
     * @param {string} survname
     * @param {string} inputname
     */
    function numberInput(value, survname, inputname) {
        var statement = surveyXapi.statement('answered', 'survey', survname + '/number/' + inputname);
        statement.setResult(xapi.result(value));
        return statement;
        return statement;
    }

    /**
     * @param {string} value
     * @param {string} survname
     * @param {string} inputname
     */
    function choiceInput(value, survname, inputname) {
        var statement = surveyXapi.statement('answered', 'survey', survname + '/choice/' + inputname + '/value/' + value);
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
        textInput: textInput,
        numberInput: numberInput,
        choiceInput: choiceInput,
        surveyCompleted: surveyCompleted,
        surveyInitialized: surveyInitialized,
        testLib: testLib
    };
})();
