/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmEnumItem;
import com.albasim.wegas.persistance.GmInstance;
import com.albasim.wegas.persistance.GmVariableDescriptor;
import com.albasim.wegas.persistance.GmVariableInstance;
import com.albasim.wegas.persistance.cardinality.GmEnumCardinality;
import com.albasim.wegas.persistance.type.GmEnumType;
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
    private AlbaEntityManager aem;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @EJB
    private GmInstanceManager im;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "metaPU")
    private EntityManager em;


    /**
     * Add an item to an enumeration
     * @param i new enum item
     */
    public void createEnumItem(GmEnumItem i, Terminal terminal) {
        dispatcher.begin(terminal);
        enumItemPrePersist(i);
        aem.create(i, terminal);
    }


    /**
     * When a new enum item is added, add instance within a varInstance which refer to this.getEnumType through their cardinality
     */
    public void enumItemPrePersist(GmEnumItem it) {
        dispatcher.create(it);
        GmEnumType enumType = it.getGmEnumType();
        if (it.getInstances() == null) {
            List<GmInstance> is = new ArrayList<GmInstance>();
            it.setInstances(is);
        }

        List<GmInstance> is = it.getInstances();
        List<GmEnumCardinality> gmEnumCardinalities = enumType.getGmEnumCardinalities();
        if (gmEnumCardinalities != null) {
            for (GmEnumCardinality card : gmEnumCardinalities) {
                GmVariableDescriptor vd = card.getVarDesc();
                for (GmVariableInstance vi : vd.getGmVariableInstances()) {
                    if (!vi.isInstanceExists(it.getName())) {
                        GmInstance createInstance = vd.getType().createInstance(it.getName(), vi, it);
                        is.add(createInstance);
                        im.instancePrePersist(createInstance);
                    }
                }
            }
        }
    }


    /**
     * Retrieve an enum item
     * 
     * @param gmID ID of the game model it belongs to
     * @param eID ID of the enum type is belongs to
     * @param itemID  ID of requested enum item
     * @return  the enum item if the request is valid
     */
    public GmEnumItem getEnumItem(String gmID, String eID, String itemID,
                                  Terminal terminal) {
        GmEnumItem item = em.find(GmEnumItem.class, Long.parseLong(itemID));

        if (item != null) {
            GameModel gm = gmm.getGameModel(gmID, null);
            GmEnumType enumType = tm.getEnumType(gm, eID);

            if (item.getGmEnumType().equals(enumType)) {
                dispatcher.registerObject(item, terminal);
                return item;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    public GmEnumItem updateEnumItem(String gmID, String eID, String itID,
                                     GmEnumItem newItem, Terminal terminal) {
        GmEnumItem enumItem = getEnumItem(gmID, eID, itID, null);
        if (enumItem.equals(newItem)) {
            newItem.setGmEnumType(enumItem.getGmEnumType());
            //Be sure to reflect new name within instances
            newItem.setInstances(enumItem.getInstances());
            dispatcher.begin(terminal);
            enumItemPreUpdate(newItem);
            GmEnumItem update = aem.update(newItem, terminal);
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


    public void destroyEnumItem(String gmId, String eId, String itId,
                                Terminal term) {
        GmEnumItem enumItem = getEnumItem(gmId, eId, itId, null);
        dispatcher.begin(term);
        enumItemPreDestroy(enumItem);
        aem.destroy(enumItem, term);
    }


    public void enumItemPreDestroy(GmEnumItem ei) {

        for (GmInstance i : ei.getInstances()) {
            im.instancePreDestroy(i);
        }

        dispatcher.remove(ei);
    }


    void detach(GmEnumItem it, Terminal terminal) {
        dispatcher.detach(it, terminal);
    }


    void detachAll(GmEnumType et, Terminal terminal) {
        for (GmEnumItem it : et.getItems()) {
            detach(it, terminal);
        }
    }


}
