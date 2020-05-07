/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.ejb;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.Helper;
import com.wegas.core.api.I18nFacadeI;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNashornException;
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
import com.wegas.core.i18n.tools.FishedTranslation;
import com.wegas.core.i18n.tools.FoundTranslation;
import com.wegas.core.i18n.tools.I18nHelper;
import com.wegas.core.i18n.tools.TranslationExtractor;
import com.wegas.core.i18n.tools.TranslationsPrinter;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.MergeHelper.MergeableVisitor;
import com.wegas.core.merge.utils.WegasEntitiesHelper;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.mcq.persistence.Result;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.inject.Inject;
import javax.naming.NamingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author maxence
 */
@Stateless
@LocalBean
public class I18nFacade extends WegasAbstractFacade implements I18nFacadeI {

    private static final Logger logger = LoggerFactory.getLogger(I18nFacade.class);

    private static final int TEXT_PER_REQUEST_LIMIT = 50; // up to 50 texts / request
    private static final int DEEPL_SIZE_LIMIT = 30000; // maximim 30 kB / request

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     * Type of Update. This type indicates how to handle status of translations.
     */
    public enum UpdateType {
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

    /**
     * Move the given item up, giving it a higher priority
     *
     * @param gameModelId id of gameModel the gameMOdel which owns the language
     * @param languageId  id of the language to move up
     *
     * @return the updated gameModel
     */
    public GameModel moveLanguageUp(Long gameModelId, Long languageId) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        List<GameModelLanguage> languages = gameModel.getLanguages();
        GameModelLanguage lang = this.findGameModelLanguage(languageId);
        int indexOf = languages.indexOf(lang);
        if (indexOf > 0 && languages.remove(lang)) {
            languages.add(indexOf - 1, lang);
            gameModel.setLanguages(languages);
        }
        return gameModel;
    }

    /**
     * Load a GameModelLangue by id
     *
     * @param gmlId id of the gameModelLanguage to load
     *
     * @return the gameModelLanguage or null if it does not exist
     */
    private GameModelLanguage findGameModelLanguage(Long gmlId) {
        return getEntityManager().find(GameModelLanguage.class, gmlId);
    }

    /**
     * Update the language.
     *
     * @param language new version to save to database
     *
     * @return the updated language
     */
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

    /**
     * Delete a language from the gameModel
     *
     * @param gameModelId id of the gameModel
     * @param code        code of the language to delete
     *
     * @return updated GameModel
     */
    public GameModel deleteLanguage(Long gameModelId, String code) {
        logger.trace("Delete language {} for gameModel #{}", code, gameModelId);
        return deleteLanguage(gameModelFacade.find(gameModelId), code);
    }

    /**
     * Delete a language from the gameModel
     *
     * @param gameModel the gameModel from which to remove the language
     * @param code      code of the language to delet
     *
     * @return updated GameModel
     *
     * @throws WegasErrorMessage in all cases as this features has not been implemented yet !
     */
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
     * Get a Translation
     *
     * @param code language code
     *
     * @return the Translation
     *
     * @throws WegasNotFoundException if such a Translation does not exists
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
     * Destroy a translation. Remove translation from DB and maintain cache integrity
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
     * Get a translation
     *
     * @param trId content id
     * @param code language ref name
     *
     * @return the Translation
     *
     * @throws WegasNotFoundException if such a Translation does not exists
     */
    public String getTranslatedString(Long trId, String code) {
        return this.getTranslation(trId, code).getTranslation();
    }

    /**
     * Retrieve the parent which own the translation targeted by a ScriptUpdate
     *
     * @param scriptUpdate the script change
     *
     * @return the parent
     */
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

    /**
     * find nearest VariableDescriptor
     *
     * @param theParent starting point
     *
     * @return theParent if it's a VariableDescriptor the nearest ancesor which if in any, null
     *         otherwise
     */
    private VariableDescriptor getParentVariableDescriptor(AbstractEntity theParent) {
        if (theParent instanceof VariableDescriptor) {
            return (VariableDescriptor) theParent;
        } else if (theParent instanceof Result) {
            return theParent.findNearestParent(VariableDescriptor.class);
        }
        return null;
    }

    /**
     * Apply lots of I18nUpdate in one shot.
     *
     * @param i18nUpdates list of update to apply
     * @param updateType  type (minor, major, outdate or catch-up)
     *
     * @return list of updated entities
     *
     * @throws WegasNashornException if parsing some scripts it not possible
     */
    public List<AbstractEntity> batchUpdate(List<I18nUpdate> i18nUpdates, UpdateType updateType) throws WegasNashornException {
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
     * @param update translation update to apply
     * @param mode   type (minor, major, outdate or catch-up)
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
                    // translation belongs to a  readonly variable descriptor
                    return content;
                }
            } else if (content.getParentInstance() != null && content.getInheritedVisibility() == ModelScoped.Visibility.INTERNAL) {
                // translation belongs to a readonly variableInstance
                return content;
            }
        }

        String code = update.getCode();
        String newValue = update.getValue();

        GameModel gameModel = content.getParentGameModel();
        GameModelLanguage gmLang = gameModel.getLanguageByCode(code);

        if (gmLang == null && Helper.isNullOrEmpty(newValue)) {
            // empty translation + ghost Language => remove
            content.removeTranslation(code);
        } else {
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
        }
        return content;
    }

    /**
     * Update a translation in a script.
     *
     * @param scriptUpdate
     * @param mode
     *
     * @return the parent which owns the script
     *         ({@link #getParent(com.wegas.core.i18n.rest.ScriptUpdate)})
     *
     */
    private AbstractEntity inScriptUpdate(InScriptUpdate scriptUpdate, UpdateType mode) throws WegasNashornException {
        AbstractEntity theParent = this.getParent(scriptUpdate);
        if (theParent != null) {
            VariableDescriptor toReturn = this.getParentVariableDescriptor(theParent);
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
                        source = I18nHelper.updateStatusInScript(source, scriptUpdate.getIndex(), "outdated::" + scriptUpdate.getCode());
                    } else if (mode == UpdateType.CATCH_UP) {
                        status = "";
                    } else if (mode == UpdateType.OUTDATE) {
                        status = "outdate:manual";
                    } else {
                        status = null;
                    }

                    String updatedSource = I18nHelper.updateScriptWithNewTranslation(source, scriptUpdate.getIndex(), scriptUpdate.getCode(), scriptUpdate.getValue(), status);
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
     *
     * @return the parent which owns the script
     *         ({@link #getParent(com.wegas.core.i18n.rest.ScriptUpdate)})
     */
    private AbstractEntity scriptUpdate(ScriptUpdate scriptUpdate) {
        AbstractEntity theParent = this.getParent(scriptUpdate);
        if (theParent != null) {
            VariableDescriptor toReturn = this.getParentVariableDescriptor(theParent);

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

    /**
     * Apply an I18nUpdate and update status according to given type
     *
     * @param update update to apply
     * @param type   type of the update
     *
     * @return updated entity
     *
     * @throws WegasNashornException if underlying update try to parse an erroneous script
     */
    public AbstractEntity update(I18nUpdate update, UpdateType type) throws WegasNashornException {
        UpdateType eType = type;
        if (eType == null) {
            eType = UpdateType.MINOR;
        }
        if (update instanceof TranslationUpdate) {
            return this.trUpdate((TranslationUpdate) update, eType);
        } else if (update instanceof InScriptUpdate) {
            return this.inScriptUpdate((InScriptUpdate) update, eType);
        } else if (update instanceof ScriptUpdate) {
            return this.scriptUpdate((ScriptUpdate) update);
        } else {
            throw WegasErrorMessage.error("Unknown Update Type: " + update);
        }
    }

    /**
     * Load the gameModel and print all translations to logger
     *
     * @param gmId id of the gameModel to print
     */
    public void printAllTranslations(Long gmId) {
        GameModel gameModel = gameModelFacade.find(gmId);
        List<String> collect = gameModel.getRawLanguages().stream().map(GameModelLanguage::getCode).collect(Collectors.toList());

        String[] langs = collect.toArray(new String[collect.size()]);

        this.printTranslations(gameModel, (String[]) langs);
    }

    /**
     * Load the gameModel and print translations of given languages to logger
     *
     * @param gmId      id of the gamemodel to print
     * @param languages list of gameModel to print
     */
    public void printTranslations(Long gmId, String... languages) {
        this.printTranslations(gameModelFacade.find(gmId), languages);
    }

    /**
     * Print translations of given languages to logger
     *
     * @param gmId      gamemodel to print
     * @param languages list of gameModel to print
     */
    public void printTranslations(GameModel target, String... languages) {
        TranslationsPrinter prettyPrinter = new TranslationsPrinter(languages);
        MergeHelper.visitMergeable(target, Boolean.TRUE, prettyPrinter);
        logger.error("Translation for {}{}{}", target, System.lineSeparator(), prettyPrinter);
    }


    /*
     * is any Machine-Translate Service there ?
     */
    public boolean isTranslationServiceAvailable() {
        return Helper.getWegasProperty("deepl.enabled", "false").equals("true");
    }

    /**
     * Get DeepL client
     *
     * @return a deepL client
     */
    private Deepl getDeeplClient() {
        if (isTranslationServiceAvailable()) {
            return new Deepl(Helper.getWegasProperty("deepl.service_url", "https://api.deepl.com/v2"),
                Helper.getWegasProperty("deepl.auth_key"));
        } else {
            throw WegasErrorMessage.error("No translation service");
        }
    }

    /**
     * Initialise or Override all TranslatedContent "targetLangCode" translations within the model
     * using an translation service.
     *
     *
     * @param gameModelId    id of the gameModel to translate
     * @param sourceLangCode reference language
     * @param targetLangCode language to update
     *
     * @return update gameModel
     */
    public GameModel initLanguage(Long gameModelId, String sourceLangCode, String targetLangCode) throws WegasNashornException {
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

    /**
     * copy translation from one language to another. This method will not override any
     * translations.
     *
     * @param gameModelId    id of the gameModel to process
     * @param sourceLangCode code of the language to copy
     * @param targetLangCode code of the language to
     *
     * @return updated gameModel
     *
     * @throws WegasNashornException one script in the gameModel is erroneous
     */
    public GameModel copyLanguage(Long gameModelId, String sourceLangCode, String targetLangCode) throws WegasNashornException {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        if (gameModel.getLanguageByCode(sourceLangCode) != null) {
            if (gameModel.getLanguageByCode(targetLangCode) != null) {

                try {
                    copyGameModelLanguage(gameModel, sourceLangCode, targetLangCode, true);
                } catch (UnsupportedEncodingException ex) {
                    throw WegasErrorMessage.error("Unsupported encoding exception " + ex);
                }

            } else {
                throw WegasErrorMessage.error("Source language is not defined in the gameModel");
            }
        } else {
            throw WegasErrorMessage.error("Source language is not defined in the gameModel");
        }

        return gameModel;

    }

    /**
     * Erase translation within the gameModel.
     *
     * @param gameModelId id of the gameModel to clear
     * @param langCode    code of the language to clear
     * @param mode        if "All" erase all translation, otherwise erase only outdated ones (ie
     *                    those with a status)
     *
     * @return updated gameModel
     *
     * @throws WegasNashornException A script in the gameModel couldn't be parsed.
     */
    public GameModel clearLanguage(Long gameModelId, String langCode, String mode) throws WegasNashornException {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        if (gameModel.getLanguageByCode(langCode) != null) {

            try {
                clearGameModelLanguage(gameModel, langCode, mode);
            } catch (UnsupportedEncodingException ex) {
                throw WegasErrorMessage.error("Unsupported encoding exception " + ex);
            }

        } else {
            throw WegasErrorMessage.error("Language is in not defined in the gameModel");
        }

        return gameModel;

    }

    /**
     * Get current Machine-Translation service usage
     *
     * @return current consumption
     */
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

    /**
     * Ask deepL to translate some texts
     *
     * @param sourceLangCode from this language
     * @param targetLangCode to this language
     * @param texts          list of text to translate
     *
     * @returns the deepL translations
     *
     * @throws UnsupportedEncodingException
     */
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
     * Erase translation within the given entity.
     *
     * @param target   entity to clean
     * @param langCode code of the language to clear
     * @param mode     if "All" erase all translation, otherwise erase only outdated ones (ie those
     *                 with a status)
     *
     * @return updated entity
     *
     * @throws WegasNashornException A script in the target couldn't be parsed.
     */
    private void clearGameModelLanguage(Mergeable target, String langCode, String mode) throws UnsupportedEncodingException {

        TranslationEraser eraser = new TranslationEraser(langCode, "All".equals(mode));

        MergeHelper.visitMergeable(target, Boolean.TRUE, eraser);

    }

    /**
     * Copy translation from one language to another. This method will not override any
     * translations.
     *
     * @param target         entity to translate
     * @param sourceLangCode translation sources language
     * @param targetLangCode target languages
     * @param initOnly       do not override existing texts
     */
    private void copyGameModelLanguage(Mergeable target, String sourceLangCode, String targetLangCode, boolean initOnly) throws WegasNashornException, UnsupportedEncodingException {
        TranslationExtractor extractor = new TranslationExtractor(sourceLangCode, initOnly ? targetLangCode : null);
        MergeHelper.visitMergeable(target, Boolean.TRUE, extractor);
        List<I18nUpdate> patches = extractor.getPatches();

        for (I18nUpdate patch : patches) {
            patch.setCode(targetLangCode);
        }

        this.batchUpdate(patches, UpdateType.OUTDATE);
    }

    /**
     * Auto translate all translation in an entity
     *
     * @param target         entity to translate
     * @param sourceLangCode translation sources language
     * @param targetLangCode target languages
     * @param initOnly       do not override existing texts
     *
     */
    private void translateGameModel(Mergeable target, String sourceLangCode, String targetLangCode, boolean initOnly) throws WegasNashornException, UnsupportedEncodingException {
        TranslationExtractor extractor = new TranslationExtractor(sourceLangCode, initOnly ? targetLangCode : null);
        MergeHelper.visitMergeable(target, Boolean.TRUE, extractor);
        List<I18nUpdate> patches = extractor.getPatches();

        List<List<String>> listOfTexts = new ArrayList<>();

        int currentSize = 0;
        List<String> texts = new ArrayList<>();

        int i = 0;
        while (i < patches.size()) {
            I18nUpdate update = patches.get(i);

            int size = update.getValue().getBytes(StandardCharsets.UTF_8).length;

            if (currentSize + size > DEEPL_SIZE_LIMIT) {
                // no place left for new text
                if (!texts.isEmpty()) {
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

                if (texts.size() % TEXT_PER_REQUEST_LIMIT == 0) {
                    listOfTexts.add(texts);
                    texts = new ArrayList<>();
                    currentSize = 0;
                }
            }
        }

        if (!texts.isEmpty()) {
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
                    String newScript = I18nHelper.updateCodeInScript(script.getContent(), oldCode, newCode);
                    script.setContent(newScript);
                } catch (WegasNashornException ex) {
                    logger.error("Fails to parse script: {}", ex);
                }
                return false;
            }
            return true;
        }
    }

    /**
     * Update each occurrence of the language code in the given gameModel. each TranslatableContent
     * property and each TranslatableContnent in any script will be updated.
     *
     * @param gameModel
     * @param oldCode
     * @param newCode
     */
    public void updateTranslationCode(GameModel gameModel, String oldCode, String newCode) {
        MergeHelper.visitMergeable(gameModel, Boolean.TRUE, new LanguageCodeUpgrader(oldCode, newCode, this));
    }

    /**
     * Kind of secret method used by UpdateController only. Force a new TX so one can process a long
     * series without being too afraid of a timeout
     *
     * @param id
     * @param oldCode
     * @param newCode
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void updateCodeTx(Long id, String oldCode, String newCode) {
        GameModel gameModel = gameModelFacade.find(id);
        try {
            GameModelLanguage lang = gameModel.getLanguageByCode(oldCode);
            lang.setCode(newCode);
            MergeHelper.visitMergeable(gameModel, Boolean.TRUE, new LanguageCodeUpgrader(oldCode, newCode, this));
            gameModelFacade.reset(gameModel);
        } catch (Exception ex) {
            logger.error("Faild to process {}", gameModel);
        }
    }

    /**
     * Update translation in target for given language.
     *
     * @param target       the script to update
     * @param source       the script which contains up to date translation
     * @param reference    previous version of source
     * @param languageCode language to update
     */
    private void importTranslationsInScript(Script target, Script source, Script reference, String languageCode, boolean shouldKeepUserTranslation) {
        try {
            List<FishedTranslation> inTarget
                = I18nHelper.getTranslations(target.getContent(), languageCode);
            List<FishedTranslation> inSource
                = I18nHelper.getTranslations(source.getContent(), languageCode);
            List<FishedTranslation> inRef = null;
            if (reference != null) {
                inRef = I18nHelper.getTranslations(reference.getContent(), languageCode);
            }
            if (inTarget != null && inSource != null) {
                if (inTarget.size() == inSource.size()) {
                    if (inRef == null || inRef.size() == inTarget.size()) {
                        String script = target.getContent();

                        for (int index = 0; index < inTarget.size(); index++) {
                            FishedTranslation trTarget = inTarget.get(index);
                            FishedTranslation trSource = inSource.get(index);
                            FishedTranslation trRef = null;
                            if (inRef != null) {
                                trRef = inRef.get(index);
                            }

                            String newTranslation = null;
                            String currentTranslation = null;
                            String previousTranslation = null;
                            String newStatus = null;

                            // any new newTranslation in the source ?
                            if (trSource instanceof FoundTranslation) {
                                newTranslation = ((FoundTranslation) trSource).getTranslation();
                                newStatus = ((FoundTranslation) trSource).getStatus();
                            }

                            // has current newTranslation ?
                            if (trTarget instanceof FoundTranslation) {
                                currentTranslation = ((FoundTranslation) trTarget).getTranslation();
                            }

                            if (trRef instanceof FoundTranslation) {
                                previousTranslation = ((FoundTranslation) trRef).getTranslation();
                            }

                            if (newTranslation == null) {
                                if (previousTranslation != null && currentTranslation != null) {
                                    // TODO: implement "remove Language"
                                    script = I18nHelper.updateScriptWithNewTranslation(script, index, languageCode, "", "deleted");
                                }
                            } else {
                                if (!shouldKeepUserTranslation || previousTranslation == null || currentTranslation == null || previousTranslation.equals(currentTranslation)) {
                                    logger.debug("Import {}::{} from {}->{} in {}, ", languageCode, newTranslation, reference, source, target);
                                    script = I18nHelper.updateScriptWithNewTranslation(script, index, languageCode, newTranslation, newStatus);
                                }
                            }
                        }
                        target.setContent(script);
                    } else {
                        logger.error("Reference Structure does not match; {} VS {}", target, reference);
                    }
                } else {
                    logger.error("Structure does not match; {} VS {}", target, source);
                }
            }
        } catch (WegasNashornException ex) {
            logger.error("Fails to parse script: {}", ex);
        }
    }

    /**
     * Copy translation from one set of mergeables to another one
     */
    private static class TranslationsImporter implements MergeableVisitor {

        private final String languageCode;
        private final I18nFacade i18nFacade;

        public TranslationsImporter(String languageCode, I18nFacade i18nFacade) {
            this.languageCode = languageCode;
            this.i18nFacade = i18nFacade;
        }

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level,
            WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable references[]) {

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
                        // target is not protected, keep target translation
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
                    // target is not protected, keep target translation
                    shouldKeepUserTranslation = true;
                }
                i18nFacade.importTranslationsInScript((Script) target, (Script) references[0], ref, languageCode, shouldKeepUserTranslation);
            }

            return true;
        }
    }

    /**
     * Copy translation from one set of mergeables to another one
     *
     * @param target       entiy to update
     * @param source       entity to fetch translations in
     * @param sourceRef    code of the language to copy from the source
     * @param languageCode code og the language to set in the target
     */
    public void importTranslations(Mergeable target, Mergeable source, Mergeable sourceRef, String languageCode) {
        MergeHelper.visitMergeable(target, Boolean.TRUE, new TranslationsImporter(languageCode, this), source, sourceRef);
    }

    /**
     * Mechanism to interpolate variable within text. Available patterns are <ul>
     * <li>{{Variable(name).property}} means Variable.find(gameModel, name).getProperty()</li>
     * <li>{{VariableInstance(name).property}} means Variable.find(gameModel,
     * name).getInstance(self).getProperty()</li>
     * <li>{{Player.property}} means self.getProperty()</li>
     * <li>{{Team.property}} means self.getTeam().getProperty()</li>
     * <li>{{Game.property}} means self.getGame().getProperty()</li>
     * <li>{{GameModel.property}} means.self.getGameModel().getProperty()</li>
     * </ul>
     *
     * @param str    text to process
     * @param player current player
     *
     * @return
     */
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
     * get the list of language the current user has the right to edit. If the user has a global
     * edit permission on the gameModel, then the wildcard "*" is returned.
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
            return Helper.lookupBy(I18nFacade.class
            );
        } catch (NamingException ex) {
            logger.error("Error retrieving var desc facade", ex);
            return null;
        }
    }
}
