/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.messaging.ejb;

import com.wegas.core.ejb.VariableDescriptorEntityFacade;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.messaging.persistence.variable.InboxInstanceEntity;
import com.wegas.messaging.persistence.variable.MessageEntity;
import java.util.Date;
import java.util.Properties;
import java.util.ResourceBundle;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

/**
 *
 * @author fx
 */
@Stateless
public class MessagingManager {

    @EJB
    VariableDescriptorEntityFacade variableDescriptorFacade;

    public void sendMail(String to, String from,
            String subject, String body) {

        Properties props = System.getProperties();

        ResourceBundle res = ResourceBundle.getBundle("com.wegas.app.Wegas");
        props.put("mail.smtp.host", res.getString("mail.smtp.host"));           // Attaching to default Session, or we could start a new one

        Session session = Session.getDefaultInstance(props, null);

        Message msg = new MimeMessage(session);                                 // Create a new message

        try {
            msg.setFrom(new InternetAddress(from));                             // Set the FROM and TO fields
            msg.setRecipients(Message.RecipientType.TO,
                    InternetAddress.parse(to, false));
            // -- We could include CC recipients too --
            // if (cc != null)
            // msg.setRecipients(Message.RecipientType.CC
            // ,InternetAddress.parse(cc, false));

            msg.setSubject(subject);                                            // Set the subject and body text
            msg.setText(body);
            msg.setSentDate(new Date());
            Transport.send(msg);                                                // Send the message
            System.out.println("Message sent OK.");
        }
        catch (MessagingException ex) {
            Logger.getLogger(MessagingManager.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public void sendMail(PlayerEntity p, String from, String subject, String body) {
        //this.sendMail(p.getUser().getName(), from, subject, body);
        this.sendMail("fx@red-agent.com", from, subject, body);
    }

    public void sendMail(PlayerEntity p, MessageEntity msg) {
        this.sendMail(p, "admin@wegas.com", msg.getSubject(), msg.getBody());
    }

    public void sendInGameMessage(PlayerEntity p, MessageEntity msg) {
        VariableDescriptorEntity vd = variableDescriptorFacade.findByName("inbox");
        InboxInstanceEntity inbox = (InboxInstanceEntity) vd.getVariableInstance(p);
        inbox.addMessage(msg);
    }

    public void sendInGameMessage(PlayerEntity p, String subject, String body) {
        MessageEntity msg = new MessageEntity();
        msg.setName(subject);
        msg.setBody(body);
        this.sendInGameMessage(p, msg);
    }

    public void send(String type, PlayerEntity p, MessageEntity msg) {
        if (type.equals("important")) {
            this.sendMail(p, type, type, type);
        }
        this.sendInGameMessage(p, msg);
    }

    public void send(String type, PlayerEntity p, String from, String subject, String body) {
        MessageEntity msg = new MessageEntity();
        msg.setName(subject);
        msg.setBody(body);
        this.send(type, p, msg);
    }
}
