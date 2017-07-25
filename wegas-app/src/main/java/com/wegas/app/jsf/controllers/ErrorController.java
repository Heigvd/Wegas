/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.RequestFacade;
import java.io.IOException;
import java.io.Serializable;
import javax.faces.bean.ManagedBean;
import javax.faces.context.FacesContext;
import org.slf4j.LoggerFactory;

/**
 * Stores error message in session.
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@ManagedBean(name = "error")
public class ErrorController implements Serializable {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(RequestFacade.class);
    private static final long serialVersionUID = 5105141712902571973L;

    public String getErrorMessage() {
        return (String) FacesContext.getCurrentInstance().getExternalContext().getSessionMap().remove("errorMessage");
    }

    public void setErrorMessage(String errorMessage) {
        FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("errorMessage", errorMessage);
    }

    public void dispatch(String errorMsg) {
        this.setErrorMessage(errorMsg);
        try {
            FacesContext.getCurrentInstance().getExternalContext().dispatch("/wegas-app/jsf/error/error.xhtml");
        } catch (IOException ex) {
            logger.error("Unable to find error page", ex);
        }
    }

    public void accessDenied() {
        try {
            FacesContext.getCurrentInstance().getExternalContext().dispatch("/wegas-app/jsf/error/accessdenied.xhtml");
        } catch (IOException ex) {
            logger.error("Unable to find error page", ex);
        }
    }
}
