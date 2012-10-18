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
import com.wegas.core.security.persistence.GuestAccount;
import com.wegas.core.security.persistence.User;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
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
    @EJB
    private AccountFacade accountFacade;

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
     *
     * @return a User entity, based on the shiro login state
     */
    public User getCurrentUser() {
        final Subject subject = SecurityUtils.getSubject();
        if (subject.isAuthenticated()) {
            return accountFacade.find((Long) subject.getPrincipal()).getUser();
        } else {
            User newUser = new User(new GuestAccount());                        // return a Guest user
            if (ResourceBundle.getBundle("wegas").getString("guestallowed").equals("true")) {
                //userFacade.create(newUser);                                   // @fixme For now we do not persist this new user
            }
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
