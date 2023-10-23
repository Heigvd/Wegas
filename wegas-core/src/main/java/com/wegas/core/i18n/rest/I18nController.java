/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.rest;

import com.wegas.core.exception.internal.WegasNashornException;
import com.wegas.core.i18n.deepl.Deepl;
import com.wegas.core.i18n.deepl.DeeplTranslations;
import com.wegas.core.i18n.deepl.DeeplTranslations.DeeplTranslation;
import com.wegas.core.i18n.deepl.DeeplUsage;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.i18n.ejb.I18nFacade.UpdateType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Manages languages and translations of gameModel
 *
 * @author maxence
 */
@Stateless
@Path("GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class I18nController {

    private static final Logger logger = LoggerFactory.getLogger(I18nController.class);

    @Inject
    private I18nFacade i18nFacade;

    @POST
    @Path("Lang")
    public GameModel createLanguage(@PathParam("gameModelId") Long gameModelId,
        GameModelLanguage language) {
        logger.trace("POST new language {} for gameModel #{}", language, gameModelId);
        return i18nFacade.createLanguage(gameModelId, language.getCode(), language.getLang());
    }

    @PUT
    @Path("Lang")
    public GameModelLanguage updateLanguage(@PathParam("gameModelId") Long gameModelId,
        GameModelLanguage language) {
        logger.trace("UPDATE language {} for gameModel #{}", language, gameModelId);
        return i18nFacade.updateLanguage(language);
    }

    @PUT
    @Path("Langs")
    public List<GameModelLanguage> updateLanguages(@PathParam("gameModelId") Long gameModelId,
        List<GameModelLanguage> languages) {
        logger.trace("UPDATE languages {} for gameModel #{}", languages, gameModelId);

        List<GameModelLanguage> updated = new ArrayList<>();

        for (GameModelLanguage language : languages) {
            updated.add(i18nFacade.updateLanguage(language));
        }

        return updated;
    }

    @DELETE
    @Path("Lang/{lang : [^\\/]*}")
    public GameModel removeLanguage(@PathParam("gameModelId") Long gameModelId, @PathParam("lang") String lang) {
        logger.trace("DELETE new language {} for gameModel #{}", lang, gameModelId);
        return i18nFacade.deleteLanguage(gameModelId, lang);
    }

    @PUT
    @Path("Lang/{langId: [1-9][0-9]*}/Up")
    public GameModel updateLanguage(@PathParam("gameModelId") Long gameModelId,
        @PathParam("langId") Long langId) {
        return i18nFacade.moveLanguageUp(gameModelId, langId);
    }

    @GET
    @Path("Tr/{code : [^\\/]*}/{trId: [1-9][0-9]*}")
    public String getTranslation(@PathParam("code") String code, @PathParam("trId") Long trId) {
        logger.trace("UPDATE #{} / {}", trId, code);
        return i18nFacade.getTranslatedString(trId, code);
    }

    @PUT
    @Path("Tr/{mode : [A-Z_]+}")
    public AbstractEntity update(@PathParam("mode") UpdateType mode, I18nUpdate i18nUpdate) throws WegasNashornException {
        return i18nFacade.update(i18nUpdate, mode);
    }

    @PUT
    @Path("BatchUpdate")
    public List<AbstractEntity> batchUpdate(List<I18nUpdate> i18nUpdates) throws WegasNashornException  {
        return i18nFacade.batchUpdate(i18nUpdates, UpdateType.MINOR);
    }

    /*
     * DeppL mock
     */
    @POST
    @Path("deepl/translate")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public DeeplTranslations deepLMockTranslate(@FormParam("text") List<String> texts,
        @FormParam("source_lang") Deepl.Language sourceLang,
        @FormParam("target_lang") Deepl.Language targetLang,
        @FormParam("tag_handling") String tagHandling,
        @FormParam("non_splitting_tags") String nonSplittingTags,
        @FormParam("ignore_tags") String ignoreTags,
        @FormParam("split_sentences") String splitSentences,
        @FormParam("preserve_formatting") String preserveFormatting,
        @FormParam("auth_key") String auth_key) {

        DeeplTranslations deeplTranslations = new DeeplTranslations();
        List<DeeplTranslations.DeeplTranslation> translations = new ArrayList<>();

        String source;
        if (sourceLang != null) {
            source = sourceLang.name();
        } else {
            source = "autodetected";
        }

        for (String text : texts) {
            DeeplTranslations.DeeplTranslation deeplTranslation = new DeeplTranslations.DeeplTranslation();

            deeplTranslation.setLang(source);
            deeplTranslation.setText("translate \"" + text + "\" from " + source + " to " + targetLang);

            translations.add(deeplTranslation);
        }

        deeplTranslations.setTranslations(translations);

        return deeplTranslations;
    }


    /*
     * DeppL mock
     */
    @POST
    @Path("deepl/usage")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public DeeplUsage deepLMockUsage(@FormParam("auth_key") String auth_key) {
        DeeplUsage usage = new DeeplUsage();

        usage.setCharacterCount(500000l);
        usage.setCharacterLimit(1000000l);

        return usage;
    }

    @PUT
    @Path("InitLanguage/{source: [a-zA-Z]+}/{target: [a-zA-Z]+}")
    @RequiresRoles("Administrator")
    public GameModel initLanguageTranslations(@PathParam("gameModelId") Long gameModelId,
        @PathParam("target") String targetLangCode,
        @PathParam("source") String sourceLangCode) throws WegasNashornException {

        return i18nFacade.initLanguage(gameModelId, sourceLangCode, targetLangCode);
    }

    @PUT
    @Path("CopyLanguage/{source: [a-zA-Z]+}/{target: [a-zA-Z]+}")
    @RequiresRoles("Administrator")
    public GameModel copyLanguageTranslations(@PathParam("gameModelId") Long gameModelId,
        @PathParam("target") String targetLangCode,
        @PathParam("source") String sourceLangCode) throws WegasNashornException {

        return i18nFacade.copyLanguage(gameModelId, sourceLangCode, targetLangCode);
    }

    @PUT
    @Path("Clear/{lang: [a-zA-Z]+}/{mode: (All|Outdated)}")
    @RequiresRoles("Administrator")
    public GameModel clearLanguageTranslations(@PathParam("gameModelId") Long gameModelId,
        @PathParam("lang") String langCode,
        @PathParam("mode") String mode) throws WegasNashornException {

        return i18nFacade.clearLanguage(gameModelId, langCode, mode);
    }

    @PUT
    @Path("Translate/{source: [a-zA-Z]+}/{target: [a-zA-Z]+}")
    @Consumes(MediaType.TEXT_PLAIN)
    public DeeplTranslation translate(@PathParam("target") String targetLangCode,
        @PathParam("source") String sourceLangCode, String text) throws UnsupportedEncodingException {

        return i18nFacade.translate(sourceLangCode, targetLangCode, text).getTranslations().get(0);
    }

    /**
     *
     * @param targetLangCode
     * @param sourceLangCode
     * @param text
     *
     * @return
     */
    @GET
    @Path("Usage")
    public DeeplUsage usage(@PathParam("target") String targetLangCode,
        @PathParam("source") String sourceLangCode, String text) {
        return i18nFacade.usage();
    }

    /**
     * List of language the current use has the right to edit
     *
     * @return the list of editable languages code or ["*"] if user has complete write right
     */
    @GET
    @Path("EditableLanguages")
    public List<String> getWriteableLanguages(@PathParam("gameModelId") Long gameModelId) {
        return i18nFacade.getEditableLanguages(gameModelId);
    }

    @GET
    @Path("AvailableLanguages")
    public List<String> getAvailableLanguages() {
        List<String> list = new ArrayList<>();

        if (i18nFacade.isTranslationServiceAvailable()) {
            for (Deepl.Language lang : Deepl.Language.values()) {
                list.add(lang.name());
            }
        }

        return list;
    }

    @GET
    @Path("Print")
    public void print(@PathParam("gameModelId") Long gameModelId) {
        i18nFacade.printAllTranslations(gameModelId);
    }
}
