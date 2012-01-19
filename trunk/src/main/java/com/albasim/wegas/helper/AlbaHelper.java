/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.helper;

import com.albasim.wegas.persistance.NamedAlbaEntity;
import com.albasim.wegas.conf.Conf;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmVariableInstance;
import com.sun.grizzly.comet.CometHandler;
import java.util.ArrayList;
import java.util.Collection;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.servlet.http.HttpServletRequest;

/**
 *
 * @author maxence
 */
@Stateless
public class AlbaHelper {

    @PersistenceContext(unitName = "wegasPU")
    private static EntityManager em;


    /**
     * This is the first validation a type name should go through :
     *   Its forbidden to override a primitive type name !
     * GmTyoe uniqueness is a database constraint and will be checked by
     * standard JPA validation life-cycle
     * 
     * @param typeName 
     * 
     */
    public static boolean isTypeNameValid(String typeName) {
        for (String pType : Conf.privitiveTypes) {
            if (pType.equalsIgnoreCase(typeName)) {
                return false;
            }
        }
        return true;
    }


    public static Collection<IndexEntry> getIndex(
            Collection<? extends NamedAlbaEntity> collection) {
        ArrayList<IndexEntry> index = new ArrayList<IndexEntry>();
        for (NamedAlbaEntity e : collection) {
            index.add(new IndexEntry(e));
        }
        return index;
    }

    public static Collection<VariableInstanceIndexEntry> getVariableInstanceIndex(
            Collection<GmVariableInstance> collection) {
        ArrayList<VariableInstanceIndexEntry> index = new ArrayList<VariableInstanceIndexEntry>();
        for (GmVariableInstance vi : collection){
            index.add(new VariableInstanceIndexEntry(vi));
        }
        return index;
    }
}
