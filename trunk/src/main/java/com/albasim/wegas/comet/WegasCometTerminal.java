/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.comet;

import java.io.PrintWriter;

/**
 *
 * @author maxence
 */
public class WegasCometTerminal {
    
    private PrintWriter writer;
    private String session;


    public WegasCometTerminal(PrintWriter writer, String session) {
        this.writer = writer;
        this.session = session;
    }


    public String getSession() {
        return session;
    }


    public void setSession(String session) {
        this.session = session;
    }


    public PrintWriter getWriter() {
        return writer;
    }


    public void setWriter(PrintWriter writer) {
        this.writer = writer;
    }
}
