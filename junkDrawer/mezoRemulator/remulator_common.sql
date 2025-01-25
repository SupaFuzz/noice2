create schema remulator;
create role remulator_user nologin;
grant usage on schema remulator to remulator_user;
grant remulator_user to authenticator;
grant api_user to remulator_user;
grant usage on schema remulator to web_anon;
grant usage on schema basic_auth to remulator_user;

/*
    form_registry
*/
create table remulator.form_registry (
    id                  serial primary key,
    submitter           int not null,
    create_date         timestamp default now(),
    modified_date       timestamp default now(),
    last_modified_by    int not null,
    status              varchar(10) not null default 'install' check(status in('install','ready','archive')),
    form_name           varchar(255) not null,
    table_name          varchar(255) not null,
    form_definition     jsonb,
    store_definition    jsonb
);

grant all on remulator.form_registry to mezo_user;
grant usage, select on sequence remulator.form_registry_id_seq to mezo_user;

create trigger form_registry_create before insert on remulator.form_registry
    for each row
    execute procedure api.handle_create();

create trigger form_registry_modify before update on remulator.form_registry
    for each row
    execute procedure api.handle_modify();
