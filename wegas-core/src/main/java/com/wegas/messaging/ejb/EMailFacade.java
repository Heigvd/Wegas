/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.persistence.game.Player;
import com.wegas.messaging.persistence.Message;
import java.util.Date;
import java.util.Properties;
import java.util.ResourceBundle;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.mail.Authenticator;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

/**
 * @fixme @important The mail should be sent in an async queue, so they don't
 * hang the reply endlessly
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class EMailFacade {

    /**
     *
     * @param to
     * @param from
     * @param subject
     * @param body
     */
    public void send(String to, String from,
            String subject, String body) {

        Properties props = new Properties();
        final ResourceBundle res = ResourceBundle.getBundle("systemsettings");
        final String username = res.getString("mail.smtp.username");
        final String password = res.getString("mail.smtp.password");

        props.put("mail.smtp.host", res.getString("mail.smtp.host"));           // Attaching to default Session, or we could start a new one

        props.setProperty("mail.smtp.auth", res.getString("mail.smtp.auth"));
        props.put("mail.smtp.port", res.getString("mail.smtp.port"));
        if (res.getString("mail.smtp.starttls.enable").equals("true")) {        // TLS
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.ssl.trust", res.getString("mail.smtp.host"));
        } else {                                                                // SSL
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.port", res.getString("mail.smtp.port"));
            props.put("mail.smtp.ssl.trust", res.getString("mail.smtp.host"));
        }


        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });

        javax.mail.Message msg = new MimeMessage(session);                                 // Create a new message

        try {
            msg.setFrom(new InternetAddress(from));                             // Set the FROM and TO fields
            msg.setRecipients(javax.mail.Message.RecipientType.TO,
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
        } catch (MessagingException ex) {
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
    public void send(Player p, String from, String subject, String body) {
        this.send(p.getUser().getName(), from, subject, body);
    }

    /**
     *
     * @param p
     * @param msg
     */
    public void send(Player p, Message msg) {
        this.send(p, "admin@wegas.com", msg.getSubject(), msg.getBody());
    }

    /**
     *
     * @param messageEvent
     */
    public void listener(@Observes MessageEvent messageEvent) {
        // @fixme remove this hardcoded condition w/ some db values or at least a line in the prop file
//        if (messageEvent.getType().equals("important")) {
//            this.send("fx@red-agent.com", "admin@wegas.com",
//                    messageEvent.getMessage().getSubject(),
//                    messageEvent.getMessage().getBody());
//        }
    }
}
