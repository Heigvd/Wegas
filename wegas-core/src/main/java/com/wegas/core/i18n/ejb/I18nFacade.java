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
import com.wegas.core.i18n.rest.I18nController;
import com.wegas.core.i18n.rest.ScriptUpdate;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.mcq.persistence.Result;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.script.ScriptException;
import jdk.nashorn.api.scripting.JSObject;
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
        lang.merge(language);
        return lang;
    }

    /**
     * Find a language of the gameModel which match refName
     *
     * @param gameModel the gameModel to search language in
     * @param refName   language unique name to find
     *
     * @return the language with matching refName or null
     */
    public GameModelLanguage findLangByRef(GameModel gameModel, String refName) {
        if (refName != null) {
            for (GameModelLanguage gmLang : gameModel.getLanguages()) {
                if (refName.equals(gmLang.getRefName())) {
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
     * @param code      language code to find
     *
     * @return the language with matching refName or null
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
     * @return the language with matching refName or null
     */
    public GameModelLanguage findLanguageByName(GameModel gameModel, String lang) {
        if (lang != null) {
            for (GameModelLanguage gmLang : gameModel.getLanguages()) {
                if (lang.equals(gmLang.getLang())) {
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
            newLang.setCode(code);
            newLang.setLang(name);

            String refName = code;
            int suffix = 0;
            // make refName unique
            while (findLangByRef(gameModel, refName) != null) {
                refName = code + (++suffix);
            }
            newLang.setRefName(refName);

            rawLanguages.add(newLang);

            return gameModel;
        } else {
            throw WegasErrorMessage.error("This language already exists");
        }
    }

    public GameModel deleteLanguage(Long gameModelId, String refName) {
        logger.trace("Delete language {} for gameModel #{}", refName, gameModelId);
        return deleteLanguage(gameModelFacade.find(gameModelId), refName);
    }

    public GameModel deleteLanguage(GameModel gameModel, String refName) {
        logger.trace("Delete language {} for gameModel #{}", refName, gameModel);
        List<GameModelLanguage> rawLanguages = gameModel.getRawLanguages();
        GameModelLanguage lang = this.findLangByRef(gameModel, refName);
        if (lang != null) {
            if (rawLanguages.size() > 1) {
                rawLanguages.remove(lang);
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
     * @param trId    content id
     * @param refName language ref name
     *
     * @return the translation
     *
     * @throws WegasNotFoundException if such a translation does not exists
     */
    private Translation getTranslation(Long trId, String refName) {
        if (refName != null) {
            TranslatableContent i18nContent = this.findTranslatableContent(trId);
            for (Translation tr : i18nContent.getRawTranslations()) {
                if (refName.equals(tr.getLang())) {
                    return tr;
                }
            }
        }
        throw new WegasNotFoundException("There is no translation for language " + refName);
    }

    /**
     * Get a translation
     *
     * @param refName language ref name
     *
     * @return the translation
     *
     * @throws WegasNotFoundException if such a translation does not exists
     */
    private Translation getTranslation(TranslatableContent trContent, String refName) {
        Translation translation = trContent.getTranslation(refName);
        if (translation != null) {
            return translation;
        } else {
            throw new WegasNotFoundException("There is no translation for language " + refName);
        }
    }

    /**
     * Get a translation
     *
     * @param trId    content id
     * @param refName language ref name
     *
     * @return the translation
     *
     * @throws WegasNotFoundException if such a translation does not exists
     */
    public String getTranslatedString(Long trId, String refName) {
        return this.getTranslation(trId, refName).getTranslation();
    }

    public TranslatableContent updateTranslation(Long trId, String refName, String newValue) {
        TranslatableContent content = this.findTranslatableContent(trId);

        content.updateTranslation(refName, newValue);

        return content;
    }

    /**
     * Parse impact and return location of the AST node to update
     *
     * @param impact
     * @param index
     * @param refName
     * @param newValue
     *
     * @return
     *
     * @throws ScriptException
     */
    private Object fishTranslationLocation(String impact, Integer index, String refName, String newValue) throws ScriptException {
        // JAVA 9 will expose Nashorn parser in java !!!
        String fisherman = "load(\"nashorn:parser.js\");\n"
                + "\n"
                + "    var count = 0, ast, loc;\n"
                + "    ast = parse(impact, \"impact\", true);\n"
                + "\n"
                + "    function fish(node, args) {\n"
                + "        var key, child, keys, i, j, result;\n"
                + "        if (node.type === 'ObjectExpression') {\n"
                + "            var i, p, properties = {}, content;\n"
                + "            if (node.properties) {\n"
                + "                for (i in node.properties) {\n"
                + "                    p = node.properties[i];\n"
                + "                    properties[p.key.value] = p.value;\n"
                + "                }\n"
                + "                if (properties[\"@class\"] && properties[\"@class\"].value === \"TranslatableContent\") {\n"
                + "                    if (index === count) {\n"
                + "                        for (i in properties[\"translations\"].properties) {\n"
                + "                            p = properties[\"translations\"].properties[i];\n"
                + "                            if (p.key.value === refName) {\n"
                + "                                p.value.loc.status = 'found';\n"
                + "                                return p.value.loc;\n"
                + "                            }\n"
                + "                        }\n"
                + "                        properties[\"translations\"].loc.status = 'missingRefName'\n"
                + "                        return  properties[\"translations\"].loc;\n"
                + "                    } else {\n"
                + "                        count++;\n"
                + "                    }\n"
                + "                }\n"
                + "            }\n"
                + "        }\n"
                + "\n"
                + "        keys = Object.keys(node).sort();\n"
                + "        for (i in keys) {\n"
                + "            key = keys[i];\n"
                + "            if (node.hasOwnProperty(key)) {\n"
                + "                child = node[key];\n"
                + "                if (Array.isArray(child)) {\n"
                + "                    // process all items in arry\n"
                + "                    for (j = 0; j < child.length; j++) {\n"
                + "                        result = fish(child[j]);\n"
                + "                        if (result) {\n"
                + "                            return result;\n"
                + "                        }\n"
                + "                    }\n"
                + "                } else if (child instanceof Object && typeof child.type === \"string\") {\n"
                + "                    // the child is an object which contains a type property\n"
                + "                    result = fish(child);\n"
                + "                    if (result) {\n"
                + "                        return result;\n"
                + "                    }\n"
                + "                }\n"
                + "            }\n"
                + "        }\n"
                + "    }\n"
                + "\n"
                //+ "    print(JSON.stringify(ast));\n"
                + "    loc = fish(ast) || {\n"
                + "        status: 'misingTranslationContent'\n"
                + "    };\n"
                + "    loc.newValue = JSON.stringify(newValue);\n"
                + "    loc;";

        Map<String, Object> args = new HashMap<>();
        args.put("impact", impact);
        args.put("index", index);
        args.put("refName", refName);
        args.put("newValue", newValue);

        return scriptFacade.nakedEval(fisherman, args);
    }

    public String updateScriptWithNewTranslation(String impact, int index, String refName, String newValue) throws ScriptException {
        JSObject location = (JSObject) fishTranslationLocation(impact, index, refName, newValue);

        if (location != null) {

            String status = (String) location.getMember("status");

            if (location.hasMember("start") && location.hasMember("end")) {
                JSObject start = (JSObject) location.getMember("start");
                JSObject end = (JSObject) location.getMember("end");

                Integer startIndex = null;
                Integer endIndex = null;

                Integer startLine = (Integer) start.getMember("line");
                Integer startColumn = (Integer) start.getMember("column");

                Integer endLine = (Integer) end.getMember("line");
                Integer endColumn = (Integer) end.getMember("column");

                String newNewValue = (String) location.getMember("newValue");

                int line = 1;
                int col = 1;

                // convert column/line nunbers to absolute indexes
                for (int i = 0; i < impact.length(); i++) {
                    if (startLine == line) {
                        startIndex = i + startColumn;
                    }

                    if (endLine == line) {
                        endIndex = i + endColumn;
                    }

                    if (startIndex != null && endIndex != null) {
                        break;
                    }

                    if (impact.charAt(i) == '\n') {
                        line++;
                        col = 0;
                    }
                    col++;
                }

                System.out.println("Indexes: " + startIndex + " : " + endIndex);

                switch (status) {
                    case "found":
                        // update existing translation
                        if (startIndex != null && endIndex != null) {
                            StringBuilder sb = new StringBuilder(impact);
                            sb.replace(startIndex - 1, endIndex + 1, newNewValue);
                            return sb.toString();
                        }
                        break;
                    case "missingRefName":
                        StringBuilder sb = new StringBuilder(impact);
                        // insert new refName property right after opening bracket
                        sb.replace(startIndex + 1, startIndex + 1, "\"" + refName + "\": " + newNewValue + ", ");
                        return sb.toString();
                    default:
                        break;
                }
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

    private AbstractEntity getToReturn(String className, AbstractEntity theParent) {
        if (theParent != null) {
            switch (className) {
                case "TriggerDescriptor":
                    return theParent;
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
            AbstractEntity toReturn = this.getToReturn(scriptUpdate.getParentClass(), theParent);

            try {
                // fetch impact getter and setter
                PropertyDescriptor property = new PropertyDescriptor(scriptUpdate.getFieldName(), theParent.getClass());
                Method getter = property.getReadMethod();

                // Fetch script to update
                Script theScript = (Script) getter.invoke(theParent);
                String source = theScript.getContent();

                String updatedSource = this.updateScriptWithNewTranslation(source, scriptUpdate.getIndex(), scriptUpdate.getRefName(), scriptUpdate.getValue());
                theScript.setContent(updatedSource);

                Method setter = property.getWriteMethod();
                setter.invoke(theParent, theScript);

                return toReturn;

            } catch (IntrospectionException | InvocationTargetException | IllegalAccessException | IllegalArgumentException ex) {
                logger.error("Error while setting {}({})#{}.{} to {}", scriptUpdate.getFieldName(), scriptUpdate.getParentId(), scriptUpdate.getFieldName(), scriptUpdate.getIndex(), scriptUpdate.getValue());
            }
        }
        return null;
    }

    public List<AbstractEntity> batchScriptUpdate(List<ScriptUpdate> updates) {
        List<AbstractEntity> ret = new ArrayList<>();
        for (ScriptUpdate scriptUpdate : updates) {
            AbstractEntity theParent = this.getParent(scriptUpdate);
            if (theParent != null) {
                try {
                    AbstractEntity toReturn = this.getToReturn(scriptUpdate.getParentClass(), theParent);

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
        return ret;
    }

}
