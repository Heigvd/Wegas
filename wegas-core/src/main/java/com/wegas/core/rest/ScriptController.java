/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptCheck;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.Scripted;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.security.ejb.UserFacade;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Script/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ScriptController {

    private static final Logger logger = LoggerFactory.getLogger(ScriptController.class);

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

    @Inject
    private PlayerFacade playerFacade;

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param variableDescritptorId
     * @param script
     *
     * @return whatever the evaluated script returns
     */
    @POST
    @Path("Run/{playerId : [1-9][0-9]*}{sep: /?}{variableDescriptorId : ([1-9][0-9]*)?}")
    public Object run(@PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId,
            @PathParam("variableDescriptorId") Long variableDescritptorId,
            Script script) {

        Player thePlayer = playerFacade.find(playerId);
        Team theTeam;
        Game theGame;
        GameModel theGameModel;

        if ((thePlayer != null)
                && ((theTeam = thePlayer.getTeam()) != null)
                && ((theGame = theTeam.getGame()) != null)
                && ((theGameModel = theGame.getGameModel()) != null)
                && (Objects.equals(theGameModel.getId(), gameModelId))
                && (SecurityUtils.getSubject().isPermitted("GameModel:Edit:gm" + gameModelId)
                || SecurityUtils.getSubject().isPermitted("Game:Edit:g" + theGame.getId())
                || userFacade.matchCurrentUser(playerId))) {

            VariableDescriptor context;
            if (variableDescritptorId != null && variableDescritptorId > 0) {
                context = variableDescriptorFacade.find(variableDescritptorId);
            } else {
                context = null;
            }
            logger.info("script for player " + playerId + ": " + script.getContent());

            Object r = scriptManager.eval(playerId, script, context);
            requestFacade.commit(true);
            return r;
        } else {
            throw new UnauthorizedException();
        }
    }

    /**
     * @param gameModelId
     * @param variableDescritptorId
     * @param multiplayerScripts
     *
     * @return list of whatever the evaluated script returns
     */
    @POST
    @Path("Multirun{sep: /?}{variableDescriptorId : ([1-9][0-9]*)?}")
    public List<Object> multirun(@PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescritptorId,
            HashMap<String, Object> multiplayerScripts) throws WegasScriptException {

        Script script = new Script();
        ArrayList<Integer> playerIdList = (ArrayList<Integer>) multiplayerScripts.get("playerIdList");
        script.setLanguage(((HashMap<String, String>) multiplayerScripts.get("script")).get("language"));
        script.setContent(((HashMap<String, String>) multiplayerScripts.get("script")).get("content"));
        ArrayList<Object> results = new ArrayList<>();

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        VariableDescriptor context;
        if (variableDescritptorId != null && variableDescritptorId > 0) {
            context = variableDescriptorFacade.find(variableDescritptorId);
        } else {
            context = null;
        }

        for (Integer playerId : playerIdList) {
            Object r = scriptManager.eval(playerId.longValue(), script, context);
            results.add(r);
            requestFacade.commit(playerFacadeFacade.find(playerId.longValue()), false);
        }
        requestFacade.flushClear();
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
        //requestFacade.getRequestManager().setEnv(RequestManager.RequestEnvironment.TEST);
        List<VariableDescriptor> findAll = variableDescriptorFacade.findAll(gameModelId);
        Player player = gmf.find(gameModelId).getPlayers().get(0);
        Map<Long, WegasScriptException> ret = new HashMap<>();
        findAll.stream().filter((descriptor) -> (descriptor instanceof Scripted))
                .forEach((VariableDescriptor vd) -> {
                    ((Scripted) vd).getScripts().stream().filter(script -> script != null)
                            .anyMatch((Script script) -> {
                                WegasScriptException validate = scriptCheck.validate(script, player, vd);
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
