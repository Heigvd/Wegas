/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmType;
import com.albasim.wegas.persistance.GmUserEvent;
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
public class GmUserEventManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private AlbaEntityManager aem;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    public GmUserEvent getUserEvent(String gmID, String tID, String eID) {
        GmUserEvent find = em.find(GmUserEvent.class, Long.parseLong(eID));

        if (find != null) {
            GameModel gm = gmm.getGameModel(gmID);
            GmType type = tm.getType(gm, eID);
            if (find.getBelongsTo().equals(type)) {
               // dispatcher.registerObject(find);
                return find;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    public void createUserEvent(GmUserEvent userEvent) {
        userEventPrePersist(userEvent);
        aem.create(userEvent);
    }


    public void userEventPrePersist(GmUserEvent ev) {
        dispatcher.create(ev);
    }


    public GmUserEvent updateUserEvent(String gmID, String tID, String eID,
                                GmUserEvent userEvent) {
        GmUserEvent ue = getUserEvent(gmID, tID, eID);
        if (ue.equals(userEvent)) {
            userEvent.setBelongsTo(ue.getBelongsTo());
            GmUserEvent update = aem.update(userEvent);
            return update;
        }
        throw new InvalidContent();
    }


    public void destroyUserEvent(String gmID, String tID, String eID) {
        GmUserEvent userEvent = getUserEvent(gmID, tID, eID);
        userEventPreDestroy(userEvent);
    }


    public void userEventPreDestroy(GmUserEvent ue) {
        dispatcher.remove(ue);
    }


    void detachAll(GmType theType) {
        for (GmUserEvent ue : theType.getUserEvents()){
            detach(ue);
        }
    }

    private void detach(GmUserEvent ue) {
       // dispatcher.detach(ue);
    }


}
