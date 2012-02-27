/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.session;

import java.util.logging.Logger;
import javax.servlet.ServletRequestEvent;
import javax.servlet.ServletRequestListener;

/**
 *
 * @author maxence
 */

public class RequestListener implements ServletRequestListener {

    private static final Logger logger = Logger.getLogger("RequestListener");

    /**
     * 
     * @param sre
     */
    @Override
    public void requestDestroyed(ServletRequestEvent sre) {
        //logger.log(Level.INFO, "THREAD WAS :{0}", Thread.currentThread());
    }


    /**
     * 
     * @param sre
     */
    @Override
    public void requestInitialized(ServletRequestEvent sre) {
        //logger.log(Level.INFO, "THREAD IS :{0}", Thread.currentThread());
        /*ServletRequest servletRequest = sre.getServletRequest();

        logger.log(Level.INFO, "Request initialized");

        if (servletRequest instanceof HttpServletRequest){
            logger.log(Level.INFO, "IS HTTP Request");
            HttpServletRequest req = (HttpServletRequest) servletRequest;
            String header = req.getHeader("WSSESSIONID");
            if (header == null){
                logger.log(Level.INFO, "MISSING");
                throw new InvalidContent("WebSocket Session is missing!");
            } else {
                logger.log(Level.INFO, "OK");
                // TODO Check that the provided WS SESSION ID exists and belongs to the correct HTTP SESSION
            }
        } else {
            logger.info("Effective Session Type is " + servletRequest.getClass().getSimpleName());
        }*/
    }
    
}
