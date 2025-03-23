drop table if exists
    question_complexity,
    langs,
    questions,
    code_question_scaffold,
delete
cascade;

drop trigger if exists trigger_update_timestamp on questions;
drop function if exists update_timestamp;


create table question_complexity
(
    id          integer generated always as identity primary key,
    description varchar not null unique check (length(description) > 1)
);
create index idx_question_complexity_id on question_complexity (id);


create table langs
(
    id           integer generated always as identity primary key,
    name         varchar not null unique check (length(name) > 1),
    abbreviation varchar not null unique check (length(abbreviation) > 1)
);
create index idx_langs_id on langs (id);


create table questions
(
    id                     integer generated always as identity primary key,
    public_id              uuid        not null,
    question_complexity_id int         not null references question_complexity (id),
    content                varchar     not null unique check (length(content) > 1),
    created_at             timestamptz not null default current_timestamp,
    updated_at             timestamptz not null default current_timestamp check (updated_at >= created_at)
);
create index idx_questions_id on questions (id);
create index idx_questions_public_id on questions (public_id);


create table code_question_scaffold
(
    id          integer generated always as identity primary key,
    question_id int   not null references questions (id),
    code        jsonb not null,
    lang_id     int   not null references langs (id)
);


create
or replace function update_timestamp()
returns trigger as $$
begin
    new.updated_at
= current_timestamp;
return new;
end;
$$
language plpgsql;

create trigger trigger_update_timestamp
    before update
    on questions
    for each row
    execute function update_timestamp();

