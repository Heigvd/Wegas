/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
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


    @PersistenceContext(unitName = "metaPU")
    private EntityManager em;


    public GmUserEvent getUserEvent(String gmID, String tID, String eID,
                                    Terminal terminal) {
        GmUserEvent find = em.find(GmUserEvent.class, Long.parseLong(eID));

        if (find != null) {
            GameModel gm = gmm.getGameModel(gmID, null);
            GmType type = tm.getType(gm, eID, null);
            if (find.getBelongsTo().equals(type)) {
                dispatcher.registerObject(find, terminal);
                return find;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    public void createUserEvent(GmUserEvent userEvent, Terminal terminal) {
        dispatcher.begin(terminal);
        userEventPrePersist(userEvent);
        aem.create(userEvent, terminal);
    }


    public void userEventPrePersist(GmUserEvent ev) {
        dispatcher.create(ev);
    }


    public GmUserEvent updateUserEvent(String gmID, String tID, String eID,
                                GmUserEvent userEvent, Terminal terminal) {
        GmUserEvent ue = getUserEvent(gmID, tID, eID, null);
        if (ue.equals(userEvent)) {
            dispatcher.begin(terminal);
            userEvent.setBelongsTo(ue.getBelongsTo());
            GmUserEvent update = aem.update(userEvent, terminal);
            return update;
        }
        throw new InvalidContent();
    }


    public void destroyUserEvent(String gmID, String tID, String eID,
                                 Terminal terminal) {
        GmUserEvent userEvent = getUserEvent(gmID, tID, eID, null);
        dispatcher.begin(terminal);
        userEventPreDestroy(userEvent);
        aem.destroy(userEvent, terminal);
    }


    public void userEventPreDestroy(GmUserEvent ue) {
        dispatcher.remove(ue);
    }


    void detachAll(GmType theType, Terminal terminal) {
        for (GmUserEvent ue : theType.getUserEvents()){
            detach(ue, terminal);
        }
    }

    private void detach(GmUserEvent ue, Terminal terminal) {
        dispatcher.detach(ue, terminal);
    }


}
