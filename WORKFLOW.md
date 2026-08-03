# WORKFLOW.md — Round 1 vs Round 2 Prompting Comparison

For this drill I built the same feature twice: a user settings form with a
name field, an email field, and a notifications toggle. Round 1 came from a
single lazy prompt ("build me a settings form") with no follow-up. Round 2
came from a detailed spec in a fresh session, asking for react-hook-form +
zod validation, accessibility attributes, and a verification step where the
AI had to write and run its own tests.

## Correctness

This was the biggest gap, and it surprised me. I assumed Round 1 would at
least have basic validation since "settings form" implies fields that can be
wrong. It doesn't. I checked by grepping Round 1's component for "valid",
"error", and "required" and got zero matches. Looking at its `handleSubmit`
function directly, it just calls `setSavedSnapshot(settings)` and marks the
form as saved — no matter what's in the fields. I could submit a blank name
or type `asdf` into the email box and it would say "saved" every time.
Round 2 uses zod to reject an empty name and a badly formatted email, shows
an inline error under the right field, and disables Save until the form is
actually valid. I checked this myself in the browser (empty submit → error,
bad email → error, valid data → success message) and it also has 3 automated
tests that all pass.

## Accessibility

Round 1 has one `aria-describedby` on the form for a status message, but no
`aria-invalid` and no per-field error linking. Round 2 has both, because I
explicitly asked for them in the prompt — it wasn't something the AI added on
its own initiative in Round 1.

## Edge cases

Round 1 doesn't really have an "invalid" state at all — every submission is
treated the same. Round 2 specifically handles and tests three cases: empty
name, invalid email format, and a valid submission.

## Review effort

This is the part that changed my mind about what "good output" looks like.
Round 1's code is actually longer — 200 lines of JSX and 243 lines of CSS,
versus Round 2's 121 and 64. At a glance Round 1 looks more finished because
it's styled and fleshed out. But none of that length is doing real work —
it's a form-shaped shell. If I were shipping this, I'd have to rewrite the
entire submit logic from scratch, which means Round 1's "head start" was
mostly an illusion.

## Time

Round 2 felt slower while I was doing it — writing the detailed prompt took
real effort, and then I had to wait for it to build the component, install
testing libraries, write tests, and run them. Round 1 was done in under a
minute. But that's misleading: Round 1 isn't actually usable yet, and fixing
it (adding validation, error states, accessibility, and tests after the fact)
would take longer than Round 2 took start to finish. Counting that hidden
cleanup work, Round 2 was faster overall, not slower — I just paid the cost
up front instead of after.

## AI mistake I caught

The clearest mistake: Round 1's form looks fully built and never tells you
anything is wrong with it, because nothing checks. It would happily "save" an
empty form. I only caught this by deliberately testing bad input in the
browser and then confirming in the code that there was no validation logic
at all — if I'd just glanced at the UI, I would have assumed it worked.

## Takeaway

The lesson for me: a vague prompt gets you something that *looks* done, and a
precise prompt with a verification step gets you something that *is* done.
The extra time in Round 2 wasn't wasted — it replaced debugging time I would
have owed later anyway.
