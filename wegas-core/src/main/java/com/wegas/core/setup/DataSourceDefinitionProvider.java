/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.setup;

import jakarta.annotation.sql.DataSourceDefinition;
import jakarta.ejb.Stateless;
import org.postgresql.xa.PGXADataSource;

/**
 *
 * @author maxence
 */
@Stateless
@DataSourceDefinition(
    name = "java:global/WegasDS",
    className = "org.postgresql.xa.PGXADataSource",
    user = "${wegas.db.user}",
    password = "${wegas.db.password}",
    url = "jdbc:postgresql://${wegas.db.host}:${wegas.db.port}/${wegas.db.name}"
)
public class DataSourceDefinitionProvider {

    /**
     * Dummy method which do nothing. Nonetheless, setting return type to PGXADataSource asserts the
     * class is on the class-path
     *
     * @return the PGXADatasSurce class
     */
    public Class<? extends PGXADataSource> loadDep() {
        return PGXADataSource.class;
    }
}