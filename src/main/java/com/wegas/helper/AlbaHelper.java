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
package com.wegas.helper;

import com.wegas.persistence.game.NamedEntity;
import com.wegas.conf.Conf;
import com.wegas.persistence.game.GameModelEntity;
import com.wegas.persistence.variableinstance.VariableInstanceEntity;
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
     * @return  
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


    /**
     * 
     * @param collection
     * @return
     */
    public static Collection<IndexEntry> getIndex(
            Collection<? extends NamedEntity> collection) {
        ArrayList<IndexEntry> index = new ArrayList<IndexEntry>();
        for (NamedEntity e : collection) {
            index.add(new IndexEntry(e));
        }
        return index;
    }

    /**
     * 
     * @param collection
     * @return
     */
    public static Collection<VariableInstanceIndexEntry> getVariableInstanceIndex(
            Collection<VariableInstanceEntity> collection) {
        ArrayList<VariableInstanceIndexEntry> index = new ArrayList<VariableInstanceIndexEntry>();
        for (VariableInstanceEntity vi : collection){
            index.add(new VariableInstanceIndexEntry(vi));
        }
        return index;
    }
}
