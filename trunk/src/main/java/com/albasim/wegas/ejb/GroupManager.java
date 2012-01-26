/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistence.users.GroupEntity;
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
    private WegasEntityManager aem;

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

        if (find == null) {
            throw new NotFound();
        }
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
    public GroupEntity updateGroup(Long id, GroupEntity u) {
        GroupEntity gm = this.getGroup(id);
        if (gm.equals(u)) {
            GroupEntity update = aem.update(u);
            return update;
        }

        throw new InvalidContent();
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
