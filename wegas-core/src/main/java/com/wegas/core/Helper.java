/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.MissingResourceException;
import java.util.ResourceBundle;
import java.util.Set;
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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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

    /**
     *
     * @param <T>
     * @param context
     * @param type
     * @return
     * @throws NamingException
     */
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
        return sb.toString().replaceAll("[^\\w]|(^\\d)", "_$1");                //Replace special chars and initial digit with "_"
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

    /**
     *
     * @param propertyName
     * @param defaultValue
     * @return
     */
    public static String getWegasProperty(String propertyName, String defaultValue) {
        try {
            return getWegasProperty(propertyName);
        } catch (MissingResourceException | ClassCastException e) {
            return defaultValue;
        }
    }

    /**
     *
     * @param array
     * @return
     */
    public static String hex(byte[] array) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < array.length; ++i) {
            sb.append(Integer.toHexString((array[i]
                    & 0xFF) | 0x100).substring(1, 3));
        }
        return sb.toString();
    }

    /**
     *
     * @param message
     * @return
     */
    public static String md5Hex(String message) {
        try {
            MessageDigest md
                    = MessageDigest.getInstance("MD5");
            return hex(md.digest(message.getBytes("CP1252")));
        } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
        }
        return null;
    }

    /**
     *
     * @param list
     * @return
     */
    public static int[] toArray(List<Integer> list) {
        int[] ret = new int[list.size()];
        int i = 0;
        for (Integer e : list) {
            ret[i++] = e.intValue();
        }
        return ret;
    }

    /**
     *
     * Unescapes a string that contains standard Java escape sequences.
     * <ul>
     * <li><strong>&#92;b &#92;f &#92;n &#92;r &#92;t &#92;" &#92;'</strong> :
     * BS, FF, NL, CR, TAB, double and single quote.</li>
     * <li><strong>&#92;X &#92;XX &#92;XXX</strong> : Octal character
     * specification (0 - 377, 0x00 - 0xFF).</li>
     * <li><strong>&#92;uXXXX</strong> : Hexadecimal based Unicode
     * character.</li>
     * </ul>
     * https://gist.github.com/uklimaschewski/6741769
     *
     * @param st A string optionally containing standard java escape sequences.
     * @return The translated string.
     */
    public static String unescape(String st) {

        StringBuilder sb = new StringBuilder(st.length());

        for (int i = 0; i < st.length(); i++) {
            char ch = st.charAt(i);
            if (ch == '\\') {
                char nextChar = (i == st.length() - 1) ? '\\' : st
                        .charAt(i + 1);
                // Octal escape?
                if (nextChar >= '0' && nextChar <= '7') {
                    String code = "" + nextChar;
                    i++;
                    if ((i < st.length() - 1) && st.charAt(i + 1) >= '0'
                            && st.charAt(i + 1) <= '7') {
                        code += st.charAt(i + 1);
                        i++;
                        if ((i < st.length() - 1) && st.charAt(i + 1) >= '0'
                                && st.charAt(i + 1) <= '7') {
                            code += st.charAt(i + 1);
                            i++;
                        }
                    }
                    sb.append((char) Integer.parseInt(code, 8));
                    continue;
                }
                switch (nextChar) {
                    case '\\':
                        ch = '\\';
                        break;
                    case 'b':
                        ch = '\b';
                        break;
                    case 'f':
                        ch = '\f';
                        break;
                    case 'n':
                        ch = '\n';
                        break;
                    case 'r':
                        ch = '\r';
                        break;
                    case 't':
                        ch = '\t';
                        break;
                    case '\"':
                        ch = '\"';
                        break;
                    case '\'':
                        ch = '\'';
                        break;
// Hex Unicode: u????
                    case 'u':
                        if (i >= st.length() - 5) {
                            ch = 'u';
                            break;
                        }
                        int code = Integer.parseInt(
                                "" + st.charAt(i + 2) + st.charAt(i + 3)
                                + st.charAt(i + 4) + st.charAt(i + 5), 16);
                        sb.append(Character.toChars(code));
                        i += 5;
                        continue;
                }
                i++;
            }
            sb.append(ch);
        }
        return sb.toString();
    }

    /**
     * print ENV variables to log
     */
    public static void logEnv() {
        Map<String, String> env = System.getenv();

        Set<String> keySet = env.keySet();
        List<String> keys = new ArrayList<>(keySet);

        Collections.sort(keys);

        StringBuilder output = new StringBuilder();

        for (String k : keys) {
            String v = env.get(k);
            if (v != null) {
                output.append(String.format("%s = \"%s%n", k, env.get(k)));
            } else {
                output.append(String.format("%s is not set%n", k));
            }
        }
        logger.info(output.toString());
    }

    public static void recursiveDelete(File file) throws IOException {
        if (file.isDirectory()) {
            if (file.list().length == 0) {
                if (!file.delete()) {
                    logger.warn("Failed to delete file {}", file.getName());
                }
            } else {
                String files[] = file.list();
                for (String f : files) {
                    File fileToDel = new File(file, f);
                    recursiveDelete(fileToDel);
                }
                if (file.list().length == 0) {
                    if (!file.delete()) {
                        logger.warn("Failed to delete file {}", file.getName());
                    }
                } else {
                    throw new IOException("Could not empty " + file.getName());
                }
            }

        } else {
            if (!file.delete()) {
                logger.warn("Failed to delete file {}", file.getName());
            }
        }
    }

}
