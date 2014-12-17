/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.ScriptCheck;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Scripted;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.security.ejb.UserFacade;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private GameModelFacade gmf;
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
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @EJB
    private ScriptCheck scriptCheck;

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param script
     *
     * @return p
     */
    @POST
    @Path("Run/{playerId : [1-9][0-9]*}")
    public Object run(@PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId, Script script) {

        if (SecurityUtils.getSubject().isPermitted("GameModel:Edit:gm" + gameModelId)
                || userFacade.matchCurrentUser(playerId)) {
            Object r = scriptManager.eval(playerId, script);
            requestFacade.commit();
            return r;
        } else {
            throw new UnauthorizedException();
        }
    }

    /**
     * @param gameModelId
     * @param multiplayerScripts
     *
     * @return
     */
    @POST
    @Path("Multirun")
    public List<Object> multirun(@PathParam("gameModelId") Long gameModelId,
            HashMap<String, Object> multiplayerScripts) throws WegasScriptException {

        Script script = new Script();
        ArrayList<Integer> playerIdList = (ArrayList<Integer>) multiplayerScripts.get("playerIdList");
        script.setLanguage(((HashMap<String, String>) multiplayerScripts.get("script")).get("language"));
        script.setContent(((HashMap<String, String>) multiplayerScripts.get("script")).get("content"));
        ArrayList<Object> results = new ArrayList();

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        for (Integer playerId : playerIdList) {
            Object r = scriptManager.eval(playerId.longValue(), script);
            results.add(r);
            requestFacade.commit(playerFacadeFacade.find(playerId.longValue()));
        }
        return results;
    }

    /**
     * Test scripts in a given GameModel (Currently in VariableDescriptors only)
     *
     * @param gameModelId the given gameModel's id
     *
     * @return Map containing errored VariableDescriptor'id and associated error
     *         informations
     */
    @GET
    @Path("Test")
    public Map<Long, WegasScriptException> testGameModel(@PathParam("gameModelId") Long gameModelId) {
        List<VariableDescriptor> findAll = variableDescriptorFacade.findAll(gameModelId);
        Player player = gmf.find(gameModelId).getPlayers().get(0);
        Map<Long, WegasScriptException> ret = new HashMap<>();
        findAll.stream().filter((descriptor) -> (descriptor instanceof Scripted))
                .forEach((VariableDescriptor vd) -> {
                    ((Scripted) vd).getScripts().stream().filter(script -> script != null)
                    .anyMatch((Script script) -> {
                        WegasScriptException validate = scriptCheck.validate(script, player);
                        if (validate != null) {
                            ret.put(vd.getId(), validate);
                            return true;
                        }
                        return false;
                    });
                });

        return ret;
    }

}
