/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.ejb;

import com.wegas.persistence.game.GameModelEntity;
import java.util.Collection;
import java.util.List;
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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless(name="GameModelManagerBean")
@LocalBean
public class GameModelManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private AnonymousEntityManager aem;



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
    public Collection<GameModelEntity> getGameModels() {
        CriteriaQuery cq = em.getCriteriaBuilder().createQuery();
        cq.select(cq.from(GameModelEntity.class));
        Query q = em.createQuery(cq);
        return q.getResultList();
        //return AlbaHelper.getIndex(resultList);
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
        return find;
    }


    /**
     * Create a new game model
     * 
     * @param gm  the game model to propagateCreate
     */
    public void createGameModel(GameModelEntity gm) {
        aem.create(gm);
    }


    /**
     * Update a game model
     * 
     * @param gmID 
     * @param theGameModel
     * @return  
     */
    public GameModelEntity updateGameModel(Long gmID, GameModelEntity updatedGameModel) {
        GameModelEntity gm = getGameModel(gmID);
        gm.merge(updatedGameModel);
        return gm;
    }


    /**
     * Destroy a game model
     * 
     * @param id
     */
    public void destroyGameModel(Long id) {
        GameModelEntity gameModel = this.getGameModel(id);
        aem.destroy(gameModel);
    }

    /**
     * 
     * @param gameModelId
     * @return
     */
    public GameModelEntity reset(Long gameModelId) {
        
        GameModelEntity gm = this.getGameModel(gameModelId);
        gm.propagateDefaultVariableInstance(true);
        em.flush();
        em.refresh(gm);
        return gm;
    }

}
