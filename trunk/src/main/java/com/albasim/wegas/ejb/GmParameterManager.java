/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
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


    @PersistenceContext(unitName = "metaPU")
    private EntityManager em;


    public GmParameter getParameter(String gmId, String tId, String mId,
                                    String pId, Terminal terminal) {
        GmMethod method = mm.getMethod(gmId, tId, mId, null);
        GmParameter find = em.find(GmParameter.class, Long.parseLong(pId));

        if (find != null) {
            if (find.getMethod().equals(method)) {
                dispatcher.registerObject(find, terminal);
                return find;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    public void createParameter(GmParameter param, Terminal terminal) {
        dispatcher.begin(terminal);
        parameterPrePersist(param);
        aem.create(param, terminal);
    }


    public void parameterPrePersist(GmParameter param) {
        dispatcher.create(param);
        param.validate();
    }


    public GmParameter updateParameter(String gmID, String tID, String mID, String pID,
                                GmParameter parameter, Terminal terminal) {

        GmParameter p = getParameter(gmID, tID, mID, pID, null);
        if (p.equals(parameter)) {
            parameter.setMethod(p.getMethod());
            dispatcher.begin(terminal);
            GmParameter update = aem.update(parameter, terminal);
            return update;
        }
        throw new InvalidContent();
    }


    public void destroyParameter(String gmId, String tId, String mId,
                                 String parameterID, Terminal terminal) {
        GmParameter parameter = getParameter(gmId, tId, mId, parameterID, null);
        dispatcher.begin(terminal);
        parameterPreDestroy(parameter);
        aem.destroy(parameter, terminal);
    }


    public void parameterPreDestroy(GmParameter p) {
        dispatcher.remove(p);
    }


    void detachAll(GmMethod m, Terminal terminal) {
        for (GmParameter p : m.getParameters()){
            detach(p, terminal);
        }
    }


    private void detach(GmParameter p, Terminal terminal) {
        dispatcher.detach(p, terminal);
    }


}
