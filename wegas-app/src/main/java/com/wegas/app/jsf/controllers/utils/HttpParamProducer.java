/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers.utils;

import com.wegas.core.Helper;
import jakarta.enterprise.inject.Produces;
import jakarta.enterprise.inject.spi.InjectionPoint;
import jakarta.faces.context.FacesContext;

/**
 *
 * @author maxence
 */
public class HttpParamProducer {

    /*@Inject
    FacesContext facesContext;
     */
    @Produces
    @HttpParam
    String getHttpParam(InjectionPoint ip) {
        String name = ip.getAnnotated().getAnnotation(HttpParam.class).value();

        if (Helper.isNullOrEmpty(name)) {
            // use field name id no value is provided
            name = ip.getMember().getName();
        }
        return FacesContext.getCurrentInstance().getExternalContext().getRequestParameterMap().get(name);
    }

    @Produces
    @HttpParam
    Long getHttpParamAsLong(InjectionPoint ip) {
        String httpParam = this.getHttpParam(ip);
        if (!Helper.isNullOrEmpty(httpParam)) {
            return Long.parseLong(httpParam, 10);
        }
        return null;
    }

	@Produces
    @HttpParam
    Boolean getHttpParamAsBoolean(InjectionPoint ip) {
        String httpParam = this.getHttpParam(ip);
		return "true".equals(httpParam);
    }
}
