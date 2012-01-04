/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.exception.ConcurrentAccessException;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.MissingTransaction;
import com.albasim.wegas.exception.MissingWebSocketSession;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.AnonymousAlbaEntity;
import com.albasim.wegas.helper.StaticHelper;
import com.sun.grizzly.comet.CometContext;
import com.sun.grizzly.comet.CometEngine;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.annotation.PostConstruct;
import javax.ejb.LocalBean;
import javax.ejb.Singleton;
import javax.ejb.TransactionManagement;
import javax.ejb.TransactionManagementType;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.ext.Providers;

/**
 *
 * @author maxence
 */
@Singleton
@LocalBean
@TransactionManagement(TransactionManagementType.BEAN)
public class Dispatcher {

    private static final Logger logger = Logger.getLogger("DISPATCHER");


    @Context
    Providers ps;

    // Thread hashcode !

    HashMap<Integer, DispatchTransaction> transactions;

    /*
     * Link a web-socket session to its related http socket one
     */

    HashMap<Terminal, String> terminalToHttpSession;

    // Link an http-session to its web-socket session(s)

    HashMap<String, List<Terminal>> httpSessionToTerminals;


    HashMap<String, List<Terminal>> object2Terminals;


    private String contextPath;


    @PostConstruct
    public void init() {
        terminalToHttpSession = new HashMap<Terminal, String>();
        httpSessionToTerminals = new HashMap<String, List<Terminal>>();
        object2Terminals = new HashMap<String, List<Terminal>>();

        transactions = new HashMap<Integer, DispatchTransaction>();
    }


    public Set<Terminal> getTerminals() {
        return terminalToHttpSession.keySet();
    }


    public Terminal getTerminal(HttpServletRequest req) {
        logger.log(Level.INFO, "GET TERMINAL : THREAD IS : {0}", Thread.currentThread());
        String id = req.getSession().getId();
        logger.log(Level.INFO, "GET TERMINAL : SESSION ID is {0}", id);
        List<Terminal> get = httpSessionToTerminals.get(id);
        if (get == null) {
            throw new MissingWebSocketSession();
        }
        logger.log(Level.INFO, "There is {0} terminal in the list", get.size());
        logger.log(Level.INFO, "The terminal is : {0}", get.get(0));
        return get.get(0);
    }


    /**
     * Create 
     * @param session identify the user
     * @param webSocketSessionId  identify the terminal 
     */
    public void newSession(String session, Terminal terminal) {
        logger.log(Level.INFO, "NEW SESSION: {0} / {1}", new Object[]{session, terminal});

        terminalToHttpSession.put(terminal, session);

        List<Terminal> get;
        if (httpSessionToTerminals.containsKey(session)) {
            get = httpSessionToTerminals.get(session);
        } else {
            get = new ArrayList<Terminal>();
            httpSessionToTerminals.put(session, get);
        }
        get.add(terminal);
    }


    /**
     * 
     * @param session 
     */
    public void destroyAllSession(String session) {
        //for (hs2ws)
    }


    public void destroySession(String session, Terminal handler) {
        if (terminalToHttpSession.containsKey(handler)) {
            terminalToHttpSession.remove(handler);
        }
        List<Terminal> get = httpSessionToTerminals.get(session);
        if (get != null) {
            if (get.contains(handler)) {
                get.remove(handler);
            }
            if (get.size() == 0) {
                httpSessionToTerminals.remove(session);
            }
        }
    }


    public boolean checkSession(final String httpSessionId,
                                final Terminal terminal) {
        List<Terminal> get = httpSessionToTerminals.get(httpSessionId);
        return (get != null && get.contains(terminal));
    }


    private void assertWebSocketSession(Terminal terminal) {
        logger.log(Level.INFO, "Assert Session Terminal :{0}", terminal);
        if (terminal == null || !terminalToHttpSession.containsKey(terminal)) {
            throw new MissingWebSocketSession();
        }
    }


    public void registerObject(AnonymousAlbaEntity o, Terminal terminal) {
        // If terminal is null, it means it's an internal request
        // So it'doesn't require any registration
        if (terminal != null) {
            logger.log(Level.INFO, "Register Object Terminal :{0}", terminal);
            assertWebSocketSession(terminal);
            List<Terminal> get = object2Terminals.get(o.getKey());
            if (get == null) {
                get = new ArrayList<Terminal>();
                object2Terminals.put(o.getKey(), get);
            }

            /* Do not register the same object twice */
            if (!get.contains(terminal)) {
                logger.log(Level.INFO, "{0} registers object {1}", new Object[]{terminal, o.getKey()});
                get.add(terminal);
            }
        }
    }


    /**
     * Inform dispatcher that object has just been created
     * Client whom had register object parent will receive this new child
     * 
     * @param o
     * @param webSocketSessionId 
     */
    public void propagateCreate(AnonymousAlbaEntity o, Terminal terminal) {
        logger.log(Level.INFO, "Shall propagate {0} creation to ", o);
        assertWebSocketSession(terminal);
        registerObject(o, terminal);
        // TODO Propager a qui ? 
    }


    /**
     * Inform dispatcher that object has been updated.
     * Client whom had register this object will receive the new version
     * 
     * @param o
     * @param webSocketSessionId 
     */
    public void propagateUpdate(AnonymousAlbaEntity o, Terminal terminal) {
        try {
            logger.log(Level.INFO, "Shall propagate {0} update to ", o);
            assertWebSocketSession(terminal);

            CometContext context = CometEngine.getEngine().register(contextPath);

            // Fetch handler list to propagate propagateUpdate
            String json = o.toJson(ps);

            List<Terminal> get = object2Terminals.get(o.getKey());
            for (Terminal term : get) {
                try {
                    logger.log(Level.INFO, "  - {0}", term);
                    String script = "<script type='text/javascript'>\nwindow.parent.app.updateRaw(\"" + StaticHelper.escape(json) + "\")</script>";
                    context.notify(script, term.getCometHandler());
                } catch (IOException ex) {
                    Logger.getLogger(Dispatcher.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new InvalidContent("OUCH : MARSHALLER !");
        }
    }


    /**
     * Inform dispatcher that object has been destroyed
     * Client whom had register this object will be noticed of the deletion
     * 
     * @param o
     * @param webSocketSessionId 
     */
    public void propagateDestroy(AnonymousAlbaEntity o,
                                 Terminal terminal) {
        try {
            String key = o.getKey();
            logger.log(Level.INFO, "Shall propagate deletion of {0} to ", o);
            assertWebSocketSession(terminal);


            CometContext context = CometEngine.getEngine().register(contextPath);

            // Fetch handler list to propagate propagateUpdate
            IndexEntry entry = null;
            String json = o.toJson(ps);

            // TODO SHORT FORM !String json2 = "{\"@class\": }";

            List<Terminal> get = object2Terminals.get(key);
            for (Terminal term : get) {
                try {
                    logger.log(Level.INFO, "  - {0}", term);
                    String script = "<script type='text/javascript'>\nwindow.parent.app.destroyRaw(\"" + StaticHelper.escape(json) + "\")</script>";
                    context.notify(script, term.getCometHandler());
                } catch (IOException ex) {
                    Logger.getLogger(Dispatcher.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
            // clear the terminal list
            get.clear();
            // clear the object entry

            object2Terminals.remove(key);
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new InvalidContent("OUCH : MARSHALLER !");
        }
    }


    /** 
     * note that the speciefied terminal does not know the object anymore !
     * 
     * @param o the just detached object
     * @param terminal the terminal who detach
     */
    void detach(AnonymousAlbaEntity o, Terminal terminal) {
        String key = o.getKey();
        List<Terminal> get = object2Terminals.get(key);
        if (get != null && get.contains(terminal)) {
            get.remove(terminal);
        }
    }


    public HashMap<Integer, DispatchTransaction> getTransactions() {
        return transactions;
    }


    public DispatchTransaction getTransaction() {
        int hashCode = Thread.currentThread().hashCode();

        logger.log(Level.INFO, "get Transaction for thread: {0}", hashCode);
        if (transactions.containsKey(hashCode)) {
            return transactions.get(hashCode);
        }
        throw new MissingTransaction();
    }


    /**
     * Create a new transaction or throw ConcurrentAccessEception
     * @param terminal 
     */
    public void begin(Terminal terminal) {
        int hashCode = Thread.currentThread().hashCode();
        logger.log(Level.INFO, "get Transaction for thread: {0}", hashCode);

        // If transaction not exists :
        if (!transactions.containsKey(hashCode)) {
            DispatchTransaction transaction = new DispatchTransaction(terminal);
            transactions.put(Thread.currentThread().hashCode(), transaction);
        } else {
            // ALARM
            throw new ConcurrentAccessException();
        }
    }

    public void endTransaction(DispatchTransaction transaction){
        transactions.remove(Thread.currentThread().hashCode());
    }

    public void commit() {
        DispatchTransaction transaction = getTransaction();
        logger.log(Level.INFO, "COMMIT -> {0}", transaction);
        transaction.commit(this);
        transactions.remove(Thread.currentThread().hashCode());
    }


    public void rollback() {
        logger.log(Level.INFO, "ROLLBACK:");
        DispatchTransaction transaction = getTransaction();
        logger.log(Level.INFO, "ROLLBACK -> {0}", transaction);
        transaction.rollback();
        transactions.remove(Thread.currentThread().hashCode());
    }


    public void reset() {
        transactions.clear();
    }


    public void setContextPath(String contextPath) {
        this.contextPath = contextPath;
    }


    public void remove(AnonymousAlbaEntity o) {
        DispatchTransaction transaction = getTransaction();
        transaction.remove(o);
    }


    public void update(AnonymousAlbaEntity o) {
        DispatchTransaction transaction = getTransaction();
        transaction.update(o);
    }


    public void create(AnonymousAlbaEntity o) {
        DispatchTransaction transaction = getTransaction();
        transaction.create(o);
    }


}
