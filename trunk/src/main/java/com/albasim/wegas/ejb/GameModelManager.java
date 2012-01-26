/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistence.GameModelEntity;
import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.albasim.wegas.persistence.variableinstance.VariableInstanceEntity;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaQuery;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class GameModelManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private WegasEntityManager aem;



    @EJB
    private VariableDescriptorManager vdm;


    @EJB
    private VariableInstanceManager vim;


    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    /**
     * Game Model index
     * 
     * @todo security + acl
     * @return  list of game model
     */
    public Collection<IndexEntry> getGameModels() {
        CriteriaQuery cq = em.getCriteriaBuilder().createQuery();
        cq.select(cq.from(GameModelEntity.class));
        Query q = em.createQuery(cq);
        List<GameModelEntity> resultList = q.getResultList();

        return AlbaHelper.getIndex(resultList);
    }


    /**
     * Get all Game Model
     * 
     * @todo security + acl
     * @return  list of game model
     */
    private Collection<GameModelEntity> getAllGameModel() {
        CriteriaQuery cq = em.getCriteriaBuilder().createQuery();
        cq.select(cq.from(GameModelEntity.class));
        Query q = em.createQuery(cq);
        List<GameModelEntity> resultList = q.getResultList();

        return resultList;
    }




    /**
     * Read a game model
     * 
     * @param gmid 
     * @return game model
     */
    public GameModelEntity getGameModel(Long gmid) {
        GameModelEntity find = em.find(GameModelEntity.class, gmid);

        if (find == null) {
            throw new NotFound();
        }
        return find;
    }


    /**
     * Create a new game model
     * 
     * @param gm  the game model to propagateCreate
     */
    public void createGameModel(GameModelEntity gm) {
     //   dispatcher.begin();
       // gameModelPrePersist(gm);
        aem.create(gm);
    }


    /**
     * Update a game model
     * 
     * @param gmID 
     * @param theGameModel
     * @return  
     */
    public GameModelEntity updateGameModel(Long gmID, GameModelEntity theGameModel) {
        GameModelEntity gm = getGameModel(gmID);
        if (gm.equals(theGameModel)) {
            GameModelEntity update = aem.update(theGameModel);
            return update;
        }

        throw new InvalidContent();
    }


    /**
     * Destroy a game model
     * 
     * @param id
     */
    public void destroyGameModel(Long id) {
        GameModelEntity gameModel = getGameModel(id);
        aem.destroy(gameModel);
    }

}
