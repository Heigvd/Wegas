/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistance.GmEventListener;
import com.albasim.wegas.persistance.instance.GmComplexInstance;
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
public class GmEventListenerManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private AlbaEntityManager aem;


    @EJB
    private GmInstanceManager im;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "metaPU")
    private EntityManager em;


    public GmEventListener getEventListener(String gmID, String viID,
                                            String ciID, String elID,
                                            Terminal terminal) {
        GmEventListener find = em.find(GmEventListener.class, Long.parseLong(elID));
        if (find != null) {
            GmComplexInstance complexInstance = im.getComplexInstance(gmID, viID, ciID);
            GmComplexInstance gmComplexInstance = find.getGmComplexInstance();
            if (complexInstance.equals(gmComplexInstance)) {
                dispatcher.registerObject(find, terminal);
                return find;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    public void createEventListener(String gmID, String viID, String ciID,
                                    GmEventListener listener,
                                    Terminal terminal) {
        GmComplexInstance ci = im.getComplexInstance(gmID, viID, ciID);
        dispatcher.begin(terminal);
        listener.setGmComplexInstance(ci);
        eventListenerPrePersist(listener);
        aem.create(listener, terminal);
    }


    public void eventListenerPrePersist(GmEventListener evl) {
        evl.validateEventPathAndBody();
        dispatcher.create(evl);
    }


    public GmEventListener updateEventListener(String gmID, String viID, String ciID,
                                    String elID,
                                    GmEventListener listener, Terminal terminal) {

        GmEventListener eventListener = getEventListener(gmID, viID, ciID, elID, null);
        if (eventListener.equals(listener)) {
            dispatcher.begin(terminal);
            listener.setGmComplexInstance(eventListener.getGmComplexInstance());
            GmEventListener update = aem.update(listener, terminal);
            return update;
        }
        throw new InvalidContent();
    }


    public void destroyEventListener(String gmID, String viID, String ciID,
                                     String elID, Terminal terminal) {
        GmEventListener eventListener = getEventListener(gmID, viID, ciID, elID, null);
        dispatcher.begin(terminal);
        eventListenerPreDestroy(eventListener);
        aem.destroy(eventListener, terminal);
    }


    public void eventListenerPreDestroy(GmEventListener el) {
        dispatcher.remove(el);
    }


    void detachAll(GmComplexInstance gmComplexInstance, Terminal terminal) {
        for (GmEventListener el : gmComplexInstance.getListeners()){
            detach(el, terminal);
        }
    }


    private void detach(GmEventListener el, Terminal terminal) {
        dispatcher.detach(el, terminal);
    }


}
