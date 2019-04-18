/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.ejb;

import com.wegas.core.Helper;
import com.wegas.core.api.I18nFacadeI;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.deepl.Deepl;
import com.wegas.core.i18n.deepl.DeeplTranslations;
import com.wegas.core.i18n.deepl.DeeplUsage;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.i18n.rest.I18nUpdate;
import com.wegas.core.i18n.rest.InScriptUpdate;
import com.wegas.core.i18n.rest.ScriptUpdate;
import com.wegas.core.i18n.rest.TranslationUpdate;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.MergeHelper.MergeableVisitor;
import com.wegas.core.merge.utils.WegasEntitiesHelper;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.ProtectionLevel;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.mcq.persistence.Result;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.script.CompiledScript;
import javax.script.ScriptContext;
import javax.script.ScriptException;
import javax.script.SimpleScriptContext;
import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author maxence
 */
@Stateless
@LocalBean
public class I18nFacade extends WegasAbstractFacade implements I18nFacadeI {

    private static final Logger logger = LoggerFactory.getLogger(I18nFacade.class);

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private ScriptFacade scriptFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    public static enum UpdateType {
        /**
         * Do not change any statuses
         */
        MINOR,
        /**
         * This is a major update -> outdate others languages
         */
        MAJOR,
        /**
         * Mark the translation up-to-date
         */
        CATCH_UP,
        /**
         * Outdate the translation
         */
        OUTDATE
    }

    /**
     * Create language for the given gamemodel.
     *
     * @param gameModelId id of the gameModel
     * @param code        language code
     * @param name        name of the new language to create
     *
     * @return the gameModel
     */
    public GameModel createLanguage(Long gameModelId, String code, String name) {
        logger.trace("CREATE new language {} for gameModel #{}", name, gameModelId);
        return createLanguage(gameModelFacade.find(gameModelId), code, name);
    }

    public GameModel moveLanguageUp(Long gameModelId, Long languageId) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        List<GameModelLanguage> languages = Helper.copyAndSortModifiable(gameModel.getRawLanguages(), new EntityComparators.OrderComparator<>());
        GameModelLanguage lang = this.findGameModelLanguage(languageId);
        int indexOf = languages.indexOf(lang);
        if (indexOf > 0) {
            if (languages.remove(lang)) {
                languages.add(indexOf - 1, lang);
                gameModel.setLanguages(languages);
            }
        }
        return gameModel;
    }

    private GameModelLanguage findGameModelLanguage(Long gmlId) {
        return getEntityManager().find(GameModelLanguage.class, gmlId);
    }

    public GameModelLanguage updateLanguage(GameModelLanguage language) {
        Long id = language.getId();
        GameModelLanguage lang = this.findGameModelLanguage(id);
        String oldCode = lang.getCode();
        lang.merge(language);
        String newCode = lang.getCode();

        if (!oldCode.equals(newCode)) {
            this.updateTranslationCode(lang.getGameModel(), oldCode, newCode);
        }

        return lang;
    }

    /**
     * Create language for the given gamemodel.
     *
     * @param gameModel the gameModel
     * @param code      language code
     * @param name      name of the new language to create
     *
     * @return the gameModel
     */
    public GameModel createLanguage(GameModel gameModel, String code, String name) {
        logger.trace("CREATE new language {}/{} for {}", code, name, gameModel);
        GameModelLanguage found = gameModel.getLanguageByName(name);
        GameModelLanguage foundByCode = gameModel.getLanguageByCode(code);

        if (found == null && foundByCode == null) {
            List<GameModelLanguage> rawLanguages = gameModel.getRawLanguages();

            GameModelLanguage newLang = new GameModelLanguage();
            newLang.setGameModel(gameModel);
            newLang.setIndexOrder(rawLanguages.size()); // last position
            newLang.setLang(name);
            newLang.setCode(code);

            if (gameModel.isModel()) {
                newLang.setVisibility(Visibility.INTERNAL);
            } else {
                newLang.setVisibility(Visibility.PRIVATE);
            }

            rawLanguages.add(newLang);

            return gameModel;
        } else {
            throw WegasErrorMessage.error("This language already exists");
        }
    }

    public GameModel deleteLanguage(Long gameModelId, String code) {
        logger.trace("Delete language {} for gameModel #{}", code, gameModelId);
        return deleteLanguage(gameModelFacade.find(gameModelId), code);
    }

    public GameModel deleteLanguage(GameModel gameModel, String code) {
        logger.trace("Delete language {} for gameModel #{}", code, gameModel);
        List<GameModelLanguage> rawLanguages = gameModel.getRawLanguages();
        GameModelLanguage lang = gameModel.getLanguageByCode(code);
        if (lang != null) {
            if (rawLanguages.size() > 1) {
                rawLanguages.remove(lang);
                throw WegasErrorMessage.error("NOT YET IMPLEMENTED");
                // please visit the gameModel to clean all lang translations !!!
                // -> EntityVisitor from Modeler branches

            } else {
                throw WegasErrorMessage.error("Removing the last language is forbidden");
            }
        }
        return gameModel;
    }

    /**
     * Load TranslatableContent with the given id
     *
     * @param trId id of the content to search
     *
     * @return translatableContent
     *
     * @throws WegasNotFoundException if such a content does not exists
     */
    public TranslatableContent findTranslatableContent(Long trId) {
        TranslatableContent find = this.getEntityManager().find(TranslatableContent.class, trId);
        if (find != null) {
            return find;
        } else {
            throw new WegasNotFoundException("Translation #" + trId + " does not exist");
        }
    }

    /**
     * Get a newTranslation
     *
     * @param trId content id
     * @param code language code
     *
     * @return the newTranslation
     *
     * @throws WegasNotFoundException if such a newTranslation does not exists
     */
    private Translation getTranslation(Long trId, String code) {
        if (code != null) {
            TranslatableContent i18nContent = this.findTranslatableContent(trId);
            for (Translation tr : i18nContent.getRawTranslations()) {
                if (code.equals(tr.getLang())) {
                    return tr;
                }
            }
        }
        throw new WegasNotFoundException("There is no translation for language " + code);
    }

    /**
     * Get a newTranslation
     *
     * @param code language code
     *
     * @return the newTranslation
     *
     * @throws WegasNotFoundException if such a newTranslation does not exists
     */
    private Translation getTranslation(TranslatableContent trContent, String code) {
        Translation translation = trContent.getTranslation(code);
        if (translation != null) {
            return translation;
        } else {
            throw new WegasNotFoundException("There is no translation for language " + code);
        }
    }

    /**
     * Destroy a translation.
     * Remove translation from DB and maintain cache integrity
     *
     * @param translation the translation to destroy
     */
    private void deleteTranslation(Translation translation) {
        if (translation != null) {
            TranslatableContent parent = translation.getTranslatableContent();
            parent.getRawTranslations().remove(translation);
            this.getEntityManager().remove(translation);
        }
    }

    /**
     * Get a newTranslation
     *
     * @param trId content id
     * @param code language ref name
     *
     * @return the newTranslation
     *
     * @throws WegasNotFoundException if such a newTranslation does not exists
     */
    public String getTranslatedString(Long trId, String code) {
        return this.getTranslation(trId, code).getTranslation();
    }

    /**
     * Parse impact and return location of the AST node to update
     *
     * @param impact
     * @param index
     * @param code
     * @param newValue
     *
     * @return
     *
     * @throws ScriptException
     */
    private Object fishTranslationLocation(String impact, Integer index, String code, String newValue) throws ScriptException {
        // JAVA 9 will expose Nashorn parser in java !!!
        Map<String, Object> args = new HashMap<>();
        args.put("impact", impact);
        args.put("index", index);
        args.put("code", code);
        args.put("newValue", newValue);

        ScriptContext ctx = new SimpleScriptContext();

        scriptFacade.nakedEval(getI18nJsHelper(), null, ctx);
        return scriptFacade.nakedEval("I18nHelper.getTranslationLocation()", args, ctx);
    }

    private Object fishTranslationsByCode(String impact, String code) throws ScriptException {
        // JAVA 9 will expose Nashorn parser in java !!!
        Map<String, Object> args = new HashMap<>();
        args.put("impact", impact);
        args.put("code", code.toUpperCase());

        ScriptContext ctx = new SimpleScriptContext();

        scriptFacade.nakedEval(getI18nJsHelper(), null, ctx);
        return scriptFacade.nakedEval("I18nHelper.getTranslations()", args, ctx);
    }

    private CompiledScript getI18nJsHelper() throws ScriptException {
        InputStream resourceAsStream = this.getClass().getResourceAsStream("/helpers/i18nHelper.js");
        InputStreamReader isr = new InputStreamReader(resourceAsStream, StandardCharsets.UTF_8);
        return scriptFacade.compile(isr);
    }

    private Integer[] getIndexes(String script, JSObject result, String key) {

        JSObject location = (JSObject) result.getMember(key);

        if (location.hasMember("start") && location.hasMember("end")) {
            JSObject start = (JSObject) location.getMember("start");
            JSObject end = (JSObject) location.getMember("end");

            Integer startLine = (Integer) start.getMember("line");
            Integer startColumn = (Integer) start.getMember("column");

            Integer endLine = (Integer) end.getMember("line");
            Integer endColumn = (Integer) end.getMember("column");

            Integer[] indexes = new Integer[2];
            int line = 1;
            int col = 1;

            // convert column/line nunbers to absolute indexes
            for (int i = 0; i < script.length(); i++) {
                if (startLine == line) {
                    indexes[0] = i + startColumn;
                }

                if (endLine == line) {
                    indexes[1] = i + endColumn;
                }

                if (indexes[0] != null && indexes[1] != null) {
                    return indexes;
                }

                if (script.charAt(i) == '\n') {
                    line++;
                    col = 0;
                }
                col++;
            }
        }
        return null;
    }

    private static final class InScriptChange {

        private final int startIndex;
        private final int endIndex;

        private final String newValue;

        public InScriptChange(int startIndex, int endIndex, String newValue) {
            this.startIndex = startIndex;
            this.endIndex = endIndex;
            this.newValue = newValue;
        }
    }

    public String updateCodeInScript(String impact, String oldCode, String newCode) throws ScriptException {
        JSObject result = (JSObject) fishTranslationsByCode(impact, oldCode);

        if (result != null) {
            List<InScriptChange> langCodes = new ArrayList<>();
            for (String key : result.keySet()) {

                // TODO: store all indexes; sort them from end to start, replace all oldCode by new one, return new content
                JSObject translation = (JSObject) result.getMember(key);
                String status = (String) translation.getMember("status");
                if ("found".equals(status)) {
                    Integer[] indexes = getIndexes(impact, translation, "keyLoc");
                    if (indexes != null) {
                        langCodes.add(new InScriptChange(indexes[0], indexes[1], "\"" + newCode + "\""));
                    }
                }
            }

            if (!langCodes.isEmpty()) {
                StringBuilder sb = new StringBuilder(impact);

                Collections.sort(langCodes, new Comparator<InScriptChange>() {
                    @Override
                    public int compare(InScriptChange o1, InScriptChange o2) {
                        return o1.startIndex < o2.startIndex ? 1 : -1;
                    }
                });

                for (InScriptChange change : langCodes) {
                    // update lang code
                    sb.replace(change.startIndex - 1, change.endIndex + 1, change.newValue);
                }
                return sb.toString();
            }
        }

        return impact;
    }

    private boolean doesPathLocationsMatches(JSObject inTarget, JSObject inRef) {
        if (inTarget.keySet().size() == inRef.keySet().size()) {
            for (String k : inTarget.keySet()) {
                JSObject trTarget = (JSObject) inTarget.getMember(k);
                JSObject trRef = (JSObject) inTarget.getMember(k);
                if (!trTarget.hasMember("path") || !trRef.hasMember("path") || !trTarget.getMember("path").equals(trRef.getMember("path"))) {
                    // as soon as one path does not match, return false
                    logger.error("Script paths differs");
                    return false;
                }
            }
        } else {
            logger.debug("Number of translations does not match");
            return false;
        }
        // nothing wrong has been detected, return true
        return true;
    }

    public List<TranslatableContent> getInScriptTranslations(String script) throws ScriptException {
        List<TranslatableContent> list = new ArrayList<>();

        Map<String, Object> args = new HashMap<>();
        args.put("impact", script);

        ScriptContext ctx = new SimpleScriptContext();

        scriptFacade.nakedEval(getI18nJsHelper(), null, ctx);
        ScriptObjectMirror nakedEval = (ScriptObjectMirror) scriptFacade.nakedEval("I18nHelper.getTranslatableContents()", args, ctx);

        for (String key : nakedEval.keySet()) {
            list.add((TranslatableContent) nakedEval.getMember(key));
        }
        return list;
    }

    public String updateScriptWithNewTranslation(String impact, int index, String code, String newValue, String newTrStatus) throws ScriptException {

        JSObject result;

        if (code.equals(code.toUpperCase())) {
            result = (JSObject) fishTranslationLocation(impact, index, code, newValue);
        } else {
            JSObject lowerCaseResult = (JSObject) fishTranslationLocation(impact, index, code, newValue);

            String lowerStatus = (String) lowerCaseResult.getMember("status");

            if (lowerStatus.equals("found")) {
                result = lowerCaseResult;
            } else {
                JSObject upperCaseResult = (JSObject) fishTranslationLocation(impact, index, code.toUpperCase(), newValue);
                String upperStatus = (String) upperCaseResult.getMember("status");

                if (upperStatus.equals("found") || upperStatus.equals("missingCode")) {
                    // no lower case, but a upper case one
                    result = upperCaseResult;
                } else {
                    result = lowerCaseResult;
                }
            }
        }

        if (result != null) {

            String status = (String) result.getMember("status");

            String newNewValue = (String) result.getMember("newValue");

            String previousStatus;
            String translation;
            Integer[] indexes;

            switch (status) {
                case "found":
                    // the newTranslation already exists
                    indexes = getIndexes(impact, result, "valueLoc");

                    previousStatus = (String) result.getMember("trStatus");
                    translation = "{"
                            + "\"translation\": " + newNewValue + ","
                            + "\"status\": \"" + (newTrStatus != null ? newTrStatus : previousStatus) + "\""
                            + "}";

                    if (indexes != null) {
                        Integer startIndex = indexes[0];
                        Integer endIndex = indexes[1];
                        // update existing newTranslation
                        if (startIndex != null && endIndex != null) {
                            StringBuilder sb = new StringBuilder(impact);
                            sb.replace(startIndex, endIndex, translation);
                            return sb.toString();
                        }
                    }
                    break;
                case "missingCode":
                    indexes = getIndexes(impact, result, "loc");

                    translation = "{"
                            + "\"translation\": " + newNewValue + ","
                            + "\"status\": \"" + (newTrStatus != null ? newTrStatus : "") + "\""
                            + "}";

                    if (indexes != null) {
                        Integer startIndex = indexes[0];
                        Integer endIndex = indexes[1];
                        StringBuilder sb = new StringBuilder(impact);
                        // insert new code property right after opening bracket
                        sb.replace(startIndex + 1, startIndex + 1, "\"" + code.toUpperCase() + "\": " + translation + ", ");
                        return sb.toString();
                    }
                default:
                    break;

            }
        }
        return impact;
    }

    private AbstractEntity getParent(ScriptUpdate scriptUpdate) {
        Class theKlass;
        // hardcoded class name => resolve with a switch is a bad practice, should rely on JSON type name (wait for payara5 / yasson)
        switch (scriptUpdate.getParentClass()) {
            case "TriggerDescriptor":
                theKlass = TriggerDescriptor.class;
                break;
            case "Result":
                theKlass = Result.class;
                break;
            case "Transition":
                theKlass = Transition.class;
                break;
            case "State":
                theKlass = State.class;
                break;
            default:
                theKlass = null;
        }

        if (theKlass != null) {
            // load the parent
            return (AbstractEntity) this.getEntityManager().find(theKlass, scriptUpdate.getParentId());
        }
        return null;
    }

    private VariableDescriptor getToReturn(String className, AbstractEntity theParent) {
        if (theParent != null) {
            switch (className) {
                case "TriggerDescriptor":
                    return (TriggerDescriptor) theParent;
                case "Result":
                    return ((Result) theParent).getChoiceDescriptor();
                case "Transition":
                    return ((Transition) theParent).getState().getStateMachine();
                case "State":
                    return ((State) theParent).getStateMachine();
            }
        }
        return null;
    }

    public List<AbstractEntity> batchUpdate(List<I18nUpdate> i18nUpdates, UpdateType updateType) throws ScriptException {
        List<AbstractEntity> updatedEntities = new ArrayList<>();

        for (I18nUpdate update : i18nUpdates) {
            AbstractEntity r = this.update(update, updateType);

            if (r != null) {
                updatedEntities.add(r);
            }
        }

        return updatedEntities;
    }

    /**
     * Update a translation stored as in a translatable content entity
     *
     * @param update
     * @param mode
     *
     * @return updated TranslatableContent
     */
    private TranslatableContent trUpdate(TranslationUpdate update, UpdateType mode) {

        TranslatableContent content = this.findTranslatableContent(update.getTrId());

        if (content.belongsToProtectedGameModel()) {
            if (content.getParentDescriptor() != null) {
                ModelScoped.Visibility visibility = content.getParentDescriptor().getVisibility();
                if (visibility == ModelScoped.Visibility.INTERNAL
                        || visibility == ModelScoped.Visibility.PROTECTED) {
                    // newTranslation belongs to a variable readonly variable descriptor
                    return content;
                }
            } else if (content.getParentInstance() != null) {
                if (content.getInheritedVisibility() == ModelScoped.Visibility.INTERNAL) {
                    // newTranslation belongs to a variable readonly variableInstance
                    return content;
                }
            }
        }

        String code = update.getCode();
        String newValue = update.getValue();

        if (null == mode) {
            // MINOR change, do not change the status
            content.updateTranslation(code, newValue);
        } else {
            switch (mode) {
                case MAJOR:
                    // make all tr as outdated
                    for (Translation t : content.getRawTranslations()) {
                        t.setStatus("outdated::" + code);
                    }   // but this one is not
                    content.updateTranslation(code, newValue, "");
                    break;
                case CATCH_UP:
                    // clear the status as the new translation is up to date
                    content.updateTranslation(code, newValue, "");
                    break;
                case OUTDATE:
                    content.updateTranslation(code, newValue, "outdated::manual");
                    break;
                default:
                    // MINOR change, do not change the status
                    content.updateTranslation(code, newValue);
                    break;
            }
        }
        return content;
    }

    /**
     * Update a translation in a script.
     *
     * @param scriptUpdate
     * @param mode
     *
     * @return the parent which owns the script ({@link #getParent(com.wegas.core.i18n.rest.ScriptUpdate)})
     *
     * @throws ScriptException
     */
    private AbstractEntity inScriptUpdate(InScriptUpdate scriptUpdate, UpdateType mode) throws ScriptException {
        AbstractEntity theParent = this.getParent(scriptUpdate);
        if (theParent != null) {
            VariableDescriptor toReturn = this.getToReturn(scriptUpdate.getParentClass(), theParent);
            if (toReturn != null) {
                if (toReturn.belongsToProtectedGameModel()) {
                    // theParent is a variableDescriptor
                    ModelScoped.Visibility visibility = toReturn.getVisibility();
                    if (visibility == ModelScoped.Visibility.PROTECTED || visibility == ModelScoped.Visibility.INTERNAL) {
                        return null;
                    }
                }

                try {
                    // fetch impact getter and setter
                    PropertyDescriptor property = new PropertyDescriptor(scriptUpdate.getFieldName(), theParent.getClass());
                    Method getter = property.getReadMethod();

                    // Fetch script to update
                    Script theScript = (Script) getter.invoke(theParent);
                    String source = theScript.getContent();

                    String status;
                    if (mode == UpdateType.MAJOR) {
                        status = "";
                        //TODO mark all as outdated
                        source = this.updateStatusInScript(source, scriptUpdate.getIndex(), "outdated::" + scriptUpdate.getCode());
                    } else if (mode == UpdateType.CATCH_UP) {
                        status = "";
                    } else if (mode == UpdateType.OUTDATE) {
                        status = "outdate:manual";
                    } else {
                        status = null;
                    }

                    String updatedSource = this.updateScriptWithNewTranslation(source, scriptUpdate.getIndex(), scriptUpdate.getCode(), scriptUpdate.getValue(), status);
                    theScript.setContent(updatedSource);

                    Method setter = property.getWriteMethod();
                    setter.invoke(theParent, theScript);

                    return toReturn;

                } catch (IntrospectionException | InvocationTargetException | IllegalAccessException | IllegalArgumentException ex) {
                    logger.error("Error while setting {}({})#{}.{} to {}", scriptUpdate.getFieldName(), scriptUpdate.getParentId(), scriptUpdate.getFieldName(), scriptUpdate.getIndex(), scriptUpdate.getValue());
                }
            }
        }
        return null;
    }

    /**
     * Update the whole script identified in the scriptUpdate.
     *
     * @param scriptUpdate
     * @param type
     *
     * @return the parent which owns the script ({@link #getParent(com.wegas.core.i18n.rest.ScriptUpdate)})
     */
    private AbstractEntity scriptUpdate(ScriptUpdate scriptUpdate, UpdateType type) {
        AbstractEntity theParent = this.getParent(scriptUpdate);
        if (theParent != null) {
            VariableDescriptor toReturn = this.getToReturn(scriptUpdate.getParentClass(), theParent);

            if (toReturn != null) {

                Boolean process = true;
                if (toReturn.belongsToProtectedGameModel()) {
                    // theParent is a variableDescriptor
                    ModelScoped.Visibility visibility = toReturn.getVisibility();
                    if (visibility == ModelScoped.Visibility.PROTECTED || visibility == ModelScoped.Visibility.INTERNAL) {
                        process = false;
                    }
                }
                if (process) {
                    try {

                        // fetch impact getter and setter
                        PropertyDescriptor property = new PropertyDescriptor(scriptUpdate.getFieldName(), theParent.getClass());
                        Method getter = property.getReadMethod();

                        Script theScript = (Script) getter.invoke(theParent);

                        theScript.setContent(scriptUpdate.getValue());

                        Method setter = property.getWriteMethod();
                        setter.invoke(theParent, theScript);

                        return toReturn;
                    } catch (IntrospectionException | InvocationTargetException | IllegalAccessException | IllegalArgumentException ex) {
                        logger.error("Error while setting {}({})#{} to {}", scriptUpdate.getParentClass(), scriptUpdate.getParentId(), scriptUpdate.getFieldName(), scriptUpdate.getValue());
                    }
                }
            }
        }
        return null;
    }

    public AbstractEntity update(I18nUpdate update, UpdateType type) throws ScriptException {
        UpdateType eType = type;
        if (eType == null) {
            eType = UpdateType.MINOR;
        }
        if (update instanceof TranslationUpdate) {
            return this.trUpdate((TranslationUpdate) update, eType);
        } else if (update instanceof InScriptUpdate) {
            return this.inScriptUpdate((InScriptUpdate) update, eType);
        } else if (update instanceof ScriptUpdate) {
            return this.scriptUpdate((ScriptUpdate) update, eType);
        } else {
            throw WegasErrorMessage.error("Unknown Update Type: " + update);
        }
    }

    private Object fishTranslationsByIndex(String impact, int index) throws ScriptException {
        Map<String, Object> args = new HashMap<>();
        args.put("impact", impact);
        args.put("index", index);

        ScriptContext ctx = new SimpleScriptContext();

        scriptFacade.nakedEval(getI18nJsHelper(), null, ctx);
        return scriptFacade.nakedEval("I18nHelper.getTranslationsByIndex()", args, ctx);
    }

    public String updateStatusInScript(String impact, int index, String newStatus) throws ScriptException {
        JSObject result = (JSObject) fishTranslationsByIndex(impact, index);

        if (result != null) {
            List<InScriptChange> langCodes = new ArrayList<>();

            for (String key : result.keySet()) {

                // TODO: store all indexes; sort them from end to start, update all statuses to newStatus
                JSObject translation = (JSObject) result.getMember(key);
                JSObject value = (JSObject) translation.getMember("value");
                JSObject member = (JSObject) value.getMember("properties");

                for (String key2 : member.keySet()) {
                    JSObject prop = (JSObject) member.getMember(key2);
                    if (((JSObject) prop.getMember("key")).getMember("value").equals("status")) {
                        JSObject statusProp = (JSObject) prop.getMember("value");

                        Integer[] indexes = getIndexes(impact, statusProp, "loc");
                        if (indexes != null) {
                            langCodes.add(new InScriptChange(indexes[0], indexes[1], "\"" + newStatus + "\""));
                        }
                    }
                }
            }

            if (!langCodes.isEmpty()) {
                StringBuilder sb = new StringBuilder(impact);

                Collections.sort(langCodes, new Comparator<InScriptChange>() {
                    @Override
                    public int compare(InScriptChange o1, InScriptChange o2) {
                        return o1.startIndex < o2.startIndex ? 1 : -1;
                    }
                });

                for (InScriptChange change : langCodes) {
                    // update lang code
                    sb.replace(change.startIndex - 1, change.endIndex + 1, change.newValue);
                }
                return sb.toString();
            }
        }

        return impact;
    }

    private static class TranslationsPrinter implements MergeableVisitor {

        private I18nFacade i18nFacade;

        private String[] languages;

        private StringBuilder sb = new StringBuilder();

        public TranslationsPrinter(String[] languages, I18nFacade i18nFacade) {
            this.languages = languages;
            this.i18nFacade = i18nFacade;
        }

        private void print(String msg, int level) {
            for (int i = 0; i < level; i++) {
                sb.append("    ");
            }
            sb.append(msg);
            sb.append(System.lineSeparator());
        }

        private void process(TranslatableContent trc, int level) {

            StringBuilder line = new StringBuilder();
            for (String code : languages) {
                String tr;
                Translation translation = trc.getTranslation(code);
                line.append("[").append(code);

                if (translation != null) {
                    if (Helper.isNullOrEmpty(translation.getStatus())) {
                        line.append("] ");
                    } else {
                        line.append(", ").append(translation.getStatus()).append("] ");
                    }

                    tr = translation.getTranslation();
                } else {
                    line.append("] ");
                    tr = "<N/A>";
                }

                line.append(tr);
                if (tr.length() < 30) {
                    for (int i = 0; i < 30 - tr.length(); i++) {
                        line.append(" ");
                    }
                }
                line.append("    ");
            }
            print(line.toString(), level + 1);

        }

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
            if (target instanceof VariableDescriptor) {
                print(((VariableDescriptor) target).getName(), level);
            }

            if (field != null) {
                print(field.getField().getName(), level);
            }
            if (target instanceof TranslatableContent) {
                TranslatableContent trTarget = (TranslatableContent) target;
                process(trTarget, level);
            } else if (target instanceof Script) {
                try {
                    List<TranslatableContent> inscript = i18nFacade.getInScriptTranslations(((Script) target).getContent());
                    for (TranslatableContent trc : inscript) {
                        process(trc, level);
                    }
                    // hum ...
                } catch (ScriptException ex) {
                    logger.error("FAILS {}", ex);
                }
            }
            return true;
        }

        @Override
        public String toString() {
            return sb.toString();
        }
    }

    public void printAllTranslations(Long gmId) {
        GameModel gameModel = gameModelFacade.find(gmId);
        List<String> collect = gameModel.getRawLanguages().stream().map(GameModelLanguage::getCode).collect(Collectors.toList());

        String[] langs = collect.toArray(new String[collect.size()]);

        this.printTranslations(gameModel, (String[]) langs);
    }

    public void printTranslations(Long gmId, String... languages) {
        this.printTranslations(gameModelFacade.find(gmId), languages);
    }

    public void printTranslations(GameModel target, String... languages) {
        TranslationsPrinter prettyPrinter = new TranslationsPrinter(languages, this);
        MergeHelper.visitMergeable(target, Boolean.TRUE, prettyPrinter);
        logger.error("Translation for {}{}{}", target, System.lineSeparator(), prettyPrinter);
    }


    /*
     * Translation Service
     */
    public boolean isTranslationServiceAvailable() {
        return Helper.getWegasProperty("deepl.enabled", "false").equals("true");
    }

    private Deepl getDeeplClient() {
        if (isTranslationServiceAvailable()) {
            return new Deepl(Helper.getWegasProperty("deepl.service_url", "https://api.deepl.com/v2"),
                    Helper.getWegasProperty("deepl.auth_key"));
        } else {
            throw WegasErrorMessage.error("No translation service");
        }
    }

    /**
     * Initialise or Override all TranslatedContent "targetLangCode" translations within the model using an newTranslation service.
     *
     *
     * @param gameModelId    id of the gameModel to translate
     * @param sourceLangCode reference language
     * @param targetLangCode language to update
     *
     * @return update gameModel
     */
    public GameModel initLanguage(Long gameModelId, String sourceLangCode, String targetLangCode) throws ScriptException {
        GameModel gameModel = gameModelFacade.find(gameModelId);

        Deepl.Language sourceLang = Deepl.Language.valueOf(sourceLangCode.toUpperCase());
        Deepl.Language targetLang = Deepl.Language.valueOf(targetLangCode.toUpperCase());

        if (sourceLang != null) {
            if (gameModel.getLanguageByCode(sourceLangCode) != null) {
                if (targetLang != null) {
                    if (gameModel.getLanguageByCode(targetLangCode) != null) {

                        try {
                            translateGameModel(gameModel, sourceLang.name(), targetLang.name(), true);
                        } catch (UnsupportedEncodingException ex) {
                            throw WegasErrorMessage.error("Unsupported encoding exception " + ex);
                        }
                    } else {
                        throw WegasErrorMessage.error("Unsupported target language " + targetLangCode);
                    }

                } else {
                    throw WegasErrorMessage.error("Source language in not defined in the gameModel");
                }
            } else {
                throw WegasErrorMessage.error("Unsupported source language +");
            }
        } else {
            throw WegasErrorMessage.error("Source language in not defined in the gameModel");
        }

        return gameModel;
    }

    public DeeplUsage usage() {
        if (isTranslationServiceAvailable()) {
            return getDeeplClient().usage();
        } else {
            // Mock deepl Usage
            DeeplUsage usage = new DeeplUsage();
            usage.setCharacterCount(0l);
            usage.setCharacterLimit(0l);
            return usage;
        }
    }

    public DeeplTranslations translate(String sourceLangCode, String targetLangCode, String... texts) throws UnsupportedEncodingException {
        Deepl.Language sourceLang = Deepl.Language.valueOf(sourceLangCode.toUpperCase());
        Deepl.Language targetLang = Deepl.Language.valueOf(targetLangCode.toUpperCase());

        if (sourceLang != null) {
            if (targetLang != null) {

                Deepl deepl = getDeeplClient();

                return deepl.translate(sourceLang, targetLang, texts);
            } else {
                throw WegasErrorMessage.error("Unsupported target language " + targetLangCode);
            }
        } else {
            throw WegasErrorMessage.error("Unsupported source language +");
        }
    }

    /**
     * Automatic translation.
     * For each encountered translatable content, auto-translate targetLangCode tr from sourceLangCode on.
     */
    private static class TranslationExtractor implements MergeableVisitor {

        private final I18nFacade i18nFacade;

        private final String langCode;
        private final String refCode;

        private List<I18nUpdate> patchList = new LinkedList<>();

        public TranslationExtractor(String langCode, I18nFacade facade, String refCode) {
            this.langCode = langCode;
            this.i18nFacade = facade;
            this.refCode = refCode;
        }

        public List<I18nUpdate> getPatches() {
            return patchList;
        }

        private String getTranslation(JSObject inScript, String key) {
            if (inScript != null) {
                if (key != null) {
                    JSObject tr = (JSObject) inScript.getMember(key);
                    if (tr.getMember("status").equals("found")) {
                        return (String) tr.getMember("trValue");
                    }
                }
            }
            return null;
        }

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
            if (target instanceof TranslatableContent) {
                TranslatableContent trTarget = (TranslatableContent) target;
                Translation source = trTarget.getTranslation(langCode);

                if (source != null && !Helper.isNullOrEmpty(source.getTranslation())) {
                    if (!this.isProtected(trTarget, protectionLevel)) {
                        if (Helper.isNullOrEmpty(refCode) // re required empty translation
                                || trTarget.getTranslation(refCode) == null // requiered empty is null
                                || Helper.isNullOrEmpty(trTarget.getTranslation(refCode).getTranslation())) { // exists but is empty
                            TranslationUpdate trUpdate = new TranslationUpdate();
                            trUpdate.setTrId(trTarget.getId());
                            trUpdate.setCode(langCode);
                            trUpdate.setValue(source.getTranslation());
                            patchList.add(trUpdate);
                        }
                    }
                }
                return false;
            } else if (target instanceof Script) {
                if (!this.isProtected(target, protectionLevel)) {
                    Script script = (Script) target;

                    Mergeable parent = ancestors.getFirst();
                    if (parent instanceof AbstractEntity) {
                        try {
                            JSObject inscript = (JSObject) i18nFacade.fishTranslationsByCode(script.getContent(), langCode);
                            JSObject targetInScript = null;
                            if (!Helper.isNullOrEmpty(refCode)) {
                                targetInScript = (JSObject) i18nFacade.fishTranslationsByCode(script.getContent(), refCode);
                            }

                            if (inscript != null) {
                                int index = 0;
                                for (String key : inscript.keySet()) {
                                    String translation = getTranslation(inscript, key);
                                    if (!Helper.isNullOrEmpty(translation) && Helper.isNullOrEmpty(getTranslation(targetInScript, key))) {
                                        InScriptUpdate patch = new InScriptUpdate();
                                        patch.setParentClass(parent.getClass().getSimpleName());
                                        patch.setParentId(((AbstractEntity) parent).getId());

                                        patch.setFieldName(field.getField().getName());
                                        patch.setIndex(index);

                                        patch.setCode(key);
                                        patch.setValue(translation);
                                        patchList.add(patch);
                                    }
                                    index++;
                                }
                            }

                        } catch (ScriptException ex) {
                            logger.error("Ouille ouille ouille: {}", ex);
                        }
                    } else {
                        throw WegasErrorMessage.error("Unsupported parent: " + parent);
                    }
                }
                return false;
            }
            return true;
        }
    }

    /**
     * Auto translate a something.
     *
     * @param target         entity to translate
     * @param sourceLangCode translation sources language
     * @param targetLangCode target languages
     * @param initOnly       do not override existing texts
     *
     * @throws ScriptException
     */
    private void translateGameModel(Mergeable target, String sourceLangCode, String targetLangCode, boolean initOnly) throws ScriptException, UnsupportedEncodingException {
        TranslationExtractor extractor = new TranslationExtractor(sourceLangCode, this, initOnly ? targetLangCode : null);
        MergeHelper.visitMergeable(target, Boolean.TRUE, extractor);
        List<I18nUpdate> patches = extractor.getPatches();

        List<List<String>> listOfTexts = new ArrayList<>();

        final int LIMIT = 50; // maximumt 50 texts / request
        final int SIZE_LIMIT = 30000; // maximim 30 kB / request

        int currentSize = 0;
        List<String> texts = new ArrayList<>();

        int i = 0;
        while (i < patches.size()) {
            I18nUpdate update = patches.get(i);

            int size = update.getValue().getBytes(StandardCharsets.UTF_8).length;

            if (currentSize + size > SIZE_LIMIT) {
                // no place left for new text
                if (texts.size() > 0) {
                    // stack current texts
                    listOfTexts.add(texts);
                    texts = new ArrayList<>();
                    currentSize = 0;
                } else {
                    throw WegasErrorMessage.error("One text is way too big");
                }
            } else {
                // enough room
                texts.add(update.getValue());
                currentSize += size;
                i++;

                if (texts.size() % LIMIT == 0) {
                    listOfTexts.add(texts);
                    texts = new ArrayList<>();
                    currentSize = 0;
                }
            }
        }

        if (texts.size() > 0) {
            listOfTexts.add(texts);
        }

        i = 0;
        for (List<String> toTranslate : listOfTexts) {
            DeeplTranslations translations = translate(sourceLangCode, targetLangCode, toTranslate.toArray(new String[toTranslate.size()]));
            for (DeeplTranslations.DeeplTranslation translation : translations.getTranslations()) {
                logger.error("{}: {} -> {}", i, patches.get(i).getValue(), translation.getText());
                I18nUpdate patch = patches.get(i);
                patch.setCode(targetLangCode);
                patch.setValue(translation.getText());
                i++;
            }
        }

        this.batchUpdate(patches, UpdateType.OUTDATE);
    }

    /**
     * Update language code
     */
    private static class LanguageCodeUpgrader implements MergeableVisitor {

        private final String oldCode;
        private final String newCode;
        private final I18nFacade i18nFacade;

        public LanguageCodeUpgrader(String oldCode, String newCode, I18nFacade i18nFacade) {
            this.oldCode = oldCode;
            this.newCode = newCode;
            this.i18nFacade = i18nFacade;
        }

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
            if (target instanceof TranslatableContent) {
                TranslatableContent tr = (TranslatableContent) target;
                Translation translation = tr.getTranslation(oldCode);
                if (translation != null) {
                    Translation removed = tr.removeTranslation(oldCode);
                    i18nFacade.deleteTranslation(removed);
                    tr.updateTranslation(newCode, translation.getTranslation(), translation.getStatus());
                }
                return false;
            }

            if (target instanceof Script) {
                try {
                    Script script = (Script) target;
                    String newScript = i18nFacade.updateCodeInScript(script.getContent(), oldCode, newCode);
                    script.setContent(newScript);
                } catch (ScriptException ex) {
                    logger.error("SCRIPTERROR");
                }
                return false;
            }
            return true;
        }
    }

    /**
     * Update each occurrence of the language code in the given gameModel.
     * each TranslatableContent property and each TranslatableContnent in any script will be updated.
     *
     * @param gameModel
     * @param oldCode
     * @param newCode
     */
    public void updateTranslationCode(GameModel gameModel, String oldCode, String newCode) {
        MergeHelper.visitMergeable(gameModel, Boolean.TRUE, new LanguageCodeUpgrader(oldCode, newCode, this));
    }

    /**
     * Update newTranslation in target for given language.
     *
     *
     * @param target       the script to update
     * @param source       the script which contains up to date newTranslation
     * @param reference    previous version of source
     * @param languageCode language to update
     */
    private void importTranslationsInScript(Script target, Script source, Script reference, String languageCode, boolean shouldKeepUserTranslation) {
        try {
            JSObject inTarget = (JSObject) fishTranslationsByCode(target.getContent(), languageCode);
            JSObject inSource = (JSObject) fishTranslationsByCode(source.getContent(), languageCode);

            JSObject inRef = null;
            if (reference != null) {
                inRef = (JSObject) fishTranslationsByCode(reference.getContent(), languageCode);
            }

            if (inTarget != null && inSource != null) {
                if (doesPathLocationsMatches(inTarget, inSource)) {
                    if (inRef == null || doesPathLocationsMatches(inTarget, inRef)) {
                        int index = 0;
                        String script = target.getContent();
                        for (String key : inTarget.keySet()) {
                            JSObject trTarget = (JSObject) inTarget.getMember(key);
                            JSObject trSource = (JSObject) inSource.getMember(key);
                            JSObject trRef = null;

                            if (inRef != null) {
                                trRef = (JSObject) inRef.getMember(key);
                            }

                            String newTranslation = null;
                            String currentTranslation = null;
                            String previousTranslation = null;
                            String newStatus = null;

                            // any new newTranslation in the source ?
                            if (trSource.getMember("status").equals("found")) {
                                newTranslation = (String) trSource.getMember("trValue");
                                newStatus = (String) trSource.getMember("trStatus");
                            }
                            // has current newTranslation ?
                            if (trTarget.getMember("status").equals("found")) {
                                currentTranslation = (String) trTarget.getMember("trValue");
                            }

                            if (trRef != null && trRef.getMember("status").equals("found")) {
                                previousTranslation = (String) trRef.getMember("trValue");
                            }

                            if (newTranslation == null) {
                                if (previousTranslation != null && currentTranslation != null) {
                                    // TODO: implement "remove Language"
                                    script = this.updateScriptWithNewTranslation(script, index, languageCode, "", "deleted");
                                }
                            } else {
                                if (!shouldKeepUserTranslation || previousTranslation == null || currentTranslation == null || previousTranslation.equals(currentTranslation)) {
                                    logger.debug("Import {}::{} from {}->{} in {}, ", languageCode, newTranslation, reference, source, target);
                                    script = this.updateScriptWithNewTranslation(script, index, languageCode, newTranslation, newStatus);
                                }
                            }

                            index++;
                        }
                        target.setContent(script);
                    } else {
                        logger.error("Reference Structure does not match; {} VS {}", target, reference);
                    }
                } else {
                    logger.error("Structure does not match; {} VS {}", target, source);
                }
            }

        } catch (ScriptException ex) {
            logger.error("Ouille ouille ouille: {}", ex);
        }

    }

    /**
     * Copy newTranslation from one set of mergeables to another one
     */
    private static class TranslationsImporter implements MergeableVisitor {

        private final String languageCode;
        private final I18nFacade i18nFacade;

        public TranslationsImporter(String languageCode, I18nFacade i18nFacade) {
            this.languageCode = languageCode;
            this.i18nFacade = i18nFacade;
        }

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable references[]) {

            if (target instanceof TranslatableContent) {
                boolean shouldKeepUserTranslation = false;
                TranslatableContent trContentTarget = (TranslatableContent) target;
                Translation trTarget = trContentTarget.getTranslation(languageCode);
                String currentTranslation = null;
                boolean hasNewTrContent = false;
                String newTranslation = null;
                String previousTranslation = null;

                if (trTarget != null) {
                    currentTranslation = trTarget.getTranslation();
                    Visibility visibility = target.getInheritedVisibility();
                    if (!Helper.isProtected(protectionLevel, visibility)) {
                        // target is not protected, keep target newTranslation
                        shouldKeepUserTranslation = true;
                    }
                }

                if (references.length > 0 && references[0] instanceof TranslatableContent) {
                    hasNewTrContent = true;
                    TranslatableContent trContentSource = (TranslatableContent) references[0];
                    Translation trSource = trContentSource.getTranslation(languageCode);

                    if (trSource != null) {
                        newTranslation = trSource.getTranslation();
                    }
                }

                if (references.length > 1 && references[1] instanceof TranslatableContent) {
                    TranslatableContent trContentRef;
                    Translation trRef;

                    trContentRef = (TranslatableContent) references[1];
                    trRef = trContentRef.getTranslation(languageCode);
                    if (trRef != null) {
                        previousTranslation = trRef.getTranslation();
                    }
                }

                if (newTranslation == null) {
                    if (previousTranslation != null && hasNewTrContent) {
                        //only remove the translation if the newTrContent stil exists
                        Translation removed = trContentTarget.removeTranslation(languageCode);
                        i18nFacade.deleteTranslation(removed);
                    }
                } else {
                    if (!shouldKeepUserTranslation || previousTranslation == null || currentTranslation == null || previousTranslation.equals(currentTranslation)) {
                        trContentTarget.updateTranslation(languageCode, newTranslation);
                    }
                }
            } else {
                logger.debug("No TranslationContent in source");
            }

            if (target instanceof Script && references.length > 0 && references[0] instanceof Script) {
                Script ref = null;
                if (references.length > 1) {
                    ref = (Script) references[1];
                }

                boolean shouldKeepUserTranslation = false;
                Visibility visibility = target.getInheritedVisibility();
                if (!Helper.isProtected(protectionLevel, visibility)) {
                    // target is not protected, keep target newTranslation
                    shouldKeepUserTranslation = true;
                }
                i18nFacade.importTranslationsInScript((Script) target, (Script) references[0], ref, languageCode, shouldKeepUserTranslation);
            }

            return true;
        }
    }

    public void importTranslations(Mergeable target, Mergeable source, Mergeable sourceRef, String languageCode) {
        MergeHelper.visitMergeable(target, Boolean.TRUE, new TranslationsImporter(languageCode, this), source, sourceRef);
    }

    @Override
    public String interpolate(String str, Player player) {
        try {
            GameModel gameModel = player.getGameModel();

            String p = "\\{\\{([\\w _\\.\\(\\)]*)\\}\\}";
            Pattern pattern = Pattern.compile(p);
            Matcher matcher = pattern.matcher(str);

            while (matcher.find()) {
                String value = matcher.group(1);
                String[] params = value.split("\\.");
                String param = params[0];
                Object entity = null;

                Matcher m2 = Pattern.compile("Variable\\((.*)\\)").matcher(param);
                if (m2.find()) {
                    entity = variableDescriptorFacade.find(gameModel, m2.group(1));
                } else {
                    m2 = Pattern.compile("VariableInstance\\((.*)\\)").matcher(param);
                    if (m2.find()) {
                        entity = variableDescriptorFacade.find(gameModel, m2.group(1)).getInstance(player);
                    } else if ("Player".equals(param)) {
                        entity = player;
                    } else if ("Team".equals(param)) {
                        entity = player.getTeam();
                    } else if ("Game".equals(param)) {
                        entity = player.getGame();
                    } else if ("GameModel".equals(param)) {
                        entity = gameModel;
                    }
                }

                if (entity != null) {
                    for (int i = 1; i < params.length; i++) {
                        param = params[i];
                        if (entity instanceof Mergeable) {
                            Mergeable m = (Mergeable) entity;
                            WegasEntityFields fields = WegasEntitiesHelper.getEntityIterator(m.getClass());
                            WegasFieldProperties field = fields.getField(param);
                            entity = field.getPropertyDescriptor().getReadMethod().invoke(entity);
                        } else if (entity instanceof List) {
                            List l = (List) entity;
                            entity = l.get(Integer.parseInt(param, 10));
                        } else if (entity instanceof Map) {
                            Map map = (Map) entity;
                            entity = map.get(param);
                        }
                    }

                    if (entity != null) {
                        String newValue;
                        if (entity instanceof TranslatableContent) {
                            newValue = interpolate(((TranslatableContent) entity).translateOrEmpty(player), player);
                        } else {
                            newValue = entity.toString();
                        }

                        str = matcher.replaceFirst(newValue);
                        matcher.reset(str);
                    }

                }
            }

            return str;

        } catch (WegasNoResultException | IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
            throw WegasErrorMessage.error("Something went wrong: " + ex);
        }
    }

    /**
     * get the list of language the current user has the right to edit.
     * If the user has a global edit permission on the gameModel, then the wildcard "*" is returned.
     *
     * @param gameModelId
     *
     * @return list of languages code or ["*"]
     */
    public List<String> getEditableLanguages(Long gameModelId) {
        GameModel gameModel = gameModelFacade.find(gameModelId);

        if (requestManager.hasGameModelWriteRight(gameModel)) {
            ArrayList<String> all = new ArrayList<>();
            all.add("*");
            return all;
        }

        return gameModel.getLanguages().stream()
                .map(l -> l.getCode())
                .filter(lang -> requestManager.hasPermission(gameModel.getAssociatedTranslatePermission(lang)))
                .collect(Collectors.toList());
    }

    /**
     * @return Looked-up EJB
     */
    public static I18nFacade lookup() {
        try {
            return Helper.lookupBy(I18nFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving var desc facade", ex);
            return null;
        }
    }
}
