/*
 * Wegas. http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmType;
import com.albasim.wegas.persistance.GmVariableDescriptor;
import com.albasim.wegas.persistance.GmVariableInstance;
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
    private AlbaEntityManager aem;


    @EJB
    private GmTypeManager tm;


    @EJB
    private GmVarDescManager vdm;


    @EJB
    private GmVarInstManager vim;


    @EJB
    private Dispatcher dispatcher;


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
        cq.select(cq.from(GameModel.class));
        Query q = em.createQuery(cq);
        List<GameModel> resultList = q.getResultList();

        return AlbaHelper.getIndex(resultList);
    }


    /**
     * Get all Game Model
     * 
     * @todo security + acl
     * @return  list of game model
     */
    private Collection<GameModel> getAllGameModel() {
        CriteriaQuery cq = em.getCriteriaBuilder().createQuery();
        cq.select(cq.from(GameModel.class));
        Query q = em.createQuery(cq);
        List<GameModel> resultList = q.getResultList();

        return resultList;
    }




    /**
     * Read a game model
     * 
     * @param id
     * @return game model
     */
    public GameModel getGameModel(String gmid) {
        GameModel find = em.find(GameModel.class, Long.parseLong(gmid));

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
    public void createGameModel(GameModel gm) {
     //   dispatcher.begin();
        gameModelPrePersist(gm);
        aem.create(gm);
    }


    private void gameModelPrePersist(GameModel gm) {
        logger.log(Level.INFO, "Thread : {0}", Thread.currentThread().hashCode());
        logger.log(Level.INFO, "Dispatch : {0}", dispatcher);

        dispatcher.create(gm);

        if (gm.getTypes() != null) {
            for (GmType t : gm.getTypes()) {
                t.setGameModel(gm);
                tm.typePrePersist(t);
            }
        }

        if (gm.getVariableInstances() == null) {
            gm.setVariableInstances(new ArrayList<GmVariableInstance>());
        }

        if (gm.getVariableDescriptors() == null) {
            gm.setVariableDescriptors(new ArrayList<GmVariableDescriptor>());
        }

        // Check that all provided instances match a descriptor
        for (GmVariableInstance v : gm.getVariableInstances()) {
            String varName = v.getStringName();
            GmVariableDescriptor lookupDescriptor = gm.lookupDescriptor(varName);
            // And link the variable to its desc
            v.setDescriptor(lookupDescriptor);
            // And to the game model
            v.setParentGameModel(gm);
        }

        Collection<GmVariableInstance> vInsts = gm.getVariableInstances();
        for (GmVariableDescriptor vd : gm.getVariableDescriptors()) {
            vd.setParentGameModel(gm);
            //vd.setType(lookupType(vd.getRealStringType(), null));

            // Check that an instance exists
            GmVariableInstance theVi = gm.lookupVariableInstance(vd.getName());
            if (theVi == null) {
                logger.log(Level.INFO, "Desc has no var => create !{0}", vd.getName());
                // Not the case ? so propagateCreate variable instance (and dont care about effective instances)
                theVi = new GmVariableInstance();
                theVi.setDescriptor(vd);
                theVi.setParentGameModel(gm);
                vInsts.add(theVi);
                //throw new InvalidContent("There is no variable instance for the \"" + vd.getName() + "\" descriptor!");
            }
        }

        for (GmVariableDescriptor vd : gm.getVariableDescriptors()) {
            vdm.varDescPrePersist(vd);
        }

        for (GmVariableInstance vi : gm.getVariableInstances()) {
            vim.variableInstancePrePersist(vi);
        }
    }


    /**
     * Update a game model
     * 
     * @param gm 
     */
    public GameModel updateGameModel(String gmID, GameModel theGameModel) {
        GameModel gm = getGameModel(gmID);
        if (gm.equals(theGameModel)) {
            GameModel update = aem.update(theGameModel);
            return update;
        }

        throw new InvalidContent();
    }


    /**
     * Destroy a game model
     * 
     * @param id
     */
    public void destroyGameModel(String id) {
        GameModel gameModel = getGameModel(id);
        gameModelPreDestroy(gameModel);
        aem.destroy(gameModel);
    }


    private void gameModelPreDestroy(GameModel gm) {
        // removing var instance is done by removing the descs
        /*for (GmVariableInstance vi : gm.getVariableInstances()){
            vim.variableInstancePreDestroy(vi);
        }*/

        for (GmVariableDescriptor vd : gm.getVariableDescriptors()){
            vdm.varDescPreDestroy(vd);
        }

        for (GmType t : gm.getTypes()){
            tm.typePreDestroy(t);
        }
        
        dispatcher.remove(gm);
    }


    public void detachAll(){
        for (GameModel gm : getAllGameModel()){
            detachGameModel(gm);
        }
    }

    public void detachGameModel(GameModel gameModel) {

        tm.detachAll(gameModel);

        vdm.detachAll(gameModel);

        vim.detachAll(gameModel);
        
       // dispatcher.detach(gameModel, null);
    }
}
