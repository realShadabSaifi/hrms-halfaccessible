-- Seed data that does not require auth users.
-- Team members, leaves, and polls are created after people sign up (or via admin add-human).

insert into public.anonymous_messages (category, body, created_at) values
  ('✨ Vibe Check', 'the new deploy pipeline is so fast i don''t have time to make chai anymore. mixed feelings.', now() - interval '2 hours'),
  ('💡 Idea', 'burger holiday but for mondays after india wins a cricket match', now() - interval '5 hours'),
  ('🙌 Appreciation', 'whoever reviewed my PR at 11pm without complaining - you''re him. you''re the guy.', now() - interval '1 day'),
  ('🤔 Concern', 'the office AC has two modes: himalaya and surface of the sun. can we get a third mode', now() - interval '1 day'),
  ('📣 Feedback', 'standups are creeping past 15 mins again. respectfully, wrap it up', now() - interval '2 days'),
  ('💬 General', 'who keeps leaving exactly one biscuit in the packet. this is a cry for help', now() - interval '3 days');

insert into public.cxo_windows (name, title, tagline, avatar_color, window_label, slots_remaining) values
  ('Nikhil Verma', 'CEO', 'the vision guy. asks "but why?" a lot.', '#1C1C2E', 'Fri, Aug 21 · 4-5pm', 2),
  ('Ritika Shah', 'CTO', 'wrote the first commit. still reviews PRs at 1am.', '#5B2D8E', 'Wed, Aug 26 · 11am-12pm', 3),
  ('Farhan Ali', 'COO', 'makes the trains run. knows where the budget hides.', '#00816F', 'Tue, Sep 1 · 3-4pm', 1);

insert into public.activity_events (verb, body) values
  ('trip', 'FY27 trip poll opened - Gokarna is leading'),
  ('party', 'party request "Q3 shipped bash" approved'),
  ('announcement', 'new announcement: team trip - GOA WON');
