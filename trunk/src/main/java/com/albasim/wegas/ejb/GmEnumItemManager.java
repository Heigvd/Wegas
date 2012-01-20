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
import com.albasim.wegas.persistence.GameModel;
import com.albasim.wegas.persistence.GmEnumItem;
import com.albasim.wegas.persistence.GmInstance;
import com.albasim.wegas.persistence.VariableDescriptorEntity;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.cardinality.GmEnumCardinality;
import com.albasim.wegas.persistence.type.GmEnumType;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class GmEnumItemManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private WegasEntityManager aem;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @EJB
    private GmInstanceManager im;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    /**
     * Add an item to an enumeration
     * @param i new enum item
     */
    public void createEnumItem(GmEnumItem i) {
        enumItemPrePersist(i);
        aem.create(i);
    }


    /**
     * When a new enum item is added, add instance within a varInstance which refer to this.getEnumType through their cardinality
     */
    public void enumItemPrePersist(GmEnumItem it) {
      /*  dispatcher.create(it);
        GmEnumType enumType = it.getGmEnumType();
        if (it.getInstances() == null) {
            List<GmInstance> is = new ArrayList<GmInstance>();
            it.setInstances(is);
        }

        List<GmInstance> is = it.getInstances();
        List<GmEnumCardinality> gmEnumCardinalities = enumType.getGmEnumCardinalities();
        if (gmEnumCardinalities != null) {
            for (GmEnumCardinality card : gmEnumCardinalities) {
                VariableDescriptorEntity vd = card.getVarDesc();
                for (VariableInstanceEntity vi : vd.getGmVariableInstances()) {
                    if (!vi.isInstanceExists(it.getName())) {
                        GmInstance createInstance = vd.getType().createInstance(it.getName(), vi, it);
                        is.add(createInstance);
                        im.instancePrePersist(createInstance);
                    }
                }
            }
        }*/
    }


    /**
     * Retrieve an enum item
     * 
     * @param gmID ID of the game model it belongs to
     * @param eID ID of the enum type is belongs to
     * @param itemID  ID of requested enum item
     * @return  the enum item if the request is valid
     */
    public GmEnumItem getEnumItem(String gmID, String eID, String itemID) {
        GmEnumItem item = em.find(GmEnumItem.class, Long.parseLong(itemID));

        if (item != null) {
            GameModel gm = gmm.getGameModel(gmID);
            GmEnumType enumType = tm.getEnumType(gm, eID);

            if (item.getGmEnumType().equals(enumType)) {
               // dispatcher.registerObject(item);
                return item;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    public GmEnumItem updateEnumItem(String gmID, String eID, String itID,
                                     GmEnumItem newItem) {
        GmEnumItem enumItem = getEnumItem(gmID, eID, itID);
        if (enumItem.equals(newItem)) {
            newItem.setGmEnumType(enumItem.getGmEnumType());
            //Be sure to reflect new name within instances
            newItem.setInstances(enumItem.getInstances());
            enumItemPreUpdate(newItem);
            GmEnumItem update = aem.update(newItem);
            return update;
        }
        throw new InvalidContent("ID not match path");
    }


    /**
     * When the item is update, instances linked to this item may be renamed
     */
    private void enumItemPreUpdate(GmEnumItem item) {

        logger.log(Level.INFO, "UPDATE ITEM");
        for (GmInstance i : item.getInstances()) {
            logger.log(Level.SEVERE, "HIT INSTANCE ON ITEM UPDATE : {0}", item.getName());
            i.setName(item.getName());
            //em.refresh(i);
            dispatcher.update(i);
        }
    }


    public void destroyEnumItem(String gmId, String eId, String itId) {
        GmEnumItem enumItem = getEnumItem(gmId, eId, itId);
        enumItemPreDestroy(enumItem);
        aem.destroy(enumItem);
    }


    public void enumItemPreDestroy(GmEnumItem ei) {

        for (GmInstance i : ei.getInstances()) {
            im.instancePreDestroy(i);
        }

        dispatcher.remove(ei);
    }


    void detach(GmEnumItem it) {
       // dispatcher.detach(it);
    }


    void detachAll(GmEnumType et) {
        for (GmEnumItem it : et.getItems()) {
            detach(it);
        }
    }


}
