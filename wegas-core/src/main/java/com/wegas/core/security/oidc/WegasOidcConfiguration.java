package com.wegas.core.security.oidc;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.oauth2.sdk.auth.ClientAuthenticationMethod;
import com.wegas.core.Helper;
import org.pac4j.oidc.config.OidcConfiguration;
import org.pac4j.oidc.config.PrivateKeyJWTClientAuthnMethodConfig;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.ECPrivateKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;


public class WegasOidcConfiguration extends OidcConfiguration {
    public WegasOidcConfiguration() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        super();
        this.setDiscoveryURI(Helper.getWegasProperty("oidc.discoveryURI", "https://localhost:8443/.well-known/openid-configuration"));
        this.setClientId(Helper.getWegasProperty("oidc.clientId", "1234"));
        //TODO: use private key https://www.pac4j.org/docs/clients/openid-connect.html#3-advanced-configuration
        this.setSecret(Helper.getWegasProperty("oidc.secret", "1234"));
        this.setUseNonce(true);
        this.setWithState(true);
        this.setPreferredJwsAlgorithm(JWSAlgorithm.RS256);
        this.addCustomParam("prompt", "consent");
        /*
        //JWT KEY, from: https://www.pac4j.org/docs/clients/openid-connect.html
        this.setClientAuthenticationMethod(ClientAuthenticationMethod.PRIVATE_KEY_JWT);

        //var privateKey = org.jasig.cas.client.util.PrivateKeyUtils.createKey("private-key.pem", "RSA");
//        ECKey.Builder(Curve.P_256, getECPublicKey())
//               .privateKey(getECPrivateKey())
//               .keyID("my_unique_ec_key_ID") // The key ID you specified in the resource registry
//               .build();
        this.setPrivateKeyJWTClientAuthnMethodConfig(
                new PrivateKeyJWTClientAuthnMethodConfig(JWSAlgorithm.ES256,
                        getECPrivateKey(), Helper.getWegasProperty("oidc.clientId")));

         */
    }

    // From: https://help.switch.ch/eduid/docs/services/openid-connect/dev/
    private ECPrivateKey getECPrivateKey() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        byte[] keyBytes = Files.readAllBytes(Paths.get("/path/to/priv_ec.der"));
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("EC");
        return (ECPrivateKey) kf.generatePrivate(spec);
    }
}
