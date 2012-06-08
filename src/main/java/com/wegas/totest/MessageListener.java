/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.totest;

import javax.enterprise.event.Observes;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class MessageListener {

    public void listener(@Observes MessageEvent me){
        System.out.println("Event received");

    }
}
