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
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
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
}
