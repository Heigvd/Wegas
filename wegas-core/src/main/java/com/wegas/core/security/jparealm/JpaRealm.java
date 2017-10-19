/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJBException;
import javax.naming.NamingException;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.SimpleByteSource;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class JpaRealm extends AuthorizingRealm {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(JpaRealm.class);

    /**
     *
     */
    public JpaRealm() {
        setName("JpaRealm");                                                    //This name must match the name in the User class's getPrincipals() method
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authcToken) throws AuthenticationException {
        UsernamePasswordToken token = (UsernamePasswordToken) authcToken;
        try {
            AccountFacade accountFacade = accountFacade();
            try {
                JpaAccount account = accountFacade.findJpaByEmail(token.getUsername());
                SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(account.getId(), account.getPasswordHex(), getName());
                info.setCredentialsSalt(new SimpleByteSource(account.getSalt()));
                return info;

            } catch (WegasNoResultException e) {                                         // Could not find correponding mail,
                try {
                    JpaAccount account = accountFacade.findJpaByUsername(token.getUsername());// try with the username
                    SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(account.getId(), account.getPasswordHex(), getName());
                    info.setCredentialsSalt(new SimpleByteSource(account.getSalt()));
                    return info;

                } catch (WegasNoResultException ex) {
                    logger.error("Unable to find token", ex);
                    return null;
                }
            }
        } catch (NamingException ex) {
            logger.error("Unable to find AccountFacade EJB", ex);
            return null;
        }
    }

    private SimpleAuthorizationInfo newWay(PrincipalCollection principals) {
        SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();

        RequestManager rManager = RequestFacade.lookup().getRequestManager();

        for (String roleName : rManager.getEffectiveRoles()) {
            info.addRole(roleName);
        }

        /**
         * Load permissions from DB
         */
        for (String p : rManager.getEffectiveDBPermissions()) {
            info.addStringPermission(p);
        }

        return info;
    }

    private SimpleAuthorizationInfo oldWay(PrincipalCollection principals) {
        SimpleAuthorizationInfo info = null;
        try {
            AbstractAccount account = accountFacade().find((Long) principals.getPrimaryPrincipal());
            if (account != null) {

                info = new SimpleAuthorizationInfo();

                UserFacade userFacade = UserFacade.lookup();
                User user = account.getUser();
                for (Role role : userFacade.findRoles(user)) {
                    info.addRole(role.getName());
                }

                for (Permission p : userFacade.findAllUserPermissions(user)) {
                    // not yet persisted permission should be ignored
                    if (this.isLive(p)) {
                        //logger.error("accept permission: {}", p.getValue());
                        addPermissions(info, p);
                        //} else {
                        //logger.error("reject permission: {}", p.getValue());
                    }
                }
            }
        } catch (NamingException ex) {
        }
        return info;
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        try {

            SimpleAuthorizationInfo info = this.newWay(principals);

            return info;
        } catch (EJBException e) {
            Helper.printWegasStackTrace(e);
            return null;
        }
    }

    private boolean isPermId(String id) {
        return id.matches("(g|gm)\\d+");
    }

    /**
     * Checl if the permission is valid.
     * A valid permission is a persisted one or a not-yet perstisted linked to a not-yet persisted game/gameModel
     *
     * @param p
     *
     * @return
     */
    private boolean isLive(Permission p) {
        if (p.isPersisted()) {
            return true;
        }

        String[] split = p.getValue().split(":");

        if (split.length == 3) {
            String perm = split[2];
            switch (split[0]) {
                case "GameModel":
                    if (isPermId(perm)) {
                        GameModel gameModel = GameModelFacade.lookup().find(Long.parseLong(perm.replaceFirst("gm", "")));
                        if (gameModel != null) {
                            return !gameModel.isPersisted();
                        }
                    }
                case "Game":
                    if (isPermId(perm)) {
                        Game game = GameFacade.lookup().find(Long.parseLong(perm.replaceFirst("g", "")));
                        if (game != null) {
                            return !game.isPersisted();
                        }
                    }
            }
        }
        return false;
    }

    /**
     *
     * @return @throws NamingException
     */
    public AccountFacade accountFacade() throws NamingException {
        return Helper.lookupBy(AccountFacade.class);
    }

    /**
     *
     * @param info
     * @param p
     */
    public static void addPermissions(SimpleAuthorizationInfo info, Permission p) {
        info.addStringPermission(p.getValue());
        /*if (p.getInducedPermission() != null && !p.getInducedPermission().isEmpty()) {
            info.addStringPermission(p.getInducedPermission());
        }*/
    }
}
