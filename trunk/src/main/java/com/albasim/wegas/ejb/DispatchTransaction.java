/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.persistance.AnonymousAlbaEntity;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * This class encapsulate all operations done during a transaction in AlbaEntityManager.
 * 
 * This is a stateful bean which is strictly bound to only one operation 
 *  (ie. concurrent transaction will each have their own instance of this bean).
 * 
 * To start such a transaction, the begin method shall be called.
 * 
 * Nothing is propagate to client until the commit method is called. This method 
 * shall be called only once everything as been flushed into the DB without any errors.
 * 
 * @author maxence
 */
public class DispatchTransaction {

    private static final Logger logger = Logger.getLogger("DispatchTransaction");

    private Terminal terminal;
    private List<AnonymousAlbaEntity> removed;
    private List<AnonymousAlbaEntity> created;
    private List<AnonymousAlbaEntity> updated;
    //private List<AnonymousAlbaEntity> detached;
    

    public Terminal getTerminal(){
        return terminal;
    }

    public DispatchTransaction(Terminal terminal){
        removed = new ArrayList<AnonymousAlbaEntity>();
        updated = new ArrayList<AnonymousAlbaEntity>();
        created = new ArrayList<AnonymousAlbaEntity>();
        //detached = new ArrayList<AnonymousAlbaEntity>();
        this.terminal = terminal;
    }

    public void remove(AnonymousAlbaEntity o){
        add(removed, o);
    }

    public void update(AnonymousAlbaEntity o){
        add(updated, o);
    }

    public void create(AnonymousAlbaEntity o){
        add(created, o);
    }

    private void add(Collection<AnonymousAlbaEntity> collection, AnonymousAlbaEntity o){
        if (!collection.contains(o)){
            collection.add(o);
        }

        /*
        AnonymousAlbaEntity parent = o.getParent();
        if (parent != null && !collection.contains(o)){
            collection.add(parent);
        }
        */
    }

    /*void detach(AnonymousAlbaEntity o) {
        detached.add(o);
    }*/


    public void commit(Dispatcher dispatcher){
        /*for (AnonymousAlbaEntity o : detached){
            dispatcher.doDetach(o, terminal);
        }*/

        for (AnonymousAlbaEntity o : removed){
            dispatcher.propagateDestroy(o, terminal);
        }

        for (AnonymousAlbaEntity o : updated){
            dispatcher.propagateUpdate(o, terminal);
        }

        for (AnonymousAlbaEntity o : created){
            dispatcher.propagateCreate(o, terminal);
        }
        // And clear lists
        rollback();
    }

    public void rollback(){
        logger.log(Level.INFO, "ROLLBACK TRANSACTION");
        removed.clear();
        updated.clear();
        created.clear();
    }
}
