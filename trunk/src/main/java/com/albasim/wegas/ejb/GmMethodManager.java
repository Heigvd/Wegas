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
import com.albasim.wegas.persistence.GmMethod;
import com.albasim.wegas.persistence.GmParameter;
import com.albasim.wegas.persistence.GmType;
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
public class GmMethodManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private WegasEntityManager aem;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @EJB
    private GmParameterManager pm;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    public GmMethod getMethod(String gmId, String tId, String mId) {
        GmMethod find = em.find(GmMethod.class, Long.parseLong(mId));

        if (find == null) {
            throw new NotFound();
        } else {
            GameModel gm = gmm.getGameModel(gmId);
            GmType t = tm.getType(gm, tId);

            // Does Method belongs to the righe type ?
            if (!find.getBelongsTo().equals(t)) {
                throw new InvalidContent();
            }
            // Does the type a game model one ?
            if (gm != t.getGameModel()) {
                throw new InvalidContent();
            }

           // dispatcher.registerObject(find);
            return find;
        }
    }


    public void createMethod(GmMethod method) {
        methodPrePersist(method);
        aem.create(method);

    }


    public void methodPrePersist(GmMethod method) {
        method.validate();
        dispatcher.create(method);
        if (method.getParameters() != null) {
            for (GmParameter p : method.getParameters()) {
                p.setMethod(method);
                pm.parameterPrePersist(p);
            }
        }

    }

    public GmMethod updateMethod(String gmID, String tID, String mID, GmMethod method) {
        GmMethod m = getMethod(gmID, tID, mID);

        if (m.equals(method)) {
            method.setBelongsTo(m.getBelongsTo());
            GmMethod update = aem.update(method);
            return update;
        }
        throw new InvalidContent();
    }


    public void destroyMethod(String gmId, String tId, String mId) {
        GmMethod method = getMethod(gmId, tId, mId);
        methodPreDestroy(method);
        aem.destroy(method);
    }



    public void methodPreDestroy(GmMethod m) {

        for (GmParameter p : m.getParameters()){
            pm.parameterPreDestroy(p);
        }
        
        dispatcher.remove(m);
    }


    void detachAll(GmType theType) {
        for (GmMethod m : theType.getMethods()){
            detach(m);
        }
    }


    private void detach(GmMethod m) {
        pm.detachAll(m);
       // dispatcher.detach(m);
    }


}
