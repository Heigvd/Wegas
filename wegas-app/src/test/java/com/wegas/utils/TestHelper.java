package com.wegas.utils;

/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class TestHelper {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(TestHelper.class);

    public static void resetTestDB() {
        final String DB_CON = "jdbc:postgresql://localhost:5432/wegas_test";
        final String USER = "user";
        final String PASSWORD = "1234";
        try (Connection connection = DriverManager.getConnection(DB_CON, USER, PASSWORD);
                Statement st = connection.createStatement()) {
            st.execute("DROP SCHEMA public CASCADE;");
            st.execute("CREATE SCHEMA public;");
        } catch (SQLException ex) {
            logger.error("Error reseting DB: " + ex.getLocalizedMessage());
        }
    }

    public static String readFile(String path) {
        byte[] buffer;
        try {
            buffer = Files.readAllBytes(Paths.get(path));
        } catch (IOException ex) {
            return null;
        }
        return Charset.defaultCharset().decode(ByteBuffer.wrap(buffer)).toString();
    }
}
