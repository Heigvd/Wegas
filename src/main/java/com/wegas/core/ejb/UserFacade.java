/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.user.User;
import com.wegas.core.persistence.user.User_;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class UserFacade extends AbstractFacadeImpl<User> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public UserFacade() {
        super(User.class);
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     * @param principal
     * @return
     * @throws NoResultException
     */
    public User getUserByPrincipal(String principal) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<User> user = cq.from(User.class);
        cq.where(cb.equal(user.get(User_.name), principal));
        Query q = em.createQuery(cq);
        return (User) q.getSingleResult();
    }

    /**
     *
     * @return a User entity, based on the shiro login state
     */
    public User getCurrentUser() {
        final Subject subject = SecurityUtils.getSubject();

        try {
            return this.getUserByPrincipal(subject.getPrincipal().toString());
        }
        catch (NoResultException e) {                                           // If the user is logged in but we cannot find a
            User newUser = new User();                                          // corresponding account, that means we need to create one.
            newUser.setName(subject.getPrincipal().toString());
            this.create(newUser);
            return newUser;
        }
    }

    public List<Game> registeredGames(Long userId) {
        User user = this.find(userId);
        List<Game> ret = new ArrayList<>();
        for (Player p : user.getPlayers()) {
            ret.add(p.getGame());
        }
        return ret;
    }
}
