/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.Helper;
import com.wegas.core.Helper.EmailAttributes;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.aai.AaiUserDetails;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.Shadow;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.persistence.token.InviteToJoinToken;
import com.wegas.core.security.persistence.token.ResetPasswordToken;
import com.wegas.core.security.persistence.token.SurveyToken;
import com.wegas.core.security.persistence.token.Token;
import com.wegas.core.security.persistence.token.ValidateAddressToken;
import com.wegas.core.security.util.HashMethod;
import com.wegas.core.security.util.Sudoer;
import com.wegas.core.security.util.TokenInfo;
import com.wegas.messaging.ejb.EMailFacade;
import com.wegas.survey.persistence.SurveyDescriptor;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import javax.naming.NamingException;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
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
    private GameFacade gameFacade;

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
     * Get the current account
     *
     * @return the current account or null
     */
    public AbstractAccount getCurrentAccount() {
        return requestManager.getCurrentAccount();
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
        if (!(account instanceof AaiAccount) && !Helper.isNullOrEmpty(account.getUsername())) {
            try {
                AbstractAccount a = this.findByUsername(account.getUsername());
                if (!a.getId().equals(account.getId())) {                       // and we can find an account with the username which is not the one we are editing,
                    throw WegasErrorMessage.error("This username is already in use");// throw an exception
                }
            } catch (WegasNoResultException e) { //NOPMD
                // GOTCHA no username could be found, do not use
            }
        }

        // Silently discard any modification attempts made by non-admins to the comment field:
        if (!requestManager.isAdmin()) {
            account.setComment(super.find(entityId).getComment());
        }

        AbstractAccount oAccount = super.update(entityId, account);
        if (oAccount != null) {

            if (oAccount instanceof JpaAccount) {
                JpaAccount jpaAccount = (JpaAccount) oAccount;
                if (!Helper.isNullOrEmpty(jpaAccount.getPassword())) {
                    jpaAccount.shadowPasword();
                }
            }

            oAccount.shadowEmail();

// @Deprecated: Admin shall update membershipness with dedicated methods
//            /*
//             * Only an administrator can modify memberships And only if given account contains roles
//             * by itself
//             */
//            if (requestManager.isAdmin() && account.getDeserialisedRoles() != null) {
//                Set<Role> revivedRoles = new HashSet<>();
//                for (Role r : account.getDeserialisedRoles()) {
//                    try {
//                        revivedRoles.add(roleFacade.find(r.getId()));
//                    } catch (EJBException e) {
//                        // not able to revive this role
//                        logger.error("Fails to add role {} to {}", r, account);
//                    }
//                }
//                oAccount.getUser().setRoles(revivedRoles);
//            }
        }

        return oAccount;
    }

    /**
     * Remove an account
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
        final TypedQuery<JpaAccount> query = getEntityManager()
            .createNamedQuery("JpaAccount.findExactClass", JpaAccount.class);
        return query.getResultList();
    }

    /**
     * Get all AAI Accounts
     *
     * @return all AaiAccounts
     */
    public List<AaiAccount> findAllRegisteredAai() {
        final TypedQuery<AaiAccount> query = getEntityManager()
            .createNamedQuery("AaiAccount.findExactClass", AaiAccount.class);
        return query.getResultList();
    }

    /**
     * Get all registered accounts (excluding Guest accounts)
     *
     * @return all registered accounts
     */
    public List<AbstractAccount> findAllRegistered() {
        final TypedQuery<AbstractAccount> query = getEntityManager()
            .createNamedQuery("AbstractAccount.findAllNonGuests", AbstractAccount.class);
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
        final TypedQuery<AbstractAccount> query = getEntityManager()
            .createNamedQuery("AbstractAccount.findByUsername", AbstractAccount.class);
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
        final TypedQuery<JpaAccount> query = getEntityManager()
            .createNamedQuery("JpaAccount.findByUsername", JpaAccount.class);
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
            final TypedQuery<AbstractAccount> query = getEntityManager()
                .createNamedQuery("AbstractAccount.findByEmail", AbstractAccount.class);
            query.setParameter("email", email);
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param name
     *
     * @return all accounts which match the given name (case-insensitive)
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
     * @param name
     *
     * @return all accounts which match the given name (case sensitive)
     *
     */
    public List<AbstractAccount> findAllByEmailOrUsernameCaseSensitive(String name) {
        TypedQuery<AbstractAccount> query = getEntityManager()
            .createNamedQuery("AbstractAccount.findByEmailOrUserNameSensitive",
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
            final TypedQuery<JpaAccount> query = getEntityManager()
                .createNamedQuery("JpaAccount.findByEmail", JpaAccount.class);
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
        final TypedQuery<AaiAccount> query = getEntityManager()
            .createNamedQuery("AaiAccount.findByPersistentId", AaiAccount.class);
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
            logger.error("AAIAccount does not exist");
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

    private List<AbstractAccount> findByNameEmailDomainOrUsernameWithRoles(String input, List<String> roleNames) {
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

        Predicate anyRolePredicate = cb.or(anyRoleFilter
            .toArray(new Predicate[anyRoleFilter.size()]));

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
        return findByNameEmailDomainOrUsernameWithRoles(value, rolesList);
        /* List<String> roles = rolesList.get("rolesList");
         *
         * List<AbstractAccount> returnValue = new ArrayList<>(); for (AbstractAccount a :
         * findByNameEmailDomainOrUsername(value)) { if (userFacade.hasAnyRole(a.getUser(), roles))
         * { returnValue.add(a); } } return returnValue; */

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

    public void setNextAuth(Long accountId, HashMethod nextAuth) {
        AbstractAccount find = this.find(accountId);
        if (find instanceof JpaAccount) {
            JpaAccount account = (JpaAccount) find;
            account.setNextAuth(nextAuth);
            account.setNewSalt(Helper.generateSalt());
        }
    }

    public void setNextShadowHashMethod(Long accountId, HashMethod nextHashMethod) {
        AbstractAccount find = this.find(accountId);
        if (find instanceof JpaAccount) {
            JpaAccount account = (JpaAccount) find;
            account.getShadow().setNextHashMethod(nextHashMethod);
        }
    }

    /**
     * Find token by id
     *
     * @param tokenId id of the token to search
     *
     * @return the token or null if no token was found
     */
    public Token findToken(Long tokenId) {
        return this.getEntityManager().find(Token.class, tokenId);
    }

    /**
     * Find token by the token itself
     *
     * @param token token string to search
     *
     * @return the token
     *
     * @throws WegasNoResultException if token was not found
     */
    public Token findToken(String token) throws WegasNoResultException {
        try {
            TypedQuery<Token> query = getEntityManager()
                .createNamedQuery("Token.findByToken", Token.class);

            query.setParameter("token", token);
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException("Token not found", ex);
        }
    }

    /**
     * Based on the given tokenInfo, find the effective token.
     *
     * @param tokenInfo token identifier
     *
     * @return the token
     *
     * @throws WegasNoResultException if the token does not exist
     */
    public Token getToken(TokenInfo tokenInfo) throws WegasNoResultException {
        try {
            requestManager.su();
            if (tokenInfo.getAccountId() > 0) {
                AbstractAccount account = this.find(tokenInfo.getAccountId());
                String hashedToken = this.hashToken(tokenInfo.getToken(), account);
                Token t = this.findToken(hashedToken);

                if (t != null) {
                    // little hack to expose email
                    // this is not a leak as the only one who knows the token is this very mailbox
                    t.getAccount().setEmail(t.getAccount().getEmail());
                }
                return t;
            } else {
                // anonymous token are not hashed
                return this.findToken(tokenInfo.getToken());
            }
        } finally {
            requestManager.releaseSu();
        }
    }

    /**
     * If the token is not linked to any account, link it to current one. It the token linked to an
     * account, verify it's to the current one
     *
     * @throws WegasErrorMessage if currentSubject is not authenticated or currentSubject is not the
     *                           token owner
     */
    private void setupAndAssertTokenAccount(Long tokenId) {
        Subject subject = SecurityUtils.getSubject();

        if (!Helper.isLoggedIn(subject)) {
            throw WegasErrorMessage.error("Please log in to consume token");
        }

        try ( Sudoer su = requestManager.sudoer()) {
            Token token = this.findToken(tokenId);
            AbstractAccount account = token.getAccount();

            // assert/setup account
            if (account == null) {
                AbstractAccount currentAccount = this.find((Long) subject.getPrincipal());
                token.setAccount(currentAccount);
            } else {
                if (!account.getId().equals(subject.getPrincipal())) {
                    throw WegasErrorMessage.error("Not authorised to consume this token");
                }
            }
        }
    }

    /**
     * Consume the token.
     * <ul>
     * <li>Make sure the token is linked to the currentuser account</li>
     * <li>Decrement remaining uses counter</li>
     * <li>Mark account as verified (JPAAccount only)</li>
     * <li>Call specific token process method</li>
     * </ul>
     *
     * @param token the token to process
     */
    public Token processToken(Long tokenId, HttpServletRequest request) {
        this.setupAndAssertTokenAccount(tokenId);

        Token token = this.findToken(tokenId);
        AbstractAccount account = token.getAccount();

        // Decrement uses counter
        Long remainingUses = token.getRemainingUses();
        if (remainingUses != null) {
            if (remainingUses <= 0) {
                throw WegasErrorMessage.error("The token has already been consumed");
            } else {
                token.setRemainingUses(remainingUses - 1);
            }
        }

        // Mark as verified
        if (account instanceof JpaAccount) {
            ((JpaAccount) account).setVerified(true);
        }

        token.process(this, request);

        return token;
    }

    /**
     * If the token is linked to an account, such token must not be saved in clear text in the db.
     * If given account is not null, salt and hash the given token with hash method from account
     * shadow. If there is no account, return the token as-is
     *
     * @param token   the token to hash
     * @param account the account
     *
     * @return hased token if account exists, plain token otherwise
     */
    private String hashToken(String token, AbstractAccount account) {
        if (account != null) {
            Shadow shadow = account.getShadow();
            if (shadow != null && shadow.getHashMethod() != null) {
                return account.getShadow().getHashMethod().hash(
                    token, account.getShadow().getSalt());
            } else {
                return token;
            }
        } else {
            return token;
        }
    }

    /**
     * Destroy all tokens of the given type from the given account.
     * <p>
     * Destroyed tokens are not useable any-longer.
     *
     * @param account account to clean
     * @param klass   type of token to remove
     */
    private void destroyAllTokenOfType(AbstractAccount account, Class<? extends Token> klass) {
        account.getTokens().stream()
            .filter(t -> klass.isAssignableFrom(t.getClass()))
            // collect to temp list to avoid concurrentModificatioException
            // destroyToken -> Token#updateCacheOnDelete -> account#removeToken()
            .collect(Collectors.toList())
            .forEach(t -> this.destroyToken(t));
    }

    /**
     * Send the JpaAccount a link to validate its email address
     *
     * @param request http request is required to generate the link to send
     */
    public void requestValidationLink(JpaAccount account, HttpServletRequest request) {
        if (account instanceof JpaAccount) {

            /*
             * delete any validationToken which already exists for this account since such tokens
             * have infinite lifespan, we do not want to keep more than one token per account
             */
            this.destroyAllTokenOfType(account, ValidateAddressToken.class);

            ValidateAddressToken token = new ValidateAddressToken();

            token.setAccount(account);
            token.setAutoLogin(false);
            token.setExpiryDate(null);
            token.setRemainingUses(1l);

            token.setToken(Helper.genToken(128));

            this.persistAndSendDisposableToken(token, request, account.getEmail(), null,
                "[AlbaSim Wegas] Please validate your account",
                "Click <a href='{{link}}'>here</a> to confirm your email address.<br /><br />"
                + "If you did't request this verification, you can ignore this message");
        }
    }

    /**
     * Send a link invitation by e-mail
     *
     * @param request http request is required to generate the link to send
     */
    public void inviteByMail(HttpServletRequest request, String recipientAddress,
        boolean forceGuest, Game game, Team team) {

        // trainer or team mate can invite other user
        requestManager.assertUpdateRight(team);

        String sender = requestManager.getCurrentUser().getMainAccount().getName();

        if (game == null && team == null) {
            throw WegasErrorMessage.error("Sending an invitation requires a game or a team");
        } else if (game != null && team != null && !team.getGame().equals(game)) {
            throw WegasErrorMessage.error("Given team is not part of the given game");
        }

        InviteToJoinToken token = new InviteToJoinToken();

        if (team != null) {
            token.setTeam(team);
        } else {
            token.setGame(game);
        }

        token.setAccount(null);
        // no account and no autologin means auto login as guest
        // no account and no autologin requires the user to login/signup
        token.setAutoLogin(forceGuest);

        token.setExpiryDate(null);
        token.setRemainingUses(1l);

        token.setToken(Helper.genToken(128));

        this.persistAndSendDisposableToken(token, request, recipientAddress, sender,
            "[AlbaSim Wegas] Invitation to join a game",
            "Hi " + recipientAddress + "<br /><br />"
            + sender + " invite you to join a game. Click <a href='{{link}}'>here</a> to accept their invitation.");
    }

    /**
     * User request a link to reset its password. It's only valid for JPAAccounts
     *
     * @param request http request is required to generate the link to send
     */
    public void requestPasswordReset(String email, HttpServletRequest request) {
        // as the subject who requires such a lin is unauthenticated, we have to promote it
        try ( Sudoer su = requestManager.sudoer()) {
            JpaAccount account = this.findJpaByEmail(email);
            if (account != null) {

                /*
                 * as reset tokens have limited lifespan, we can keep them, thus if the user request
                 * several link at the same time, all links will be usable
                 */
                ResetPasswordToken token = new ResetPasswordToken();

                token.setAccount(account);
                token.setAutoLogin(true);
                token.setExpiryDate(new Date((new Date()).getTime() + 60 * 60 * 1000)); // 1 hour
                token.setRemainingUses(1l);

                token.setToken(Helper.genToken(128));

                // print GMT date
                SimpleDateFormat sdf = new SimpleDateFormat("dd MMM yyyy hh:mm:ss a");
                sdf.setTimeZone(TimeZone.getTimeZone("GMT"));
                String expire = sdf.format(token.getExpiryDate()) + " GMT";

                this.persistAndSendDisposableToken(token, request, account.getEmail(), null,
                    "[Albasim Wegas] Reset Password Request",
                    "Hi " + account.getName() + ", <br /><br />Click <a href='{{link}}'>here</a> to reset your password.<br /><br />"
                    + "If you did't request this email, then simply ignore this message<br /><br />"
                    + " <hr />"
                    + "<em>This link will be valid until " + expire + "</em>");
            }
            this.flush();
        } catch (WegasNoResultException ex) {
            logger.error("No JPA account for {}", email);
        }
    }

    /**
     *
     * Trainer send invitation to participate in a survey anonymously. This invitation will force to
     * log into an anonymous guest account.
     *
     * @param email   structure with attributes recipients, from, subject and body.
     * @param surveys survey list
     * @param request HTTP request is required to generate the link to send
     */
    public void sendSurveyAnonymousTokens(
        EmailAttributes email,
        List<SurveyDescriptor> surveys,
        HttpServletRequest request) {

        for (String recipient : email.getRecipients()) {
            SurveyToken token = new SurveyToken();
            token.setToken(Helper.genToken(128));

            token.setSurveys(surveys);
            // do not link to given account to force guest login
            token.setAccount(null);
            token.setAutoLogin(true);

            // never expire
            token.setExpiryDate(null);
            // can be used as many times as desired
            token.setRemainingUses(null);

            String body = email.getBody();
            // insert the player email into the text
            if (body.contains("{{player}}")) {
                body = body.replaceAll("\\{\\{player\\}\\}", recipient);
            }

            this.persistAndSendDisposableToken(token, request,
                recipient,
                email.getSender(), // requestManager.getCurrentUser().getMainAccount().getName();
                email.getSubject(), // "[Albasim Wegas] Survey",
                body);              // "Dear " + account.getName() + ", <br /><br />Click <a href='{{link}}'>here</a> to participate in a survey");
        }
    }

    /**
     * Trainer send invitation to participate in a survey (non-anonymously)
     *
     * @param account recipient's account
     * @param email   structure with attributes to, from, subject and body.
     * @param surveys survey list
     * @param request HTTP request is required to generate the link to send
     */
    public void sendSurveyToken(AbstractAccount account,
        EmailAttributes email,
        List<SurveyDescriptor> surveys,
        HttpServletRequest request) {

        SurveyToken token = new SurveyToken();
        token.setToken(Helper.genToken(128));

        token.setSurveys(surveys);
        // link to given account
        token.setAccount(account);
        token.setAutoLogin(true);

        // never expire
        token.setExpiryDate(null);
        // can be used as many times as desired
        token.setRemainingUses(null);

        String body = email.getBody();
        // insert the player name into the text
        if (body.contains("{{player}}")) {
            body = body.replaceAll("\\{\\{player\\}\\}", account.getName());
        }

        this.persistAndSendDisposableToken(token, request,
            email.getRecipient(),
            email.getSender(), // requestManager.getCurrentUser().getMainAccount().getName();
            email.getSubject(), // "[Albasim Wegas] Survey",
            body);              // "Hi " + account.getName() + ", <br /><br />Click <a href='{{link}}'>here</a> to participate in a survey");
    }

    /**
     * Send a disposable token by e-mail to a user.
     *
     * @param request               current http request is used to guess the public hostname to
     *                              generate the link to send
     * @param account               Jpa account to send email to
     * @param subject               Subject of the message
     * @param autologin             autologin/create guest or request explicit authentication ?
     * @param text                  text of the message with "{{link}}"
     * @param redirectTO            reset or verify
     * @param tokenValidityDuration how long the token will be valid, in minutes, null means
     *                              infinity
     */
    private void persistAndSendDisposableToken(Token token, HttpServletRequest request,
        String recipientAddress, String fromCommonName,
        String subject, String text) {
        User currentUser = requestManager.getCurrentUser();
        if (currentUser != null && recipientAddress != null) {
            try {
                //only root can create token
                requestManager.su();
                logger.trace("Send {} to {}", token.getClass().getSimpleName(),
                    recipientAddress);

                String plainToken = token.getToken();

                AbstractAccount account = token.getAccount();
                if (account != null) {
                    account.addToken(token);
                    token.setToken(hashToken(token.getToken(), account));
                    if (!recipientAddress.equals(account.getEmail())) {
                        logger.error("Given recipient address \"{}\" does not match account address \"{}\"",
                            recipientAddress, account.getEmail());
                        throw WegasErrorMessage.error("Given recipient address does not match account address");
                    }
                }

                EMailFacade emailFacade = new EMailFacade();

                requestManager.getEntityManager().persist(token);

                Long accountId = account != null ? account.getId() : 0l;

                String theLink = Helper.getPublicBaseUrl(request) + "/#/token/" + accountId + "/" + plainToken;
                // insert the link within the text
                if (text.contains("{{link}}")) {
                    // a placeholder is present in the text, replace it
                    text = text.replaceAll("\\{\\{link\\}\\}", theLink);
                } else {
                    // no placeholder -> append
                    text = text + "<br /><a href='" + theLink + "'>" + theLink + "</a>";
                }
                logger.trace("Token message is ready to be sent : {}", text);

                String from = "noreply@" + Helper.getWegasProperty("mail.default_domain");
                if (!Helper.isNullOrEmpty(fromCommonName)) {
                    from = fromCommonName + " <" + from + ">";
                }
                emailFacade.send(recipientAddress, from, null, subject,
                    text, Message.RecipientType.TO,
                    "text/html; charset=utf-8", true);
            } catch (MessagingException ex) {
                logger.error("Error while sending email to {}, {}", recipientAddress, ex);
            } finally {
                requestManager.getEntityManager().flush();
                requestManager.releaseSu();
            }
        }
    }

    /**
     * Destroy all outdated tokens
     */
    public void removeOutdatedTokens() {
        TypedQuery<Token> query = getEntityManager()
            .createNamedQuery("Token.findOutdatedTokens", Token.class);

        query.setParameter("now", new Date());
        List<Token> tokens = query.getResultList();
        for (Token token : tokens) {
            // double check
            if (!token.isStillValid()) {
                this.destroyToken(token);
            }
        }
    }

    /**
     * Destroy the token
     *
     * @param token token to destroy
     */
    public void destroyToken(Token token) {
        logger.info("Destroy Token {}", token);
        this.getEntityManager().remove(token);
    }

    /**
     * If the current player has not already join the tean in the token, join it.
     *
     * @param token   invitation
     * @param request http request which contains user languages preferences
     */
    public void processJoin(InviteToJoinToken token, HttpServletRequest request) {
        Player player = null;
        User user = requestManager.getCurrentUser();
        Long userId = user.getId();
        if (token != null) {
            // has the user already joined the game ?
            if (token.getTeam() != null) {
                player = playerFacade.findPlayerInTeam(token.getTeam().getId(), userId);
                if (player == null) {
                    // no player in the team
                    // check in the game
                    player = playerFacade.findPlayer(token.getTeam().getGameId(), userId);
                    if (player != null) {
                        // user has already joined the game, but not in the requested team
                        // TODO: do not know what to do. Throw error?
                    }
                }
            } else if (token.getGame() != null) {
                player = playerFacade.findPlayer(token.getTeam().getId(), userId);
            }

            if (player == null) {
                // no -> join the game/team
                ArrayList<Locale> languages = request != null ? Collections.list(request
                    .getLocales()) : null;
                // join !
                if (token.getTeam() != null) {
                    // join that team
                    gameFacade.joinTeam(token.getTeam().getId(), languages);
                } else if (token.getGame() != null) {
                    if (token.getGame().getProperties().getFreeForAll()) {
                        // join that game in own team
                        gameFacade.joinIndividually(token.getGame(), languages);
                    } else {
                        // redirect to join team modale but such a config is quite strange
                    }
                }
            }
        }
    }

    public void processSurveyToken(SurveyToken token, HttpServletRequest request) {
        if (token != null) {

            GameModel gameModel = token.getGameModel();
            if (gameModel.isPlay()) {
                User user = requestManager.getCurrentUser();
                Long userId = user.getId();

                Player player = playerFacade.findPlayerInGameModel(gameModel.getId(), userId);
                if (player == null) {
                    // join as SurveyPlayer
                    ArrayList<Locale> languages = request != null ? Collections.list(request
                        .getLocales()) : null;
                    gameFacade.joinForSurvey(gameModel.getGames().get(0), languages);
                }
            } else {
                throw WegasErrorMessage.error("Invitiation only works for real game");
            }
        }
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
