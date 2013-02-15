/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.RequestFacade;
import java.io.IOException;
import java.io.Serializable;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.bean.ManagedBean;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import org.slf4j.LoggerFactory;

/**
 * Stores error message in session.
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@ManagedBean(name = "error")
public class ErrorController implements Serializable {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(RequestFacade.class);
    private static final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

    public String getErrorMessage() {
        return (String) externalContext.getSessionMap().remove("errorMessage");
    }

    public void setErrorMessage(String errorMessage) {
        externalContext.getSessionMap().put("errorMessage", errorMessage);
    }

    public void dispatch(String errorMsg) {
        this.setErrorMessage(errorMsg);
        try {
            externalContext.dispatch("/wegas-app/view/error/error.xhtml");
        } catch (IOException ex) {
            logger.error("Unable to find error page", ex);
        }
    }
}
