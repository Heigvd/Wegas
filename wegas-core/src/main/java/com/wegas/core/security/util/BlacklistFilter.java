/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.wegas.core.ejb.RequestManager;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.inject.Inject;
import javax.servlet.DispatcherType;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@WebFilter(filterName = "BlacklistFilter", urlPatterns = {"/wegas-private/*"}, dispatcherTypes = {DispatcherType.REQUEST})
public class BlacklistFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(BlacklistFilter.class);

    private static final List<String> blacklist = new ArrayList<>();

    @Inject
    private RequestManager requestManager;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        blacklist.add("/wegas-private/wegas-crimesim/js-server/crimesim-server.js");
        blacklist.add("/wegas-private/wegas-crimesim/db/wegas-crimesim-gamemodel.json");
        blacklist.add("/wegas-private/wegas-flexitests/scripts/flexitests-server-script.js");
        blacklist.add("/wegas-private/wegas-flexitests/db/wegas-flexitests-gamemodel.json");
        blacklist.add("/wegas-private/wegas-leaderway/db/wegas-leaderway.json");
        blacklist.add("/wegas-private/wegas-leaderway/db/wegas-leaderway-changemanagement.json");
        blacklist.add("/wegas-private/wegas-leaderway/server-js/wegas-leaderway.js");
        blacklist.add("/wegas-private/wegas-escapegamev1/db/EscapeGameV1.4.2.json");
        blacklist.add("/wegas-private/wegas-cep/js-server/wegas-cep.js");
        blacklist.add("/wegas-private/wegas-cep/db/wegas-cep-gamemodel.json");
        blacklist.add("/wegas-private/wegas-games/wegas-book/db/wegas-book.json");
        blacklist.add("/wegas-private/wegas-games/wegas-monopoly/db/wegas-monopoly-gamemodel.json");
        blacklist.add("/wegas-private/wegas-games/wegas-chess/db/wegas-chess-gamemodel.json");
        blacklist.add("/wegas-private/wegas-games/wegas-laddergame/db/laddergame-gamemodel.json");
        blacklist.add("/wegas-private/wegas-games/wegas-simpledialogue/db/wegas-simpledialogue-gamemodel.json");
        blacklist.add("/wegas-private/wegas-games/wegas-leaderway-v1/db/wegas-leaderway.json");
        blacklist.add("/wegas-private/wegas-pmg/scripts/test-scripts/wegas-pmg-server-test-language.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/test-scripts/wegas-pmg-server-test-util.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/test-scripts/wegas-pmg-server-test-artos.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/test-scripts/wegas-pmg-server-test-simplepmg.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/wegas-pmg-server-util.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/wegas-dashboard.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/wegas-pmg-server-backward.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/wegas-pmg-server-export.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/wegas-pmg-server-simulation.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/wegas-pmg-server-helper.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/wegas-pmg-server-language.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/locales");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/locales/en.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/locales/fr.js");
        blacklist.add("/wegas-private/wegas-pmg/scripts/server-scripts/wegas-pmg-server-event-listeners.js");
        blacklist.add("/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-language.json");
        blacklist.add("/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-Artos.json");
        blacklist.add("/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-simplePmg.json");
        blacklist.add("/wegas-private/wegas-corporatelaw/scripts/server/simulation.js");
        blacklist.add("/wegas-private/wegas-corporatelaw/scripts/server/event-listeners.js");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (request instanceof HttpServletRequest && response instanceof HttpServletResponse) {
            HttpServletRequest req = (HttpServletRequest) request;
            HttpServletResponse resp = (HttpServletResponse) response;

            String url = req.getRequestURI().replaceFirst("^" + req.getContextPath(), "");

            if (!requestManager.isAdmin() && isBlacklisted(url)){
                // Blacklist URL -> forbidden
                logger.error("Trying to access blacklisted content ( {} ) ! ", url);
                resp.setStatus(403);
                resp.getOutputStream().print("<h1>forbidden</h1>This content has been blacklisted");
            } else {
                chain.doFilter(request, response);
            }
        }
    }

    @Override
    public void destroy() {
        // nothing to do
    }

    public static boolean isBlacklisted(String url) {
        return url.matches("/wegas-private/private/.*$") || blacklist.contains(url);
    }
}
