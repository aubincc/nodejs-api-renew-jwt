# API with Authentication & User Groups on MySQL

## Project setup

`git clone https://github.com/aubincc/nodejs-api-renew-jwt.git`

`cd nodejs-api-renew-jwt`

`npm install`

## Configuration & customisation

Please edit the .env file and L28 of index.js

##### the .env file

```shell
# API information
API_NAME=NodeJS Express API for MySQL
API_DESCRIPTION=API to manage resources, users, the users groups (like roles) and the groups permissions on resources.<br>Users can register, log in, change their password and renew their session.
API_CREATOR=dev@aubin.cc
API_PORT=8080

# MySQL or MariaDB database information
DB_HOST=localhost # localhost // if your database is on the same server as the API
DB_PORT=3306
DB_USER=node_api
DB_PASSWORD=50FTW4R3_Q4_P45$W0RD
DB_NAME=mydb
DB_LOGS_IN_CONSOLE=0 # 1 shows "SELECT", "UPDATE", "DELETE", "INSERT", "CREATE", "ALTER" and "DROP" logs in the console

# Flush renew tokens periodically
DB_FLUSH_RENEWJWT_CRON=0 2 * * * # every night at 2 a.m.
DB_FLUSH_RENEWJWT_AFTER=90 # older than 90 days

# Sessions secret keys and duration
SESSION_TOKEN_SECRET=v3ry_0wn_s3cr3t_K3Y! # change this!! and change it again from time to time
SESSION_TOKEN_MAXAGE=300 # 5 minutes // 3600 # 1 hour
SESSION_RENEW_TOKEN_SECRET=4_t0t4lly_d1ff3r3nt_s3cr3t_K3Y? # change this!! and change it again from time to time
SESSION_RENEW_TOKEN_MAXAGE=3600 # 1 hour // 43200 # 12 hours
SESSION_CLOCK_TOLERANCE= 10 # 10 seconds to avoid clock skew

# Express rate limits on routes
REQUEST_LIMIT_REGISTER_WINDOW=60 # 1 hour
REQUEST_LIMIT_REGISTER_MAX=2 # 2 new users per IP per REQUEST_LIMIT_REGISTER_WINDOW
REQUEST_LIMIT_ALL_WINDOW=5 # 5 minutes
REQUEST_LIMIT_ALL_MAX=100 # 100 requests per IP per REQUEST_LIMIT_ALL_WINDOW

# Check distance between old and new when changing password
PASSWORD_LEVENSHTEIN_DISTANCE=5

# Swagger available at endpoint /api if set to 1
SWAGGER_DOC_AVAILABLE=0
SWAGGER_DOC_ENDPOINT=/api

# Cors Options
# Don't forget to edit the corsOptions value in `index.js:L28`
```

##### L28 of index.js

```javascript
// CORS : Configure through which hosts communication with the API can be made (frontend IPs or hosts)
const corsOptions = {
  origin: ["https://your.website.tld", "http://mirror-of.website.tld:8090"],
};
```

## Running the API

It is probably best if you have `nodemon` installed globally:

`npm install -g nodemon`

Then you can run your API with this:

`nodemon index.js`

## Routes available

##### Api

- `GET /` get confirmation that the API is running
- `GET /api` consult swagger documentation (disabled from `.env` file at project root)

##### Authentication

- `POST /auth/register` register with `email` and `password`
- `POST /auth/login` log in with `email` and `password` to get a 5 minutes `jwt` and a 1 hour `renewJwt`
- `POST /auth/renew` get new `jwt` and `renewJwt` tokens with your current `renewJwt`
- `POST /auth/password` change your password
- `GET /whoami` see what groups you belong to and what permissions you have on which resources

##### Users

- `POST /user/:id` edit your own information (<sub>and that of others, provided you have permission</sub>)
- `POST /user/:id/group` edit the groups a user belongs to (<sub>add & remove</sub>)
- `GET /user` list all users (<sub>with pagination</sub>)
- `GET /user/:id` view a specific user's information
- `GET /user/:id/group` list the groups a user belongs to
- `GET /user/:id/permission` see what permissions a user has (<sub>depending on their groups</sub>)
- `GET /user/:id/activity` view a specific user's recent or latest activity

##### Permissions

- `GET /permission` list available resource permissions

##### Groups

- `POST /group` create a group
- `POST /group/:id` edit a group (<sub>merely just rename it</sub>)
- `POST /group/:id/user` edit the list of users that belong to a group (<sub>add & remove</sub>)
- `POST /group/:id/permission` set the permissions of a group on each resource
- `GET /group` list all groups (<sub>with pagination</sub>)
- `GET /group/:id` view a specific group's information
- `GET /group/:id/permission` view a specific group's permissions
- `GET /group/permission` view cumulated permissions from the combination of several groups
- `GET /group/:id/user` view a group's users list (<sub>with pagination</sub>)
- `DELETE /group/:id` delete a group after removing all users from it (<sub>see comments in `groupDelete` function</sub>)

## Additional info & features

##### Administrators can be protected

If you want a user to belong to the "admin" group, you will have to do it from the database.

Additionally, you can protect it, so that no other administrator can remove it from the "admin" group.

##### A user is always a user

Whatever you do to a user, it will always belong to the "user" group.

If a user is removed from the "user" group, the routes `POST /user/:id/group` and `POST /group/:id/user` will fix that.

##### Flushing old sessions

There is a node-cron flush of all renewJwt older than 90 days every night at 2 a.m. ("0 2 \* \* \*").

This can be changed in the `.env` file.

##### Preventing SPAM on routes

Registering new users is currently limited to 2 attempts per hour and per IP address.

All the other routes together are limited to 100 requests in a 5 minutes window and per IP address.

This can be changed in the `.env` file.

##### Challenging the user changing password

The user changing their password must choose a pretty different password, as there is a Levenshtein distance check (5) between the old password and the new.

This can be changed in the `.env` file.

## Small print

Author: Nicolas Aubin &lt;dev@aubin.cc&gt; &copy; 2023

- [@aubin_cc](https://twitter.com/aubin_cc)
- [aubin.cc](https://aubin.cc)
- [github.com/aubincc](https://github.com/aubincc)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this project, email / tweet /
[open issue](https://github.com/aubincc/nodejs-api-renew-jwt/issues) on Github

## MIT License

Copyright (c) 2023 Nicolas AUBIN

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the groups to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copygroup notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
