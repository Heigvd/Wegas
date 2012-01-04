/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.comet;

import com.albasim.wegas.ejb.Dispatcher;
import com.sun.grizzly.comet.CometContext;
import com.sun.grizzly.comet.CometEngine;
import com.sun.grizzly.comet.CometEvent;
import com.sun.grizzly.comet.CometHandler;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author maxence
 */
public class WegasCometHandler implements CometHandler<WegasCometTerminal> {
    
    private Terminal terminal;
    
    private String contextPath;

    private PrintWriter writer;

    private static final Logger logger = Logger.getLogger("CometHandler");

    private static final String BEGIN_SCRIPT_TAG = "<script type='text/javascript'>\n";
    private static final String END_SCRIPT_TAG = "</script>\n";

    private String session;
    private final Dispatcher dispatcher;


    public WegasCometHandler(String contextPath, Dispatcher dispatcher) {
        this.contextPath = contextPath;
        this.dispatcher = dispatcher;
    }

    @Override
    public void attach(WegasCometTerminal attachment) {
        logger.log(Level.INFO, "ATTACH:" + this);
        this.writer = attachment.getWriter();
        this.session = attachment.getSession();
    }

    
    @Override
    public void onEvent(CometEvent event) throws IOException {
        logger.log(Level.INFO, "EVENT: " + this);
        if (event.getType() == CometEvent.NOTIFY) {
            String output = (String) event.attachment();
            logger.log(Level.INFO, "CometEvent.NOTIFY => '{''}'{0}", output);

            writer.println(output);
            writer.flush();
        }
    }


    @Override
    public void onInitialize(CometEvent event) throws IOException {
        logger.log(Level.INFO, "INIT: " + this);
    }


    @Override
    public void onInterrupt(CometEvent event) throws IOException {
        logger.log(Level.INFO, "INTERUPT: " + this);
        String script = BEGIN_SCRIPT_TAG + "window.parent.app.listen();\n" + END_SCRIPT_TAG;
        logger.log(Level.INFO, "CometEvent.INTERRUPT => '{''}'{0}", script);
        writer.println(script);
        writer.flush();

        removeThisFromContext();
    }


    @Override
    public void onTerminate(CometEvent event) throws IOException {
        logger.log(Level.INFO, "Terminate: " + this);
        removeThisFromContext();
    }


    private void removeThisFromContext() {
        logger.log(Level.INFO, "Remove " + this + " from context");
        writer.close();

        CometContext context = CometEngine.getEngine().getCometContext(contextPath);
        context.removeCometHandler(this);
        dispatcher.destroySession(session, terminal);
    }


    public Terminal getTerminal() {
        return terminal;
    }


    public void setTerminal(Terminal terminal) {
        this.terminal = terminal;
        this.terminal.setCometHandler(this);
    }
}