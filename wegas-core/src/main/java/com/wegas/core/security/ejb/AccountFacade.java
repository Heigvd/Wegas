/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.aai.AaiUserDetails;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.*;
import javax.ejb.EJBException;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Join;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class AccountFacade extends BaseFacade<AbstractAccount> {

    private static final Logger logger = LoggerFactory.getLogger(AccountFacade.class);

    /**
     *
     */
    @Inject
    private RoleFacade roleFacade;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private UserFacade userFacade;

    /**
     *
     */
    public AccountFacade() {
        super(AbstractAccount.class);
    }

    /**
     * Update an account
     *
     * @param entityId id of account to update
     * @param account  account to update from
     *
     * @return up to date account
     */
    @Override
    public AbstractAccount update(final Long entityId, final AbstractAccount account) {
        if (!(account instanceof AaiAccount)) {
            if (account.getUsername() != null && !account.getUsername().equals("")) {// If the provided username is not null
                try {
                    AbstractAccount a = this.findByUsername(account.getUsername());
                    if (!a.getId().equals(account.getId())) {                       // and we can find an account with the username which is not the one we are editing,
                        throw WegasErrorMessage.error("This username is already in use");// throw an exception
                    }
                } catch (WegasNoResultException e) {
                    // GOTCHA no username could be found, do not use
                }
            }
        }

        // Silently discard any modification attempts made by non-admins to the comment field:
        if (!requestManager.isAdmin()) {
            account.setComment(super.find(entityId).getComment());
        }

        AbstractAccount oAccount = super.update(entityId, account);

        if (oAccount instanceof JpaAccount) {
            JpaAccount jpaAccount = (JpaAccount) oAccount;
            if (!Helper.isNullOrEmpty(jpaAccount.getPassword())) {
                jpaAccount.shadowPasword();
            }
        }

        oAccount.shadowEmail();

        /*
         * Only an administrator can modify memberships
         */
        if (requestManager.isAdmin()) {
            // Only if given account contains roles by itself
            if (account.getDeserialisedRoles() != null) {
                Set<Role> revivedRoles = new HashSet<>();
                for (Role r : account.getDeserialisedRoles()) {
                    try {
                        revivedRoles.add(roleFacade.find(r.getId()));
                    } catch (EJBException e) {
                        // not able to revive this role
                    }
                }
                oAccount.getUser().setRoles(revivedRoles);
            }
        }

        return oAccount;
    }

    /**
     * Remvoe an account
     *
     * @param entity account to remove
     */
    @Override
    public void remove(AbstractAccount entity) {
        User user = entity.getUser();

        user.getAccounts().remove(entity);
        getEntityManager().remove(entity);

        if (user.getAccounts().isEmpty()) {
            userFacade.remove(user);
        }
    }

    /**
     * Create an account
     *
     * @param entity account to persist
     */
    @Override
    public void create(AbstractAccount entity) {
        getEntityManager().persist(entity);
    }

    /**
     * Get all JPA Accounts
     *
     * @return all JPAAccounts
     */
    public List<JpaAccount> findAllRegisteredJpa() {
        final TypedQuery<JpaAccount> query = getEntityManager().createNamedQuery("JpaAccount.findExactClass", JpaAccount.class);
        return query.getResultList();
    }

    /**
     * Get all AAI Accounts
     *
     * @return all AaiAccounts
     */
    public List<AaiAccount> findAllRegisteredAai() {
        final TypedQuery<AaiAccount> query = getEntityManager().createNamedQuery("AaiAccount.findExactClass", AaiAccount.class);
        return query.getResultList();
    }

    /**
     * Get all registered accounts (excluding Guest accounts)
     *
     * @return all registered accounts
     */
    public List<AbstractAccount> findAllRegistered() {
        final TypedQuery<AbstractAccount> query = getEntityManager().createNamedQuery("AbstractAccount.findAllNonGuests", AbstractAccount.class);
        return query.getResultList();
    }

    /**
     * Return a user based on his username.
     *
     * @param username
     *
     * @return the user who owns an account with the given username
     *
     * @throws WegasNoResultException if no such a user exists
     */
    public AbstractAccount findByUsername(String username) throws WegasNoResultException {
        final TypedQuery<AbstractAccount> query = getEntityManager().createNamedQuery("AbstractAccount.findByUsername", AbstractAccount.class);
        query.setParameter("username", username);
        try {
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * Return a user based on his username.
     *
     * @param username
     *
     * @return the user who owns an account with the given username
     *
     * @throws WegasNoResultException if no such a user exists
     */
    public JpaAccount findJpaByUsername(String username) throws WegasNoResultException {
        final TypedQuery<JpaAccount> query = getEntityManager().createNamedQuery("JpaAccount.findByUsername", JpaAccount.class);
        query.setParameter("username", username);
        try {
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param email
     *
     * @return the user who owns an account with this email address (excluding guests).
     *
     * @throws WegasNoResultException if no such a user exists
     */
    public AbstractAccount findByEmail(String email) throws WegasNoResultException {
        try {
            final TypedQuery<AbstractAccount> query = getEntityManager().createNamedQuery("AbstractAccount.findByEmail", AbstractAccount.class);
            query.setParameter("email", email);
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param name
     *
     * @return all accounts which match the given name
     *
     */
    public List<AbstractAccount> findAllByEmailOrUsername(String name) {
        TypedQuery<AbstractAccount> query = getEntityManager()
            .createNamedQuery("AbstractAccount.findByEmailOrUserName",
                AbstractAccount.class);
        query.setParameter("name", name);
        return query.getResultList();
    }

    /**
     * @param email
     *
     * @return the JPA user who owns an account with this email address
     *
     * @throws WegasNoResultException if no such a user exists
     */
    public JpaAccount findJpaByEmail(String email) throws WegasNoResultException {
        try {
            final TypedQuery<JpaAccount> query = getEntityManager().createNamedQuery("JpaAccount.findByEmail", JpaAccount.class);
            query.setParameter("email", email);
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * Return a user based on his persistentID.
     *
     * @param persistentId
     *
     * @return the user who owns an with the given username
     *
     * @throws WegasNoResultException if no such a user exists
     */
    public AaiAccount findByPersistentId(String persistentId) throws WegasNoResultException {
        final TypedQuery<AaiAccount> query = getEntityManager().createNamedQuery("AaiAccount.findByPersistentId", AaiAccount.class);
        query.setParameter("persistentId", persistentId);
        try {
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * Updates local AAI account with any modified data received at login.
     *
     * @param userDetails the freshest version of user details
     */
    public void refreshAaiAccount(AaiUserDetails userDetails) {
        try {
            AaiAccount a = findByPersistentId(userDetails.getPersistentId());

            if (!a.getFirstname().equals(userDetails.getFirstname())
                || !a.getLastname().equals(userDetails.getLastname())
                || !a.getHomeOrg().equals(userDetails.getHomeOrg())
                || !a.getDetails().getEmail().equals(userDetails.getEmail())) {

                a.merge(AaiAccount.build(userDetails)); //HAZARDOUS!!!!
                update(a.getId(), a);
            }
        } catch (WegasNoResultException ex) {
            // Ignore
        }
    }

    private Predicate getAccountAutoCompleteFilter(String input) {
        CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();

        String[] tokens = input.split(" ");
        List<Predicate> andPreds = new ArrayList<>(tokens.length);

        CriteriaQuery<AbstractAccount> cq = cb.createQuery(AbstractAccount.class);
        Root<AbstractAccount> account = cq.from(AbstractAccount.class);

        int i;
        for (i = 0; i < tokens.length; i++) {
            String token = tokens[i];
            if (!token.isEmpty()) {
                token = "%" + token.toLowerCase() + "%";

                andPreds.add(
                    cb.or(
                        cb.like(cb.lower(account.get("firstname")), token),
                        cb.like(cb.lower(account.get("lastname")), token),
                        cb.like(cb.lower(account.get("emailDomain")), token),
                        cb.like(cb.lower(account.get("username")), token)
                    )
                );
            }
        }
        andPreds.add(cb.notEqual(account.type(), GuestJpaAccount.class)); // Exclude guest accounts

        return cb.and(andPreds.toArray(new Predicate[andPreds.size()]));
    }

    /**
     * Look for AbstractAccounts (except guests) matching given value.
     * <p>
     * The value can be part of the first name, last name, email or username.
     *
     * @param input search token
     *
     * @return list of AbstractAccount matching the token
     */
    public List<AbstractAccount> findByNameEmailDomainOrUsername(String input) {
        CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        CriteriaQuery<AbstractAccount> cq = cb.createQuery(AbstractAccount.class);

        Predicate filter = this.getAccountAutoCompleteFilter(input);
        cq.where(filter);

        TypedQuery<AbstractAccount> q = getEntityManager().createQuery(cq);
        return q.getResultList();
    }

    public List<AbstractAccount> findByNameEmailDomainOrUsername_withRoles(String input, List<String> roleNames) {
        CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        CriteriaQuery<AbstractAccount> cq = cb.createQuery(AbstractAccount.class);

        Root<AbstractAccount> account = cq.from(AbstractAccount.class);

        String[] tokens = input.split(" ");
        List<Predicate> andPreds = new ArrayList<>(tokens.length);

        int i;
        for (i = 0; i < tokens.length; i++) {
            String token = tokens[i];
            if (!token.isEmpty()) {
                token = "%" + token.toLowerCase() + "%";

                andPreds.add(
                    cb.or(
                        cb.like(cb.lower(account.get("firstname")), token),
                        cb.like(cb.lower(account.get("lastname")), token),
                        cb.like(cb.lower(account.get("emailDomain")), token),
                        cb.like(cb.lower(account.get("username")), token)
                    )
                );
            }
        }
        andPreds.add(cb.notEqual(account.type(), GuestJpaAccount.class)); // Exclude guest accounts

        Predicate tokenPredicate = cb.and(andPreds.toArray(new Predicate[andPreds.size()]));

        List<Predicate> anyRoleFilter = new ArrayList<>();

        Join<AbstractAccount, User> user = account.join("user");
        Join<User, Role> role = user.join("roles");

        for (String roleName : roleNames) {
            anyRoleFilter.add(
                cb.equal(role.get("name"), roleName)
            );
        }

        Predicate anyRolePredicate = cb.or(anyRoleFilter.toArray(new Predicate[anyRoleFilter.size()]));

        cq.where(cb.and(anyRolePredicate, tokenPredicate));

        cq.distinct(true);

        TypedQuery<AbstractAccount> q = getEntityManager().createQuery(cq);

        return q.getResultList();
    }

    /**
     * Same as {@link #getAutoComplete(java.lang.String) getAutoComplete} but account must be member
     * of (at least) one role in rolesList
     *
     * @param value     account search token
     * @param rolesList list of roles targeted account should be members (only one membership is
     *                  sufficient)
     *
     * @return list of AbstractAccounts (excluding guest accounts) matching the token that are a
     *         member of at least one given role
     */
    public List<AbstractAccount> getAutoCompleteByRoles(String value, List<String> rolesList) {
        return findByNameEmailDomainOrUsername_withRoles(value, rolesList);
        /*List<String> roles = rolesList.get("rolesList");

        List<AbstractAccount> returnValue = new ArrayList<>();
        for (AbstractAccount a : findByNameEmailDomainOrUsername(value)) {
            if (userFacade.hasAnyRole(a.getUser(), roles)) {
                returnValue.add(a);
            }
        }
        return returnValue;*/

    }

    /**
     * @param team
     *
     * @return all users who have a player registered in the given team
     */
    public ArrayList<AbstractAccount> findByTeam(Team team) {
        ArrayList<AbstractAccount> result = new ArrayList<>();
        for (Player player : team.getPlayers()) {
            if (player.getUser() != null) {
                // Test players dont have a user, we do not return anything since the target widget would not know what to do with it
                result.add(player.getUser().getMainAccount());
            }
        }
        return result;
    }

    /**
     * Look for AbstractAccounts (except guests) matching given value.
     * <p>
     * The value can be part of the first name, last name, email or username.
     *
     * @param value search token
     *
     * @return list of AbstractAccount matching the token
     */
    public List<AbstractAccount> getAutoComplete(String value) {
        return findByNameEmailDomainOrUsername(value);
    }

    // Remark: excludes guest accounts
    public List<AbstractAccount> getAutoCompleteFull(String value, Long gameId) {
        List<AbstractAccount> accounts = this.getAutoComplete(value);
        for (Iterator<AbstractAccount> it = accounts.iterator(); it.hasNext();) {
            AbstractAccount ja = it.next();
            if (playerFacade.isInGame(gameId, ja.getUser().getId())) {
                it.remove();
            }
        }
        return accounts;
    }

    /**
     * @return Looked-up EJB
     */
    public static AccountFacade lookup() {
        try {
            return Helper.lookupBy(AccountFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving account facade", ex);
            return null;
        }
    }
}
