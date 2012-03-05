package com.wegas.security.realm;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.authz.AuthorizationException;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.realm.jdbc.JdbcRealm;
import org.apache.shiro.util.ByteSource;
import org.apache.shiro.util.JdbcUtils;
import org.apache.shiro.util.SimpleByteSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This realm has all {@link JdbcRealm} capabilities. It also supports JNDI as datasource source and 
 * can add salt to passwords.
 */
public class JNDIAndSaltAwareJdbcRealm extends JdbcRealm {

    /**
     * 
     */
    protected static final String DEFAULT_CREATEUSER_QUERY = "insert into sec_users (name, password, salt) values (?, ?, ?)";
    /**
     * 
     */
    private static final Logger log = LoggerFactory.getLogger(JNDIAndSaltAwareJdbcRealm.class);
    /**
     * 
     */
    protected String jndiDataSourceName;

    /**
     * 
     */
    public JNDIAndSaltAwareJdbcRealm() {
    }

    /**
     * 
     * @return
     */
    public String getJndiDataSourceName() {
        return jndiDataSourceName;
    }

    /**
     * 
     * @param jndiDataSourceName
     */
    public void setJndiDataSourceName(String jndiDataSourceName) {
        this.jndiDataSourceName = jndiDataSourceName;
        this.dataSource = getDataSourceFromJNDI(jndiDataSourceName);
    }

    /**
     * 
     * @param userName
     * @param password
     * @throws SQLException
     */
    public void createUser(String userName, String password) throws SQLException {
        ByteSource salt = this.generateSalt();
        String hPassword = JNDIAndSaltAwareJdbcRealm.saltedHash(password, salt);
        Connection conn = this.dataSource.getConnection();
        PreparedStatement userStmt = conn.prepareStatement(JNDIAndSaltAwareJdbcRealm.DEFAULT_CREATEUSER_QUERY);
        userStmt.setString(1, userName);
        userStmt.setString(2, hPassword);
        // @fixme dont know why it does not work w/the real salt see above
        // userStmt.setString(3, salt.toString());
        userStmt.setString(3, "random_salt_value_" + password);
        userStmt.executeUpdate();
    }

    private ByteSource generateSalt() {
        RandomNumberGenerator rng = new SecureRandomNumberGenerator();
        return rng.nextBytes();

    }

    private static String hash(String password) {
        return new Sha256Hash(password).toHex();
    }

    private static String saltedHash(String password, ByteSource salt) {
        // @fixme dont know why it does not work w/the real salt see above
        //return (new Sha256Hash(password, salt.getBytes())).toHex();
        return ( new Sha256Hash(password, ( new SimpleByteSource("random_salt_value_" + password) ).getBytes()) ).toHex();
    }

    private DataSource getDataSourceFromJNDI(String jndiDataSourceName) {
        try {
            InitialContext ic = new InitialContext();
            return (DataSource) ic.lookup(jndiDataSourceName);
        }
        catch (NamingException e) {
            log.error("JNDI error while retrieving " + jndiDataSourceName, e);
            throw new AuthorizationException(e);
        }
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
        //identify account to log to
        UsernamePasswordToken userPassToken = (UsernamePasswordToken) token;
        String username = userPassToken.getUsername();

        if (username == null) {
            log.debug("Username is null.");
            return null;
        }

        // read password hash and salt from db 
        PasswdSalt passwdSalt = getPasswordForUser(username);

        if (passwdSalt == null) {
            log.debug("No account found for user [" + username + "]");
            return null;
        }

        // return salted credentials
        SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(username, passwdSalt.password, getName());
        info.setCredentialsSalt(new SimpleByteSource(passwdSalt.salt));

        return info;
    }

    private PasswdSalt getPasswordForUser(String username) {
        PreparedStatement statement = null;
        ResultSet resultSet = null;
        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            statement = conn.prepareStatement(authenticationQuery);
            statement.setString(1, username);

            resultSet = statement.executeQuery();

            boolean hasAccount = resultSet.next();
            if (!hasAccount) {
                return null;
            }

            String salt = null;
            String password = resultSet.getString(1);
            if (resultSet.getMetaData().getColumnCount() > 1) {
                salt = resultSet.getString(2);
            }

            if (resultSet.next()) {
                throw new AuthenticationException("More than one user row found for user [" + username + "]. Usernames must be unique.");
            }

            return new PasswdSalt(password, salt);
        }
        catch (SQLException e) {
            final String message = "There was a SQL error while authenticating user [" + username + "]";
            if (log.isErrorEnabled()) {
                log.error(message, e);
            }
            throw new AuthenticationException(message, e);

        }
        finally {
            JdbcUtils.closeResultSet(resultSet);
            JdbcUtils.closeStatement(statement);
            JdbcUtils.closeConnection(conn);
        }
    }
}

class PasswdSalt {

    public String password;
    public String salt;

    public PasswdSalt(String password, String salt) {
        super();
        this.password = password;
        this.salt = salt;
    }
}