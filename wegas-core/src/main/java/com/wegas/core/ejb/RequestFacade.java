/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.ejb.statemachine.StateMachineRunner;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
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
    @EJB
    StateMachineRunner stateMachineRunner;

    /**
     * @return the variableInstanceManager
     */
    public RequestManager getRequestManager() {
        return requestManager;
    }

    public void setView(Class view) {
        this.requestManager.setView(view);
    }

    public Class getView() {
        return this.requestManager.getView();
    }

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

    public static RequestFacade lookup() {
        try {
            return Helper.lookupBy(RequestFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving requestmanager", ex);
            return null;
        }
    }

    public void commit() {
        em.flush();
        if (this.getUpdatedInstances().size() > 0) {

            if (this.getPlayer() != null) {
                // RequestManager.PlayerAction action = new RequestManager.PlayerAction();
                //action.setPlayer(this.getPlayer());
                //playerActionEvent.fire(action);
                stateMachineRunner.playerUpdated(this.requestManager.getPlayer());

            } else {

                //PlayerAction action = new PlayerAction();
                //playerActionEvent.fire(action);

                stateMachineRunner.playerUpdated(null);
//                for (VariableInstance instance : this.getUpdatedInstances()) {
//                    System.out.println(variableInstanceFacade.findAPlayer(instance) + ", ");
//
//                    Player p = variableInstanceFacade.findAPlayer(instance);
//                    List<Player> players = variableInstanceFacade.findAllPlayer(instance);
//
//                    System.out.println("This player has an update: " + p.getName());
//
//                    //PlayerAction action = new PlayerAction();
//                    //action.setPlayer(variableInstanceFacade.findAPlayer(instance));
//                    //playerActionEvent.fire(action);
//                }
                //  PlayerAction action = new PlayerAction();
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
     * @param local the local to set
     */
    public void setLocale(Locale locale) {
        this.requestManager.setLocale(locale);
    }

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
