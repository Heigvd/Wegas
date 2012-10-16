/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.ejb;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.jdbcrealm.JdbcRealmAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.AbstractAccount_;
import com.wegas.core.security.persistence.User;
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
     * Return a user based on his principal. @todo Currently only lookup in hte
     * jdbcrealm
     *
     * @param principal
     * @return
     * @throws NoResultException
     */
    public User getUserByPrincipal(String principal) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<AbstractAccount> account = cq.from(AbstractAccount.class);
        cq.where(cb.equal(account.get(AbstractAccount_.principal), principal));
        Query q = em.createQuery(cq);
        return ( (AbstractAccount) q.getSingleResult() ).getUser();
    }

    /**
     *
     *
     * @return a User entity, based on the shiro login state
     */
    public User getCurrentUser() {
        final Subject subject = SecurityUtils.getSubject();

        try {
            return this.getUserByPrincipal(subject.getPrincipal().toString());
        }
        catch (NoResultException e) {                                           // If the user is logged in but we cannot find a
            JdbcRealmAccount acc = new JdbcRealmAccount();
            acc.setPrincipal(subject.getPrincipal().toString());
            User newUser = new User(acc);                                       // corresponding account, that means we need to create one.
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
