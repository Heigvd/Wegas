/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.jcr.jta.JCRClient;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.ModelScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreRemove;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class EntityListener {

    private static final Logger logger = LoggerFactory.getLogger(EntityListener.class);

    @Inject
    private RequestManager requestManager;

    @Inject
    private JCRConnectorProvider jcrProvider;

    @Inject
    private Beanjection beans;

    @PrePersist
    /* lifecycle */ void onPrePersist(Object o) {
        logger.trace("PrePersist {}", o);
        if (o instanceof JCRClient) {
            this.injectJTABean((JCRClient) o);
        }
        if (o instanceof AcceptInjection) {
            AcceptInjection id = (AcceptInjection) o;
            id.setBeanjection(beans);
        }
    }

    @PostPersist
    /* lifecycle */ void onPostPersist(Object o) {
        logger.trace("PostPersist {}", o);

        if (o instanceof Mergeable) {
            Mergeable m = (Mergeable) o;
            // new entities in a protected gameModel and an INTERNAL visibility scope is prohibited
            if (m.belongsToProtectedGameModel() && m.getInheritedVisibility() == ModelScoped.Visibility.INTERNAL) {
                // but creating translation is allowed
                if (o instanceof Translation == false) {
                    throw WegasErrorMessage.error("Not authorized to create " + o);
                }
            }
        }

        if (o instanceof WithPermission) {
            if (requestManager != null) {
                requestManager.assertCreateRight((WithPermission) o);
            } else {
                logger.error("PostPersist NO SECURITY FACADE");
            }
        }
        if (o instanceof AbstractEntity) {
            logger.debug("PostPersist: {} :: {}", o.getClass().getSimpleName(), ((AbstractEntity) o).getId());
            requestManager.addUpdatedEntity((AbstractEntity) o);
        }
    }

    @PostUpdate
    /* lifecycle */ void onPostUpdate(Object o) {
        logger.trace("PostUpdate {}", o);

        if (o instanceof WithPermission) {
            if (requestManager != null) {
                requestManager.assertUpdateRight((WithPermission) o);
            } else {
                logger.error("PostUpdate NO SECURITY FACADE");
            }
        }

        if (o instanceof AbstractEntity) {
            logger.debug("PostUpdate: {} :: {}", o.getClass().getSimpleName(), ((AbstractEntity) o).getId());
            requestManager.addUpdatedEntity((AbstractEntity) o);
        }
    }

    @PreRemove
    /* lifecycle */ void onPreRemove(Object o) {
        logger.trace("PreRemove {}", o);
        if (o instanceof WithPermission) {
            WithPermission ae = (WithPermission) o;
            if (requestManager != null) {
                requestManager.assertDeleteRight(ae);
            } else {
                logger.error("PreREMOVE NO SECURITY FACADE");
            }
        }

        if (o instanceof AbstractEntity) {
            AbstractEntity ae = (AbstractEntity) o;
            requestManager.addDestroyedEntity(ae);
            ae.updateCacheOnDelete(beans);
        }
    }

    @PostLoad
    /* lifecycle */ void onPostLoad(Object o) {
        logger.trace("PostLoad {}", o);
        if (o instanceof AcceptInjection) {
            AcceptInjection id = (AcceptInjection) o;
            id.setBeanjection(beans);
        }

        if (o instanceof AbstractEntity) {
            ((AbstractEntity) o).setPersisted(true);
        }

        if (o instanceof WithPermission) {
            if (requestManager != null) {
                requestManager.assertReadRight((WithPermission) o);
            } else {
                logger.error("PostLOAD NO SECURITY FACADE");
            }
        }

        if (o instanceof JCRClient) {
            this.injectJTABean((JCRClient) o);
        }
    }

    private void injectJTABean(JCRClient o) {
        o.inject(jcrProvider);
    }
}
