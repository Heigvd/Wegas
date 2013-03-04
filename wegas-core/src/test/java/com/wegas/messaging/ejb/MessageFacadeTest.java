package com.wegas.messaging.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import java.util.ArrayList;
import static org.junit.Assert.assertEquals;
import org.junit.Test;

/**
 *
 * @author Benjamin
 */
public class MessageFacadeTest extends AbstractEJBTest {

    /**
     * Test of listener method, of class MessageFacade.
     */
    @Test
    public void testListener() throws Exception {
        System.out.println("listener");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        inbox.setScope(new TeamScope());
        vdf.create(gameModel.getId(), inbox);

        //send a message
        MessageEvent me = new MessageEvent();
        Message msg = new Message("from", "subject", "body");
        me.setMessage(msg);
        me.setPlayer(player);
        mf.listener(me);


        //get inbox
        VariableDescriptor vd = vdf.findByName(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        assertEquals(msg, gettedInbox.getMessages().get(0));

        vdf.remove(inbox.getId());


    }

    /**
     * Test of send method, of class MessageFacade.
     */
    @Test
    public void testSend_Player_Message() throws Exception {
        System.out.println("send(player, msg)");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        inbox.setScope(new TeamScope());
        vdf.create(gameModel.getId(), inbox);

        //send a message
        Message msg = new Message("from", "subject", "body");
        mf.send(player, msg);

        //get inbox
        VariableDescriptor vd = vdf.findByName(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        assertEquals(msg, gettedInbox.getMessages().get(0));

        vdf.remove(inbox.getId());
    }

    /**
     * Test of send method, of class MessageFacade.
     */
    @Test
    public void testSend_4args() throws Exception {
        System.out.println("send(player, 4args)");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        inbox.setScope(new TeamScope());
        vdf.create(gameModel.getId(), inbox);

        //send a message
        mf.send(player, "from", "subject", "body");
        Message msg = new Message("from", "subject", "body");

        //get inbox
        VariableDescriptor vd = vdf.findByName(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        assertEquals(msg, gettedInbox.getMessages().get(0));

        vdf.remove(inbox.getId());
    }

    /**
     * Test of send method, of class MessageFacade.
     */
    @Test
    public void testSend_5args() throws Exception {
        System.out.println("send(player), 5args");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        inbox.setScope(new TeamScope());
        vdf.create(gameModel.getId(), inbox);

        //send a message
        ArrayList<String> attachements = new ArrayList<>();
        attachements.add("attachement1");
        attachements.add("attachement2");
        mf.send(player, "from", "subject", "body", new ArrayList<String>(attachements));
        Message msg = new Message("from", "subject", "body", attachements);

        //get inbox
        VariableDescriptor vd = vdf.findByName(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        assertEquals(msg, gettedInbox.getMessages().get(0));

        vdf.remove(inbox.getId());
    }
}
