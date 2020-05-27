
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.Helper;
import java.io.IOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.enterprise.context.RequestScoped;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.Provider;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.Permission;
import org.apache.shiro.authz.annotation.RequiresAuthentication;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.apache.shiro.authz.permission.WildcardPermission;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Assert current user has all sufficient right to use the targeted REST resource
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Provider
@RequestScoped // payara 3994 workaround (fixed in 193)
public class SecurityFilter implements ContainerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(SecurityFilter.class);

    /*
     * Post-matching filter knows the targeted resource by injecting 
     * such a ResourceInfo
     */
    @Context
    private ResourceInfo resourceInfo;

    private <T extends Annotation> T getAnnotation(Class<T> annotation, Class<?> klass, Method method) {
        T a = method.getAnnotation(annotation);
        if (a == null) {
            a = klass.getAnnotation(annotation);
        }
        return a;
    }

    @Override
    public void filter(ContainerRequestContext crc) throws IOException {

        // Targeted Class & method
        final Class<?> runtimeClass = resourceInfo.getResourceClass();
        Method method = resourceInfo.getResourceMethod();

        Subject subject = SecurityUtils.getSubject();

        /*
         * Is authentication required ?
         */
        RequiresAuthentication authRequired = this.getAnnotation(RequiresAuthentication.class, runtimeClass, method);

        // if Annotation found, assert subject is authenticated
        if (authRequired != null && !Helper.isLoggedIn(subject)) {
            logger.error("Access denied for non-authenticted users");
            crc.abortWith(Response.status(Response.Status.UNAUTHORIZED).entity("Subject is not logged in").build());
        }
        /*
         * Check if specific roles are required
         */
        RequiresRoles requiredRoles = this.getAnnotation(RequiresRoles.class, runtimeClass, method);

        if (requiredRoles != null) {
            List<String> listOfRoles = Arrays.asList(requiredRoles.value());

            boolean[] boolRoles = subject.hasRoles(listOfRoles);
            boolean roleVerified = false;

            for (boolean b : boolRoles) {
                if (b) {
                    roleVerified = true;
                    break;
                }
            }
            if (!roleVerified) {
                String msg = "Access denied. User doesn't have enough privilege Roles:"
                    + listOfRoles + " to access this page.";
                logger.error("Access denied missing roles");
                crc.abortWith(Response.status(Response.Status.FORBIDDEN).entity(msg).build());
            }
        }
        /*
         * and lastly check for permissions
         */
        RequiresPermissions requiredPermissions = getAnnotation(RequiresPermissions.class, runtimeClass, method);

        if (requiredPermissions != null) {
            List<String> listOfPermissionsString = Arrays.asList(requiredPermissions.value());

            List<Permission> listOfPermissions = new ArrayList<>();
            for (String p : listOfPermissionsString) {
                listOfPermissions.add(new WildcardPermission(p));
            }
            boolean[] boolPermissions = subject.isPermitted(listOfPermissions);
            boolean permitted = false;
            for (boolean b : boolPermissions) {
                if (b) {
                    permitted = true;
                    break;
                }
            }
            if (!permitted) {
                String msg = "Access denied. User doesn't have enough privilege Permissions:"
                    + listOfPermissions + " to access this page.";
                logger.error("Access denied: missing permissions");
                crc.abortWith(Response.status(Response.Status.FORBIDDEN).entity(msg).build());
            }
        }
    }
}
