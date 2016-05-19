/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.Result;
import org.apache.commons.lang3.StringEscapeUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class Helper {

    private static final String DEFAULT_VARIABLE_NAME = "variable";

    private static final String DEFAULT_VARIABLE_LABEL = "Unnammed";

    private static final Logger logger = LoggerFactory.getLogger(Helper.class);

    private static String WEGAS_ROOT_DIRECTORY;

    /**
     * @param <T>
     * @param context
     * @param type
     * @param service
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Context context, Class<T> type, Class<?> service) throws NamingException {
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
     * @param <T>
     * @param type
     * @param service
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type, Class<?> service) throws NamingException {
        return lookupBy(new InitialContext(), type, service);
    }

    /**
     * @param <T>
     * @param type
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return lookupBy(type, type);
    }

    public static boolean isNullOrEmpty(final String t) {
        return t == null || t.isEmpty();
    }

    private static String findUniqueName(final String name, List<String> usedNames, String pattern, String preSuff, String postSuff) {

        Pattern p = Pattern.compile(pattern);
        Matcher matcher = p.matcher(name);

        int suff;
        final String baseName;
        if (matcher.matches()) {
            baseName = matcher.group(1);
            suff = Integer.parseInt(matcher.group(2)) + 1;
        } else {
            baseName = name;
            suff = 2;
        }

        String newName = name;
        while (usedNames.contains(newName)) {
            newName = baseName + preSuff + suff + postSuff;
            suff++;
        }

        return newName;
    }

    public static String findUniqueName(final String name, List<String> usedNames) {
        return findUniqueName(name, usedNames, "(.*)_(\\d+)", "_", "");
    }

    public static String findUniqueLabel(final String label, List<String> usedLabels) {
        return findUniqueName(label, usedLabels, "(.*) \\((\\d+)\\)", " (", ")");
    }

    /**
     * @param entity    entity to rename
     * @param usedNames
     */
    public static void setUniqueNameForEntity(final NamedEntity entity, List<String> usedNames) {
        setUniqueNameForEntity(entity, usedNames, DEFAULT_VARIABLE_NAME, true);
    }

    /**
     * @param entity      entity to rename
     * @param usedNames
     * @param defaultName name to use if entity one is unset
     * @param encodeName
     */
    public static void setUniqueNameForEntity(final NamedEntity entity, List<String> usedNames, String defaultName, boolean encodeName) {
        if (isNullOrEmpty(entity.getName())) {
            entity.setName(defaultName);
        } else if (encodeName) {
            entity.setName(encodeVariableName(entity.getName()));
        }
        String newName = findUniqueName(entity.getName(), usedNames);
        entity.setName(newName);
        usedNames.add(newName);
    }

    /**
     * Set Unique Names for the given VariableDescriptor and its children
     *
     * @param entity
     * @param usedLabels
     */
    public static void setUniqueLabel(final LabelledEntity entity, List<String> usedLabels) {
        setUniqueLabel(entity, usedLabels, DEFAULT_VARIABLE_LABEL);
    }

    /**
     * Set Unique Names for the given VariableDescriptor and its children
     *
     * @param entity
     * @param usedLabels
     * @param defaultLabel label to set if entity one is unset
     */
    public static void setUniqueLabel(final LabelledEntity entity, List<String> usedLabels, String defaultLabel) {
        if (isNullOrEmpty(entity.getLabel())) {
            entity.setLabel(defaultLabel);
        }
        String newLabel = findUniqueLabel(entity.getLabel(), usedLabels);
        entity.setLabel(newLabel);
        usedLabels.add(newLabel);
    }

    public static void setNameAndLabelForResult(Result r,
                                                List<String> usedNames, List<String> usedLabels) {
        boolean hasLabel = !isNullOrEmpty(r.getLabel());
        boolean hasName = !isNullOrEmpty(r.getName());
        if (hasLabel && !hasName) {
            r.setName(r.getLabel());
        }
        if (hasName && !hasLabel) {
            r.setLabel(r.getName());
        }
        setUniqueNameForEntity(r, usedNames, "result", false);
        setUniqueLabel(r, usedLabels, "New Result");
    }

    /**
     * Set Unique Names for the given VariableDescriptor and its children
     *
     * @param vd
     * @param usedNames
     */
    public static void setUniqueName(final VariableDescriptor vd, List<String> usedNames) {
        setUniqueNameForEntity(vd, usedNames);
        if (vd instanceof DescriptorListI) {
            // Recursively find unique names for children
            for (Object child : ((DescriptorListI) vd).getItems()) {
                setUniqueName((VariableDescriptor) child, usedNames);
            }
        } else if (vd instanceof ChoiceDescriptor) {
            ChoiceDescriptor cd = (ChoiceDescriptor) vd;
            List<String> names = new ArrayList<>();
            List<String> labels = new ArrayList<>();
            for (Result r : cd.getResults()) {
                setNameAndLabelForResult(r, names, labels);
            }
        }
    }

    public static String encodeVariableName(String s) {
        return replaceSpecialCharacters(camelCasify(s));
    }

    public static String replaceSpecialCharacters(String s) {
        s = s.replaceAll(" ", "_");

        s = s.replaceAll("[èéêë]", "e");
        s = s.replaceAll("[ûù]", "u");
        s = s.replaceAll("[ïî]", "i");
        s = s.replaceAll("[àâ]", "a");
        s = s.replaceAll("Ô", "o");

        s = s.replaceAll("[ÈÉÊË]", "E");
        s = s.replaceAll("[ÛÙ]", "U");
        s = s.replaceAll("[ÏÎ]", "I");
        s = s.replaceAll("[ÀÂ]", "A");
        s = s.replaceAll("Ô", "O");

        return s.replaceAll("[^\\w]|(^\\d)", "_$1");//Search for special chars or initial digit
    }

    /**
     * Encode a String to look like a JavaScript variable.
     *
     * @param name String to encode
     * @return a String wich will be undestandable by JavaScript as a var
     */
    public static String camelCasify(String name) {
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
        return sb.toString();
    }

    /**
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
     *                  collide.
     * @return String token
     */
    public static String genToken(Integer maxLength) {
        final String digits = "abcdefghijklmnopqrstuvwxyzABCDEFGHYJKLMNOPQRSTUVWXYZ1234567890";
        final int digitSize = digits.length();
        final StringBuilder sb = new StringBuilder();
        int modulo;
        long time = System.nanoTime();
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
     * @param list
     * @return
     */
    public static int[] toArray(List<Integer> list) {
        int[] ret = new int[list.size()];
        int i = 0;
        for (Integer e : list) {
            ret[i++] = e;
        }
        return ret;
    }

    /**
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
        return StringEscapeUtils.unescapeJava(st);
    }

    /*public static String old_unescape(String st) {

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
     }*/

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

        } else if (!file.delete()) {
            logger.warn("Failed to delete file {}", file.getName());
        }
    }

    /**
     * Insensitive contains
     *
     * @param text     text to search in
     * @param criteria criteria to search for
     * @return match
     */
    public static Boolean insensitiveContains(String text, String criteria) {
        if (text == null) {
            return false;
        }
        return Pattern.compile(Pattern.quote(criteria), Pattern.CASE_INSENSITIVE).matcher(StringEscapeUtils.unescapeHtml4(text)).find();
    }

    public static Boolean insensitiveContainsAll(String text, List<String> criterias) {
        for (String c : criterias) {
            if (!insensitiveContains(text, c)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checked conversion from long to int
     *
     * @param value value to convert
     * @return value as int
     */
    public static int longToInt(long value) {
        if (value > Integer.MAX_VALUE || value < Integer.MIN_VALUE) {
            throw new IllegalArgumentException(value + " is out of Integer's bound");
        }
        return (int) value;
    }

    public static void merge(Map<String, List<AbstractEntity>> target, Map<String, List<AbstractEntity>> other) {
        for (Map.Entry<String, List<AbstractEntity>> entry : other.entrySet()) {
            String key = entry.getKey();

            if (!target.containsKey(key)) {
                target.put(key, new ArrayList<>());
            }

            List<AbstractEntity> tList = target.get(key);
            for (AbstractEntity entity : entry.getValue()) {
                if (!tList.contains(entity)) {
                    tList.add(entity);
                }
            }
        }
    }

    public static String getWegasRootDirectory() {
        return WEGAS_ROOT_DIRECTORY;
    }

    public static void setWegasRootDirectory(String wegasRootDirectory) {
        Helper.WEGAS_ROOT_DIRECTORY = wegasRootDirectory;
    }

    public static String getAudienceTokenForGameModel(Long id) {
        return "GameModel-" + id;
    }

    public static String getAudienceTokenForGame(Long id) {
        return "Game-" + id;
    }

    public static String getAudienceTokenForTeam(Long id) {
        return "Team-" + id;
    }

    public static String getAudienceTokenForPlayer(Long id) {
        return "Player-" + id;
    }

    public static String getAudienceToken(Game game) {
        return Helper.getAudienceTokenForGame(game.getId());
    }

    public static String getAudienceToken(GameModel gameModel) {
        return Helper.getAudienceTokenForGameModel(gameModel.getId());
    }

    public static String getAudienceToken(Team team) {
        return Helper.getAudienceTokenForTeam(team.getId());
    }

    public static String getAudienceToken(Player player) {
        return Helper.getAudienceTokenForPlayer(player.getId());
    }

}
