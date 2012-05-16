Wegas
=======================
Web Game Authoring system is a jee-based framework for multiplayer web-games developement.

School of Business and Engineering Vaud, http://www.heig-vd.ch/
Media Engineering, Information Technology Managment, Comem
Copyright (C) 2011

Authors
*   Francois-Xavier Aeberhard fx@red-agent.com
*   Cyril Junod cyril.junod@gmail.com


Set up server
------------------------
*   PostgreSQL Server
    By default, Wegas will look for wegas_dev and wegas_test databases, using the username "user" and password "123"
*   Glassfish Server
    - Install glassfish v>3.1.1
    - Download Postgresql driver (most likely 9.1-901 JDBC 4) from http://jdbc.postgresql.org/download.html and place it in domains/YOURDOMAIN/lib/
    - Enable comet support:
      can be done in netbeans right click on server >> properties >> check enable comet
    - Enable websocket support:
      asadmin set configs.config.server-config.network-config.protocols.protocol.http-listener-1.http.websockets-support-enabled=true
    - Create PostgreSQL Connection pool
      (not required if launching from Netbeans, since it will automatically use glassfish-resources.xml)
      asadmin create-jdbc-connection-pool --datasourceclassname org.postgresql.ds.PGSimpleDataSource --restype javax.sql.DataSource --property portNumber=5432:password=123:user=user:serverName=localhost:databaseName=wegas_dev jdbc/wegas_dev_pool
      asadmin ping-connection-pool jdbc/wegas_dev_pool
      asadmin create-jdbc-resource --connectionpoolid jdbc/wegas_dev_pool jdbc/wegas_dev

Set up Github
------------------------
*  Set up git [http://help.github.com/win-set-up-git/]
*  git config --global user.name "Your Name"
*  git config --global user.email YourMail
*  mkdir Wegas
*  cd Wegas
*  clone git@github.com:Heigvd/Wegas.git

Set up Netbeans
------------------------
In the NetBeans installation directory (e.g. C:\Program Files\NetBeans 7.x), edit the etc\netbeans.conf startup configuration. (On both Windows 7 and Linux, you will need to edit the permissions on this file to grant your user the rights to modify it.)

*  Force utf-8
   Addn -J-Dfile.encoding=UTF-8 to netbeans_default_options line in netbeans.conf.
*  To increase the heap memory available to the IDE, replace the -J-Xms32m JVM parameter with the following:
   -J-Xms384m
*  To increase the IDE's permanent generation space (memory used for classes and static instances), replace the -J-XX:PermSize=32m JVM parameter with the following:
   -J-XX:PermSize=128m
*  Add the following parameters to improve garbage collection performance:
   -J-XX:+UseConcMarkSweepGC -J-XX:+CMSClassUnloadingEnabled -J-XX:+CMSPermGenSweepingEnabled
*  If you ever connect through a VPN, the following JVM setting will prevent connection refusals when accessing network resources (e.g. SVN and Maven repositories) through the IDE:
   -J-Djava.net.preferIPv4Stack=true

Setup JCR Jackrabbit (dev)
--------------------------
Installing Jackrabbit on Glassfish, development purpose.

* Make http://repo1.maven.org/maven2/javax/jcr/jcr/2.0/jcr-2.0.jar available to Glassfish.
* Deploy http://www.apache.org/dyn/closer.cgi/jackrabbit/2.4.1/jackrabbit-jca-2.4.1.rar in Glassfish.
* Copy https://github.com/Heigvd/Wegas/tree/master/src/main/setup/JRFile to your Glassfish's domain (JRFile included).