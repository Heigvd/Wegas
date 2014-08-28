/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.exception.ScriptException;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.security.ejb.UserFacade;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Script/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ScriptController {

    /**
     *
     */
    @EJB
    private ScriptFacade scriptManager;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @EJB
    private RequestFacade requestFacade;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacadeFacade;

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param script
     * @return p
     * @throws ScriptException
     * @throws WegasException
     */
    @POST
    @Path("Run/{playerId : [1-9][0-9]*}")
    public Object run(@PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId, Script script)
            throws ScriptException, WegasException {

        if (SecurityUtils.getSubject().isPermitted("GameModel:Edit:gm" + gameModelId)
                || userFacade.matchCurrentUser(playerId)) {
            try {
                Object r = scriptManager.eval(playerId, script);
                requestFacade.commit();
                return r;
            } catch (ScriptException e) {                                        // Try catch since script exception does not rollback
                throw new WegasException("Error running script", e);
            }
        } else {
            throw new UnauthorizedException();

        }
    }

    /**
     * @param gameModelId
     * @param multiplayerScripts
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    @POST
    @Path("Multirun")
    public List<Object> multirun(@PathParam("gameModelId") Long gameModelId,
            HashMap<String, Object> multiplayerScripts)
            throws ScriptException, WegasException {

        Script script = new Script();
        ArrayList<Integer> playerIdList = (ArrayList<Integer>) multiplayerScripts.get("playerIdList");
        script.setLanguage(((HashMap<String, String>) multiplayerScripts.get("script")).get("language"));
        script.setContent(((HashMap<String, String>) multiplayerScripts.get("script")).get("content"));
        ArrayList<Object> results = new ArrayList();

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        for (int i = 0; i < playerIdList.size(); i++) {
            Object r = scriptManager.eval(playerIdList.get(i).longValue(), script);
            results.add(r);
            requestFacade.commit(playerFacadeFacade.find(playerIdList.get(i).longValue()));
        }
        return results;
    }
}
