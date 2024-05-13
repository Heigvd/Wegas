package com.wegas.core.security.util;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.pac4j.core.config.Config;

/**
 * Class required to solve this issue:
 * https://stackoverflow.com/questions/77979704/org-jboss-weld-exceptions-deploymentexception-with-pac4j-6-0-1-jakartaee-pac4j
 */

@ApplicationScoped
public class Pac4JSecurityConfig {

    @Produces
    private Config buildConfiguration() {
        return new Config();
    }
}