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
import com.albasim.wegas.persistence.users.UserEntity;
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
public class UserManager {

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
    public List<UserEntity> getUsers() {
        CriteriaQuery cq = em.getCriteriaBuilder().createQuery();
        cq.select(cq.from(UserEntity.class));
        Query q = em.createQuery(cq);

        return q.getResultList();
    }
    
      /**
     * Read a game model
     * 
     * @param id
     * @return game model
     */
    public UserEntity getUser(Long id) {
        UserEntity find = em.find(UserEntity.class, id);

        if (find == null) {
            throw new NotFound();
        }
        return find;
    }
    
    public void createUser(UserEntity u) {
        aem.create(u);
    }
    
    public UserEntity updateUser(Long id, UserEntity u) {
        UserEntity gm = this.getUser(id);
        if (gm.equals(u)) {
            UserEntity update = aem.update(u);
            return update;
        }

        throw new InvalidContent();
    }


    /**
     * Destroy a user
     * 
     * @param id
     */
    public void destroyGameModel(Long id) {
        UserEntity u = this.getUser(id);
        aem.destroy(u);
    }
}
