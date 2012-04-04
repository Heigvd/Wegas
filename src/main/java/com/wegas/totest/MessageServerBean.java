/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.totest;

import javax.ejb.Stateless;
import javax.enterprise.context.RequestScoped;
import javax.enterprise.context.SessionScoped;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.inject.Named;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */

@Named("message")
@Stateless
public class MessageServerBean {

    @Inject
    Event<MessageEvent> messageEvent;

    public String getMessage() {
        return "Try event";
    }
    public void execute(){
        messageEvent.fire(new MessageEvent());
    }
}
