/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.comet;

import com.albasim.wegas.ejb.Dispatcher;
import com.albasim.wegas.helper.StaticHelper;
import com.sun.grizzly.comet.CometContext;
import com.sun.grizzly.comet.CometEngine;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

/**
 *
 * @author maxence
 *
 */
@WebServlet(name = "CometSocket", urlPatterns = {"/cs"})
public class WegasCometServlet extends HttpServlet {

    private static final Logger logger = Logger.getLogger("Grizzly Comet");
    
    private static final String BEGIN_SCRIPT_TAG = "<script type='text/javascript'>\n";
    private static final String END_SCRIPT_TAG = "</script>\n";
    private static final long serialVersionUID = -2919167206889576860L;
    private String contextPath;
    private final static String JUNK = "<!-- Comet is a programming technique that enables web " +
            "servers to send data to the client without having any need " +
            "for the client to request it. -->\n";

    @EJB Dispatcher dispatcher;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        contextPath = config.getServletContext().getContextPath() + "/cs";

        dispatcher.setContextPath(contextPath);
        
        CometContext context = CometEngine.getEngine().register(contextPath);
        context.setExpirationDelay(5*60*1000);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        logger.log(Level.INFO, "DO GET");
        res.setContentType("text/html");
        res.setHeader("Cache-Control", "private");
        res.setHeader("Pragma", "no-cache");

        HttpSession session = req.getSession();
        PrintWriter writer = res.getWriter();

        // For IE, Safari and Chrome, we must output some junk to enable streaming
        for (int i = 0; i < 10; i++) {
            res.getWriter().write(JUNK);
        }

        writer.flush();

        WegasCometHandler handler = new WegasCometHandler(contextPath, dispatcher);
        Terminal term = new Terminal();
        handler.setTerminal(term);
        
        handler.attach(new WegasCometTerminal(writer, session.getId()));

        logger.log(Level.INFO, "ContextPath: " + contextPath);

        CometContext context = CometEngine.getEngine().register(contextPath);
        context.addCometHandler(handler);
        //context.resumeCometHandler(handler);

        dispatcher.newSession(session.getId(), term);
        
        String script = BEGIN_SCRIPT_TAG + "window.parent.app.update({ name: \"" + StaticHelper.escape("welcome") + "\", message: \"" + StaticHelper.escape("Welcome buddy!") + "\" });\n" + END_SCRIPT_TAG;
        
        context.notify(script, handler);
    }
}