import { supabase } from "./supabase";

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export async function getPublishedVenues() {
  return unwrap(
    await supabase
      .from("venues")
      .select("*, venue_activities(activity:activities(*))")
      .eq("status", "published")
      .order("name")
  );
}

export async function getVenueResources(venueId, activityId) {
  let query = supabase
    .from("resources")
    .select("*, activity:activities(*)")
    .eq("venue_id", venueId)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (activityId) query = query.eq("activity_id", activityId);
  return unwrap(await query);
}

/**
 * Returns active bookings and maintenance blocks that overlap the requested
 * interval. A booking may start before the interval and still overlap it.
 */
export async function getResourceAvailability(resourceId, startsAt, endsAt) {
  const [bookings, blackouts] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, starts_at, ends_at, status")
      .eq("resource_id", resourceId)
      .in("status", ["pending", "confirmed"])
      .lt("starts_at", endsAt)
      .gt("ends_at", startsAt),
    supabase
      .from("resource_blackouts")
      .select("id, starts_at, ends_at, reason")
      .eq("resource_id", resourceId)
      .lt("starts_at", endsAt)
      .gt("ends_at", startsAt),
  ]);

  return {
    bookings: unwrap(bookings),
    blackouts: unwrap(blackouts),
  };
}

/**
 * Instant booking is performed by a PostgreSQL RPC so validation, pricing,
 * and the no-double-booking constraint run atomically on the server.
 */
export async function createInstantBooking({
  resourceId,
  startsAt,
  endsAt,
  guestCount = 1,
  customerNote = null,
}) {
  const data = unwrap(
    await supabase.rpc("create_booking", {
      p_resource_id: resourceId,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
      p_guest_count: guestCount,
      p_customer_note: customerNote,
    })
  );

  return Array.isArray(data) ? data[0] : data;
}

export async function getMyBookings() {
  return unwrap(
    await supabase
      .from("bookings")
      .select(
        "*, resource:resources(name, activity:activities(name), venue:venues(id, name, address, city, image_url))"
      )
      .order("starts_at", { ascending: false })
  );
}

export async function getPartnerVenues() {
  return unwrap(
    await supabase
      .from("venue_members")
      .select("role, venue:venues(id, name, city, status, image_url)")
      .order("created_at", { ascending: true })
  );
}

export async function getPartnerBookings(venueId, from, to) {
  return unwrap(
    await supabase
      .from("bookings")
      .select(
        "*, resource:resources!inner(id, name, venue_id, activity:activities(name))"
      )
      .eq("resource.venue_id", venueId)
      .gte("starts_at", from)
      .lt("starts_at", to)
      .order("starts_at")
  );
}

export async function createVenueResource({
  venueId,
  activityId,
  name,
  capacity = 2,
  priceAmount,
  currency = "HUF",
  pricingUnitMinutes = 60,
  minBookingMinutes = 60,
  maxBookingMinutes = null,
}) {
  return unwrap(
    await supabase
      .from("resources")
      .insert({
        venue_id: venueId,
        activity_id: activityId,
        name,
        capacity,
        price_amount: priceAmount,
        currency,
        pricing_unit_minutes: pricingUnitMinutes,
        min_booking_minutes: minBookingMinutes,
        max_booking_minutes: maxBookingMinutes,
      })
      .select()
      .single()
  );
}

export async function updateBookingStatus(bookingId, status) {
  return unwrap(
    await supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", bookingId)
      .select()
      .single()
  );
}
