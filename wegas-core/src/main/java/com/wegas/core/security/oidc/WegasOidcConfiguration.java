package com.wegas.core.security.oidc;

import com.nimbusds.jose.JWSAlgorithm;
import com.wegas.core.Helper;
import org.pac4j.oidc.config.OidcConfiguration;


public class WegasOidcConfiguration extends OidcConfiguration {
    public WegasOidcConfiguration() {
        super();
        this.setDiscoveryURI(Helper.getWegasProperty("oidc.discoveryURI", "https://localhost:8443/.well-known/openid-configuration"));
        this.setClientId(Helper.getWegasProperty("oidc.clientId", "1234"));
        //TODO: use private key https://www.pac4j.org/docs/clients/openid-connect.html#3-advanced-configuration
        this.setSecret(Helper.getWegasProperty("oidc.secret", "1234"));
        this.setUseNonce(true);
        this.setWithState(true);
        this.setPreferredJwsAlgorithm(JWSAlgorithm.RS256);
        this.addCustomParam("prompt", "consent");
    }
}
