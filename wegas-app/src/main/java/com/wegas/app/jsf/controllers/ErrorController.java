
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.RequestFacade;
import java.io.IOException;
import java.io.Serializable;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.inject.Named;
import org.slf4j.LoggerFactory;

/**
 * Stores error message in session.
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Named("error")
public class ErrorController implements Serializable {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(RequestFacade.class);
    private static final long serialVersionUID = 5105141712902571973L;

    public String getErrorTitle() {
        return (String) FacesContext.getCurrentInstance().getExternalContext().getSessionMap().remove("errorTitle");
    }

    public void setErrorTitle(String errorTitle) {
        FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("errorTitle", errorTitle);
    }

    public String getErrorMessage() {
        return (String) FacesContext.getCurrentInstance().getExternalContext().getSessionMap().remove("errorMessage");
    }

    public void setErrorMessage(String errorMessage) {
        FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("errorMessage", errorMessage);
    }

    public void dispatch(String title, String errorMsg) {
        this.setErrorTitle(title);
        this.setErrorMessage(errorMsg);
        try {
            ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();
            externalContext.dispatch("/wegas-app/jsf/error/error.xhtml");
        } catch (IOException ex) {
            logger.error("Unable to find error page", ex);
        }
    }

    public void dispatch(String errorMsg) {
        this.dispatch(null, errorMsg);
    }

    public void gameNotFound() {
        this.dispatch("Game not found", "The game you are looking for could not be found");
    }

    public void accessDenied() {
        this.dispatch("Access Denied", "You do not have access to this game");
    }

    public void accessForSurveyOnly() {
        this.dispatch("Access Denied", "You do not have access to this game");
    }

    void gameDeleted() {
        this.dispatch("Game has been deleted", "The game you are looking for has been deleted");
    }
}
