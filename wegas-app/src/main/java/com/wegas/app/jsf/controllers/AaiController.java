
import com.wegas.app.jsf.controllers.ErrorController;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import javax.enterprise.context.RequestScoped;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import javax.inject.Named;
import javax.servlet.http.HttpServletRequest;

/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

 /*
 * Copyright (c) AlbaSim, School of Business and Engineering of Western Switzerland
 * Licensed under the MIT License
 *
 * This is a script for handling AAI login. It's expected to be invoked by HTTP POST method.
 * Data from successful authentication (cookies) are received as POST data.
 * Session cookies are set up here, on the same domain as Wegas itself.
 * The client is then automatically redirected to Wegas.
 *
 * @author jarle.hulaas@heig-vd.ch on 18.03.2017.
 */
@RequestScoped
@Named("aaiController")
public class AaiController {

    @Inject
    private ErrorController errorController;

    private final String jsessionName = "JSESSIONID";

    private final String cookieName = "rememberMe";

    private String cookieValue;
    private String url;
    private String target;
    private String path;

    public String getCookieName() {
        return cookieName;
    }

    public String getCookieValue() {
        return cookieValue;
    }

    public String getUrl() {
        return url;
    }

    public String getTarget() {
        return target;
    }

    public String getPath() {
        return path;
    }

    public void redirect(boolean proceed) {
        ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        Object request = externalContext.getRequest();
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;

            cookieValue = httpRequest.getParameter(cookieName);
            String jsessionValue = httpRequest.getParameter(jsessionName);
            path = httpRequest.getParameter("PATH");
            url = httpRequest.getRequestURL().toString();
            target = url.substring(0, url.lastIndexOf('/') + 1);

            Map<String, Object> cookieP = new HashMap<>();

            // Session Max Age: must not be zero (or the login won't work).
            // For AAI, it should clearly be less than a year (default Wegas setting).
            Integer sessionMaxAge = 60 * 60 * 24 * 7; // I.e. one week.

            cookieP.put("maxAge", sessionMaxAge);
            cookieP.put("path", path);
            cookieP.put("httpOnly", Boolean.TRUE);
            externalContext.addResponseCookie(cookieName, this.cookieValue, cookieP);
            externalContext.addResponseCookie(jsessionName, jsessionValue, cookieP);

            String redirectTo = httpRequest.getParameter("redirect");
            if (redirectTo != null) {
                target += "?redirect=" + redirectTo;
            }

            if (proceed) {
                try {
                    externalContext.redirect(url);
                } catch (IOException ex) {
                    errorController.dispatch("Redirect Error " + ex);
                }
            }
        } else {
            errorController.dispatch("Unknown Request Type: " + request);
        }
    }
}
