/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.jparealm.JpaAccount_;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.AbstractAccount_;
import com.wegas.core.security.persistence.Role;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.ejb.EJB;
import javax.ejb.EJBException;
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
@Stateless
@LocalBean
public class AccountFacade extends BaseFacade<AbstractAccount> {

    private static final int MAXRESULT = 30;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private RoleFacade roleFacade;

    /**
     *
     */
    public AccountFacade() {
        super(AbstractAccount.class);
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
     * @param entityId
     * @param account
     * @return
     */
    @Override
    public AbstractAccount update(final Long entityId, final AbstractAccount account) {
        Set<Role> revivedRoles = new HashSet<>();
        for (Role r : account.getRoles()) {
            try {
                revivedRoles.add(roleFacade.find(r.getId()));
            } catch (EJBException e) {
                // not able to revive this role
            }
        }
        if (!account.getUsername().equals("") && account.getUsername() != null) {// If the provided username is not null
            try {
                AbstractAccount a = this.findByUsername(account.getUsername());
                if (!a.getId().equals(account.getId())) {                       // and we can find an account with the username which is not the one we are editing,
                    throw new WegasException("This username is already in use");// throw an exception
                }
            } catch (NoResultException e) {
                // GOTCHA no username could be found, do not use
            }
        }
        AbstractAccount oAccount = super.update(entityId, account);
        oAccount.setRoles(revivedRoles);

        return oAccount;
    }

    /**
     *
     * @param entity
     */
    @Override
    public void create(AbstractAccount entity) {
        getEntityManager().persist(entity);
    }

    /**
     *
     * @return
     */
    public List<JpaAccount> findAllRegistered() {
        final CriteriaQuery query = getEntityManager().getCriteriaBuilder().createQuery();
        query.select(query.from(JpaAccount.class));
        return getEntityManager().createQuery(query).getResultList();
    }

    /**
     * Return a user based on his principal.
     *
     * @param username
     * @return
     * @throws NoResultException
     */
    public AbstractAccount findByUsername(String username) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<AbstractAccount> account = cq.from(AbstractAccount.class);
        cq.where(cb.equal(account.get(AbstractAccount_.username), username));
        Query q = em.createQuery(cq);
        return (AbstractAccount) q.getSingleResult();
    }

    /**
     *
     * @param email
     * @return
     * @throws NoResultException
     */
    public JpaAccount findByEmail(String email) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<JpaAccount> account = cq.from(JpaAccount.class);
        cq.where(cb.equal(account.get(JpaAccount_.email), email));
        Query q = em.createQuery(cq);
        return (JpaAccount) q.getSingleResult();
    }

    /**
     *
     * @param name
     * @param withEmail
     * @return
     * @throws NoResultException
     */
    public List<JpaAccount> findByNameOrEmail(String name, boolean withEmail) throws NoResultException {
        ArrayList<JpaAccount> accounts = new ArrayList();
        String splidedName[] = name.split(" ");
        for (int i = 0; i < splidedName.length; i++) {
            String firstname = "";
            String lastname = "";
            for (int ii = 0; ii <= i; ii++) {
                firstname = firstname + splidedName[ii] + " ";
            }
            firstname = normalizeName(firstname);
            if (i < splidedName.length - 1) {
                for (int ii = i + 1; ii < splidedName.length; ii++) {
                    lastname = lastname + splidedName[ii] + " ";
                }
            }
            lastname = normalizeName(lastname);
            List<JpaAccount> tempAccount = this.findByNameOrEmailQuery("name", firstname, lastname);
            accounts = this.compareExistingAccount(tempAccount, accounts);
            tempAccount = this.findByNameOrEmailQuery("name", lastname, firstname);
            accounts = this.compareExistingAccount(tempAccount, accounts);
            if (withEmail && splidedName.length == 1) {
                tempAccount = this.findByNameOrEmailQuery("email", splidedName[i], null);
                accounts = this.compareExistingAccount(tempAccount, accounts);
            }
        }
        return accounts;
    }

    private String normalizeName(String name) {
        if (name.equals("")) {
            return "%";
        } else {
            return name.substring(0, name.length() - 1);
        }
    }

    private List<JpaAccount> findByNameOrEmailQuery(final String type, String value1, String value2) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<JpaAccount> account = cq.from(JpaAccount.class);

        switch (type) {
            case "name":
                cq.where(cb.and(cb.like(cb.lower(account.get(JpaAccount_.firstname)), value1.toLowerCase()),
                        cb.like(cb.lower(account.get(JpaAccount_.lastname)), value2.toLowerCase())));
                break;
            case "email":
                cq.where(cb.like(cb.lower(account.get(JpaAccount_.email)), value1.toLowerCase()));
                break;
        }
        Query q = em.createQuery(cq);
        q.setMaxResults(MAXRESULT);
        return (List<JpaAccount>) q.getResultList();
    }

    private ArrayList<JpaAccount> compareExistingAccount(List<JpaAccount> tempAccount, ArrayList<JpaAccount> accounts) {
        for (int i = 0; i < tempAccount.size(); i++) {
            if (!accounts.contains(tempAccount.get(i))) {
                accounts.add(tempAccount.get(i));
            }
        }
        return accounts;
    }

    /**
     *
     * @param team
     * @return
     */
    public ArrayList<AbstractAccount> findByTeam(Team team) {
        ArrayList<AbstractAccount> result = new ArrayList<>();
        for (Player player : team.getPlayers()) {
            if (player.getUser() == null) {
                result.add(player.getUser().getMainAccount());                      // Test players dont have a user, we do not return anything since the target widget would not know what to do with it
            }
        }
        return result;
    }
}
