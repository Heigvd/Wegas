/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnectorFactory;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import java.io.IOException;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.jcr.RepositoryException;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.codehaus.jackson.map.ObjectMapper;
import org.eclipse.persistence.exceptions.DatabaseException;

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
        //GameModel newEntity = super.duplicate(entityId);

        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance

        GameModel oldEntity = this.find(entityId);                                      // Retrieve the entity to duplicate

        String serialized = mapper.writerWithView(Views.Export.class).
                writeValueAsString(oldEntity);                                  // Serilize the entity
        System.out.println(serialized);
        GameModel newEntity = (GameModel) mapper.readValue(serialized, AbstractEntity.class);   // and deserialize it


        boolean added = false;
        int suffix = 0;
        while (!added) {
            try {
                this.create(newEntity);                                         // Store it db
                suffix++;
                newEntity.setName(oldEntity.getName() + "(" + suffix + ")");
                em.flush();
                added = true;
            } catch (DatabaseException e) {
                //e.
                System.out.println("error");
            }
        }
        //Clone jcr FILES
        try {
            ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(newEntity.getId());
            connector.cloneWorkspace(oldEntity.getId());
        } catch (RepositoryException ex) {
            System.err.println(ex);
        }
        return newEntity;
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
