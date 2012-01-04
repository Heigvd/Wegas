/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmMethod;
import com.albasim.wegas.persistance.GmParameter;
import com.albasim.wegas.persistance.GmType;
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
    private AlbaEntityManager aem;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @EJB
    private GmParameterManager pm;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "metaPU")
    private EntityManager em;


    /* _/~\_/~\_/~\_/~\_/~\_/~\_ METHODS _/~\_/~\_/~\_/~\_/~\_/~\_/~\_/~\_ */
    public GmMethod getMethod(String gmId, String tId, String mId,
                              Terminal terminal) {
        GmMethod find = em.find(GmMethod.class, Long.parseLong(mId));

        if (find == null) {
            throw new NotFound();
        } else {
            GameModel gm = gmm.getGameModel(gmId, null);
            GmType t = tm.getType(gm, tId, null);

            // Does Method belongs to the righe type ?
            if (!find.getBelongsTo().equals(t)) {
                throw new InvalidContent();
            }
            // Does the type a game model one ?
            if (gm != t.getGameModel()) {
                throw new InvalidContent();
            }

            dispatcher.registerObject(find, terminal);
            return find;
        }
    }


    public void createMethod(GmMethod method, Terminal terminal) {
        dispatcher.begin(terminal);
        methodPrePersist(method);
        aem.create(method, terminal);

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

    public GmMethod updateMethod(String gmID, String tID, String mID, GmMethod method, Terminal terminal) {
        GmMethod m = getMethod(gmID, tID, mID, null);

        if (m.equals(method)) {
            method.setBelongsTo(m.getBelongsTo());
            dispatcher.begin(terminal);
            GmMethod update = aem.update(method, terminal);
            return update;
        }
        throw new InvalidContent();
    }


    public void destroyMethod(String gmId, String tId, String mId,
                              Terminal terminal) {
        GmMethod method = getMethod(gmId, tId, mId, null);
        dispatcher.begin(terminal);
        methodPreDestroy(method);
        aem.destroy(method, terminal);
    }



    public void methodPreDestroy(GmMethod m) {

        for (GmParameter p : m.getParameters()){
            pm.parameterPreDestroy(p);
        }
        
        dispatcher.remove(m);
    }


    void detachAll(GmType theType, Terminal terminal) {
        for (GmMethod m : theType.getMethods()){
            detach(m, terminal);
        }
    }


    private void detach(GmMethod m, Terminal terminal) {
        pm.detachAll(m, terminal);
        dispatcher.detach(m, terminal);
    }


}
