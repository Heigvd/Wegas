/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.totest;

import com.wegas.totest.MessageEvent;
import com.wegas.totest.MessageServerBean;
import javax.enterprise.event.Event;
import static org.junit.Assert.assertEquals;
import org.junit.Before;
import org.junit.Test;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.*;

/**
 *  CDI test using mocks
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class MessageServerBeanTest {

    private MessageServerBean msb;

    public MessageServerBeanTest() {
    }


    @Before
    public void setUp() {
        this.msb = new MessageServerBean();
        this.msb.messageEvent = mock(Event.class);

    }

    /**
     * Test of getMessage method, of class MessageServerBean.
     */
    @Test
    public void testGetMessage() throws Exception {
        System.out.println("getMessage");
        String expResult = "Try event";
        String result = this.msb.getMessage();
        assertEquals(expResult, result);

    }

    /**
     * Test of execute method, of class MessageServerBean.<br/>
     * Verify that <i>Event</i> is fired
     */
    @Test
    public void testExecute() throws Exception {
        System.out.println("execute");
        this.msb.execute();
        verify(this.msb.messageEvent, times(1)).fire(any(MessageEvent.class));
    }
}
