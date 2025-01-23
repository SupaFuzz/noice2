create schema remulator;
create role remulator_user nologin;
grant usage on schema remulator to remulator_user;
grant remulator_user to authenticator;
grant api_user to remulator_user;
grant usage on schema remulator to web_anon;
grant usage on schema basic_auth to remulator_user;
