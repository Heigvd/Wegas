/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.event.internal.PlayerAction;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.ResourceBundle;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class RequestFacade {

    private static final Logger logger = LoggerFactory.getLogger(RequestFacade.class);
    /**
     *
     */
    @Inject
    private RequestManager requestManager;
    /**
     *
     */
    @Inject
    private ScriptEventFacade scriptEvent;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    StateMachineFacade stateMachineRunner;
    /**
     *
     */
    @Inject
    private Event<PlayerAction> playerActionEvent;

    /**
     * @return the variableInstanceManager
     */
    public RequestManager getRequestManager() {
        return requestManager;
    }

    /**
     *
     * @param view
     * @deprecated
     */
    public void setView(Class view) {
        this.requestManager.setView(view);
    }

    /**
     *
     * @return current request view
     * @deprecated
     */
    public Class getView() {
        return this.requestManager.getView();
    }

    /**
     *
     * @param playerId
     */
    public void setPlayer(Long playerId) {
        Player p = playerFacade.find(playerId);
        //playerFacade.getEntityManager().detach(p);
        this.requestManager.setPlayer(p);
    }

    /**
     *
     * @return The player associated with the current request, if any.
     */
    public Player getPlayer() {
        return this.requestManager.getPlayer();
    }

    /**
     *
     * @return Looked-up EJB
     */
    public static RequestFacade lookup() {
        try {
            return Helper.lookupBy(RequestFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving requestmanager", ex);
            return null;
        }
    }

//    public void reset() {
//        this.getUpdatedInstances().clear();
//    }
    /**
     *
     * @param player
     */
    public void commit(Player player) {
        em.flush();
        if (requestManager.getUpdatedEntities().size() > 0 || scriptEvent.isEventFired()) {
            playerActionEvent.fire(new PlayerAction(player));
            /*   if (this.getPlayer() != null) {
             // RequestManager.PlayerAction action = new RequestManager.PlayerAction();
             //action.setPlayer(this.getPlayer());
             //playerActionEvent.fire(action);

             playerActionEvent.fire(new PlayerAction(player));
             //stateMachineRunner.playerUpdated(this.requestManager.getPlayer());

             } else {
             //stateMachineRunner.playerUpdated(null);
             playerActionEvent.fire(new PlayerAction(player));
             //PlayerAction action = new PlayerAction();
             //playerActionEvent.fire(action);

             // for (VariableInstance instance : this.getUpdatedInstances()) {
             // System.out.println(variableInstanceFacade.findAPlayer(instance) + ", ");
             //
             // Player p = variableInstanceFacade.findAPlayer(instance);
             // List<Player> players = variableInstanceFacade.findAllPlayer(instance);
             //
             // System.out.println("This player has an update: " + p.getName());
             //
             // //PlayerAction action = new PlayerAction();
             // //action.setPlayer(variableInstanceFacade.findAPlayer(instance));
             // //playerActionEvent.fire(action);
             // }
             // PlayerAction action = new PlayerAction();
             // playerActionEvent.fire(action);
             }*/
            em.flush();
        }
    }

    /**
     *
     */
    public void commit() {
        this.commit(this.getPlayer());
    }

    /**
     * @return the local
     */
    public Locale getLocale() {
        return this.requestManager.getLocale();
    }

    /**
     * @param locale
     */
    public void setLocale(Locale locale) {
        this.requestManager.setLocale(locale);
    }

    /**
     *
     * @param name
     * @return
     */
    public ResourceBundle getBundle(String name) {
        return this.requestManager.getBundle(name);
    }

    /**
     *
     * @return all entities which were updated during the transaction
     */
    public Map<String, List<AbstractEntity>> getUpdatedEntities() {
        return requestManager.getUpdatedEntities();
    }

    /**
     * An outdated entity in an entity we know clients do not have the last
     * version and we can not figure out how to send them the updated one
     *
     * @return all entities marked as outdated during the transaction
     */
    public Map<String, List<AbstractEntity>> getOutdatedEntities() {
        return requestManager.getOutdatedEntities();
    }

    /*
     *
     * @return all entities which were destroyed during the transaction
     */
    public Map<String, List<AbstractEntity>> getDestroyedEntities() {
        return requestManager.getDestroyedEntities();
    }
}
