/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
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
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.security.ejb.UserFacade;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
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
    @Inject
    private ScriptFacade scriptFacade;
    /**
     *
     */
    @Inject
    private UserFacade userFacade;
    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    @Inject
    private RequestFacade requestFacade;
    /**
     *
     */
    @Inject
    private PlayerFacade playerFacadeFacade;
    /**
     *
     */
    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @Inject
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

        VariableDescriptor context;
        if (variableDescritptorId != null && variableDescritptorId > 0) {
            context = variableDescriptorFacade.find(variableDescritptorId);
        } else {
            context = null;
        }
        logger.info("script for player {} : {}", playerId, script.getContent());

        Object r = scriptFacade.eval(playerId, script, context);
        requestFacade.commit(playerId);
        return r;
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

        GameModel gm = gameModelFacade.find(gameModelId);
        requestFacade.getRequestManager().assertUpdateRight(gm);

        VariableDescriptor context;
        if (variableDescritptorId != null && variableDescritptorId > 0) {
            context = variableDescriptorFacade.find(variableDescritptorId);
        } else {
            context = null;
        }

        for (Integer playerId : playerIdList) {
            Object r = scriptFacade.eval(playerId.longValue(), script, context);
            results.add(r);
            requestFacade.commit(playerFacadeFacade.find(playerId.longValue()));
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
        GameModel gameModel = gameModelFacade.find(gameModelId);
        Player player = gameModel.getAnyLivePlayer();

        Map<Long, WegasScriptException> ret = new HashMap<>();

        MergeHelper.visitMergeable(gameModel, Boolean.TRUE, new MergeHelper.MergeableVisitor() {
            @Override
            public boolean visit(Mergeable target, ModelScoped.ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
                if (target instanceof Script) {
                    Script script = (Script) target;

                    VariableDescriptor vd = null;
                    for (Mergeable ancestor : ancestors) {
                        if (ancestor instanceof VariableDescriptor) {
                            vd = (VariableDescriptor) ancestor;
                            break;
                        }
                    }

                    if (vd != null) {
                        WegasScriptException validate = scriptCheck.validate(script, player, vd);
                        if (validate != null) {
                            ret.put(vd.getId(), validate);
                        }
                    } else {
                        logger.error("Script {} has no parent ({})!", script);
                    }
                    return false;
                }
                return true;
            }
        });

        return ret;
    }
}
