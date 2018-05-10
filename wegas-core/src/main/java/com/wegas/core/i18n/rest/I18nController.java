/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.rest;

import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Script;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.script.ScriptException;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
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
    private I18nFacade i18nfacade;

    @POST
    @Path("Lang")
    public GameModel createLanguage(@PathParam("gameModelId") Long gameModelId,
            GameModelLanguage language) {
        logger.trace("POST new language {} for gameModel #{}", language, gameModelId);
        return i18nfacade.createLanguage(gameModelId, language.getCode(), language.getLang());
    }

    @PUT
    @Path("Lang")
    public GameModelLanguage updateLanguage(@PathParam("gameModelId") Long gameModelId,
            GameModelLanguage language) {
        logger.trace("UPDATE language {} for gameModel #{}", language, gameModelId);
        return i18nfacade.updateLanguage(language);
    }

    @PUT
    @Path("Lang/{langId: [1-9][0-9]*}/Up")
    public GameModel updateLanguage(@PathParam("gameModelId") Long gameModelId,
            @PathParam("langId") Long langId) {
        return i18nfacade.moveLanguageUp(gameModelId, langId);
    }

    @GET
    @Path("Tr/{refName : [^\\/]*}/{trId: [1-9][0-9]*}")
    public String getTranslation(@PathParam("refName") String refName, @PathParam("trId") Long trId) {
        logger.trace("UPDATE #{} / {}", trId, refName);
        return i18nfacade.getTranslatedString(trId, refName);
    }

    @PUT
    @Path("Tr/{refName : [^\\/]*}/{trId: [1-9][0-9]*}")
    public TranslatableContent updateTranslation(@PathParam("refName") String refName, @PathParam("trId") Long trId, String newValue) {
        logger.trace("UPDATE #{} / {}", trId, refName);
        return i18nfacade.updateTranslation(trId, refName, newValue);
    }

    @PUT
    @Path("ScriptTr/{refName : [^\\/]*}/{parentClass: [a-zA-Z]+}/{parentId: [1-9][0-9]*}/{fieldName: [a-zA-Z]+}/{index: [0-9]+}")
    public AbstractEntity updateScript(
            @PathParam("refName") String refName,
            @PathParam("parentClass") String parentClass,
            @PathParam("parentId") Long parentId,
            @PathParam("fieldName") String fieldName,
            @PathParam("index") Integer index,
            String value) throws ScriptException {
        return i18nfacade.updateInScriptTranslation(parentClass, parentId, fieldName,
                index, refName, value);
    }

    @DELETE
    @Path("Tr/{lang : [^\\/]*}")
    public GameModel removeLanguage(@PathParam("gameModelId") Long gameModelId, @PathParam("lang") String lang) {
        logger.trace("DELETE new language {} for gameModel #{}", lang, gameModelId);
        return null;
    }
}
