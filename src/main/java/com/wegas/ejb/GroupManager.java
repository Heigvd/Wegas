/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.ejb;

import com.wegas.persistence.users.GroupEntity;
import java.util.List;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaQuery;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class GroupManager {

    private static final Logger logger = Logger.getLogger("EJB_UM");

    @EJB
    private AnonymousEntityManager aem;

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     * Game Model index
     * 
     * @todo security + acl
     * @return  list of game model
     */
    public List<GroupEntity> getGroups() {
        CriteriaQuery cq = em.getCriteriaBuilder().createQuery();
        cq.select(cq.from(GroupEntity.class));
        Query q = em.createQuery(cq);

        return q.getResultList();
    }
    
      /**
     * Read a game model
     * 
     * @param id
     * @return game model
     */
    public GroupEntity getGroup(Long id) {
        GroupEntity find = em.find(GroupEntity.class, id);
        return find;
    }
    
    /**
     * 
     * @param u
     */
    public void createGroup(GroupEntity u) {
        aem.create(u);
    }
    
    /**
     * 
     * @param id
     * @param u
     * @return
     */
    public GroupEntity updateGroup(Long id, GroupEntity updatedGroup) {
        GroupEntity group = this.getGroup(id);
        group.merge(updatedGroup);
        return group;
    }


    /**
     * Destroy a user
     * 
     * @param id
     */
    public void destroyGroup(Long id) {
        GroupEntity u = this.getGroup(id);
        aem.destroy(u);
    }
}
