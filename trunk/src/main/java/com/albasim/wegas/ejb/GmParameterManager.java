/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistance.GmMethod;
import com.albasim.wegas.persistance.GmParameter;
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
public class GmParameterManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private AlbaEntityManager aem;


    @EJB
    private GmMethodManager mm;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    public GmParameter getParameter(String gmId, String tId, String mId,
                                    String pId) {
        GmMethod method = mm.getMethod(gmId, tId, mId);
        GmParameter find = em.find(GmParameter.class, Long.parseLong(pId));

        if (find != null) {
            if (find.getMethod().equals(method)) {
                //dispatcher.registerObject(find, terminal);
                return find;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    public void createParameter(GmParameter param) {
        parameterPrePersist(param);
        aem.create(param);
    }


    public void parameterPrePersist(GmParameter param) {
        dispatcher.create(param);
        param.validate();
    }


    public GmParameter updateParameter(String gmID, String tID, String mID, String pID,
                                GmParameter parameter) {

        GmParameter p = getParameter(gmID, tID, mID, pID);
        if (p.equals(parameter)) {
            parameter.setMethod(p.getMethod());
            GmParameter update = aem.update(parameter);
            return update;
        }
        throw new InvalidContent();
    }


    public void destroyParameter(String gmId, String tId, String mId,
                                 String parameterID) {
        GmParameter parameter = getParameter(gmId, tId, mId, parameterID);
        parameterPreDestroy(parameter);
        aem.destroy(parameter);
    }


    public void parameterPreDestroy(GmParameter p) {
        dispatcher.remove(p);
    }


    void detachAll(GmMethod m) {
        for (GmParameter p : m.getParameters()){
            detach(p);
        }
    }


    private void detach(GmParameter p) {
        //dispatcher.detach(p);
    }


}
