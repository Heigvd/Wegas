package com.wegas.core.security.oidc;

import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.aai.AaiAuthenticationInfo;
import com.wegas.core.security.aai.AaiUserDetails;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import io.buji.pac4j.realm.Pac4jRealm;
import io.buji.pac4j.token.Pac4jToken;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.subject.PrincipalCollection;
import org.pac4j.core.profile.UserProfile;
import org.pac4j.oidc.profile.OidcProfile;
import org.slf4j.LoggerFactory;

import java.util.List;

public class Pac4jOidcWegasRealm extends Pac4jRealm {
    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(Pac4jOidcWegasRealm.class);

    public Pac4jOidcWegasRealm() {
        setAuthenticationTokenClass(Pac4jToken.class);
        setName("Pac4jOidcWegasRealm");                //This name must match the name in the User class's getPrincipals() method
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        //Effective authorisations are fetched by JpaRealm in all case
        return new SimpleAuthorizationInfo();
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(final AuthenticationToken authenticationToken) {

        //TODO check already loggedin?

        if (!Boolean.parseBoolean(Helper.getWegasProperty("oidc.enabled"))) {
            logger.warn("EduID OIDC is disabled");
            return null;
        }

        final Pac4jToken token = (Pac4jToken) authenticationToken;
        final List<UserProfile> profiles = token.getProfiles();

        AaiUserDetails userDetails = new AaiUserDetails();
        OidcProfile profile = (OidcProfile) profiles.get(0);

        // reject if values are null!
        if(profile.getId().isEmpty() || profile.getFirstName().isEmpty() || profile.getFamilyName().isEmpty() || profile.getEmail().isEmpty())
            throw new AuthenticationException("Profile does not provide information");

        userDetails.setPersistentId(null); //OLD AAI
        userDetails.setEduIdPairwiseId(profile.getId());
        userDetails.setEmail(profile.getEmail());
        userDetails.setFirstname(profile.getFirstName());
        userDetails.setLastname(profile.getFamilyName());
        userDetails.setRememberMe(false);
        userDetails.setHomeOrg("EduId"); //affiliations are not (easily) accessible with edu id, so we just set eduid

        AccountFacade accountFacade = AccountFacade.lookup();
        RequestManager requestManager = RequestFacade.lookup().getRequestManager();
        try {
            requestManager.su();
            AaiAccount account = accountFacade.findByEduIdPairwiseId(userDetails.getEduIdPairwiseId());
            accountFacade.refreshEduIDAccount(userDetails);
            logger.info("EduID user found, logging in user " + account.getId());
            return new AaiAuthenticationInfo(account.getId(), userDetails, getName());
        } catch (WegasNoResultException ex) {
            logger.info("User not found, creating new account.");
            AaiAccount account = AaiAccount.buildForEduIdPairwiseId(userDetails);
            User user = new User(account);
            UserFacade userFacade = UserFacade.lookup();
            userFacade.create(user);
            return new AaiAuthenticationInfo(account.getId(), userDetails, getName());
        } catch (Exception e) {
            return null;
        } finally {
            requestManager.releaseSu();
        }
    }
}