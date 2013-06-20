package com.wegas.app;

/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class TestHelper {

    private static Connection connection = null;

    protected static void createIntegrationDB(){
        if (connection == null) {
            try {
                connection = DriverManager.getConnection("jdbc:postgresql://localhost:5432/template1", "postgres", null);
                try (Statement st = connection.createStatement()) {
                    st.execute("CREATE DATABASE wegas_it");
                }
                connection.commit();
            } catch (SQLException ex) {
                System.out.println("Error creating database");
            }
        }
    }

    protected static void dropIntegrationDB(){
        if (connection != null) {
            try {
                try (Statement st = connection.createStatement()) {
                    st.execute("DROP DATABASE wegas_it");
                }
                connection.commit();
                connection.close();
                connection = null;
            } catch (SQLException ex) {
                System.out.println("Error dropping database");
            }
        }
    }
}
