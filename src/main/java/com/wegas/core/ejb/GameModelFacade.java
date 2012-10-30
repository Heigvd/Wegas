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

import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel_;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import java.io.IOException;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import org.codehaus.jackson.map.ObjectMapper;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class GameModelFacade extends AbstractFacadeImpl<GameModel> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public GameModelFacade() {
        super(GameModel.class);
    }

    /**
     *
     * @return
     */
    @Override
    public EntityManager getEntityManager() {
        return em;
    }

    @Override
    public GameModel duplicate(final Long entityId) throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance

        GameModel oldEntity = this.find(entityId);                              // Retrieve the entity to duplicate

        String serialized = mapper.writerWithView(Views.Export.class).
                writeValueAsString(oldEntity);
        GameModel newEntity = mapper.readValue(serialized, GameModel.class);    // and deserialize it

        boolean added = false;
        int suffix = 1;
        String newName = null;
        while (!added) {
            newName = oldEntity.getName() + "(" + suffix + ")";
            try {
                this.findByName(newName);
                suffix++;
            }
            catch (NoResultException ex) {
                added = true;
            }
        }
        newEntity.setName(newName);
        this.create(newEntity);                                                 // store it db
        return newEntity;
    }

    /**
     *
     * @param name
     * @return
     */
    public GameModel findByName(String name) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<GameModel> gameModel = cq.from(GameModel.class);
        cq.where(cb.equal(gameModel.get(GameModel_.name), name));
        Query q = em.createQuery(cq);
        return (GameModel) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     */
    public void reset(Long gameModelId) {
        GameModel gm = this.find(gameModelId);
        gm.propagateDefaultInstance(true);
        em.flush();
        em.refresh(gm);
    }
}
