/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelCheck;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.tools.ImportTranslationsVisitor;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Result;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.logging.Level;
import java.util.stream.Collectors;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("Update")
@RequiresRoles("Administrator")
public class UpdateController {

    private static Logger logger = LoggerFactory.getLogger(UpdateController.class);

    @Inject
    private VariableDescriptorFacade descriptorFacade;

    @Inject
    private VariableInstanceFacade variableInstanceFacade;

    @Inject
    private VariableDescriptorController descriptorController;

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private ResourceFacade resourceFacade;

    @Inject
    private RequestManager requestManager;

    @Inject
    private StateMachineFacade stateMachineFacade;

    @Inject
    private ScriptController scriptController;

    @Inject
    private GameModelCheck gameModelCheck;

    @Inject
    private I18nFacade i18nFacade;

    /**
     * @return Some String encoded HTML
     */
    @GET
    public String index() {
        //Long nbOrphans = this.countOrphans();
        //List<Game> noDebugTeamGames = this.findNoDebugTeamGames();

        //ret.append("<a href=\"Update/KillOrphans\">Kill Ulvide and 3000 Orphans (" + nbOrphans + " orphans)</a> <br />");
        //ret.append("<a href=\"Update/RestoreDebugTeams\">Restore 25 Debug Teams and Kill Ulvide (" + noDebugTeamGames.size() + " games)</a> <br />");
        //ret.append("<a href=\"Update/PMG_UPGRADE\">PMG upgrade</a> <br />");
        // for (GameModel gm : gameModelFacade.findAll()) {
        //    ret.append("<a href=\"Encode/").append(gm.getId()).append("\">Update variable names ").append(gm.getId()).append("</a> | ");
        //    ret.append("<a href=\"UpdateScript/").append(gm.getId()).append("\">Update script ").append(gm.getId()).append("</a><br />");
        //}
        return "";
        //<a href=\"RtsUpdateScope/10901\">RTS Update Scopes</a> <br />"
        //+ "<a href=\"RtsNewScope/10901\">RTS New Scopes</a> <br />";
    }

    /**
     * Retrieve
     *
     * @param gameModelId
     *
     * @return static "Finished" string...
     */
    @GET
    @Path("Encode/{gameModelId : ([1-9][0-9]*)}")
    public String encode(@PathParam("gameModelId") Long gameModelId) {
        List<VariableDescriptor> findAll = descriptorFacade.findByGameModelId(gameModelId);
        for (VariableDescriptor vd : findAll) {
            List<String> findDistinctNames = descriptorFacade.findDistinctNames(vd.getGameModel(), vd.getRefId());
            List<TranslatableContent> findDistinctLabels = descriptorFacade.findDistinctLabels(vd.getGameModel());
            findDistinctNames.remove(vd.getName());
            findDistinctLabels.remove(vd.getLabel());
            Helper.setUniqueName(vd, findDistinctNames, vd.getGameModel(), false);
            Helper.setUniqueLabel(vd, findDistinctLabels, vd.getGameModel());
            descriptorFacade.flush();
        }
        return "Finished";
    }

    /**
     * @param gameModelId
     *
     * @return static "Finished" string...
     */
    @GET
    @Path("UpdateScript/{gameModelId : ([1-9][0-9]*)}")
    public String script(@PathParam("gameModelId") Long gameModelId) {
        Collection<VariableDescriptor> findAll = descriptorFacade.findAll(gameModelId);
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

    private List<GameModel> findpmgs(boolean scenarioOnly) {
        EntityManager em = this.getEntityManager();
        final CriteriaBuilder criteriaBuilder = em.getCriteriaBuilder();
        final CriteriaQuery<GameModel> query = criteriaBuilder.createQuery(GameModel.class);

        Root<GameModel> e = query.from(GameModel.class);
        Predicate where;

        if (scenarioOnly) {
            where = criteriaBuilder.and(
                criteriaBuilder.equal(e.get("type"), GameModel.GmType.SCENARIO),
                criteriaBuilder.like(e.get("properties").get("clientScriptUri"), "wegas-private/wegas-pmg/js/wegas-pmg-loader.js;wegas-private/wegas-pmg/scripts/wegas-pmg-client.js")
            );
        } else {
            where = criteriaBuilder.like(e.get("properties").get("clientScriptUri"), "wegas-private/wegas-pmg/js/wegas-pmg-loader.js;wegas-private/wegas-pmg/scripts/wegas-pmg-client.js");
        }

        query.select(e)
            .where(where);

        return em.createQuery(query).getResultList();
    }

    private String updateHistorySize(GameModel aPmg) {
        StringBuilder sb = new StringBuilder("<ul><li><b>Update Histor Size for ");
        sb.append(aPmg).append("</b></li>");

        String[] varNames = {
            "managementApproval",
            "userApproval",
            "quality",
            "costs",
            "delay",
            "planedValue",
            "earnedValue",
            "actualCost"
        };

        int nothing = 0;

        for (String varName : varNames) {
            sb.append("<li>").append(varName);
            try {
                NumberDescriptor nd = (NumberDescriptor) descriptorFacade.find(aPmg, varName);
                if (nd.getHistorySize() != null) {
                    sb.append("  updated");
                    nd.setHistorySize(null);
                } else {
                    sb.append("  nothing to do");
                    nothing++;
                }
            } catch (WegasNoResultException ex) {
                sb.append("  not found");
                java.util.logging.Logger.getLogger(UpdateController.class.getName()).log(Level.SEVERE, null, ex);
            }
            sb.append("</li>");
        }
        sb.append("</ul>");
        if (nothing == varNames.length) {
            return "<ul><li>" + aPmg + "OK</li></ul>";
        } else {
            return sb.toString();
        }
    }

    private void updateScope(VariableDescriptor vd) {
        if (!(vd.getScope() instanceof GameModelScope)) {
            EntityManager em = this.getEntityManager();

            Collection<VariableInstance> values = this.descriptorFacade.getInstances(vd).values();

            for (VariableInstance vi : values) {
                em.remove(vi);
            }
            AbstractScope oldScope = vd.getScope();

            GameModelScope scope = new GameModelScope();
            scope.setBroadcastScope(AbstractScope.ScopeType.GameModelScope);
            scope.setVariableDescscriptor(vd);
            vd.setScope(scope);
            em.persist(vd);
            vd.propagateDefaultInstance(null, true);
            em.remove(oldScope);
        }
    }

    private String updateListDescriptorScope(GameModel gameModel) {
        Collection<VariableDescriptor> variableDescriptors = gameModel.getVariableDescriptors();
        StringBuilder sb = new StringBuilder();
        sb.append('[');

        for (VariableDescriptor vd : variableDescriptors) {
            if (vd instanceof ListDescriptor) {
                this.updateScope(vd);
            }
        }
        sb.append(']');

        return sb.toString();
    }

    @GET
    @Path("ListDescriptorScope/{gameModelId : ([1-9][0-9]*)}")
    public String listDUpdate(@PathParam("gameModelId") Long gameModelId) {
        GameModel find = gameModelFacade.find(gameModelId);
        return updateListDescriptorScope(find);
    }

    /* private String rtsUpdateScope(GameModel gameModel) { Set<VariableDescriptor>
     * variableDescriptors = gameModel.getVariableDescriptors(); StringBuilder sb = new
     * StringBuilder(); sb.append("[");
     *
     * for (VariableDescriptor vd : variableDescriptors) {
     *
     * if ("question".equals(vd.getLabel().toLowerCase())) { this.updateScope(vd); } else if
     * ("toolbar".equals(vd.getLabel().toLowerCase()) || "moves".equals(vd.getLabel().toLowerCase())
     * || "dialogues".equals(vd.getLabel().toLowerCase())) { if (vd instanceof ListDescriptor) {
     * ListDescriptor list = (ListDescriptor) vd; for (VariableDescriptor child : list.getItems()) {
     * if (child instanceof StringDescriptor) { this.updateScope(child); } } } } } sb.append("]");
     *
     * return sb.toString(); } */
    private String lawUpdateScope(GameModel gameModel) {
        this.updateListDescriptorScope(gameModel);
        StringBuilder sb = new StringBuilder();
        try {
            sb.append('[');

            ListDescriptor etapes = (ListDescriptor) descriptorFacade.find(gameModel, "etapes");
            for (VariableDescriptor item : etapes.getItems()) {
                this.updateScope(item);
            }

            sb.append(']');

        } catch (WegasNoResultException ex) {
            java.util.logging.Logger.getLogger(UpdateController.class.getName()).log(Level.SEVERE, null, ex);
        }
        return sb.toString();
    }

    @GET
    @Path("UpdateLawScope/{gameModelId : ([1-9][0-9]*)}")
    public String lawScopeUpdate(@PathParam("gameModelId") Long gameModelId) {
        GameModel find = gameModelFacade.find(gameModelId);
        return lawUpdateScope(find);
    }

    /*
     * @GET @Path("RtsUpdateScope/{gameModelId : ([1-9][0-9]*)}") public String
     * rtsScopeUpdate(@PathParam("gameModelId") Long gameModelId) { GameModel find =
     * gameModelFacade.find(gameModelId); return rtsUpdateScope(find); }
     */
    @SuppressWarnings("PMD")
    private String newScope(GameModel gameModel, VariableDescriptor vd) {
        StringBuilder sb = new StringBuilder();
        try {
            descriptorFacade.detach(vd);
            String name = vd.getName();
            String parentName = vd.getParentList().getName();

            GameModelScope scope = new GameModelScope();
            scope.setBroadcastScope(AbstractScope.ScopeType.GameModelScope);
            vd.setScope(scope);
            String json = vd.toJson(Views.Export.class);
            logger.error("JSON for {}/{} variable: ", parentName, name, json);

            descriptorFacade.remove(vd.getId());
            descriptorFacade.flush();

            logger.error("REMOVED");

            sb.append("NAME: ").append(name).append(" -> ").append(this.addVariable(gameModel, json, name, parentName));

        } catch (IOException ex) {
            java.util.logging.Logger.getLogger(UpdateController.class.getName()).log(Level.SEVERE, null, ex);
        }
        return sb.toString();
    }

    /*
     * private String rtsNewScope(GameModel gameModel) { Collection<VariableDescriptor>
     * variableDescriptors = gameModel.getVariableDescriptors(); StringBuilder sb = new
     * StringBuilder(); sb.append("[");
     *
     * for (Iterator<VariableDescriptor> it = variableDescriptors.iterator(); it.hasNext();) {
     * VariableDescriptor vd = it.next(); if ("question".equals(vd.getLabel().toLowerCase())) { if
     * (!(vd.getScope() instanceof GameModelScope)) { sb.append(this.newScope(gameModel, vd)); } }
     * else if ("toolbar".equals(vd.getLabel().toLowerCase()) ||
     * "moves".equals(vd.getLabel().toLowerCase()) ||
     * "dialogues".equals(vd.getLabel().toLowerCase())) { if (vd instanceof ListDescriptor) {
     * ListDescriptor list = (ListDescriptor) vd; for (VariableDescriptor child : list.getItems()) {
     * if (child instanceof StringDescriptor) { sb.append(this.newScope(gameModel, child)); } } } }
     * } sb.append("]");
     *
     * return sb.toString(); }
     */

 /*
     * @GET @Path("RtsNewScope/{gameModelId : ([1-9][0-9]*)}") public String
     * rtsNewScope(@PathParam("gameModelId") Long gameModelId) { GameModel find =
     * gameModelFacade.find(gameModelId); return rtsNewScope(find); }
     */
    private String addVariable(GameModel gm, String json, String varName, String parentName) {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        logger.error("Going to add {}/{} variable", parentName, varName);

        try {
            // Does the variable already exists ?
            descriptorFacade.find(gm, varName);
            logger.error("  -> variable {} exists : SKIP", varName);
            return "already exists";
        } catch (WegasNoResultException ex) {
            logger.error("  -> variable {} not found : PROCEED", varName);
        }

        try {
            // assert the parent already exists ?
            descriptorFacade.find(gm, parentName);
            logger.error("  -> variable {} exists : PROCEED", parentName);
        } catch (WegasNoResultException ex) {
            logger.error("  -> variable {} not found : FAILED", parentName);
            return "parent not found";
        }
        try {
            VariableDescriptor vd = mapper.readValue(json, VariableDescriptor.class);
            descriptorController.createChild(gm.getId(), parentName, vd);
            descriptorFacade.flush();
            return "OK";
        } catch (WegasNotFoundException ex) {
            logger.error("Error white adding the variable : parent {} not found", parentName);
            return "Parent (2) not found";
        } catch (IOException ex) {
            logger.error("Error While Reading JSON: {}", json);
            return "JSON Error";
        }
    }

    /**
     * Make sure all pmgshare the same structure. Make extractModel smarter
     *
     * @return some output
     */
    @GET
    @Path("LIST_PMG")
    public String pmgList() {
        List<GameModel> pmgs = this.findpmgs(true);
        StringBuilder ret = new StringBuilder();

        for (GameModel pmg : pmgs) {
            ret.append(',').append(pmg.getId());
        }
        return ret.toString();
    }

    /**
     * Make sure all pmgshare the same structure. Make extractModel smarter
     *
     * @return some output
     */
    @GET
    @Path("NORMALISE_PMG")
    public String pmgNormalise() {
        List<GameModel> pmgs = this.findpmgs(true);
        StringBuilder ret = new StringBuilder();

        ret.append("<ul>");
        for (GameModel pmg : pmgs) {
            ret.append("<li>").append(pmg.getName()).append("</li>");
            ret.append(this.normalisePmg(pmg));
        }
        ret.append("</ul>");
        return ret.toString();
    }

    @GET
    @Path("NORMALISE_PMG/{id: [1-9][0-9]*}")
    public String pmgNormaliseOne(@PathParam("id") Long id) {
        GameModel pmg = gameModelFacade.find(id);
        StringBuilder ret = new StringBuilder();

        ret.append("<ul>")
            .append("<li>").append(pmg.getName()).append("</li>")
            .append(this.normalisePmg(pmg))
            .append("</ul>");

        return ret.toString();
    }

    /**
     * Make sure all pmgshare the same structure. Make extractModel smarter
     *
     * @return some output
     */
    @GET
    @Path("PRETEND_FIX_LANGS/{from}/{to}/{ids}")
    public String pretendFixLang(@PathParam("from") String fromCode, @PathParam("to") String toCode, @PathParam("ids") String strIds) {
        List<GameModel> gameModels = Arrays.stream(strIds.split(","))
            .map(id -> Long.parseLong(id, 10))
            .map(id -> gameModelFacade.find(id))
            .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();

        for (GameModel gm : gameModels) {
            GameModelLanguage from = gm.getLanguageByCode(fromCode);
            GameModelLanguage to = gm.getLanguageByCode(toCode);

            sb.append("<h3>GameModel: ").append(gm).append("</h3>");
            if (from != null && to == null) {
                sb.append("Process from ").append(from.getCode()).append('/').append(from.getLang()).append(" to ").append(toCode);
                //i18nFacade.updateTranslationCode(gm, from, to);
            } else {
                sb.append("Invalid codes");
            }
        }
        return sb.toString();
    }

    @GET
    @Path("FIX_LANGS/{from}/{to}/{ids}")
    public String fixLang(@PathParam("from") String fromCode, @PathParam("to") String toCode, @PathParam("ids") String strIds) {
        List<GameModel> gameModels = Arrays.stream(strIds.split(","))
            .map(id -> Long.parseLong(id, 10))
            .map(id -> gameModelFacade.find(id))
            .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();

        for (GameModel gm : gameModels) {
            GameModelLanguage from = gm.getLanguageByCode(fromCode);
            GameModelLanguage to = gm.getLanguageByCode(toCode);

            sb.append("<h3>GameModel: ").append(gm).append("</h3>");
            if (from != null && to == null) {
                i18nFacade.updateCodeTx(gm.getId(), fromCode, toCode);
            } else {
                sb.append("Invalid codes");
            }
        }
        return sb.toString();
    }

    /**
     * Make sure all pmgshare the same structure. Make extractModel smarter
     *
     * @return some output
     */
    @GET
    @Path("COMPARE_LANGS/{ids}")
    public String compareLangs(@PathParam("ids") String strIds) {
        List<GameModel> gameModels = Arrays.stream(strIds.split(","))
            .map(id -> Long.parseLong(id, 10))
            .map(id -> gameModelFacade.find(id))
            .collect(Collectors.toList());

        Map<String, List<Long>> codeToIds = new HashMap<>();
        Map<String, List<Long>> badCodeToIds = new HashMap<>();
        Map<String, List<Long>> badNameToIds = new HashMap<>();

        Map<String, String> nameToCode = new HashMap<>();
        Map<String, String> codeToName = new HashMap<>();
        nameToCode.put("français", "FR");
        codeToName.put("FR", "français");
        nameToCode.put("english", "EN");
        codeToName.put("EN", "english");

        codeToName.put("DEF", "");

        for (GameModel gm : gameModels) {
            for (GameModelLanguage lang : gm.getRawLanguages()) {
                nameToCode.putIfAbsent(lang.getLang(), lang.getCode());
                codeToName.putIfAbsent(lang.getCode(), lang.getLang());

                codeToIds.putIfAbsent(lang.getCode(), new ArrayList<>());
                badCodeToIds.putIfAbsent(lang.getCode(), new ArrayList<>());
                badNameToIds.putIfAbsent(lang.getLang(), new ArrayList<>());

                boolean goodCode = lang.getCode().equals(nameToCode.get(lang.getLang()));
                boolean goodName = lang.getLang().equals(codeToName.get(lang.getCode()));

                if (goodCode && goodName) {
                    codeToIds.get(lang.getCode()).add(gm.getId());
                } else {
                    if (!goodCode) {
                        badCodeToIds.get(lang.getCode()).add(gm.getId());
                    }
                    if (!goodName) {
                        badNameToIds.get(lang.getLang()).add(gm.getId());
                    }
                }
            }
        }
        StringBuilder ret = new StringBuilder();
        ret.append("<h1>Good</h1>");
        appendList(ret, codeToIds);
        ret.append("<h1>Bad Code</h1>");
        appendList(ret, badCodeToIds);
        ret.append("<h1>Bad Names</h1>");
        appendList(ret, badNameToIds);

        return ret.toString();
    }

    private StringBuilder appendList(StringBuilder sb, Map<String, List<Long>> map) {
        for (Entry<String, List<Long>> entry : map.entrySet()) {
            if (!entry.getValue().isEmpty()) {
                sb.append("<h2>").append(entry.getKey()).append("</h2>");
                sb.append(',').append(entry.getValue().toString());
            }
        }
        return sb;
    }

    @GET
    @Path("PMG_CHECK_SCRIPT")
    public String pmgCheckScript() {
        List<GameModel> pmgs = this.findpmgs(true);
        StringBuilder ret = new StringBuilder();

        ret.append("<ul>");
        for (GameModel pmg : pmgs) {
            logger.info("Check {}", pmg);
            Map<Long, WegasScriptException> results = scriptController.testGameModel(pmg.getId());
            if (!results.isEmpty()) {
                logger.info("#Errors: {}", results.size());
                ret.append("<li>").append(pmg.getName()).append(" (").append(pmg.getId()).append(')').append("</li>");
                ret.append("<ul>");
                for (Entry<Long, WegasScriptException> result : results.entrySet()) {
                    Long key = result.getKey();
                    String message = result.getValue().getMessage();
                    ret.append("<li>").append(key).append(" -> ").append(message).append("</li>");
                    logger.info("  {} ->  {}", key, message);
                }
                ret.append("</ul>");
            }
        }
        ret.append("</ul>");
        return ret.toString();
    }

    /**
     * Rename existing subfolders and ensure at least 'count' exists.
     *
     * @param gameModel
     * @param parentName
     * @param childrenPrefix
     * @param count
     *
     * @return
     */
    private String processChildren(GameModel gameModel, String parentName, String childrenPrefix, int count) {
        StringBuilder sb = new StringBuilder();
        try {
            ListDescriptor parent = (ListDescriptor) descriptorFacade.find(gameModel, parentName);
            List<VariableDescriptor> children = parent.getItems();

            // rename existing subfolder
            int i = 1;
            for (; i <= children.size(); i++) {
                VariableDescriptor child = children.get(i - 1);

                if (child instanceof ListDescriptor) {
                    String newName = childrenPrefix + i;
                    if (!child.getName().equals(newName)) {
                        child.setName(childrenPrefix + i);
                        sb.append("<li>Rename ").append(child.getName()).append("</li>");
                    }
                } else {
                    break;
                }
            }

            // make sure parent accept subfolders
            Set<String> allowedTypes = parent.getAllowedTypes();
            if (!allowedTypes.isEmpty() && !allowedTypes.contains("ListDescriptor")) {
                allowedTypes.add("ListDescriptor");
                sb.append("<li>Accept ListDescriptor</li>");
            }

            // creating missing ones
            for (; i <= count; i++) {
                ListDescriptor newChild = new ListDescriptor(childrenPrefix + i);
                newChild.setDefaultInstance(new ListInstance());
                newChild.setScope(new GameModelScope());
                descriptorFacade.createChild(gameModel, parent, newChild, false, false);
                if (i < parent.size()) {
                    // move new folder at the right place
                    descriptorFacade.move(newChild.getId(), parent.getId(), i - 1);
                }

                sb.append("<li>Create ").append(newChild.getName()).append("</li>");
            }
        } catch (WegasErrorMessage ex) {
            sb.append("<li><b>folder").append(ex.getMessage()).append(" not found</b></li>");
        } catch (WegasNoResultException ex) {
            sb.append("<li><b>folder").append(parentName).append(" not found</b></li>");
        } catch (ClassCastException ex) {
            sb.append("<li><b>folder").append(parentName).append(" is not a folder</b></li>");
        }

        return sb.toString();
    }

    /**
     * Move given descriptor in targetList
     * <p>
     */
    public String move(GameModel gameModel, String descName, String targetName, Integer index) {
        try {
            VariableDescriptor desc = descriptorFacade.find(gameModel, descName);
            ListDescriptor list = (ListDescriptor) descriptorFacade.find(gameModel, targetName);
            descriptorFacade.move(desc.getId(), list.getId(), index);
            return "OK";
        } catch (WegasNoResultException ex) {
            return "NOT FOUND";
        }
    }

    private String normalisePmg(GameModel pmg) {
        StringBuilder sb = new StringBuilder();
        sb.append("<ul>");

        try {
            VariableDescriptor project = descriptorFacade.find(pmg, "projet");
            project.setName("project");
        } catch (WegasNoResultException ex) {// NOPMD
            // expected behaviour
        }

        sb.append(this.processChildren(pmg, "questions", "questionsPhase", 4))
            .append(this.processChildren(pmg, "questionsPhase1", "questionsPeriod1_", 1))
            .append(this.processChildren(pmg, "questionsPhase2", "questionsPeriod2_", 1))
            .append(this.processChildren(pmg, "questionsPhase3", "questionsPeriod3_", 1))
            .append(this.processChildren(pmg, "questionsPhase4", "questionsPeriod4_", 1))
            .append(this.processChildren(pmg, "actions", "actionsPhase", 4))
            .append("</ul>");

        return sb.toString();
    }

    /**
     *
     */
    @GET
    @Path("PMG_UPGRADE")
    public String pmgUpgrade() {
        List<GameModel> pmgs = this.findpmgs(false);
        StringBuilder ret = new StringBuilder();

        ret.append("<ul>");
        for (GameModel pmg : pmgs) {
            ret.append(this.updateHistorySize(pmg));
        }
        ret.append("</ul>");
        return ret.toString();
    }

    public String pmgUpgradeBurndown() {
        List<GameModel> pmgs = this.findpmgs(false);
        StringBuilder ret = new StringBuilder();
        String status;

        ret.append("<ul>");

        for (GameModel pmg : pmgs) {
            ret.append("<li>");
            ret.append(pmg.getName());
            ret.append('/');
            ret.append(pmg.getId());
            status = addVariable(pmg, "{\"@class\":\"BooleanDescriptor\",\"comments\":\"\",\"defaultInstance\":{\"@class\":\"BooleanInstance\",\"value\":false},\"label\":\"burndownEnabled\",\"scope\":{\"@class\":\"GameModelScope\",\"broadcastScope\":\"TeamScope\"},\"title\":null,\"name\":\"burndownEnabled\"}", "burndownEnabled", "properties");
            ret.append(" burndownEnabled: ");
            ret.append(status);

            ret.append("</li>");

            ret.append("<li>");
            ret.append(pmg.getName());
            ret.append('/');
            ret.append(pmg.getId());
            status = addVariable(pmg, "{\"@class\":\"BurndownDescriptor\",\"comments\":\"\",\"defaultInstance\":{\"@class\":\"BurndownInstance\",\"iterations\":[]},\"label\":\"burndown\",\"scope\":{\"@class\":\"TeamScope\",\"broadcastScope\":\"TeamScope\"},\"title\":\"\",\"name\":\"burndown\",\"description\":\"\"}", "burndown", "pageUtilities");
            ret.append(" burndown: ");
            ret.append(status);

            ret.append("</li>");
        }
        ret.append("</ul>");
        return ret.toString();
    }

    @GET
    @Path("KillOrphans")
    public String killOrphans() {
        List<VariableInstance> findOrphans = this.findOrphans();
        int counter = 0;
        EntityManager em = this.getEntityManager();

        /* Kill'em all */
        for (VariableInstance vi : findOrphans) {
            logger.error("Remove instance: {}", vi.getId());
            String descName;
            if (vi.getScope() != null) {
                descName = vi.getDescriptor().getName();
            } else {
                descName = "NOPE";
            }
            logger.error("    DESC: {}", descName);
            em.remove(vi);

            counter++;
            if (counter == 3000) {
                break;
            }
        }
        return "OK";
    }

    @GET
    @Path("RestoreDebugTeams")
    public String restoreDebugTeams() {
        List<Game> findNoDebugTeamGames = this.findNoDebugTeamGames();
        int counter = 0;

        for (Game g : findNoDebugTeamGames) {
            logger.error("Restore Game: {}/{}", g.getName(), g.getId());
            DebugTeam dt = new DebugTeam();
            g.addTeam(dt);
            this.getEntityManager().persist(dt);
            gameModelFacade.propagateAndReviveDefaultInstances(g.getGameModel(), dt, true); // restart missing debugTeam
            stateMachineFacade.runStateMachines(dt, true);
            this.getEntityManager().flush();
            counter++;
            if (counter == 25) {
                break;
            }
        }

        Long remaining = this.countOrphans();
        return "OK" + (remaining > 0 ? "(still " + remaining + ")" : "");
    }

    private EntityManager getEntityManager() {
        return requestManager.getEntityManager();
    }

    private boolean hasOccupation(ResourceInstance ri, double time) {
        for (Occupation o : ri.getOccupations()) {
            if (Math.abs(o.getTime() - time) < 0.000001) {
                return true;
            }
        }
        return false;
    }

    @GET
    @Path("CleanOccupations")
    public String cleanOccupations() {
        String sqlRD = "SELECT rd FROM ResourceDescriptor rd";
        TypedQuery<ResourceDescriptor> allRd = this.getEntityManager().createQuery(sqlRD, ResourceDescriptor.class
        );
        StringBuilder output = new StringBuilder();

        for (ResourceDescriptor rd : allRd.getResultList()) {
            ResourceInstance defaultInstance = rd.getDefaultInstance();
            List<Occupation> occupations = defaultInstance.getOccupations();

            HashMap<Integer, List<Occupation>> map = new HashMap<>();
            List<Occupation> cleanList = new ArrayList<>();

            for (Occupation occ : occupations) {
                int key = occ.getTime();
                if (!map.containsKey(key)) {
                    map.put(key, new ArrayList<>());
                    cleanList.add(occ);
                }

                map.get(key).add(occ);
            }

            Long created = 0L;

            /**
             * make sure each occupation exists for each resources
             */
            Collection<VariableInstance> resourceInstances = descriptorFacade.getInstances(rd).values();
            for (VariableInstance vi : resourceInstances) {
                ResourceInstance resourceInstance = (ResourceInstance) vi;
                for (Entry<Integer, List<Occupation>> entry : map.entrySet()) {
                    if (!hasOccupation(resourceInstance, entry.getKey())) {
                        resourceFacade.addOccupation(resourceInstance.getId(), false, entry.getKey());
                        created++;
                    }
                }
            }

            if (cleanList.size() != occupations.size()) {
                output.append("CLEAN OCCUPATIONS FOR ").append(rd.getLabel()).append(" (from ").append(occupations.size()).append(" to ").append(cleanList.size()).append("; ").append(created).append(" propagated)").append("<br />");
                defaultInstance.setOccupations(cleanList);
            }
        }

        return output.toString();
    }

    private List<Game> findNoDebugTeamGames() {
        EntityManager em = this.getEntityManager();
        final CriteriaBuilder criteriaBuilder = em.getCriteriaBuilder();
        final CriteriaQuery<Game> query = criteriaBuilder.createQuery(Game.class
        );

        Root<Game> e = query.from(Game.class
        );
        query.select(e);

        List<Game> games = em.createQuery(query).getResultList();
        List<Game> noDebugTeamGames = new ArrayList<>();
        for (Game g : games) {
            if (!(g instanceof DebugGame)) {

                List<Team> teams = g.getTeams();
                boolean hasDebugTeam = false;
                for (Team t : teams) {
                    if (t instanceof DebugTeam) {
                        hasDebugTeam = true;
                        break;
                    }
                }
                if (!hasDebugTeam) {
                    noDebugTeamGames.add(g);
                }
            }
        }
        return noDebugTeamGames;
    }

    private Long countOrphans() {
        String sql = "SELECT count(variableinstance) FROM VariableInstance variableinstance WHERE  (variableinstance.playerScopeKey IS NOT NULL AND  variableinstance.playerScopeKey NOT IN (SELECT player.id FROM Player player)) OR (variableinstance.teamScopeKey IS NOT NULL AND variableinstance.teamScopeKey NOT IN (SELECT team.id FROM Team team)) OR (variableinstance.gameScopeKey IS NOT NULL AND variableinstance.gameScopeKey NOT IN (SELECT game.id from Game game))";
        TypedQuery<Long> query = this.getEntityManager().createQuery(sql, Long.class
        );
        return query.getSingleResult();
    }

    private List<VariableInstance> findOrphans() {
        String sql = "SELECT variableinstance FROM VariableInstance variableinstance WHERE  (variableinstance.playerScopeKey IS NOT NULL AND  variableinstance.playerScopeKey NOT IN (SELECT player.id FROM Player player)) OR (variableinstance.teamScopeKey IS NOT NULL AND variableinstance.teamScopeKey NOT IN (SELECT team.id FROM Team team)) OR (variableinstance.gameScopeKey IS NOT NULL AND variableinstance.gameScopeKey NOT IN (SELECT game.id from Game game))";
        TypedQuery<VariableInstance> query = this.getEntityManager().createQuery(sql, VariableInstance.class
        ).setMaxResults(3000);
        return query.getResultList();
    }
    
    
    @POST
    @Path("CreateEmptyModel")
    public String createEmptyModel() {
        GameModel emptyModel = new GameModel();
        emptyModel.setName("_EmptyModel (en)");
        emptyModel.setType(GameModel.GmType.MODEL);

        gameModelFacade.createWithDebugGame(emptyModel);

        return "OK";
    }
    
    @POST
    @Path("CreateEmptyReactModel")
    public String createEmptyReactModel() {
        GameModel emptyModel = new GameModel();
        emptyModel.setName("_EmptyReactModel (en)");
        emptyModel.setType(GameModel.GmType.MODEL);
        emptyModel.setUiversion(2);

        gameModelFacade.createWithDebugGame(emptyModel);

        return "OK";
    }


    @GET
    @Path("CheckAllLiveGameModel")
    public String checkAllGameModels() {
        StringBuilder sb = new StringBuilder();

        List<GameModel> findByTypeAndStatus = gameModelFacade.findByTypeAndStatus(GameModel.GmType.SCENARIO, GameModel.Status.LIVE);
        sb.append("<ul>");
        for (GameModel gm : findByTypeAndStatus) {
            logger.error("CHECK {}", gm);
            Exception validate = gameModelCheck.validate(gm);
            sb.append("<li>");
            sb.append(gm.getName()).append(';').append(gm.getId()).append(';');
            if (validate != null) {
                logger.error(" FAILURE");
                sb.append(validate);
            } else {
                sb.append("OK");
            }
            sb.append("</li>");
        }
        sb.append("</ul>");

        return sb.toString();
    }

    private List<Long> getIdsFromString(String ids) {
        List<Long> scenarioIds = new ArrayList<>();

        for (String id : ids.split(",")) {
            scenarioIds.add(Long.parseLong(id));
        }

        return scenarioIds;
    }

    @GET
    @Path("CheckSomeGameModel/{ids}")
    public String checkSomeGameModels(@PathParam("ids") String ids) {
        StringBuilder sb = new StringBuilder();

        List<Long> idsFromString = getIdsFromString(ids);

        sb.append("<ul>");
        for (Long gmId : idsFromString) {
            GameModel gm = gameModelFacade.find(gmId);

            logger.error("CHECK {}", gm);
            Exception validate = gameModelCheck.validate(gm);
            sb.append("<li>");
            sb.append(gm.getName()).append(';').append(gm.getId()).append(';');
            if (validate != null) {
                logger.error(" FAILURE");
                sb.append(validate);
            } else {
                sb.append("OK");
            }
            sb.append("</li>");
        }
        sb.append("</ul>");

        return sb.toString();
    }

    @GET
    @Path("ImportLanguages/{targetGmId : ([1-9][0-9]*)}/{sourceGmId : ([1-9][0-9]*)}/{langToCopy}/{refLang}")
    public String importLanguages(@PathParam("targetGmId") Long targetgmId,
        @PathParam("sourceGmId") Long srcGmId,
        @PathParam("langToCopy") String codeToCopy,
        @PathParam("refLang") String codeRef) {

        GameModel target = gameModelFacade.find(targetgmId);
        GameModel source = gameModelFacade.find(srcGmId);

        if (target != null && source != null) {
            GameModelLanguage targetLang = target.getLanguageByCode(codeToCopy);
            if (targetLang != null) {
                GameModelLanguage sourceLang = source.getLanguageByCode(codeToCopy);
                if (sourceLang != null) {
                    MergeHelper.visitMergeable(target, Boolean.TRUE,
                        new ImportTranslationsVisitor(codeRef, codeToCopy), source);
                    return "Done";
                } else {
                    return "Source does not contains the lang to copy !";
                }
            } else {
                return "Please create the lang in the target !";
            }
        } else {
            return "Gamemodels not found";
        }
    }

    private void appendInTag(StringBuilder sb, String tag, Object... args) {
        sb.append('<').append(tag).append('>');
        for (Object arg : args) {
            sb.append(arg);
        }
        sb.append("</").append(tag).append('>');
    }

    @GET
    @Path("DestroyInstance/{instanceId : ([1-9][0-9]*)}")
    public String destroyInstance(@PathParam("instanceId") Long id) {
        VariableInstance instance = variableInstanceFacade.find(id);
        this.getEntityManager().remove(instance);
        return "OK";
    }

    private Map<GameModel, Map<VariableDescriptor, List<VariableInstance>>> findDuplicates() {
        String sql = "select array_agg(id) from variableinstance "
            + "where coalesce(player_id, team_id, gamemodel_id) IS NOT null "
            + "group by player_id, playerscope_id, team_id, teamscope_id, gamemodel_id, gamemodelscope_id  "
            + "having count (*) > 1";

        EntityManager em = this.getEntityManager();
        Query query = em.createNativeQuery(sql);

        Map<GameModel, Map<VariableDescriptor, List<VariableInstance>>> map = new HashMap<>();

        List resultList = query.getResultList();
        for (Object result : resultList) {
            Long[] list = (Long[]) result;
            for (Long viId : list) {
                VariableInstance vi = variableInstanceFacade.find(viId);
                VariableDescriptor descriptor = vi.getDescriptor();
                GameModel gameModel = descriptor.getGameModel();
                map.putIfAbsent(gameModel, new HashMap<>());

                Map<VariableDescriptor, List<VariableInstance>> vdMap = map.get(gameModel);
                vdMap.putIfAbsent(descriptor, new ArrayList<>());
                List<VariableInstance> instanceList = vdMap.get(descriptor);
                instanceList.add(vi);
            }
        }
        return map;
    }

    @GET
    @Path("AutoFixDuplicates")
    public String fixDuplicates() {
        Map<GameModel, Map<VariableDescriptor, List<VariableInstance>>> map = findDuplicates();
        EntityManager em = getEntityManager();

        for (Map<VariableDescriptor, List<VariableInstance>> descs : map.values()) {
            for (Entry<VariableDescriptor, List<VariableInstance>> vdEntry : descs.entrySet()) {
                VariableDescriptor vd = vdEntry.getKey();

                Object defaultValue = getValue(vd.getDefaultInstance());

                List<VariableInstance> instances = vdEntry.getValue();
                if (instances.size() > 1) {
                    if (vd instanceof ListDescriptor) {
                        VariableInstance instance = instances.get(0);
                        em.remove(instance);
                    } else {
                        for (VariableInstance instance : instances) {
                            Object value = getValue(instance);
                            if (defaultValue != null && defaultValue.equals(value)) {
                                // remove the first instance which match the default instance
                                em.remove(instance);
                                // Only ONE!
                                break;
                            }
                        }
                    }
                }
            }
        }

        return "OK";
    }

    @GET
    @Path("ListDuplicates")
    public String listDuplicates() {
        Map<GameModel, Map<VariableDescriptor, List<VariableInstance>>> map = findDuplicates();

        StringBuilder sb = new StringBuilder();

        for (Entry<GameModel, Map<VariableDescriptor, List<VariableInstance>>> gmEntry : map.entrySet()) {
            GameModel gm = gmEntry.getKey();
            Map<VariableDescriptor, List<VariableInstance>> descs = gmEntry.getValue();
            appendInTag(sb, "H3", "GameModel ", gm.getName(), " (", gm.getId(), ")");

            for (Entry<VariableDescriptor, List<VariableInstance>> vdEntry : descs.entrySet()) {
                VariableDescriptor vd = vdEntry.getKey();
                List<VariableInstance> instances = vdEntry.getValue();
                appendInTag(sb, "h4", "Variable ",
                    vd.getLabel().translateOrEmpty(gm),
                    " (", vd.getId(), ",", vd.getJSONClassName(), ")");
                appendValue(sb, "default value", vd.getDefaultInstance());
                for (VariableInstance vi : instances) {
                    appendInTag(sb, "div", vi.getId(), ", ", vi.getOwner());
                    appendInTag(sb, "div", "<a target='_blank' href=\"DestroyInstance/", vi.getId(),
                        "\">Destroy it !</a>");
                    appendValue(sb, "value", vi);
                }
            }
        }

        return sb.toString();
    }

    private Object getValue(VariableInstance vi) {
        Object value = null;
        if (vi instanceof TextInstance) {
            Player p = vi.getEffectiveOwner().getAnyLivePlayer();
            value = ((TextInstance) vi).getTrValue().translateOrEmpty(p);
        } else if (vi instanceof StringInstance) {
            Player p = vi.getEffectiveOwner().getAnyLivePlayer();
            value = ((StringInstance) vi).getTrValue().translateOrEmpty(p);
        } else if (vi instanceof NumberInstance) {
            value = ((NumberInstance) vi).getValue();
        } else if (vi instanceof BooleanInstance) {
            value = ((BooleanInstance) vi).getValue();
        } else if (vi instanceof InboxInstance) {
            value = ((InboxInstance) vi).getMessages().size();
        } else if (vi instanceof QuestionInstance) {
            QuestionInstance qi = (QuestionInstance) vi;
            value = qi.getActive() + ";" + qi.isValidated();
        } else if (vi instanceof ChoiceInstance) {
            value = ((ChoiceInstance) vi).getReplies().size();
        } else if (vi instanceof StateMachineInstance) {
            value = ((StateMachineInstance) vi).getTransitionHistory();
        } else if (vi instanceof PeerReviewInstance) {
            value = ((PeerReviewInstance) vi).getReviewState();
        } else if (vi instanceof ObjectInstance) {
            ObjectInstance oi = (ObjectInstance) vi;
            Map<String, String> properties = oi.getProperties();
            List<String> keys = new ArrayList<>(properties.keySet());
            Collections.sort(keys);
            value = "";
            for (String key : keys) {
                value += key + "=" + properties.get(key) + ";<br/>";
            }
        }

        return value;
    }

    private void appendValue(StringBuilder sb, String label, VariableInstance vi) {
        Object value = this.getValue(vi);
        if (value != null) {
            appendInTag(sb, "div", label, ": ", value);
        }
    }

    private List<GameModel> findMbenefits(boolean scenarioOnly) {
        EntityManager em = this.getEntityManager();
        final CriteriaBuilder criteriaBuilder = em.getCriteriaBuilder();
        final CriteriaQuery<GameModel> query = criteriaBuilder.createQuery(GameModel.class);

        Root<GameModel> e = query.from(GameModel.class);
        Predicate where;

        String cssUri = "wegas-mbenefits/js/wegas-benefits-clientlib.js;wegas-mbenefits/js/wegas-benefits-loader.js;";

        if (scenarioOnly) {
            where = criteriaBuilder.and(
                criteriaBuilder.equal(e.get("type"), GameModel.GmType.SCENARIO),
                criteriaBuilder.like(e.get("properties").get("clientScriptUri"), cssUri)
            );
        } else {
            where = criteriaBuilder.like(e.get("properties").get("clientScriptUri"), cssUri);
        }

        query.select(e)
            .where(where);

        return em.createQuery(query).getResultList();
    }

    private void patchPatch(Map<String, JsonNode> pages, String pageId, String replace, String with) {
        JsonNode page = pages.get(pageId);
        if (page != null) {
            try {
                String json = page.toString();
                String patchedJson = json.replace(replace, with);
                ObjectMapper mapper = JacksonMapperProvider.getMapper();
                JsonNode patchedPage;
                patchedPage = mapper.readTree(patchedJson);
                pages.put(pageId, patchedPage);
            } catch (JsonProcessingException ex) {
                logger.error("Fail to patch page");
            }
        }
    }

    @GET
    @Path("MBPatch")
    public String patchMBenefits() {
        List<GameModel> gms = findMbenefits(false);
        for (GameModel gm : gms) {
            Map<String, JsonNode> pages = gm.getPages();

            String docAirId = "18";
            String oldDocAir = "var docNode = Y.one(\\\".theDoc.pasteurisationProcess\\\");\\ndocNode.toggleClass(\\\"show-eem1-clues\\\");\\n\\ndocNode.all(\\\".wegas-line\\\").each(function(node){\\n    Y.Widget.getByNode(node).syncUI();\\n})\\n\\nreturn;";
            String newDocAir = "Y.Wegas.MBenefitsHelper.toggleEEMInDiagram(\\\".theDoc.pasteurisationProcess\\\",  \\\"show-eem1-clues\\\");";
            patchPatch(pages, docAirId, oldDocAir, newDocAir);

            String docPastId = "13";
            patchPatch(pages, docPastId,
                "var docNode = Y.one(\\\".theDoc.pasteurisationProcess\\\");\\ndocNode.toggleClass(\\\"show-eem3-clues\\\");\\n\\ndocNode.all(\\\".wegas-line\\\").each(function(node){\\n    Y.Widget.getByNode(node).syncUI();\\n})\\n\\nreturn;",
                "Y.Wegas.MBenefitsHelper.toggleEEMInDiagram(\\\".theDoc.pasteurisationProcess\\\",  \\\"show-eem3-clues\\\");");
            patchPatch(pages, docPastId,
                "var docNode = Y.one(\\\".theDoc.pasteurisationProcess\\\");\\ndocNode.toggleClass(\\\"show-eem4-clues\\\");\\n\\ndocNode.all(\\\".wegas-line\\\").each(function(node){\\n    Y.Widget.getByNode(node).syncUI();\\n})\\n\\nreturn;",
                "Y.Wegas.MBenefitsHelper.toggleEEMInDiagram(\\\".theDoc.pasteurisationProcess\\\",  \\\"show-eem4-clues\\\");");
            patchPatch(pages, docPastId,
                "var docNode = Y.one(\\\".theDoc.pasteurisationProcess\\\");\\ndocNode.toggleClass(\\\"show-eem5-clues\\\");\\n\\ndocNode.all(\\\".wegas-line\\\").each(function(node){\\n    Y.Widget.getByNode(node).syncUI();\\n})\\n\\nreturn;",
                "Y.Wegas.MBenefitsHelper.toggleEEMInDiagram(\\\".theDoc.pasteurisationProcess\\\",  \\\"show-eem5-clues\\\");");

            String docSaucesId = "11";
            patchPatch(pages, docSaucesId,
                "var docNode = Y.one(\\\".theDoc.pasteurisationProcess\\\");\\ndocNode.toggleClass(\\\"show-eem2-clues\\\");\\n\\ndocNode.all(\\\".wegas-line\\\").each(function(node){\\n    Y.Widget.getByNode(node).syncUI();\\n})\\n\\nreturn;",
                "Y.Wegas.MBenefitsHelper.toggleEEMInDiagram(\\\".theDoc.pasteurisationProcess\\\",  \\\"show-eem2-clues\\\");");

            String docLightsId = "14";
            patchPatch(pages, docLightsId, "var docNode = Y.one(\\\".theDoc.pasteurisationProcess\\\");\\ndocNode.toggleClass(\\\"show-eem6-clues\\\");\\n\\ndocNode.all(\\\".wegas-line\\\").each(function(node){\\n    Y.Widget.getByNode(node).syncUI();\\n})\\n\\nreturn;",
                "Y.Wegas.MBenefitsHelper.toggleEEMInDiagram(\\\".theDoc.pasteurisationProcess\\\",  \\\"show-eem6-clues\\\");");


            gm.setPages(pages);

        }
        return "DONE";
    }

}
