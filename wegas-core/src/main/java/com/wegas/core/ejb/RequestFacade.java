
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.ActAsPlayer;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.Set;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.persistence.EntityManager;
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
    @Inject
    private PlayerFacade playerFacade;
    /**
     *
     */
    @Inject
    private StateMachineFacade stateMachineFacade;

    /**
     *
     * @Inject private Event<PlayerAction> playerActionEvent;
     */
    /**
     * @return the variableInstanceManager
     */
    public RequestManager getRequestManager() {
        return requestManager;
    }

    public void clearEntities() {
        this.requestManager.clearEntities();
    }

    public User getCurrentUser() {
        return requestManager.getCurrentUser();
    }

    /**
     *
     * @param view
     *
     */
    public void setView(Class view) {
        this.requestManager.setView(view);
    }

    /**
     *
     * @return current request view
     *
     */
    public Class getView() {
        return this.requestManager.getView();
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

    /**
     *
     * @param player
     */
    public void commit(Player player) {
        if (!requestManager.isTestEnv()) {
            try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
                /*
             * Flush is required to triggered EntityListener's lifecycles events which populate
             * requestManager touched (deleted, updated and so on) entities
                 */
                EntityManager em = requestManager.getEntityManager();

                requestManager.getEntityManager().flush();

                if (requestManager.getUpdatedEntities().size() > 0 || scriptEvent.isEventFired()) {
                    stateMachineFacade.runStateMachines(player);
                }
            }
        }
    }

    /**
     *
     * @param playerId
     */
    public void commit(Long playerId) {
        this.commit(playerFacade.find(playerId));
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
     *
     * @return the bundle which match the name
     */
    public ResourceBundle getBundle(String name) {
        return this.requestManager.getBundle(name);
    }

    /**
     *
     * @return all entities which were updated during the transaction
     */
    public Set<AbstractEntity> getUpdatedEntities() {
        return requestManager.getUpdatedEntities();
    }

    /*
     *
     * @return all entities which were destroyed during the transaction
     */
    public Set<AbstractEntity> getDestroyedEntities() {
        return requestManager.getDestroyedEntities();
    }

    /**
     * Not sure it's deprecated... should test...
     *
     * @deprecated
     */
    @Deprecated
    public void flushClear() {
        requestManager.getEntityManager().flush();
        requestManager.clear();
    }
}
