/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hazelcast.cluster.Cluster;
import com.hazelcast.cluster.Member;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.Result;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor;
import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.*;
import java.util.Map.Entry;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.text.StringEscapeUtils;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.subject.Subject;
import org.postgresql.util.PSQLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.event.Level;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class Helper {

    private static final String DEFAULT_VARIABLE_NAME = "variable";

    private static final String DEFAULT_VARIABLE_LABEL = "Unnammed";

    private static final Logger logger = LoggerFactory.getLogger(Helper.class);

    private static final Random random = new SecureRandom();

    private static String WEGAS_ROOT_DIRECTORY;

    public static final String USER_CHANNEL_PREFIX = "private-User-";
    public static final String PLAYER_CHANNEL_PREFIX = "private-Player-";
    public static final String TEAM_CHANNEL_PREFIX = "private-Team-";
    public static final String GAME_CHANNEL_PREFIX = "private-Game-";
    public static final String GAMEMODEL_CHANNEL_PREFIX = "private-GameModel-";
    public static final String GAMEMODEL_EDITOR_CHANNEL_PREFIX = "private-GameModelEditor-";

    private Helper() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    /**
     * @param <T>
     * @param context
     * @param type
     * @param service
     *
     * @return looked-up EJB instance
     *
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
                    logger.error("Unable to retrieve to do jndi lookup on class: {}", type.getSimpleName());
                    throw ex1;
                }
            }
        }
    }

    /**
     * To be used to make a JNDI lookup when there is no CDI context
     *
     * @param <T>      resource type
     * @param jndiName resource name
     * @param type     resource type
     *
     * @return instance of the given type matching jndiName
     *
     * @throws NamingException
     */
    public static <T> T jndiLookup(String jndiName, Class<T> type) throws NamingException {
        return (T) new InitialContext().lookup(jndiName);
    }

    /**
     * @param <T>
     * @param type
     *
     * @return looked-up EJB instance
     *
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return lookupBy(new InitialContext(), type, type);
    }

//    public static HazelcastInstance getHazelcastInstance() {
//        HazelcastInstance instance;
//        try {
//            Context ctx = new InitialContext();
//            instance = (HazelcastInstance) ctx.lookup("payara/Hazelcast");
//            return instance;
//        } catch (NamingException ex) {
//            logger.error("No Hazelcast instance", ex);
//            return null;
//        }
//    }
    /**
     * Copy and sort the given list
     *
     * @param <T>  list item type
     * @param list the list to copy and sort
     * @param c    a comparator to sort the list
     *
     * @return a unmodifiable copy of the list, sorted according to the comparator
     */
    public static <T extends Object> List<T> copyAndSortModifiable(List<T> list, Comparator<? super T> c) {
        List<T> copy = new ArrayList<>(list);
        Collections.sort(copy, c);
        return copy;
    }

    /**
     * Copy and sort the given list
     *
     * @param <T>  list item type
     * @param list the list to copy and sort
     * @param c    a comparator to sort the list
     *
     * @return a unmodifiable copy of the list, sorted according to the comparator
     */
    public static <T extends Object> List<T> copyAndSort(List<T> list, Comparator<? super T> c) {
        return Collections.unmodifiableList(Helper.copyAndSortModifiable(list, c));
    }

    /**
     * Check if the given string is null or empty (without trimming)
     *
     * @param t a string
     *
     * @return true if t is null or empty
     */
    public static boolean isNullOrEmpty(final String t) {
        return t == null || t.isEmpty();
    }

    /**
     * Return the first non-null and non-empty args
     *
     * @param args
     *
     * @return first non-empty arguments or empty string
     */
    public static String coalesce(String... args) {
        for (String arg : args) {
            if (!Helper.isNullOrEmpty(arg)) {
                return arg;
            }
        }
        return "";
    }

    /**
     * How to generate new name
     */
    public enum NewNameStrategy {
        /**
         * Add incremented suffix
         */
        ORDINAL,
        /**
         * Generate brand new random name
         */
        HASH
    };

    /**
     * Given a list of names and a name, generate a new name that is not already used (ie not in
     * usedNames).
     * <p>
     * If the initial name is already in use, it will be suffixes with an ordinal. Pattern must be
     * used to detect the name baseName.
     *
     * @param name      initial name
     * @param usedNames names already in use
     * @param pattern   to detect the baseName from a full name
     * @param preSuff   some string to put before the ordinal suffix
     * @param postSuff  some string to put after the ordinal suffix
     *
     * @return name to use in place on initial one
     */
    private static String findUniqueName(final String name, List<String> usedNames,
        String preSuff, String postSuff,
        NewNameStrategy strategy) {

        StringBuilder patternB = new StringBuilder();
        patternB.append("(.+)").append(Pattern.quote(preSuff));

        switch (strategy) {
            case HASH:
                patternB.append("(\\p{Alnum}+)");
                break;
            case ORDINAL:
            default:
                patternB.append("(\\d+)");
                break;
        }
        patternB.append(Pattern.quote(postSuff));

        if (usedNames != null) {
            Pattern p = Pattern.compile(patternB.toString());
            Matcher matcher = p.matcher(name);

            String suff;
            final String baseName;
            if (matcher.matches()) {
                baseName = matcher.group(1);
                suff = matcher.group(2);
            } else {
                baseName = name;
                suff = "1";
            }

            String newName = name;
            while (usedNames.contains(newName)) {
                suff = genNewSuffix(suff, strategy);
                newName = baseName + preSuff + suff + postSuff;
            }

            return newName;
        } else {
            return name;
        }
    }

    private static String genNewSuffix(String suffix, NewNameStrategy strategy) {
        if (NewNameStrategy.ORDINAL.equals(strategy)) {
            return Integer.toString(Integer.parseInt(suffix, 10) + 1, 10);
        } else {
            return Helper.genToken(6);
        }
    }

    /**
     * Generate a unique name (within usedNames) based on name. If the initial name is contained in
     * usedNames, it will be suffix with the first available ordinal, like in this example:
     * <ul>
     * <li>Name: "myName" </li>
     * <li>UsedName: "myName", "myName_1", "myName_3" </li>
     * <li>Generated new name : "myName_2"</li>
     * </ul>
     *
     * @param name      initial name
     * @param usedNames names already in use
     *
     * @return new unique name to use in place of initial one
     */
    public static String findUniqueName(final String name, List<String> usedNames) {
        return findUniqueName(name, usedNames, "_", "", NewNameStrategy.HASH);
    }

    /**
     * Generate a unique label (within usedLabels) based on label. If the initial label is contained
     * in usedLabel, it will be suffix with the first available ordinal, like in this example:
     * <ul>
     * <li>Label: "My Label" </li>
     * <li>UsedLabel: "My Label", "Ma Label (1)", "My Label (3)" </li>
     * <li>Generated new label : "My Label (2)"</li>
     * </ul>
     *
     * @param label      initial label
     * @param usedLabels labels already in use
     *
     * @return new unique label to use in place of initial one
     */
    public static String findUniqueLabel(final String label, List<String> usedLabels) {
        return findUniqueName(label, usedLabels, " (", ")", NewNameStrategy.ORDINAL);
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
     * @param gameModel
     */
    public static void setUniqueLabel(final LabelledEntity entity, List<TranslatableContent> usedLabels, GameModel gameModel) {
        setUniqueLabel(entity, usedLabels, DEFAULT_VARIABLE_LABEL);
    }

    /**
     * Set Unique Names for the given VariableDescriptor and its children
     *
     * @param entity       entity to label
     * @param usedLabels   labels already in use
     * @param defaultLabel label to set if entity one is unset
     */
    public static void setUniqueLabel(final LabelledEntity entity,
        List<TranslatableContent> usedLabels, String defaultLabel) {

        // make sure the label exists
        TranslatableContent theLabel = entity.getLabel();
        if (theLabel == null) {
            theLabel = new TranslatableContent();
            entity.setLabel(theLabel);
        }

        Map<String, List<String>> mapUsedlabels = new HashMap<>();

        for (TranslatableContent label : usedLabels) {
            for (Entry<String, Translation> translation : label.getTranslations().entrySet()) {
                if (!mapUsedlabels.containsKey(translation.getKey())) {
                    mapUsedlabels.put(translation.getKey(), new ArrayList<>());
                }
                mapUsedlabels.get(translation.getKey()).add(translation.getValue().getTranslation());
            }
        }

        Map<String, Translation> translations = theLabel.getTranslations();
        for (Entry<String, Translation> entry : translations.entrySet()) {
            String code = entry.getKey();
            Translation currentLabel = entry.getValue();
            if (!Helper.isNullOrEmpty(currentLabel.getTranslation())) {
                theLabel.updateTranslation(code, findUniqueLabel(currentLabel.getTranslation(), mapUsedlabels.get(code)));
            }
        }

        if (!usedLabels.contains(entity.getLabel())) {
            usedLabels.add(entity.getLabel());
        }
    }

    /**
     * ChoiceDescriptor's result renaming helper
     *
     * @param le         result to rename / relabel
     * @param usedNames  result sibling's names
     * @param usedLabels result sibling's label
     * @param base       base to build new names and labels on
     * @param gameModel
     */
    public static void setNameAndLabelForLabelledEntity(LabelledEntity le,
        List<String> usedNames, List<TranslatableContent> usedLabels,
        String base, GameModel gameModel) {

        String baseName = le.getName();
        String baseLabel = baseName;

        if (le.getLabel() != null) {
            // fetch the most preferred label
            Translation favoriteLabel;
            favoriteLabel = le.getLabel().translate(gameModel);
            if (favoriteLabel != null) {
                baseLabel = favoriteLabel.getTranslation();
            }
        }

        // Init basename
        if (Helper.isNullOrEmpty(baseName)) {
            if (baseLabel == null) {
                baseName = base;
                baseLabel = "New " + base;
            } else if (baseLabel.isEmpty()) {
                baseName = base;
            } else {
                baseName = baseLabel;
            }
        }

        setUniqueNameForEntity(le, usedNames, baseName, false);
        setUniqueLabel(le, usedLabels, baseLabel);
    }

    /**
     * Set Unique Names for the given VariableDescriptor and its children
     *
     * @param vd
     * @param usedNames
     * @param gameModel
     * @param forceReset true to reset names to default names
     *
     * @return map oldName to newName
     */
    public static Map<String, String> setUniqueName(final VariableDescriptor vd, List<String> usedNames,
        GameModel gameModel, Boolean forceReset) {
        Map<String, String> map = new HashMap<>();
        String oldName = vd.getName();
        if (forceReset) {
            vd.setName(vd.getClass().getSimpleName());
        }

        setUniqueNameForEntity(vd, usedNames);

        if (!Helper.isNullOrEmpty(oldName)) {
            map.put(oldName, vd.getName());
        }

        if (vd instanceof DescriptorListI) {
            // Recursively find unique names for children
            for (Object child : ((DescriptorListI) vd).getItems()) {
                map.putAll(setUniqueName((VariableDescriptor) child, usedNames, gameModel, forceReset));
            }
        } else if (vd instanceof ChoiceDescriptor) {
            ChoiceDescriptor cd = (ChoiceDescriptor) vd;
            List<String> names = new ArrayList<>();
            List<TranslatableContent> labels = new ArrayList<>();
            for (Result r : cd.getResults()) {
                setNameAndLabelForLabelledEntity(r, names, labels, "result", gameModel);
            }
        } else if (vd instanceof PeerReviewDescriptor) {
            PeerReviewDescriptor prd = (PeerReviewDescriptor) vd;
            Helper.setNameAndLabelForLabelledEntityList(prd.getFeedback().getEvaluations(), "input", gameModel);
            Helper.setNameAndLabelForLabelledEntityList(prd.getFbComments().getEvaluations(), "input", gameModel);
        } else if (vd instanceof StringDescriptor) {
            StringDescriptor sd = (StringDescriptor) vd;
            if (sd.getAllowedValues() != null) {
                List<String> names = new ArrayList<>();
                List<TranslatableContent> labels = new ArrayList<>();

                for (EnumItem item : sd.getAllowedValues()) {
                    setNameAndLabelForLabelledEntity(item, names, labels, "item", gameModel);
                }
            }
        }

        return map;
    }

    public static void setNameAndLabelForLabelledEntityList(List<? extends LabelledEntity> items, String defaultName, GameModel gameModel) {

        List<TranslatableContent> labels = new ArrayList<>();
        List<String> names = new ArrayList<>();
        List<LabelledEntity> newItems = new ArrayList<>();

        for (LabelledEntity item : items) {
            if (item.getId() != null) {
                // Store name and label existing result
                labels.add(item.getLabel());
                names.add(item.getName());
            } else {
                newItems.add(item);
            }
        }

        // set names and labels unique
        for (LabelledEntity item : newItems) {
            Helper.setNameAndLabelForLabelledEntity(item, names, labels, defaultName, gameModel);

            if (item instanceof CategorizedEvaluationDescriptor) {
                Helper.setNamesAndLabelForEvaluationCategories((CategorizedEvaluationDescriptor) item, gameModel);
            }
        }
    }

    public static void setNamesAndLabelForEvaluationCategories(CategorizedEvaluationDescriptor ced, GameModel gameModel) {
        Helper.setNameAndLabelForLabelledEntityList(ced.getCategories(), "category", gameModel);
    }

    /**
     * Replace special characters with ASCII ones
     *
     * @param s
     *
     * @return s with special characters replaced
     */
    public static String encodeVariableName(String s) {
        return replaceSpecialCharacters(camelCasify(s));
    }

    /**
     * Remove all common diacritic marks.
     *
     * @param s the string to clean
     *
     * @return the cleaned string
     */
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
     *
     * @return a String which will be understandable by JavaScript as a var
     */
    public static String camelCasify(String name) {
        if (name.isEmpty()) {
            throw WegasErrorMessage.error("Name is empty");
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
     * Convert camelCase to human readable string.
     * <ul>
     * <li>PDFFile -&gt; PDF file</li>
     * <li>99Files -&gt; 99 files</li>
     * <li>SomeFiles -&gt; some files</li>
     * <li>SomePDFFiles -&gt; some PDF files</li>
     * </ul>
     *
     * @param camelCased
     *
     * @return human readable string
     */
    public static String humanize(String camelCased) {
        Pattern p = Pattern.compile(
            "(?<=[A-Z]|^)([A-Z])(?=[a-z])" + "|"
            + "(?<=[^A-Z])([A-Z])" + "|"
            + "(?<=[A-Za-z])([^A-Za-z])"
        );
        Matcher matcher = p.matcher(camelCased);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String match = matcher.group();
            if (matcher.start() > 0) {
                matcher.appendReplacement(sb, " " + match.toLowerCase());
            } else {
                // do not insert any space at the first position
                matcher.appendReplacement(sb, match.toLowerCase());
            }
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    /**
     * @param name
     *
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
     *
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
     *
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
     *
     * @return String token
     */
    public static String genToken(final int length) {
        //return random.ints(length, 48, 110) // 48-57 [0-9] 58-83 -> 65-90 [A-Z] 84-109 -> 97-122 [a-z]
        //        .map(i -> (i < 58 ? i : (i > 83 ? i + 13 : i + 7)))
        return random.ints(48, 123) // 48-57 [0-9] 65-90 [A-Z] 97-122 [a-z]
            .filter(i -> (i < 58) || (i > 64 && i < 91) || (i > 96))
            .limit(length)
            .collect(StringBuilder::new, (sb, i) -> sb.append((char) i), StringBuilder::append)
            .toString();
    }

    public static String generateSalt() {
        RandomNumberGenerator rng = new SecureRandomNumberGenerator();
        return rng.nextBytes().toHex();
    }

    /**
     * Return a wegas property from java properties or from wegas-override.properties or from
     * wegas.properties if wegas-override or it's respective property is missing.
     *
     * @param propertyName the property to read
     *
     * @return Property's value
     */
    public static String getWegasProperty(String propertyName) {
        String value = System.getProperty(propertyName);
        if (value != null) {
            return value;
        } else {
            try {
                return ResourceBundle.getBundle("wegas-override").getString(propertyName);
            } catch (MissingResourceException ex) {
                return ResourceBundle.getBundle("wegas").getString(propertyName);
            }
        }
    }

    /**
     * Like {@link #getWegasProperty(java.lang.String) getWegasProperty()} but return the given
     * default value if the property does not exists
     *
     * @param propertyName
     * @param defaultValue
     *
     * @return the wegasProperty or the defaultValue if the property does not exists
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
     *
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
     *
     * @return the MD5 digest or null if the system does not support MD5 digest
     */
    @Deprecated
    public static String md5Hex(String message) {
        try {
            MessageDigest md
                = MessageDigest.getInstance("MD5");
            return hex(md.digest(message.getBytes("CP1252")));
        } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
            logger.error("No Such Algorithm");
        }
        return null;
    }

    /**
     * Transform an Integer list into a int array
     *
     * @param list
     *
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
     * <li><strong>&#92;b &#92;f &#92;n &#92;r &#92;t &#92;" &#92;'</strong> : BS, FF, NL, CR, TAB,
     * double and single quote.</li>
     * <li><strong>&#92;X &#92;XX &#92;XXX</strong> : Octal character specification (0 - 377, 0x00 -
     * 0xFF).</li>
     * <li><strong>&#92;uXXXX</strong> : Hexadecimal based Unicode character.</li>
     * </ul>
     * https://gist.github.com/uklimaschewski/6741769
     *
     * @param st A string optionally containing standard java escape sequences.
     *
     * @return The translated string.
     */
    public static String unescape(String st) {
        return StringEscapeUtils.unescapeJava(st);
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

    /**
     * @param file
     *
     * @throws IOException
     */
    public static void recursiveDelete(File file) throws IOException {
        if (file.isDirectory()) {
            String[] files = file.list();
            if (files == null || files.length == 0) {
                if (!file.delete()) {
                    logger.warn("Failed to delete file {}", file.getName());
                }
            } else {
                files = file.list();
                if (files != null) {
                    for (String f : files) {
                        File fileToDel = new File(file, f);
                        recursiveDelete(fileToDel);
                    }
                }
                files = file.list();
                if (files == null || files.length == 0) {
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
     *
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
     *
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
     *
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
     * Generate random lowercase letters (a-z) of given length
     *
     * @param length number of letters to return (max 50)
     *
     * @return random letters
     */
    public static String genRandomLetters(int length) {
        final String tokenElements = "abcdefghijklmnopqrstuvwxyz";
        final int digits = tokenElements.length();

        int count = Math.min(50, length); // max 50 length;

        StringBuilder sb = new StringBuilder();
        SecureRandom sr = new SecureRandom();

        while (count > 0) {
            count--;
            sb.append(tokenElements.charAt(sr.nextInt(digits)));
        }
        return sb.toString();
    }

    public static void printWegasStackTrace(Throwable t) {
        StringBuilder sb = new StringBuilder(t.getClass().getName());
        sb.append(" - ").append(t.getMessage());
        for (StackTraceElement elem : t.getStackTrace()) {
            if (elem.getClassName().startsWith("com.wegas")
                || elem.getClassName().startsWith("jdk.nashorn")) {
                sb.append("\n\tat ");
                sb.append(elem);
            }
        }
        String toString = sb.toString();
        if (toString.contains("jparealm") || toString.contains("GuestRealm")) {
            return;
        } else {
            logger.error(toString);
        }
    }

    /**
     * Check if email is valid. (Only a string test)
     *
     * @param email
     *
     * @throws jakarta.mail.internet.AddressException
     */
    public static void assertEmailPattern(String email) throws AddressException {
        InternetAddress emailAddr = new InternetAddress(email);
        emailAddr.validate();

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
            super(cacheSize * (4 / 3) + 10, 0.75f, true);
            this.cacheSize = cacheSize;
        }

        public synchronized V putIfAbsentAndGet(K key, V value) {
            super.putIfAbsent(key, value);
            return this.get(key);
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return this.size() > this.cacheSize;
        }
    }

    public static void printClusterState(Cluster cluster) {
        if (cluster != null) {
            logger.error("Cluster up: {}", cluster.getClusterState());
            for (Member member : cluster.getMembers()) {
                logger.error(" * {}{}", member, (member == cluster.getLocalMember() ? "<-- it's me !" : ""));
            }
        } else {
            logger.error("No cluster (null)");
        }
    }

    private static void indent(StringBuilder sb, int ident) {
        for (int i = 0; i < ident; i++) {
            sb.append("  ");
        }
    }

    private static void newLine(StringBuilder sb, int ident) {
        sb.append('\n');
        Helper.indent(sb, ident);
    }

    private static void printDescriptors(GameModel gameModel, List<VariableDescriptor> list, StringBuilder sb, int level) {
        for (VariableDescriptor vd : list) {
            newLine(sb, level);
            sb.append(vd).append('(').append(gameModel.getVariableDescriptors().contains(vd)).append(" -> ").append(vd.getDefaultInstance());
            if (vd instanceof DescriptorListI) {
                printDescriptors(gameModel, ((DescriptorListI) vd).getItems(), sb, level + 1);
            }
        }
    }

    public static String printGameModel(GameModel gameModel) {
        StringBuilder sb = new StringBuilder();

        sb.append("GameModel ").append(gameModel);

        newLine(sb, 0);

        printDescriptors(gameModel, gameModel.getItems(), sb, 1);

        return sb.toString();
    }

    public static Level setLoggerLevel(Class klass, Level level) {
        return Helper.setLoggerLevel(LoggerFactory.getLogger(klass), level);
    }

    public static void log(Logger logger, Level level, String format, Object... argArray) {
        switch (level) {
            case ERROR:
                logger.error(format, argArray);
                break;
            case INFO:
                logger.info(format, argArray);
                break;
            case DEBUG:
                logger.debug(format, argArray);
                break;
            case TRACE:
                logger.trace(format, argArray);
                break;
            case WARN:
                logger.warn(format, argArray);
                break;
        }
    }

    /**
     * Set logger level and returns the previous level.
     *
     * @param logger
     * @param level
     *
     * @return the previous level
     */
    public static Level setLoggerLevel(Logger logger, Level level) {
        if (logger instanceof ch.qos.logback.classic.Logger) {
            ch.qos.logback.classic.Logger qLogger = (ch.qos.logback.classic.Logger) logger;
            ch.qos.logback.classic.Level pLevel = qLogger.getLevel();
            if (level != null) {
                qLogger.setLevel(ch.qos.logback.classic.Level.valueOf(level.toString()));
            } else {
                qLogger.setLevel(null);
            }
            if (pLevel != null) {
                return Level.valueOf(pLevel.toString());
            }
        }
        return null;
    }

    /**
     * Returns the IP address of the requesting host by looking first at headers provided by
     * (reverse) proxies. Depending on local config, it may be necessary to check additional
     * headers.
     *
     * @param request
     *
     * @return the IP address
     */
    public static String getRequestingIP(HttpServletRequest request) {
        String ip = request.getHeader("X-FORWARDED-FOR");
        if (ip == null) {
            ip = request.getHeader("X-Real-IP");
            if (ip == null) {
                ip = request.getRemoteAddr();
            }
        }
        return ip;
    }

    public static String getPublicBaseUrl(HttpServletRequest request) {
        return request.getRequestURL().toString().replace(request.getRequestURI(), "") + request.getContextPath();
    }

    /**
     * Check if current visibility imply read only access for scenarist under given protection
     * level.
     *
     * @param level      protection level
     * @param visibility visibility to check
     *
     * @return true if a scenarist is not allowed to perform an update
     */
    public static boolean isProtected(ProtectionLevel level, Visibility visibility) {
        //             all, protected, internal
        // internal    t        t         t
        // protected   t        t         f
        // inherited   t        f         f
        // private     t        f         f

        return (level == ProtectionLevel.ALL
            || visibility == Visibility.INTERNAL
            || (level == ProtectionLevel.PROTECTED && visibility == Visibility.PROTECTED)
            || (level == ProtectionLevel.INHERITED && (visibility == Visibility.PROTECTED || visibility == Visibility.INHERITED)));
    }

    public static String anonymizeEmail(String email) {
        return email.replaceFirst("([^@]{1,4})[^@]*(@.*)", "$1••••$2");
    }

    public static String getDomainFromEmailAddress(String email) {
        return email.replaceFirst("([^@]{1,4})[^@]*@(.*)", "$2");
    }

    /**
     * Class for conveniently passing email attributes by parameter.
     */
    public static final class EmailAttributes {

        private List<String> recipients = new ArrayList<>();
        private String sender = "";
        private String subject = "";
        private String body = "";

        public EmailAttributes() {
            // Default constructur required for deserialisation
        }

        // Get recipient with the hypothesis that there is only one recipient in the list
        @JsonIgnore
        public String getRecipient() {
            if (recipients.size() != 1) {
                throw WegasErrorMessage.error("There should be only one recipient in the email list.");
            }

            return recipients.get(0);
        }

        // Set recipient with the hypothesis that there is only one recipient in the list
        @JsonIgnore
        public void setRecipient(String recipient) {
            if (recipients.size() > 1) {
                throw WegasErrorMessage.error("There should be only one recipient in the email list.");
            }
            if (recipients.isEmpty()) {
                this.recipients.add(recipient);
            } else {
                this.recipients.set(0, recipient);
            }
        }

        public List<String> getRecipients() {
            return recipients;
        }

        public void setRecipients(List<String> recipients) {
            this.recipients = recipients;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getBody() {
            return body;
        }

        public void setBody(String body) {
            this.body = body;
        }

    }

    /**
     * Is the subject authenticated or remembered?
     *
     * @param subject
     *
     * @return true if subject identity can be trusted
     */
    public static boolean isLoggedIn(Subject subject) {
        return subject.isAuthenticated() || subject.isRemembered();
    }

    public static String prettyPrintPSQLException(PSQLException ex) {
        String message = ex.getMessage();

        Pattern p = Pattern.compile("ERROR: duplicate key value violates unique constraint \".*\"\\s+Detail: Key \\((.*)\\)=\\((.*)\\) already exists\\.");
        Matcher m = p.matcher(message);

        if (m != null && m.matches()) {
            return m.group(1) + " " + m.group(2) + " already exists";
        } else {
            return message;
        }
    }

    /**
     * Get all paths.
     * <p>
     * <ul>
     * <li> /hello => [hello]
     * <li> /hello/world => [hello, hello/world]
     * <li> /hello/sad/world => [hello, hello/sad, hello/sad/world]
     * </ul>
     *
     * @param path the path to clean
     *
     * @return clean path
     */
    public static List<String> getAllPaths(String path) {
        List<String> paths = new ArrayList<>();

        String[] split = path.split("/");
        String current = null;
        List<String> segments = Arrays.stream(split)
            .filter(seg -> !Helper.isNullOrEmpty(seg))
            .collect(Collectors.toList());

        for (String seg : segments) {
            String p = (current != null ? current + "/" : "") + seg;
            current = p;
            paths.add(p);
        }
        return paths;
    }

    /**
     * Sanitize a path.
     * <p>
     * A clean path do not start nor end with a slash and do not contains consecutive slashes
     * <ul>
     * <li> /hello => hello
     * <li> /hello/world => hello/world
     * <li> hello/world => hello/world
     * <li> hello//world/ => hello/world
     * </ul>
     *
     * @param path the path to clean
     *
     * @return clean path
     */
    public static String cleanFilename(String path) {
        String[] split = path.split("/");

        return Arrays.stream(split)
            .filter(seg -> !Helper.isNullOrEmpty(seg))
            .collect(Collectors.joining("/"));
    }
}
