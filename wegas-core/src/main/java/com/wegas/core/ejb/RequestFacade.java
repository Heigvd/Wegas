/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.event.PlayerAction;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.List;
import java.util.Locale;
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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
     */
    public void setView(Class view) {
        this.requestManager.setView(view);
    }

    /**
     *
     * @return
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
     * @return
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
     */
    public void commit() {
        em.flush();
        if (this.getUpdatedInstances().size() > 0) {

            if (this.getPlayer() != null) {
                // RequestManager.PlayerAction action = new RequestManager.PlayerAction();
                //action.setPlayer(this.getPlayer());
                //playerActionEvent.fire(action);

                playerActionEvent.fire(new PlayerAction(this.getPlayer()));
                //stateMachineRunner.playerUpdated(this.requestManager.getPlayer());

            } else {
                //stateMachineRunner.playerUpdated(null);
                playerActionEvent.fire(new PlayerAction(this.getPlayer()));
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
            }
            em.flush();
        }
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
     * @return
     */
    public List<VariableInstance> getUpdatedInstances() {
        return requestManager.getUpdatedInstances();
    }
}
