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

import com.wegas.exception.InvalidContent;
import com.wegas.exception.NotFound;
import com.wegas.persistence.users.UserEntity;
import com.wegas.persistence.users.UserEntity_;

import java.util.List;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless(name = "UserManagerBean")
@LocalBean
public class UserManager {

    private static final Logger logger = Logger.getLogger("EJB_UM");
    /**
     * 
     */
    @EJB
    private AnonymousEntityManager aem;
    /**
     * 
     */
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

    /**
     * 
     * @param principal
     * @return
     */
    public UserEntity getUserByPrincipal(String principal) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        // Metamodel m = em.getMetamodel();
        // EntityType<UserEntity> UserEntity_ = m.entity(UserEntity.class);
        Root<UserEntity> user = cq.from(UserEntity.class);
        cq.where(cb.equal(user.get(UserEntity_.name), principal));
        Query q = em.createQuery(cq);

        try {
            return (UserEntity) q.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    /**
     * 
     * @param u
     */
    public void createUser(UserEntity u) {
        aem.create(u);
    }

    /**
     * 
     * @param id
     * @param u
     * @return
     */
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
    public void destroyUser(Long id) {
        UserEntity u = this.getUser(id);
        aem.destroy(u);
    }
}
