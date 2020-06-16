/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi;

import gov.adlnet.xapi.model.IStatementObject;
import gov.adlnet.xapi.model.Result;
import gov.adlnet.xapi.model.Statement;
import java.util.List;
import java.util.Map;

public interface XapiI {

    Statement userStatement(final String verb, final IStatementObject object);

    IStatementObject activity(String id);

    /**
     * Activity with custom ActivityDefinition
     *
     * @param id           activityTy
     * @param activityType definition type
     * @param name         activity definition name, mapped by language code
     * @param definition   definition itself, mapped by language code
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
