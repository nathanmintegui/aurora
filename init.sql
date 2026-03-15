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
    name         varchar not null unique,
    abbreviation varchar not null unique
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
    question_id int     not null references questions (id),
    code        varchar not null,
    lang_id     int     not null references langs (id)
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


INSERT INTO question_complexity (description)
VALUES('Easy'),
      ('Medium'),
      ('Hard');

INSERT INTO langs ("name", abbreviation)
VALUES('Javascript', 'JS'),
      ('Java', 'Java'),
      ('Python', 'PY');

INSERT INTO questions (public_id, question_complexity_id, "content", created_at, updated_at)
VALUES(gen_random_uuid(), 1, '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#262626; max-width:800px;">
  <h2 style="margin-bottom:4px;">1. Two Sum</h2>
  <p style="color:#666; margin-top:0;">Easy</p>

  <p>
    Given an array of integers <code>nums</code> and an integer <code>target</code>, 
    return the indices of the two numbers such that they add up to <code>target</code>.
  </p>

  <p>
    You may assume that each input would have exactly one solution, and you may not use 
    the same element twice.
  </p>

  <p>You can return the answer in any order.</p>

  <h3>Example 1:</h3>
  <pre style="background:#f6f8fa;padding:12px;border-radius:6px;overflow:auto;">
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
  </pre>

  <h3>Example 2:</h3>
  <pre style="background:#f6f8fa;padding:12px;border-radius:6px;overflow:auto;">
Input: nums = [3,2,4], target = 6
Output: [1,2]
  </pre>

  <h3>Example 3:</h3>
  <pre style="background:#f6f8fa;padding:12px;border-radius:6px;overflow:auto;">
Input: nums = [3,3], target = 6
Output: [0,1]
  </pre>

  <h3>Constraints:</h3>
  <ul>
    <li><code>2 ≤ nums.length ≤ 10⁴</code></li>
    <li><code>-10⁹ ≤ nums[i] ≤ 10⁹</code></li>
    <li><code>-10⁹ ≤ target ≤ 10⁹</code></li>
    <li>Only one valid answer exists.</li>
  </ul>

  <h3>Follow-up:</h3>
  <p>
    Can you come up with an algorithm that runs in less than <code>O(n²)</code> time complexity?
  </p>
</div>', '2026-03-15 18:05:54.340', '2026-03-15 18:05:54.340');

INSERT INTO code_question_scaffold (question_id, code, lang_id)
VALUES(1, '/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    
}', 1);

