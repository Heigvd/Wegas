/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Player;
import com.wegas.messaging.persistence.Message;
import java.util.Date;
import java.util.Properties;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.mail.Authenticator;
import javax.mail.Message.RecipientType;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

/*
 * @todo @important The mail should be sent in an async queue, so they don't
 * hang the reply endlessly
 */
/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class EMailFacade {


    /**
     *
     * @param to
     * @param from
     * @param replyTo effective from
     * @param subject
     * @param body
     * @param toType
     * @param mimetype
     * @param replyToOrCC false -> add ReplyTo: replyTo true : acc CC: replyTo
     *
     * @throws javax.mail.MessagingException when something went wrong
     */
    public void send(String to, String from, String replyTo,
            String subject, String body, RecipientType toType, String mimetype, Boolean replyToOrCC) throws MessagingException {

        Properties props = new Properties();
        final String username = Helper.getWegasProperty("mail.smtp.username");
        final String password = Helper.getWegasProperty("mail.smtp.password");

        props.put("mail.smtp.host", Helper.getWegasProperty("mail.smtp.host"));           // Attaching to default Session, or we could start a new one

        props.setProperty("mail.smtp.auth", Helper.getWegasProperty("mail.smtp.auth"));
        props.put("mail.smtp.port", Helper.getWegasProperty("mail.smtp.port"));
        if (Helper.getWegasProperty("mail.smtp.starttls.enable").equals("true")) {
        props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.ssl.trust", Helper.getWegasProperty("mail.smtp.host"));
        } else {
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.port", Helper.getWegasProperty("mail.smtp.port"));
            props.put("mail.smtp.ssl.trust", Helper.getWegasProperty("mail.smtp.host"));
        }

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });

        MimeMessage msg = new MimeMessage(session);

        msg.setFrom(new InternetAddress(from));
        msg.setRecipients(toType, InternetAddress.parse(to, false));
        msg.setSubject(subject);
        msg.setContent(body, mimetype);
        msg.setSentDate(new Date());

        if (replyTo != null) {
            if (replyToOrCC) {
                msg.setReplyTo(InternetAddress.parse(replyTo));
            } else {
                msg.addRecipients(RecipientType.CC, InternetAddress.parse(replyTo, false));
            }
        }

        Transport.send(msg);
    }

    /**
     * @deprecated
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     */
    public void send(Player p, String from, String subject, String body) throws MessagingException {
        this.send(p.getUser().getName(), from, null, subject, body, RecipientType.TO, "text/plain; charset=utf-8", false);
    }

    /**
     * @deprecated @param p
     * @param msg
     */
    public void send(Player p, Message msg) throws MessagingException {

        this.send(p, "noreply@" + Helper.getWegasProperty("mail.default_domain"), msg.getSubject().translateOrEmpty(p), msg.getBody().translateOrEmpty(p));
    }
}
