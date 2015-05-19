/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.Result;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("Update")
@RequiresRoles("Administrator")
public class UpdateController {

    private static Logger logger = LoggerFactory.getLogger(UpdateController.class);

    @EJB
    VariableDescriptorFacade descriptorFacade;

    @EJB
    VariableDescriptorController descriptorController;

    @EJB
    GameModelFacade gameModelFacade;

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     * @return
     */
    @GET
    public String index() {
        StringBuilder ret = new StringBuilder();
        ret.append("<a href=\"Update/PMG_UPGRADE\">PMG upgrade</a> <br />");
        for (GameModel gm : gameModelFacade.findAll()) {
            ret.append("<a href=\"Encode/").append(gm.getId()).append("\">Update variable names ").append(gm.getId()).append("</a> | ");
            ret.append("<a href=\"UpdateScript/").append(gm.getId()).append("\">Update script ").append(gm.getId()).append("</a><br />");
        }
        return ret.toString();
    }

    /**
     * Retrieve
     *
     * @param gameModelId
     * @return
     */
    @GET
    @Path("Encode/{gameModelId : ([1-9][0-9]*)}")
    public String encode(@PathParam("gameModelId") Long gameModelId) {
        List<VariableDescriptor> findAll = descriptorFacade.findByGameModelId(gameModelId);
        for (VariableDescriptor vd : findAll) {
            List<String> findDistinctNames = descriptorFacade.findDistinctNames(vd.getGameModel());
            List<String> findDistinctLabels = descriptorFacade.findDistinctLabels(vd.getGameModel());
            findDistinctNames.remove(vd.getName());
            findDistinctLabels.remove(vd.getLabel());
            Helper.setUniqueName(vd, findDistinctNames);
            Helper.setUniqueLabel(vd, findDistinctLabels);
            descriptorFacade.flush();
        }
        return "Finished";
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    @GET
    @Path("UpdateScript/{gameModelId : ([1-9][0-9]*)}")
    public String script(@PathParam("gameModelId") Long gameModelId) {
        List<VariableDescriptor> findAll = descriptorFacade.findAll(gameModelId);
        List<String> keys = new ArrayList<>();
        List<String> values = new ArrayList<>();
        for (VariableDescriptor vd : findAll) {
            keys.add("VariableDescriptorFacade\\.find\\(" + vd.getId() + "\\)");
            values.add("VariableDescriptorFacade.find(gameModel, \"" + vd.getName() + "\")");
        }

        for (VariableDescriptor vd : findAll) {
            if (vd instanceof ChoiceDescriptor) {
                ChoiceDescriptor choice = (ChoiceDescriptor) vd;
                for (Result r : choice.getResults()) {
                    replaceAll(r.getImpact(), keys, values);
                }
            } else if (vd instanceof StateMachineDescriptor) {
                StateMachineDescriptor fsm = (StateMachineDescriptor) vd;
                for (Map.Entry<Long, State> s : fsm.getStates().entrySet()) {
                    replaceAll(s.getValue().getOnEnterEvent(), keys, values);
                    for (Transition t : s.getValue().getTransitions()) {
                        replaceAll(t.getPreStateImpact(), keys, values);
                        replaceAll(t.getTriggerCondition(), keys, values);
                    }
                }
            }
        }
        return "Finished";
    }

    private static void replaceAll(Script script, List<String> a, List<String> b) {
        if (script == null) {
            return;
        }
        String s = script.getContent();
        for (int i = 0; i < a.size(); i++) {
            s = s.replaceAll(a.get(i), b.get(i));
        }
        script.setContent(s);
    }

    private List<GameModel> findPMGs() {
        final CriteriaBuilder criteriaBuilder = em.getCriteriaBuilder();
        final CriteriaQuery query = criteriaBuilder.createQuery();

        Root e = query.from(GameModel.class);
        query.select(e)
                .where(criteriaBuilder.like(e.get("properties").get("clientScriptUri"), "wegas-pmg/js/wegas-pmg-loader.js%"));

        return em.createQuery(query).getResultList();
    }

    private String addVariable(GameModel gm, String json, String varName, String parentName) {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        try {
            descriptorFacade.find(gm, varName);
            return "already exists";
        } catch (WegasNoResultException ex) {
            logger.error("Variable " + varName + " already exists", ex);
        }
        try {
            VariableDescriptor vd = mapper.readValue(json, VariableDescriptor.class);
            descriptorController.createChild(gm.getId(), parentName, vd);
            return "OK";
        } catch (IOException ex) {
            logger.error("Error While Reading JSON: " + json, ex);
            return "JSON Error";
        }
    }

    /**
     *
     */
    @GET
    @Path("PMG_UPGRADE")
    public String pmg_upgrade() {
        List<GameModel> PMGs = this.findPMGs();
        StringBuilder ret = new StringBuilder();
        String status;

        ret.append("<ul>");

        for (GameModel pmg : PMGs) {
            ret.append("<li>");
            ret.append(pmg.getName());
            ret.append("/");
            ret.append(pmg.getId());

            // Add phase names variables
            status = addVariable(pmg, "{\"@class\":\"ListDescriptor\",\"label\":\"Phase Names\",\"title\":null,\"name\":\"phaseNames\",\"items\":[{\"@class\":\"StringDescriptor\",\"label\":\"phase1Name\",\"title\":null,\"name\":\"phase1Name\",\"validationPattern\":null,\"comments\":\"\",\"defaultInstance\":{\"@class\":\"StringInstance\",\"value\":\"Initiation\"},\"scope\":{\"@class\":\"TeamScope\",\"broadcastScope\":\"TeamScope\"}},{\"@class\":\"StringDescriptor\",\"label\":\"phase2Name\",\"title\":null,\"name\":\"phase2Name\",\"validationPattern\":null,\"comments\":\"\",\"defaultInstance\":{\"@class\":\"StringInstance\",\"value\":\"Planning\"},\"scope\":{\"@class\":\"TeamScope\",\"broadcastScope\":\"TeamScope\"}},{\"@class\":\"StringDescriptor\",\"label\":\"phase3Name\",\"title\":null,\"name\":\"phase3Name\",\"validationPattern\":null,\"comments\":\"\",\"defaultInstance\":{\"@class\":\"StringInstance\",\"value\":\"Execution\"},\"scope\":{\"@class\":\"TeamScope\",\"broadcastScope\":\"TeamScope\"}},{\"@class\":\"StringDescriptor\",\"label\":\"phase4Name\",\"title\":null,\"name\":\"phase4Name\",\"validationPattern\":null,\"comments\":\"\",\"defaultInstance\":{\"@class\":\"StringInstance\",\"value\":\"Closing\"},\"scope\":{\"@class\":\"TeamScope\",\"broadcastScope\":\"TeamScope\"}}],\"comments\":\"\",\"defaultInstance\":{\"@class\":\"ListInstance\"},\"scope\":{\"@class\":\"TeamScope\",\"broadcastScope\":\"TeamScope\"}}", "phaseNames", "properties");
            ret.append(" names: ");
            ret.append(status);

            // Add initialBudget variable
            status = addVariable(pmg, "{\"@class\":\"NumberDescriptor\",\"label\":\"Initial Budget\",\"title\":null,\"name\":\"initialBudget\",\"minValue\":0,\"maxValue\":null,\"defaultValue\":0.0,\"comments\":\"\",\"defaultInstance\":{\"@class\":\"NumberInstance\",\"value\":0.0,\"history\":[]},\"scope\":{\"@class\":\"TeamScope\",\"broadcastScope\":\"TeamScope\"}}", "initialBudget", "pageUtilities");

            ret.append(" budget: ");
            ret.append(status);
            ret.append("</li>");
        }
        ret.append("</ul>");
        return ret.toString();
    }
}
