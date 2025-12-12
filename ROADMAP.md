# Book Share Roadmap

## Phase 0 — Codebase Hygiene

Goal: Stabilize what exists. No new features.

- [ ] Remove legacy or unused borrow functions in DataContext
- [ ] Confirm all pages use the same BorrowTransaction API for create, approve, reject, return
- [ ] Confirm MockDatabase is used only for dev and that SeedData is the single source of mock truth
- [ ] npm run build passes with zero errors and no unexpected warnings
- [ ] No console errors in normal flows (home, search, borrow, profile, clubs, admin)

## Phase 1 — Real Backend & Auth

Goal: Supabase as primary source of truth with basic authentication.

- [x] Books, users, clubs, and transactions saved in Supabase tables *(partial: books ✓, users ✓, clubs pending, transactions pending)*
- [x] All CRUD goes through service layer (bookService, transactionService, userService, clubService) *(partial: bookService ✓, userService ✓, others pending)*
- [ ] MockDatabase used only for storybook or removed completely *(in progress: HomePage prioritizes Supabase with fallback)*
- [x] Basic auth working (phone or email) with sessions persisting across refresh ✓
- [x] A new user can: sign up → complete profile → add a book → see it on Discover from another device ✓

## Phase 2 — Trust, Tokens & Transaction Lifecycle

Goal: Real world borrowing that can succeed or fail cleanly.

- [ ] Every borrow has clear statuses from request to complete or failed
- [ ] Both parties can confirm exchange and confirm return
- [ ] Overdue detection and status updates implemented
- [ ] Simple dispute flag on a transaction
- [ ] Token or deposit model implemented in database and UI
- [ ] Token ledger reconciles correctly across locks, releases, and penalties

## Phase 3 — Clubs & Community

Goal: Clubs become central to discovery and trust.

- [ ] Club discovery page showing top clubs by city
- [ ] Club profile with catalog, members, and basic info
- [ ] Flow: join a club → see its books → request a book
- [ ] Simple in app messaging for transactions and clubs
- [ ] Invite link to bring a friend into a club or to a specific book

## Phase 4 — UX, Discovery & Onboarding

Goal: Make the app feel deliberate and easy to adopt.

- [ ] Home has: hero section, top rated row, and at least one discovery row (new or popular)
- [ ] Onboarding flow: choose city → add books → join club → follow readers
- [ ] Empty states for new users on profile, loans, and clubs
- [ ] Analytics events hooked for: book added, borrow requested, borrow completed, club joined

## Phase 5 — Scale & Partnerships

Goal: Prepare for real world scale and social good impact.

- [ ] Basic moderation tools for admins (flagged users, flagged books)
- [ ] Backup and restore strategy documented for Supabase
- [ ] Simple public landing page describing the mission
- [ ] Instrumentation to track usage by city and by club
