package com.wegas.core.security.oidc;

import com.wegas.core.Helper;
import org.pac4j.core.authorization.generator.AuthorizationGenerator;
import org.pac4j.core.context.CallContext;
import org.pac4j.core.profile.CommonProfile;
import org.pac4j.core.profile.UserProfile;

import java.util.Optional;


public class WegasRememberMeAuthGenerator implements AuthorizationGenerator {
    @Override
    public Optional<UserProfile> generate(final CallContext ctx, final UserProfile profile) {
        ((CommonProfile) profile).removeLoginData(); // remove tokens
        profile.setRemembered(Boolean.parseBoolean(Helper.getWegasProperty("oidc.useRememberMe", "false")));
        return Optional.of(profile);
    }
}
