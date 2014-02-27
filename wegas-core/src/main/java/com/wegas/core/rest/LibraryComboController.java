/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.game.GameModelContent;
import java.io.IOException;
import java.util.Map.Entry;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import org.apache.shiro.SecurityUtils;

/**
 *
 * This servlet allows to retrieve several resources in a single request. Used
 * to combine .js and .css files.
 *
 * @todo Resulting files should be cached. For example check
 * https://github.com/smaring/javascript-combo-service/blob/master/src/main/java/org/maring/util/js/JavascriptComboService.java
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("csscombo")
@Produces(ComboController.MediaTypeCss)
public class LibraryComboController {

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     * Retrieve
     *
     * @param req
     * @return
     * @throws IOException
     */
    @GET
    @Path("{gameModelId : [1-9][0-9]*}")
    public String index(@PathParam("gameModelId") Long gameModelId) {

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + gameModelId);

        StringBuilder acc = new StringBuilder();
        for (Entry<String, GameModelContent> e : gameModelFacade.find(gameModelId).getCssLibrary().entrySet()) {
            acc.append(e.getValue().getContent());
        }

        return acc.toString();
    }
}
