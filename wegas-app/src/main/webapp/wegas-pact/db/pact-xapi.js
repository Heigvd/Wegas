/* global xapi */
/* exported Log */
var Log = (function() {
    var Verbs = {
        initialized: 'http://adlnet.gov/expapi/verbs/initialized',
        completed: 'http://adlnet.gov/expapi/verbs/completed',
        resumed: 'http://adlnet.gov/expapi/verbs/resumed',
        suspended: 'http://adlnet.gov/expapi/verbs/suspended',
        responded: 'http://adlnet.gov/expapi/verbs/responded',
    };
    var Activities = {
        proggame: 'internal://wegas/proggame',
        level: 'internal://wegas/proggame-level',
        theory: 'internal://wegas/proggame-theory',
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
     * @param {string} script
     * @param {string | number} levelid
     * @param {boolean} success
     * @param {boolean} completion
     */
    function level(script, levelid, success, completion) {
        var statement = Log.statement('responded', 'level', levelid);
        var result = xapi.result(script);
        result.setSuccess(success);
        result.setCompletion(completion);
        statement.setResult(result);
        return statement;
    }
    return {
        statement: statement,
        post: post,
        level: level,
    };
})();
