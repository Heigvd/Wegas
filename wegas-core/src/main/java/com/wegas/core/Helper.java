/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.MissingResourceException;
import java.util.ResourceBundle;
import java.util.StringTokenizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author fx
 */
public class Helper {

    private static final Logger logger = LoggerFactory.getLogger(Helper.class);

    /**
     *
     * @param <T>
     * @param context
     * @param type
     * @param service
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Context context, Class<T> type, Class service) throws NamingException {
        try {
            return (T) context.lookup("java:module/" + service.getSimpleName() + "!" + type.getName());
        } catch (NamingException ex) {
            try {
                return (T) context.lookup("java:global/classes/" + service.getSimpleName() + "!" + type.getName());
            } catch (NamingException ex3) {
                try {
                    return (T) context.lookup("java:global/embed-classes/" + service.getSimpleName() + "!" + type.getName());
                } catch (NamingException ex1) {
                    try {
                        return (T) context.lookup("java:global/cobertura/" + service.getSimpleName() + "!" + type.getName());
                    } catch (NamingException ex2) {
                        logger.error("Unable to retrieve to do jndi lookup on class: {}", type.getSimpleName());
                        throw ex2;
                    }
                }
            }
        }
    }

    public static <T> T lookupBy(Context context, Class<T> type) throws NamingException {
        return lookupBy(context, type, type);
    }

    /**
     *
     * @param <T>
     * @param type
     * @param service
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return lookupBy(new InitialContext(), type, service);
    }

    /**
     *
     * @param <T>
     * @param type
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return lookupBy(type, type);
    }

    /**
     * Encode a String to look like a JavaScript variable.
     *
     * @param name String to encode
     * @return a String wich will be undestandable by JavaScript as a var
     */
    public static String encodeVariableName(String name) {
        if (name.isEmpty()) {
            throw new NullPointerException("Name is empty");
        }
        StringBuilder sb = new StringBuilder();
        StringTokenizer st = new StringTokenizer(name);
        String tmp;
        Boolean first = true;
        while (st.hasMoreTokens()) {                                            //CamelCase the name except first word (instance like)
            tmp = st.nextToken();
            if (first) {
                sb.append(tmp.substring(0, 1).toLowerCase());
                first = false;
            } else {
                sb.append(tmp.substring(0, 1).toUpperCase());
            }
            sb.append(tmp.substring(1));
            //sb.append(tmp.substring(1).toLowerCase());
        }

        Pattern pattern = Pattern.compile("[^\\w]|(^\\d)");                     //Search for special chars or initial digit
        Matcher matcher = pattern.matcher(sb.toString());
        return matcher.replaceAll("_$1");                                       //Replace special chars and initial digit with "_"
    }


    /**
     *
     * @param name
     * @return the provided name stripped of its _# suffix.
     */
    public static String stripNameSuffix(String name) {
        Pattern pattern = Pattern.compile("^(\\w+)_(\\d+)$");
        Matcher matcher = pattern.matcher(name);
        if (matcher.find()) {
            return matcher.group(1);
        } else {
            return name;
        }
    }

    /**
     *
     * @param label
     * @return the provided name stripped of its (#) suffix.
     */
    public static String stripLabelSuffix(String label) {
        Pattern pattern = Pattern.compile("^(.*)\\((\\d+)\\)$");
        Matcher matcher = pattern.matcher(label);
        if (matcher.find()) {
            return matcher.group(1);
        } else {
            return label;
        }
    }

    /**
     *
     * @param label
     * @return
     */
    public static int getLabelSuffix(String label) {
        Pattern pattern = Pattern.compile("^(.*)\\((\\d+)\\)$");
        Matcher matcher = pattern.matcher(label);

        if (matcher.find()) {
            return Integer.parseInt(matcher.group(2));
        } else {
            return 0;
        }
    }

    /**
     * Generate an alphanumeric token based on system time.
     *
     * @param maxLength Token maximum length. The shorter, the sooner it will
     * collide.
     * @return String token
     */
    public static String genToken(Integer maxLength) {
        final String digits = "abcdefghijklmnopqrstuvwxyzABCDEFGHYJKLMNOPQRSTUVWXYZ1234567890";
        final int digitSize = digits.length();
        StringBuilder sb = new StringBuilder();
        int modulo;
        Long time = System.nanoTime();
        while (time > 0) {
            modulo = (int) (time % digitSize);
            sb.append(digits.substring(modulo, modulo + 1));
            time = time / digitSize;
        }
        return sb.toString().substring(0, Math.min(sb.length(), maxLength));
    }

    /**
     * Return a wegas property from wegas-override.properties or from
     * wegas.properties if wegas-override or it's respective property is
     * missing.
     *
     * @param propertyName the property to read
     * @return Property's value
     */
    public static String getWegasProperty(String propertyName) {
        try {
            return ResourceBundle.getBundle("wegas-override").getString(propertyName);
        } catch (MissingResourceException ex) {
            return ResourceBundle.getBundle("wegas").getString(propertyName);
        }
    }

    public static String getWegasProperty(String propertyName, String defaultValue) {
        String ret = getWegasProperty(propertyName);
        if (ret == null) {
            return defaultValue;
        } else {
            return ret;
        }
    }

    public static String hex(byte[] array) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < array.length; ++i) {
            sb.append(Integer.toHexString((array[i]
                    & 0xFF) | 0x100).substring(1, 3));
        }
        return sb.toString();
    }

    public static String md5Hex(String message) {
        try {
            MessageDigest md =
                    MessageDigest.getInstance("MD5");
            return hex(md.digest(message.getBytes("CP1252")));
        } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
        }
        return null;
    }
}
