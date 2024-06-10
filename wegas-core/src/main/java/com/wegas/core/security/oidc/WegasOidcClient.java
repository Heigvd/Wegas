package com.wegas.core.security.oidc;

import com.wegas.core.Helper;
import org.pac4j.core.http.callback.NoParameterCallbackUrlResolver;
import org.pac4j.oidc.client.OidcClient;

public class WegasOidcClient extends OidcClient {

    public WegasOidcClient() {
        super();
        this.setCallbackUrlResolver(new NoParameterCallbackUrlResolver());
        this.setCallbackUrl(Helper.getWegasProperty("oidc.callbackUrl","https://localhost:8443/rest/Oidc/Callback"));
    }
}
