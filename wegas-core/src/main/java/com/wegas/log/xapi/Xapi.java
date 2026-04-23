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
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/*
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

@Stateless
@LocalBean
public class Xapi implements XapiI {

    private static final Logger logger = LoggerFactory.getLogger(Xapi.class);

    @Override
    public Statement userStatement(final String verb, final IStatementObject object) {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Statement();
    }

    @Override
    public IStatementObject activity(String id) {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Activity();
    }

    @Override
    public IStatementObject activity(String id, String activityType,
        Map<String, String> name,
        Map<String, String> definition) {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Activity();
    }

    @Override
    public Result result(String response) {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Result();
    }

    @Override
    public Result result() {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Result();
    }

    @Override
    public void post(Statement stmt) {
        logger.debug("Quietly, do nothing as xapi is deprecated");
    }

    @Override
    public void post(List<Statement> stmts) {
        logger.debug("Quietly, do nothing as xapi is deprecated");
    }

    @Override
    public void post(String verb, String activity) {
        logger.debug("Quietly, do nothing as xapi is deprecated");
    }

    @Override
    public void post(String verb, String activity, String result) {
        logger.debug("Quietly, do nothing as xapi is deprecated");
    }
}
