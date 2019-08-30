package com.wegas.log.xapi;

import java.util.List;

import gov.adlnet.xapi.model.*;
import java.util.Map;

public interface XapiI {

    Statement userStatement(final String verb, final IStatementObject object);

    IStatementObject activity(String id);

    /**
     * Activity with custom ActivityDefinition
     *
     * @param id    activityTy
     * @param activityType definition type
     * @param name activity definition name, mapped by language code
     * @param definition definition itself, mapped by language code
     *
     * @return
     */
    IStatementObject activity(String id, String activityType,
            Map<String, String> name,
            Map<String, String> definition);

    Result result(String response);

    Result result();

    void post(String verb, String activity);

    void post(String verb, String activity, String result);

    void post(Statement stmt);

    void post(List<Statement> stmts);
}
