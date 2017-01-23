/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.BroadcastTarget;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.NamedEntity;
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
import java.security.SecureRandom;
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

    private static final Random random = new SecureRandom();

    private static String WEGAS_ROOT_DIRECTORY;

    /**
     * @param <T>
     * @param context
     * @param type
     * @param service
     * @return looked-up EJB instance
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
     * @return looked-up EJB instance
     * @throws NamingException
     */
    public static <T> T lookupBy(Context context, Class<T> type) throws NamingException {
        return lookupBy(context, type, type);
    }

    /**
     * @param <T>
     * @param type
     * @param service
     * @return looked-up EJB instance
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type, Class<?> service) throws NamingException {
        return lookupBy(new InitialContext(), type, service);
    }

    /**
     * @param <T>
     * @param type
     * @return looked-up EJB instance
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return lookupBy(type, type);
    }

    /**
     * Check if the given string is null or empty (without trimming)
     *
     * @param t a string
     * @return true if t is null or empty
     */
    public static boolean isNullOrEmpty(final String t) {
        return t == null || t.isEmpty();
    }

    /**
     * Given a list of names and a name, generate a new name that is not already
     * used (ie not in usedNames).
     * <p>
     * If the initial name is already in use, it will be suffixes with an
     * ordinal. Pattern must be used to detect the name baseName.
     *
     * @param name      initial name
     * @param usedNames names already in use
     * @param pattern   to detect the baseName from a full name
     * @param preSuff   some string to put before the ordinal suffix
     * @param postSuff  some string to put after the ordinal suffix
     * @return name to use in place on initial one
     */
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

    /**
     * Generate a unique name (within usedNames) based on name. If the initial
     * name is contained in usedNames, it will be suffix with the first
     * available ordinal, like in this example:
     * <ul>
     * <li>Name: "myName" </li>
     * <li>UsedName: "myName", "myName_1", "myName_3" </li>
     * <li>Generated new name : "myName_2"</li>
     * </ul>
     *
     * @param name      initial name
     * @param usedNames names already in use
     * @return new unique name to use in place of initial one
     */
    public static String findUniqueName(final String name, List<String> usedNames) {
        return findUniqueName(name, usedNames, "(.*)_(\\d+)", "_", "");
    }

    /**
     * Generate a unique label (within usedLabels) based on label. If the
     * initial label is contained in usedLabel, it will be suffix with the first
     * available ordinal, like in this example:
     * <ul>
     * <li>Label: "My Label" </li>
     * <li>UsedLabel: "My Label", "Ma Label (1)", "My Label (3)" </li>
     * <li>Generated new label : "My Label (2)"</li>
     * </ul>
     *
     * @param label      initial label
     * @param usedLabels labels already in use
     * @return new unique label to use in place of initial one
     */
    public static String findUniqueLabel(final String label, List<String> usedLabels) {
        return findUniqueName(label, usedLabels, "(.*) \\((\\d+)\\)", " (", ")");
    }

    /**
     * Shortcut for
     * {@link #setUniqueNameForEntity(com.wegas.core.persistence.NamedEntity, java.util.List, java.lang.String, boolean) setUniqueNameForEntity}
     * with defaultName = {@link #DEFAULT_VARIABLE_NAME} and encodeName = true
     *
     * @param entity    entity to rename
     * @param usedNames names already in use
     */
    public static void setUniqueNameForEntity(final NamedEntity entity, List<String> usedNames) {
        setUniqueNameForEntity(entity, usedNames, DEFAULT_VARIABLE_NAME, true);
    }

    /**
     * Rename an entity with a unique name
     *
     * @param entity      entity to rename
     * @param usedNames   names already in use
     * @param defaultName name to use if entity one is unset
     * @param encodeName  replace special character with ASCII ones
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
     * @param entity     entity to label
     * @param usedLabels labels already in use
     */
    public static void setUniqueLabel(final LabelledEntity entity, List<String> usedLabels) {
        setUniqueLabel(entity, usedLabels, DEFAULT_VARIABLE_LABEL);
    }

    /**
     * Set Unique Names for the given VariableDescriptor and its children
     *
     * @param entity       entity to label
     * @param usedLabels   labels already in use
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

    /**
     * ChoiceDescriptor's result renaming helper
     *
     * @param r          result to rename / relabel
     * @param usedNames  result sibling's names
     * @param usedLabels result sibling's label
     */
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

    /**
     * Replace special characters with ASCII ones
     *
     * @param s
     * @return s with special characters replaced
     */
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
     * @return a String which will be understandable by JavaScript as a var
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
     * Given a label ending with a bracketed number, return the number
     *
     * @param label
     * @return the number in brackets at the very end of the label or 0
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
     * Generate an alphanumeric random token.
     *
     * @param length Token length
     * @return String token
     */
    public static String genToken(final int length) {
        return random.ints(48, 123) // 48-57 [0-9] 65-90 [A-Z] 97-122 [a-z]
                .filter(i -> (i < 58) || (i > 64 && i < 91) || (i > 96))
                .limit(length)
                .collect(StringBuilder::new, (sb, i) -> sb.append((char) i), StringBuilder::append)
                .toString();
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
     * Like {@link #getWegasProperty(java.lang.String) getWegasProperty()} but
     * return the given default value if the property does not exists
     *
     * @param propertyName
     * @param defaultValue
     * @return the wegasProperty or the defaultValue if the property does not
     *         exists
     */
    public static String getWegasProperty(String propertyName, String defaultValue) {
        try {
            return getWegasProperty(propertyName);
        } catch (MissingResourceException | ClassCastException e) {
            return defaultValue;
        }
    }

    /**
     * Given a byte array, return its hexadecimal string representation
     *
     * @param array
     * @return hexadecimal string representation of byte array
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
     * MD5 digest
     *
     * @param message
     * @return the MD5 digest or null if the system does not support MD5 digest
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
     * Transform an Integer list into a int array
     *
     * @param list
     * @return array copy
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

    /**
     * @param file
     * @throws IOException
     */
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

    /**
     * @param text
     * @param criterias
     * @return true if text matches all criterias
     */
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

    /**
     * Make sure target map contains all other map entities
     *
     * @param target
     * @param other
     */
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

    /**
     * Ugly hack used by IntegrationTest
     *
     * @return root directory to read static script from
     */
    public static String getWegasRootDirectory() {
        return WEGAS_ROOT_DIRECTORY;
    }

    /**
     * Ugly hack used by IntegrationTest
     *
     * @param wegasRootDirectory
     */
    public static void setWegasRootDirectory(String wegasRootDirectory) {
        Helper.WEGAS_ROOT_DIRECTORY = wegasRootDirectory;
    }

    /**
     * Generation Pusher token for a target
     *
     * @param target 
     * @return channel name
     */
    public static String getAudienceToken(BroadcastTarget target) {
        return target.getChannel();
    }

    /**
     * Generate random lowercase letters (a-z) of given length
     *
     * @param length number of letters to return (max 50)
     * @return random letters
     */
    public static String genRandomLetters(int length) {
        final String tokenElements = "abcdefghijklmnopqrstuvwxyz";
        final int digits = tokenElements.length();
        length = Math.min(50, length); // max 50 length;
        StringBuilder sb = new StringBuilder();
        int random = (int) (Math.random() * digits);
        sb.append(tokenElements.charAt(random));
        if (length > 1) {
            sb.append(genRandomLetters(length - 1));
        }
        return sb.toString();
    }

    /**
     * A Least Recently Used key-value in memory cache.
     *
     * @param <K> key type
     * @param <V> value type
     */
    public static class LRUCache<K, V> extends LinkedHashMap<K, V> {

        private int cacheSize;

        /**
         * Constructor a new LRU Cache of given size
         *
         * @param cacheSize Max size the cache should have
         */
        public LRUCache(int cacheSize) {
            super(16, 0.75f, true); // default values
            this.cacheSize = cacheSize;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return this.size() >= this.cacheSize;
        }
    }
}
