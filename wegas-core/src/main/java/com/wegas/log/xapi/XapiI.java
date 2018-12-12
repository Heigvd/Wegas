package com.wegas.log.xapi;

import java.util.List;

import gov.adlnet.xapi.model.*;

public interface XapiI {

    Statement userStatement(final String verb, final IStatementObject object);

    IStatementObject activity(String id);

    Result result(String response);

    Result result();

    void post(Statement stmt);

    void post(List<Statement> stmts);
}