/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;
import javax.persistence.PreRemove;
import java.util.List;
import java.util.Map;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class EntityListener {

    private static final Logger logger = LoggerFactory.getLogger(EntityListener.class);

    @Inject
    private RequestManager requestManager;

    @PostPersist
    void onPostPersist(Object o) {
        if (o instanceof Broadcastable) {
            Broadcastable b = (Broadcastable) o;
            Map<String, List<AbstractEntity>> entities = b.getEntities();
            if (b instanceof Team || b instanceof Player || b instanceof VariableInstance) {
                requestManager.addUpdatedEntities(entities);
            } else {
                logger.debug("Unhandled new broadcastable entity: " + b);
            }
        }
    }

    @PostUpdate
    void onPostUpdate(Object o) {
        if (o instanceof Broadcastable) {
            Broadcastable b = (Broadcastable) o;
            if (b instanceof GameModel) {
                /* Since a serialized gameModel differs according to whom request it...
                 it's not possible to broadcast the new version -> Outdate it */

                // GameModel is not broadcastable ...
                /// requestManager.addOutofdateEntities(b.getEntities());
            } else if (b instanceof AbstractEntity) {
                logger.debug("Propagate: " + b.getClass().getSimpleName() + "::" + ((AbstractEntity)b).getId());
                Map<String, List<AbstractEntity>> entities = b.getEntities();
                requestManager.addUpdatedEntities(entities);
            }
        }
    }

    @PreRemove
    void onPreRemove(Object o) {
        if (o instanceof Broadcastable) {
            Broadcastable b = (Broadcastable) o;
            Map<String, List<AbstractEntity>> entities = b.getEntities();
            if (entities != null) {
                if (b instanceof VariableDescriptor || b instanceof VariableInstance || b instanceof Game) {
                    logger.debug(("#Entities: " + entities.size()));
                    requestManager.addDestroyedEntities(entities);
                } else if (b instanceof Team || b instanceof Player) {
                    logger.debug(("#Entities: " + entities.size()));
                    requestManager.addUpdatedEntities(entities);
                } else {
                    logger.debug("Unhandled destroyed broadcastable entity: " + b);
                }
            }
        }

        if (o instanceof AbstractEntity) {
            ((AbstractEntity) o).updateCacheOnDelete();
        }
    }
}
