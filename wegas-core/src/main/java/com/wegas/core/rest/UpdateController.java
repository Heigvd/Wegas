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
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.*;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.Result;
import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Level;
import javax.inject.Inject;
import javax.persistence.Query;
import org.eclipse.persistence.config.CacheUsage;
import org.eclipse.persistence.config.QueryHints;
import org.eclipse.persistence.config.QueryType;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
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

    @Inject
    ResourceFacade resourceFacade;

    @Inject
    RequestManager requestManager;

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
        return "<a href=\"RtsUpdateScope/10901\">RTS Update Scopes</a> <br />"
                + "<a href=\"RtsNewScope/10901\">RTS New Scopes</a> <br />";
    }

    /**
     * Retrieve
     *
     * @param gameModelId
     * @return static "Finished" string...
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
     * @param gameModelId
     * @return static "Finished" string...
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

    private List<GameModel> findPMGs(boolean scenarioOnly) {
        EntityManager em = this.getEntityManager();
        final CriteriaBuilder criteriaBuilder = em.getCriteriaBuilder();
        final CriteriaQuery<GameModel> query = criteriaBuilder.createQuery(GameModel.class);

        Root<GameModel> e = query.from(GameModel.class);
        Predicate where;

        if (scenarioOnly) {
            where = criteriaBuilder.and(
                    criteriaBuilder.equal(e.get("template"), true),
                    criteriaBuilder.like(e.get("properties").get("clientScriptUri"), "wegas-pmg/js/wegas-pmg-loader.js%")
            );
        } else {
            where = criteriaBuilder.like(e.get("properties").get("clientScriptUri"), "wegas-pmg/js/wegas-pmg-loader.js%");
        }

        query.select(e)
                .where(where);

        return em.createQuery(query).getResultList();
    }

    private void updateScope(VariableDescriptor vd) {
        if (!(vd.getScope() instanceof GameModelScope)) {
            EntityManager em = this.getEntityManager();

            Collection<VariableInstance> values = vd.getScope().getVariableInstancesByKeyId().values();
            for (VariableInstance vi : values) {
                em.remove(vi);
            }
            GameModelScope scope = new GameModelScope();
            scope.setBroadcastScope("GameScope");
            scope.setVariableDescscriptor(vd);
            vd.setScope(scope);
            em.persist(vd);
            vd.propagateDefaultInstance(null, true);
        }
    }

    private String listDescriptorScope(GameModel gameModel) {
        List<VariableDescriptor> variableDescriptors = gameModel.getVariableDescriptors();
        StringBuilder sb = new StringBuilder();
        sb.append("[");

        for (VariableDescriptor vd : variableDescriptors) {
            if (vd instanceof ListDescriptor) {
                this.updateScope(vd);
            }
        }
        sb.append("]");

        return sb.toString();
    }

    @GET
    @Path("ListDescriptorScope/{gameModelId : ([1-9][0-9]*)}")
    public String listDUpdate(@PathParam("gameModelId") Long gameModelId) {
        GameModel find = gameModelFacade.find(gameModelId);
        return listDescriptorScope(find);
    }

    private String rtsUpdateScope(GameModel gameModel) {
        List<VariableDescriptor> variableDescriptors = gameModel.getVariableDescriptors();
        StringBuilder sb = new StringBuilder();
        sb.append("[");

        for (VariableDescriptor vd : variableDescriptors) {

            if ("question".equals(vd.getLabel().toLowerCase())) {
                this.updateScope(vd);
            } else if ("toolbar".equals(vd.getLabel().toLowerCase())
                    || "moves".equals(vd.getLabel().toLowerCase())
                    || "dialogues".equals(vd.getLabel().toLowerCase())) {
                if (vd instanceof ListDescriptor) {
                    ListDescriptor list = (ListDescriptor) vd;
                    for (VariableDescriptor child : list.getItems()) {
                        if (child instanceof StringDescriptor) {
                            this.updateScope(child);
                        }
                    }
                }
            }
        }
        sb.append("]");

        return sb.toString();
    }

    private void updateListDescriptorScope(GameModel gameModel) {
        List<VariableDescriptor> variableDescriptors = gameModel.getVariableDescriptors();

        for (VariableDescriptor vd : variableDescriptors) {
            if (vd instanceof ListDescriptor) {
                this.updateScope(vd);
            }
        }

    }

    private String lawUpdateScope(GameModel gameModel) {
        this.updateListDescriptorScope(gameModel);
        StringBuilder sb = new StringBuilder();
        try {
            sb.append("[");

            ListDescriptor etapes = (ListDescriptor) VariableDescriptorFacade.lookup().find(gameModel, "etapes");
            for (VariableDescriptor item : etapes.getItems()) {
                this.updateScope(item);
            }

            sb.append("]");

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

    @GET
    @Path("RtsUpdateScope/{gameModelId : ([1-9][0-9]*)}")
    public String rtsScopeUpdate(@PathParam("gameModelId") Long gameModelId) {
        GameModel find = gameModelFacade.find(gameModelId);
        return rtsUpdateScope(find);
    }

    private String newScope(GameModel gameModel, VariableDescriptor vd) {
        StringBuilder sb = new StringBuilder();
        try {
            descriptorFacade.detach(vd);
            String name = vd.getName();
            String parentName = vd.getParentList().getName();

            GameModelScope scope = new GameModelScope();
            scope.setBroadcastScope("GameScope");
            vd.setScope(scope);
            String json = vd.toJson(Views.Export.class);
            logger.error("JSON for " + parentName + "/" + name + " variable: " + json);

            descriptorFacade.remove(vd.getId());
            descriptorFacade.flush();

            logger.error("REMOVED");

            sb.append("NAME: ").append(name).append(" -> ").append(this.addVariable(gameModel, json, name, parentName));

        } catch (IOException ex) {
            java.util.logging.Logger.getLogger(UpdateController.class.getName()).log(Level.SEVERE, null, ex);
        }
        return sb.toString();
    }

    private String rtsNewScope(GameModel gameModel) {
        List<VariableDescriptor> variableDescriptors = gameModel.getVariableDescriptors();
        StringBuilder sb = new StringBuilder();
        sb.append("[");

        for (Iterator<VariableDescriptor> it = variableDescriptors.iterator(); it.hasNext();) {
            VariableDescriptor vd = it.next();
            if ("question".equals(vd.getLabel().toLowerCase())) {
                if (!(vd.getScope() instanceof GameModelScope)) {
                    sb.append(this.newScope(gameModel, vd));
                }
            } else if ("toolbar".equals(vd.getLabel().toLowerCase())
                    || "moves".equals(vd.getLabel().toLowerCase())
                    || "dialogues".equals(vd.getLabel().toLowerCase())) {
                if (vd instanceof ListDescriptor) {
                    ListDescriptor list = (ListDescriptor) vd;
                    for (VariableDescriptor child : list.getItems()) {
                        if (child instanceof StringDescriptor) {
                            sb.append(this.newScope(gameModel, child));
                        }
                    }
                }
            }
        }
        sb.append("]");

        return sb.toString();
    }

    @GET
    @Path("RtsNewScope/{gameModelId : ([1-9][0-9]*)}")
    public String rtsNewScope(@PathParam("gameModelId") Long gameModelId) {
        GameModel find = gameModelFacade.find(gameModelId);
        return rtsNewScope(find);
    }

    private String addVariable(GameModel gm, String json, String varName, String parentName) {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        logger.error("Going to add " + parentName + "/" + varName + " variable");

        try {
            // Does the variable already exists ? 
            descriptorFacade.find(gm, varName);
            logger.error("  -> variable " + varName + " exists : SKIP");
            return "already exists";
        } catch (WegasNoResultException ex) {
            logger.error("  -> variable " + varName + " not found : PROCEED");
        }

        try {
            // assert the parent already exists ? 
            descriptorFacade.find(gm, parentName);
            logger.error("  -> variable " + parentName + " exists : PROCEED");
        } catch (WegasNoResultException ex) {
            logger.error("  -> variable " + parentName + " not found : FAILED");
            return "parent not found";
        }
        try {
            VariableDescriptor vd = mapper.readValue(json, VariableDescriptor.class);
            descriptorController.createChild(gm.getId(), parentName, vd);
            descriptorFacade.flush();
            return "OK";
        } catch (WegasNotFoundException ex) {
            logger.error("Error white adding the variable : parent " + parentName + " not found", ex);
            return "Parent (2) not found";
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
        List<GameModel> PMGs = this.findPMGs(false);
        StringBuilder ret = new StringBuilder();
        String status;

        ret.append("<ul>");

        for (GameModel pmg : PMGs) {
            ret.append("<li>");
            ret.append(pmg.getName());
            ret.append("/");
            ret.append(pmg.getId());
            status = addVariable(pmg, "{\"@class\":\"BooleanDescriptor\",\"comments\":\"\",\"defaultInstance\":{\"@class\":\"BooleanInstance\",\"value\":false},\"label\":\"burndownEnabled\",\"scope\":{\"@class\":\"GameScope\",\"broadcastScope\":\"TeamScope\"},\"title\":null,\"name\":\"burndownEnabled\"}", "burndownEnabled", "properties");
            ret.append(" burndownEnabled: ");
            ret.append(status);

            ret.append("</li>");

            ret.append("<li>");
            ret.append(pmg.getName());
            ret.append("/");
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
            logger.error("Remove instance: " + vi.getId());
            String descName;
            if (vi.getScope() != null) {
                descName = vi.getDescriptor().getName();
            } else {
                descName = "NOPE";
            }
            logger.error("    DESC: " + descName);
            em.remove(vi);

            if (++counter == 3000) {
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
            logger.error("Restore Game: " + g.getName() + "/" + g.getId());
            DebugTeam dt = new DebugTeam();
            g.addTeam(dt);
            this.getEntityManager().persist(dt);
            g.getGameModel().propagateDefaultInstance(dt, true);
            this.getEntityManager().flush();
            if (++counter == 25) {
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
        TypedQuery<ResourceDescriptor> allRd = this.getEntityManager().createQuery(sqlRD, ResourceDescriptor.class);
        StringBuilder output = new StringBuilder();

        for (ResourceDescriptor rd : allRd.getResultList()) {
            ResourceInstance defaultInstance = rd.getDefaultInstance();
            List<Occupation> occupations = defaultInstance.getOccupations();

            HashMap<Long, List<Occupation>> map = new HashMap<>();
            List<Occupation> cleanList = new ArrayList<>();

            for (Occupation occ : occupations) {
                Long key = ((Double) occ.getTime()).longValue();
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
            Collection<ResourceInstance> resourceInstances = rd.getScope().getPrivateInstances().values();
            for (ResourceInstance resourceInstance : resourceInstances) {
                for (Entry<Long, List<Occupation>> entry : map.entrySet()) {
                    if (!hasOccupation(resourceInstance, entry.getKey().doubleValue())) {
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
        final CriteriaQuery<Game> query = criteriaBuilder.createQuery(Game.class);

        Root<Game> e = query.from(Game.class);
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

    @GET
    @Path("Duplicata")
    public String getDuplicata() {
        return this.deleteDuplicata();
    }

    private String deleteDuplicata() {

        StringBuilder sb = new StringBuilder();

        String sql = "SELECT vi.gameScope, vi.game FROM VariableInstance vi WHERE vi.gameScope IS NOT NULL GROUP BY vi.gameScope.id, vi.game.id HAVING count(vi) > 1";
        Query createQuery = this.getEntityManager().createQuery(sql);

        List resultList = createQuery.getResultList();
        int i = 0;
        for (Object o : resultList) {
            Object[] array = (Object[]) o;
            GameScope scope = (GameScope) array[0];
            Game game = (Game) array[1];
            //VariableInstance variableInstance = scope.getVariableInstance(game);
            //System.out.println("DELETE: " + variableInstance);

            sb.append("DELETE: ");
            sb.append(i++);
            sb.append(". ");

            String sql2 = "SELECT vi from VariableInstance vi WHERE vi.gameScope.id = :scopeId and vi.game.id = :gameId";

            TypedQuery<VariableInstance> query2 = this.getEntityManager().createQuery(sql2, VariableInstance.class);
            query2.setHint(QueryHints.CACHE_USAGE, CacheUsage.DoNotCheckCache);
            //@QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.CheckCacheThenDatabase)

            query2.setParameter("scopeId", scope.getId());
            query2.setParameter("gameId", game.getId());

            List<VariableInstance> list = query2.getResultList();

            sb.append(list.get(0));
            sb.append(" SCOPE - TEAM " + scope.getId() + "   " + game.getId());

            sb.append(("<br />"));

            if (list.size() != 2) {
                sb.append("   -> NOT 2 but " + list.size());
            } else {

                VariableInstance get = list.get(0);
                VariableInstance get2 = list.get(1);
                if (get instanceof BooleanInstance) {
                    if (((BooleanInstance) get).getValue() != ((BooleanInstance) get2).getValue()) {
                        sb.append(("   -> NOT EQUALS"));
                    } else {
                        this.getEntityManager().remove(get2);
                    }
                } else if (get instanceof NumberInstance) {
                    if (((NumberInstance) get).getValue() != ((NumberInstance) get2).getValue()) {
                        sb.append(("   -> NOT EQUALS"));
                    } else {
                        this.getEntityManager().remove(get2);
                    }
                } else if (get instanceof StringInstance) {
                    if (!((StringInstance) get).getValue().equals(((StringInstance) get2).getValue())) {
                        sb.append(("   -> NOT EQUALS"));
                    } else {
                        this.getEntityManager().remove(get2);
                    }
                }

            }
            sb.append(("<br />"));
        }
        return sb.toString();
    }

    private Long countOrphans() {
        String sql = "SELECT count(variableinstance) FROM VariableInstance variableinstance WHERE  (variableinstance.playerScopeKey IS NOT NULL AND  variableinstance.playerScopeKey NOT IN (SELECT player.id FROM Player player)) OR (variableinstance.teamScopeKey IS NOT NULL AND variableinstance.teamScopeKey NOT IN (SELECT team.id FROM Team team)) OR (variableinstance.gameScopeKey IS NOT NULL AND variableinstance.gameScopeKey NOT IN (SELECT game.id from Game game))";
        TypedQuery<Long> query = this.getEntityManager().createQuery(sql, Long.class);
        return query.getSingleResult();
    }

    private List<VariableInstance> findOrphans() {
        String sql = "SELECT variableinstance FROM VariableInstance variableinstance WHERE  (variableinstance.playerScopeKey IS NOT NULL AND  variableinstance.playerScopeKey NOT IN (SELECT player.id FROM Player player)) OR (variableinstance.teamScopeKey IS NOT NULL AND variableinstance.teamScopeKey NOT IN (SELECT team.id FROM Team team)) OR (variableinstance.gameScopeKey IS NOT NULL AND variableinstance.gameScopeKey NOT IN (SELECT game.id from Game game))";
        TypedQuery<VariableInstance> query = this.getEntityManager().createQuery(sql, VariableInstance.class).setMaxResults(3000);
        return query.getResultList();
    }
}
