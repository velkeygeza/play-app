# PLAY

PLAY is a venue and activity booking app built with React, Vite and Supabase.

## Booking model

Every independently bookable physical unit is stored as one row in `resources`.
For example, a venue with three dartboards has three resources (Darts 1, Darts 2,
Darts 3). A bowling center with six lanes has six separate resources. Bookings
always point to one resource, never just to an activity or venue.

Instant bookings are created through the PostgreSQL `create_booking` RPC.
The database validates the resource, duration and capacity, calculates the
price, and uses a GiST exclusion constraint to prevent overlapping active
bookings on the same resource.

## Supabase setup

1. Open the Supabase SQL Editor for the PLAY project.
2. Apply the SQL migration in `supabase/migrations/20261117000100_booking_core.sql`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the local/StackBlitz
   environment. Never put a Supabase service-role key in the frontend.
4. The frontend booking and partner data helpers are in
   `src/lib/bookingService.js`.

The migration creates the core schema, row-level security policies, partner
membership roles, venue onboarding RPC, booking audit events, and the atomic
instant-booking RPC. It is committed to the repository; it is not automatically
applied to the Supabase database.
