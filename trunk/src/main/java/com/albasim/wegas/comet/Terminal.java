/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.comet;

import com.sun.grizzly.comet.CometHandler;

/**
 *
 * @author maxence
 */
public class Terminal {
    
    private CometHandler cometHandler;


    public CometHandler getCometHandler() {
        return cometHandler;
    }


    public void setCometHandler(CometHandler cometHandler) {
        this.cometHandler = cometHandler;
    }
}
