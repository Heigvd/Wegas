package com.wegas.app;

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

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class TestHelper {

    private static Connection connection = null;

    protected static void resetTestDB() {
        if (connection == null) {
            try {
                connection = DriverManager.getConnection("jdbc:postgresql://localhost:5432/wegas_test", "user", "1234");
                try (Statement st = connection.createStatement()) {
                    st.execute("DROP SCHEMA public CASCADE;");
                    st.execute("CREATE SCHEMA public;");
                }
                connection.commit();
            } catch (SQLException ex) {
                System.out.println("Error creating database");
            }
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
