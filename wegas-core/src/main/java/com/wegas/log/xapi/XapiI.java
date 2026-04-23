/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi;

import java.util.List;
import java.util.Map;

/*
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public interface XapiI {

    Statement userStatement(final String verb, final IStatementObject object);

    IStatementObject activity(String id);

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
