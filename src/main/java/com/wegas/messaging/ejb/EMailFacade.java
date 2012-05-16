/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.ejb;

import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.messaging.persistence.variable.MessageEntity;
import java.util.Date;
import java.util.Properties;
import java.util.ResourceBundle;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

/**
 * @fixme @important The mail should be sent in an async queue, so they don't hang the reply endlessly
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class EMailFacade {

    /**
     *
     * @param messageEvent
     */
    public void listener(@Observes MessageEvent messageEvent) {
        // @fixme remove this hardcoded condition w/ some db values or at least a line in the prop file
//        if (messageEvent.getType().equals("important")) {
            this.send("fx@red-agent.com", "admin@wegas.com",
                    messageEvent.getMessage().getSubject(),
                    messageEvent.getMessage().getBody());
//        }
    }

    /**
     *
     * @param to
     * @param from
     * @param subject
     * @param body
     */
    public void send(String to, String from,
            String subject, String body) {

        Properties props = System.getProperties();

        ResourceBundle res = ResourceBundle.getBundle("wegas");
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
            Logger.getLogger(EMailFacade.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    /**
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     */
    public void send(PlayerEntity p, String from, String subject, String body) {
        //this.send(p.getUser().getName(), from, subject, body);
        this.send("fx@red-agent.com", from, subject, body);
    }

    /**
     *
     * @param p
     * @param msg
     */
    public void send(PlayerEntity p, MessageEntity msg) {
        this.send(p, "admin@wegas.com", msg.getSubject(), msg.getBody());
    }
}
