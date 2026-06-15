# Running Wegas

For Wegas to run, you will need:
* Java 17 and maven
* Node 24 and yarn
* Docker (PostgreSQL and MongoDB will run in containers)
* A Pusher account


## Install tools

### MacOS with Homebrew

#### Install brew  
```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```


#### Install Java 17 and maven
```shell
brew install --cask temurin@17
brew install maven
```

If you don't manage several Java versions, you might want to set the JAVA_HOME env var in your `.zshrc`:
```shell
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

#### Install Node (via nvm) and yarn

```shell
brew install nvm
brew install yarn
nvm install 24
```

I recommend using nvm to easily be able to manage/switch Node versions, but you can directly install the Node version you need without nvm.

#### Install Docker or Docker desktop
```shell
brew install docker
```
or
```shell
brew install --cask docker-desktop
```

## Install services

### PostgreSQL

#### One line installation
```shell
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=1234 -e POSTGRES_USER=user -e POSTGRES_DB=wegas_dev --name wegas_postgres -d postgres:14-alpine 
```

In this case, the user will already be created and the credentials correspond to the defaults in the config file. There is no database for testing.

You can change `POSTGRES_USER` and `POSTGRES_PASSWORD` as you want but you will need to update the env vars used by the app.

#### Basic installation (needs configuration)
```shell
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=<YOUR_PASSWORD> --name wegas_postgres -d postgres:14-alpine 
```

#### Configure
If you did the "One Line Installation", you can ignore this or take the parts you need.

```shell
echo "CREATE USER \"user\" WITH PASSWORD '1234' SUPERUSER;
CREATE DATABASE \"wegas_dev\" OWNER \"user\";
CREATE DATABASE \"wegas_test\" OWNER \"user\";" |  docker exec -it wegas_postgres psql -U postgres
```

#### Environment Variables
If you modified the user/password during Postgres configuration, don't forget to set the following environment variables with your values:
```
DB_USER
DB_PASSWORD
```

### Jackrabbit backend (MongoDB)
#### Install
```shell
docker run -p 27017:27017 --name wegas_mongo -d mongo:4.2
```

## Configuration

At this point, you can run `./configure`. The script will create a `wegas-override.properties` file in `/src/main/resources`. It is also created when missing by the `run` script.

### Pusher

1. Go to [Pusher](https://dashboard.pusher.com/accounts/sign_in) and sign in/create an account.

2. In [Channels](https://dashboard.pusher.com/channels), create a new app.

3. Go to your app "App keys" and transfer the information to the `wegas-override.properties` file.

## Build
```shell
mvn -f .. -DskipTests install
```

### Java 17
If your default JVM is not 17, you must provide the path to a JVM-17 to maven. E.G:
```shell
JAVA_HOME="<path/to/java17>" mvn -DskipTests install
```



## Test

### Private access
```bash
mvn -f .. test
```

### Public access
Since some tests require data from our private repository, please run tests with `-DskipPrivateTests` to skip them:

```bash
mvn -f .. -DskipPrivateTests clean install
```

## Run

### Start
Run `./run` to start wegas.

#### Java 17
Wegas is designed to run on Java 17. If your default JVM is lower or higher than 17, you must provide the path to a JVM 17 using the -j option.

#### Options
Option | Env Var | Description | Default Value
-- | - | - | -
-c | CLUSTER_MODE | Datagrid discovery mode | DEFAULT
-d |  | Debug mode | 
-g | GC | Garbage collector ZGC or G1GC | G1GC
-s | DB_HOST | PostgreSQL host | localhost
-i | INTERFACES | Datagrid discovery interface | 127.0.0.1
-j | JAVA_HOME | Java path | None (Inherited from environment)
-m | HEAP | Heap size | 2G
-n | NB_POPULATORS | Number of populating daemons | 1
-p | DEBUG_PORT | Debug port | 9009
-t | NB_THREADS | Number of HTTP threads | 9
-w | THE_WAR | WAR path | ../wegas-app/target/Wegas

#### Clustering
Running several instance (localhost) at the same time will automatically create a cluster.

#### Reload after wegas-core changes
```
mvn -f .. -pl wegas-app -am -DskipTests -DskipYarn install
touch ../wegas-app/target/Wegas/.reload
```
