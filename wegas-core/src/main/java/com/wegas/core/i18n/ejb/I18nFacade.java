/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.i18n.rest.ScriptUpdate;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.MergeHelper.MergeableVisitor;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.ProtectionLevel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.mcq.persistence.Result;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
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
public class I18nFacade extends WegasAbstractFacade {

    private static final Logger logger = LoggerFactory.getLogger(I18nFacade.class);

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private ScriptFacade scriptFacade;

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
            MergeHelper.updateTranslationCode(lang.getGameModel(), oldCode, newCode, this);
        }

        return lang;
    }

    /**
     * Find a language of the gameModel which match the given name
     *
     * @param gameModel the gameModel to search language in
     * @param code      language code to find
     *
     * @return the language with matching code or null
     */
    public GameModelLanguage findLanguageByCode(GameModel gameModel, String code) {
        if (code != null) {
            for (GameModelLanguage gmLang : gameModel.getLanguages()) {
                if (code.equals(gmLang.getCode())) {
                    return gmLang;
                }
            }
        }
        return null;
    }

    /**
     * Find a language of the gameModel which match the given name
     *
     * @param gameModel the gameModel to search language in
     * @param lang      language display name to find
     *
     * @return the language with matching lang or null
     */
    public GameModelLanguage findLanguageByName(GameModel gameModel, String lang) {
        if (lang != null) {
            String lowerLang = lang.toLowerCase();
            for (GameModelLanguage gmLang : gameModel.getLanguages()) {
                if (lowerLang.equals(gmLang.getLang().toLowerCase())) {
                    return gmLang;
                }
            }
        }
        return null;
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
        GameModelLanguage found = this.findLanguageByName(gameModel, code);

        if (found == null) {
            List<GameModelLanguage> rawLanguages = gameModel.getRawLanguages();

            GameModelLanguage newLang = new GameModelLanguage();
            newLang.setGameModel(gameModel);
            newLang.setIndexOrder(rawLanguages.size()); // last position
            newLang.setLang(name);

            int suffix = 0;
            String realCode = code;
            // make code unique
            while (findLanguageByCode(gameModel, code) != null) {
                realCode = code + (++suffix);
            }
            newLang.setCode(realCode);

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
        GameModelLanguage lang = this.findLanguageByCode(gameModel, code);
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
     * Get a translation
     *
     * @param trId content id
     * @param code language code
     *
     * @return the translation
     *
     * @throws WegasNotFoundException if such a translation does not exists
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
     * Get a translation
     *
     * @param code language code
     *
     * @return the translation
     *
     * @throws WegasNotFoundException if such a translation does not exists
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
     * Get a translation
     *
     * @param trId content id
     * @param code language ref name
     *
     * @return the translation
     *
     * @throws WegasNotFoundException if such a translation does not exists
     */
    public String getTranslatedString(Long trId, String code) {
        return this.getTranslation(trId, code).getTranslation();
    }

    public TranslatableContent updateTranslation(Long trId, String code, String newValue) {
        TranslatableContent content = this.findTranslatableContent(trId);

        if (content.belongsToProtectedGameModel()) {
            if (content.getParentDescriptor() != null) {
                ModelScoped.Visibility visibility = content.getParentDescriptor().getVisibility();
                if (visibility == ModelScoped.Visibility.INTERNAL
                        || visibility == ModelScoped.Visibility.PROTECTED) {
                    // translation belongs to a variable readonly variable descriptor
                    return content;
                }
            } else if (content.getParentInstance() != null) {
                if (content.getInheritedVisibility() == ModelScoped.Visibility.INTERNAL) {
                    // translation belongs to a variable readonly variableInstance
                    return content;
                }
            }
        }

        content.updateTranslation(code, newValue);

        return content;
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
        args.put("code", code);

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

    private static final class LangChange {

        private final int startIndex;
        private final int endIndex;

        private final String newValue;

        public LangChange(int startIndex, int endIndex, String newValue) {
            this.startIndex = startIndex;
            this.endIndex = endIndex;
            this.newValue = newValue;
        }
    }

    public String updateScriptRefName(String impact, String oldCode, String newCode) throws ScriptException {
        JSObject result = (JSObject) fishTranslationsByCode(impact, oldCode);

        if (result != null) {
            List<LangChange> langCodes = new ArrayList<>();
            for (String key : result.keySet()) {

                // TODO: store all indexes; sort them from end to start, replace all oldCode by new one, return new content
                JSObject translation = (JSObject) result.getMember(key);
                String status = (String) translation.getMember("status");
                if ("found".equals(status)) {
                    Integer[] indexes = getIndexes(impact, translation, "keyLoc");
                    if (indexes != null) {
                        langCodes.add(new LangChange(indexes[0], indexes[1], "\"" + newCode + "\""));
                    }
                }
            }

            if (!langCodes.isEmpty()) {
                StringBuilder sb = new StringBuilder(impact);

                Collections.sort(langCodes, new Comparator<LangChange>() {
                    @Override
                    public int compare(LangChange o1, LangChange o2) {
                        return o1.startIndex < o2.startIndex ? 1 : -1;
                    }
                });

                for (LangChange change : langCodes) {
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

    public void importTranslations(Script target, Script reference, String languageCode) {
        try {
            JSObject inTarget = (JSObject) fishTranslationsByCode(target.getContent(), languageCode);
            JSObject inRef = (JSObject) fishTranslationsByCode(reference.getContent(), languageCode);
            if (inTarget != null && inRef != null) {
                if (doesPathLocationsMatches(inTarget, inRef)) {
                    int index = 0;
                    String script = target.getContent();
                    for (String key : inTarget.keySet()) {
                        JSObject trTarget = (JSObject) inTarget.getMember(key);
                        JSObject trRef = (JSObject) inRef.getMember(key);

                        if (trRef.getMember("status").equals("found")) {

                            if (trTarget.getMember("status").equals("found")) {
                                logger.debug("Target already contains a translation");
                            } else {
                                String translation = (String) trRef.getMember("value");
                                logger.debug("Import {}::{} from {} in {}", languageCode, translation, reference, target);
                                script = this.updateScriptWithNewTranslation(script, index, languageCode, translation);
                            }
                        } else {
                            logger.debug("Missing translation in ref");
                        }
                        index++;
                    }
                    target.setContent(script);
                } else {
                    logger.error("Structure does not match; {} VS {}", target, reference);
                }
            }

        } catch (ScriptException ex) {
            logger.error("Ouille ouille ouille: {}", ex);
        }

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

    public String updateScriptWithNewTranslation(String impact, int index, String code, String newValue) throws ScriptException {
        JSObject result = (JSObject) fishTranslationLocation(impact, index, code, newValue);

        if (result != null) {

            String status = (String) result.getMember("status");

            String newNewValue = (String) result.getMember("newValue");

            Integer[] indexes;

            switch (status) {
                case "found":
                    // the translation already exists
                    indexes = getIndexes(impact, result, "valueLoc");

                    if (indexes != null) {
                        Integer startIndex = indexes[0];
                        Integer endIndex = indexes[1];
                        // update existing translation
                        if (startIndex != null && endIndex != null) {
                            StringBuilder sb = new StringBuilder(impact);
                            sb.replace(startIndex - 1, endIndex + 1, newNewValue);
                            return sb.toString();
                        }
                    }
                    break;
                case "missingCode":
                    indexes = getIndexes(impact, result, "loc");
                    if (indexes != null) {
                        Integer startIndex = indexes[0];
                        Integer endIndex = indexes[1];
                        StringBuilder sb = new StringBuilder(impact);
                        // insert new code property right after opening bracket
                        sb.replace(startIndex + 1, startIndex + 1, "\"" + code + "\": " + newNewValue + ", ");
                        return sb.toString();
                    }
                default:
                    break;

            }
        }
        return null;
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

    public List<AbstractEntity> batchUpdateInScriptTranslation(List<ScriptUpdate> scriptUpdates) throws ScriptException {
        List<AbstractEntity> ret = new ArrayList<>();
        for (ScriptUpdate update : scriptUpdates) {
            AbstractEntity updated = this.updateInScriptTranslation(update);
            if (updated != null) {
                ret.add(updated);
            }
        }
        return ret;
    }

    public AbstractEntity updateInScriptTranslation(ScriptUpdate scriptUpdate) throws ScriptException {
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

                    String updatedSource = this.updateScriptWithNewTranslation(source, scriptUpdate.getIndex(), scriptUpdate.getCode(), scriptUpdate.getValue());
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

    public List<AbstractEntity> batchScriptUpdate(List<ScriptUpdate> updates) {
        List<AbstractEntity> ret = new ArrayList<>();
        for (ScriptUpdate scriptUpdate : updates) {
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

                            if (toReturn != null) {
                                ret.add(toReturn);
                            }
                        } catch (IntrospectionException | InvocationTargetException | IllegalAccessException | IllegalArgumentException ex) {
                            logger.error("Error while setting {}({})#{} to {}", scriptUpdate.getFieldName(), scriptUpdate.getParentId(), scriptUpdate.getFieldName(), scriptUpdate.getIndex(), scriptUpdate.getValue());
                        }
                    }
                }
            }
        }
        return ret;
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
                line.append("[").append(code).append("] ");
                String tr;
                if (trc.getTranslation(code) != null) {
                    tr = trc.getTranslation(code).getTranslation();
                } else {
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
        public void visit(Mergeable target, Mergeable reference, ProtectionLevel protectionLevel, int level, WegasFieldProperties field) {
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
        }

        @Override
        public String toString() {
            return sb.toString();
        }
    }

    public void printTranslations(Long gmId, String... languages) {
        this.printTranslations(gameModelFacade.find(gmId), languages);
    }

    public void printTranslations(GameModel target, String... languages) {
        TranslationsPrinter prettyPrinter = new TranslationsPrinter(languages, this);
        MergeHelper.visitMergeable(target, null, ProtectionLevel.PROTECTED, Boolean.TRUE, prettyPrinter, 0, null);
        logger.error("Translation for {}{}{}", target, System.lineSeparator(), prettyPrinter);
    }

}
