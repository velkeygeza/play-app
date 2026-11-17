import { useAuth } from "./hooks/useAuth";
import { AuthGate } from "./components/AuthGate";

import React, { useState, useMemo } from "react";

// ===== DESIGN SYSTEM =====

const COLORS = {
  background: "#F5F7FA",
  surface: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  accent: "#00B8A9", // turquoise / emerald
  accentSoft: "rgba(0,184,169,0.1)",
  border: "#E5E7EB",
  danger: "#EF4444",
  success: "#10B981",
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
};

const SHADOW = {
  soft: "0 8px 24px rgba(15,23,42,0.06)",
  subtle: "0 2px 8px rgba(15,23,42,0.04)",
};

const TYPO = {
  h1: { fontSize: 24, fontWeight: 700 },
  h2: { fontSize: 20, fontWeight: 600 },
  h3: { fontSize: 16, fontWeight: 600 },
  body: { fontSize: 14, fontWeight: 400 },
  caption: { fontSize: 12, fontWeight: 400 },
};

// ===== MOCK DATA =====

const ACTIVITIES = [
  "Darts",
  "Billiards",
  "Bowling",
  "Foosball",
  "Table Tennis",
  "Mini Golf",
  "Padel",
  "Squash",
  "Escape Rooms",
  "VR",
  "Laser Tag",
  "More",
];

const VENUES = [
  {
    id: 1,
    name: "Darts & Drinks",
    district: "VII",
    distanceKm: 1.2,
    activities: ["Darts", "Bar"],
    startingPrice: 2500,
    rating: 4.8,
    ratingCount: 164,
    nextAvailable: "Today · 18:00",
    image:
      "https://images.pexels.com/photos/1345791/pexels-photo-1345791.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: { lat: 47.4986, lng: 19.055 }, // center-ish
    description:
      "Cozy darts bar with 10 high-quality boards, craft beers and a friendly atmosphere in the heart of the Jewish Quarter.",
    openingHours: "Mon–Thu 16:00–00:00 · Fri–Sun 14:00–02:00",
    facilities: ["Craft beer", "Snacks", "Air conditioning", "Groups welcome"],
    pricePerActivity: {
      Darts: 2500,
    },
    slots: ["18:00", "19:00", "20:00", "21:00"],
    maxPlayersPerSlot: 6,
  },
  {
    id: 2,
    name: "Budapest Billiards Club",
    district: "VI",
    distanceKm: 2.4,
    activities: ["Billiards", "Snooker"],
    startingPrice: 3000,
    rating: 4.7,
    ratingCount: 231,
    nextAvailable: "Today · 19:00",
    image:
      "https://images.pexels.com/photos/1433052/pexels-photo-1433052.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: { lat: 47.502, lng: 19.06 },
    description:
      "Spacious billiards hall with 16 tournament-grade tables, snacks and lounge area.",
    openingHours: "Daily 12:00–02:00",
    facilities: ["Snacks", "Bar", "Tournament tables", "Locker area"],
    pricePerActivity: {
      Billiards: 3000,
      Snooker: 3500,
    },
    slots: ["17:00", "18:00", "19:00", "20:00", "21:00"],
    maxPlayersPerSlot: 4,
  },
  {
    id: 3,
    name: "Strike City Bowling",
    district: "XI",
    distanceKm: 4.8,
    activities: ["Bowling", "Arcade"],
    startingPrice: 4500,
    rating: 4.6,
    ratingCount: 312,
    nextAvailable: "Today · 17:30",
    image:
      "https://images.pexels.com/photos/1796722/pexels-photo-1796722.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: { lat: 47.476, lng: 19.04 },
    description:
      "Modern bowling center with 12 lanes, neon lighting, cocktails and casual food.",
    openingHours: "Daily 10:00–01:00",
    facilities: ["Food", "Cocktails", "Arcade", "Kids friendly"],
    pricePerActivity: {
      Bowling: 4500,
    },
    slots: ["16:00", "17:30", "19:00", "20:30", "22:00"],
    maxPlayersPerSlot: 6,
  },
  {
    id: 4,
    name: "VR Escape Budapest",
    district: "VIII",
    distanceKm: 3.1,
    activities: ["VR", "Escape Rooms"],
    startingPrice: 5900,
    rating: 4.9,
    ratingCount: 98,
    nextAvailable: "Today · 16:00",
    image:
      "https://images.pexels.com/photos/907239/pexels-photo-907239.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: { lat: 47.49, lng: 19.07 },
    description:
      "Immersive VR escape adventures and classic escape rooms for groups of 2–6 players.",
    openingHours: "Mon–Fri 14:00–22:00 · Sat–Sun 10:00–22:00",
    facilities: ["VR headsets", "Locker area", "Team events"],
    pricePerActivity: {
      VR: 7500,
      "Escape Rooms": 5900,
    },
    slots: ["14:00", "16:00", "18:00", "20:00"],
    maxPlayersPerSlot: 6,
  },
  {
    id: 5,
    name: "City Padel Arena",
    district: "III",
    distanceKm: 6.2,
    activities: ["Padel"],
    startingPrice: 8000,
    rating: 4.5,
    ratingCount: 76,
    nextAvailable: "Today · 20:00",
    image:
      "https://images.pexels.com/photos/5739151/pexels-photo-5739151.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: { lat: 47.54, lng: 19.03 },
    description:
      "Brand new indoor padel courts with pro-level flooring and equipment rental.",
    openingHours: "Daily 07:00–23:00",
    facilities: ["Indoor courts", "Racket rental", "Changing rooms"],
    pricePerActivity: {
      Padel: 8000,
    },
    slots: ["17:00", "18:30", "20:00", "21:30"],
    maxPlayersPerSlot: 4,
  },
];

// Simple map center stub for visual
const MAP_CENTER = { lat: 47.4979, lng: 19.0402 };

// ===== REUSABLE COMPONENTS =====

const Card = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.lg,
      boxShadow: SHADOW.soft,
      padding: 16,
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
  >
    {children}
  </div>
);

const Chip = ({ children, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      borderRadius: 999,
      border: selected ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
      padding: "6px 12px",
      fontSize: 12,
      backgroundColor: selected ? COLORS.accentSoft : "#FFFFFF",
      color: COLORS.text,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </button>
);

const PrimaryButton = ({ children, onClick, disabled, full }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: full ? "100%" : "auto",
      padding: "12px 16px",
      borderRadius: RADIUS.md,
      border: "none",
      backgroundColor: disabled ? "#9CA3AF" : COLORS.accent,
      color: "#FFFFFF",
      fontWeight: 600,
      fontSize: 15,
      cursor: disabled ? "default" : "pointer",
      boxShadow: SHADOW.subtle,
    }}
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, onClick, full }) => (
  <button
    onClick={onClick}
    style={{
      width: full ? "100%" : "auto",
      padding: "12px 16px",
      borderRadius: RADIUS.md,
      border: `1px solid ${COLORS.border}`,
      backgroundColor: "#FFFFFF",
      color: COLORS.text,
      fontWeight: 500,
      fontSize: 14,
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

const SectionTitle = ({ children, action }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      marginTop: 24,
    }}
  >
    <div style={{ ...TYPO.h2 }}>{children}</div>
    {action && <div style={{ fontSize: 12, color: COLORS.accent }}>{action}</div>}
  </div>
);

// ===== HOME SCREEN =====

const HomeScreen = ({
  onOpenVenue,
  filters,
  setFilters,
  favorites,
  toggleFavorite,
}) => {
  const [search, setSearch] = useState("");

  const filteredVenues = useMemo(() => {
    return VENUES.filter((v) => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.activity && !v.activities.includes(filters.activity)) return false;
      if (filters.minRating && v.rating < filters.minRating) return false;
      if (filters.maxDistance && v.distanceKm > filters.maxDistance) return false;
      return true;
    });
  }, [search, filters]);

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", color: COLORS.textMuted }}>
            Location
          </div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Budapest</div>
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          PLAY
        </div>
        <div
          style={{
            marginLeft: "auto",
            width: 32,
            height: 32,
            borderRadius: 999,
            background:
              "url(https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200) center/cover",
          }}
        ></div>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderRadius: RADIUS.lg,
          backgroundColor: "#FFFFFF",
          padding: "10px 12px",
          boxShadow: SHADOW.subtle,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 16,
            marginRight: 8,
            color: COLORS.textMuted,
          }}
        >
          🔍
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Where do you want to play?"
          style={{
            border: "none",
            outline: "none",
            fontSize: 14,
            flex: 1,
            backgroundColor: "transparent",
          }}
        />
      </div>

      {/* Quick filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, overflowX: "auto" }}>
        <Chip
          selected={!!filters.availableToday}
          onClick={() =>
            setFilters((f) => ({ ...f, availableToday: !f.availableToday }))
          }
        >
          Available today
        </Chip>
        <Chip
          selected={!!filters.minRating}
          onClick={() =>
            setFilters((f) => ({ ...f, minRating: f.minRating ? null : 4.5 }))
          }
        >
          4.5★ & up
        </Chip>
        <Chip
          selected={!!filters.maxDistance}
          onClick={() =>
            setFilters((f) => ({ ...f, maxDistance: f.maxDistance ? null : 3 }))
          }
        >
          Within 3 km
        </Chip>
      </div>

      {/* Categories */}
      <SectionTitle>Activities</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {ACTIVITIES.map((a) => (
          <button
            key={a}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                activity: f.activity === a ? null : a,
              }))
            }
            style={{
              position: "relative",
              borderRadius: RADIUS.md,
              border:
                filters.activity === a
                  ? `1px solid ${COLORS.accent}`
                  : `1px solid ${COLORS.border}`,
              padding: 8,
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              minHeight: 60,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: COLORS.text,
              }}
            >
              {a}
            </span>
          </button>
        ))}
      </div>

      {/* Recommended Venues */}
      <SectionTitle>Recommended in Budapest</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 64 }}>
        {filteredVenues.map((v) => (
          <Card
            key={v.id}
            onClick={() => onOpenVenue(v)}
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div style={{ position: "relative" }}>
              <img
                src={v.image}
                alt={v.name}
                style={{
                  width: "100%",
                  height: 170,
                  objectFit: "cover",
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(v.id);
                }}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: "rgba(15,23,42,0.5)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                {favorites.includes(v.id) ? "♥" : "♡"}
              </button>
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  padding: "4px 8px",
                  borderRadius: 999,
                  backgroundColor: "rgba(15,23,42,0.7)",
                  color: "#FFFFFF",
                  fontSize: 11,
                }}
              >
                {v.nextAvailable}
              </div>
            </div>
            <div style={{ padding: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <div>
                  <div style={{ ...TYPO.h3 }}>{v.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.textMuted,
                      marginTop: 2,
                    }}
                  >
                    Budapest, District {v.district} · {v.distanceKm.toFixed(1)} km
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {v.rating.toFixed(1)} ★
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                    {v.ratingCount} reviews
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textMuted,
                  marginBottom: 4,
                }}
              >
                {v.activities.join(" · ")}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 13 }}>
                  From{" "}
                  <span style={{ fontWeight: 600 }}>
                    {v.startingPrice.toLocaleString("hu-HU")} HUF
                  </span>
                  /hour
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.success,
                    backgroundColor: "rgba(16,185,129,0.08)",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  Available today
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filteredVenues.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: COLORS.textMuted,
              fontSize: 13,
              padding: "24px 12px 64px",
            }}
          >
            No venues match these filters yet. Try removing one of the filters.
          </div>
        )}
      </div>
    </div>
  );
};

// ===== DISCOVERY SCREEN (LIST + MAP) =====

const ExploreScreen = ({ onOpenVenue, filters, setFilters }) => {
  const [viewMode, setViewMode] = useState("list");

  const filteredVenues = useMemo(() => {
    return VENUES.filter((v) => {
      if (filters.activity && !v.activities.includes(filters.activity)) return false;
      if (filters.minRating && v.rating < filters.minRating) return false;
      if (filters.maxDistance && v.distanceKm > filters.maxDistance) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="screen">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ ...TYPO.h1 }}>Discover</div>
        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            backgroundColor: "#E5E7EB",
            padding: 4,
          }}
        >
          <button
            onClick={() => setViewMode("list")}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              backgroundColor:
                viewMode === "list" ? "#FFFFFF" : "transparent",
            }}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("map")}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              backgroundColor:
                viewMode === "map" ? "#FFFFFF" : "transparent",
            }}
          >
            Map
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto" }}>
        <Chip
          selected={!!filters.activity}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              activity: f.activity ? null : "Bowling",
            }))
          }
        >
          {filters.activity ? filters.activity : "Activity"}
        </Chip>

        <Chip
          selected={!!filters.minRating}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              minRating: f.minRating ? null : 4,
            }))
          }
        >
          Min rating
        </Chip>

        <Chip
          selected={!!filters.maxDistance}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              maxDistance: f.maxDistance ? null : 5,
            }))
          }
        >
          Distance
        </Chip>

        <Chip>Price</Chip>
        <Chip>Date</Chip>
        <Chip>Players</Chip>
      </div>

      {viewMode === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 64 }}>
          {filteredVenues.map((v) => (
            <Card
              key={v.id}
              onClick={() => onOpenVenue(v)}
              style={{ padding: 0, overflow: "hidden" }}
            >
              <div style={{ display: "flex" }}>
                <img
                  src={v.image}
                  alt={v.name}
                  style={{
                    width: 120,
                    height: 110,
                    objectFit: "cover",
                    borderTopLeftRadius: RADIUS.lg,
                    borderBottomLeftRadius: RADIUS.lg,
                  }}
                />
                <div style={{ padding: 10, flex: 1 }}>
                  <div style={{ ...TYPO.h3, marginBottom: 2 }}>{v.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    Budapest, District {v.district} · {v.distanceKm.toFixed(1)} km
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    {v.activities.join(" · ")}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      marginBottom: 4,
                    }}
                  >
                    From{" "}
                    <span style={{ fontWeight: 600 }}>
                      {v.startingPrice.toLocaleString("hu-HU")} HUF
                    </span>
                    /hour
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <div style={{ fontSize: 11 }}>
                      {v.rating.toFixed(1)} ★ · {v.ratingCount} reviews
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.success,
                        backgroundColor: "rgba(16,185,129,0.08)",
                        padding: "2px 6px",
                        borderRadius: 999,
                      }}
                    >
                      {v.nextAvailable}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div
          style={{
            borderRadius: RADIUS.lg,
            overflow: "hidden",
            boxShadow: SHADOW.soft,
            backgroundColor: "#E5E7EB",
            height: "calc(100vh - 180px)",
            position: "relative",
          }}
        >
          {/* This is a simplified custom "map" layout, no external API.
              The markers are positioned relatively to a pseudo-map. */}
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, #E5F9F6 0%, #F3F4F6 50%, #E5F9F6 100%)",
              position: "relative",
            }}
          >
            {/* Center dot for Budapest */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: "#4B5563",
                transform: "translate(-50%, -50%)",
              }}
            ></div>
            {filteredVenues.map((v, idx) => {
              // crude relative placement based on lat/lng difference
              const latDiff = v.location.lat - MAP_CENTER.lat;
              const lngDiff = v.location.lng - MAP_CENTER.lng;
              const x = 50 + lngDiff * 200; // scale for demo
              const y = 50 - latDiff * 200;
              return (
                <div
                  key={v.id}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                  }}
                  onClick={() => onOpenVenue(v)}
                >
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      padding: "6px 8px",
                      borderRadius: RADIUS.md,
                      boxShadow: SHADOW.subtle,
                      minWidth: 140,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {v.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.textMuted,
                        marginBottom: 2,
                      }}
                    >
                      {v.activities[0]} · From{" "}
                      {v.startingPrice.toLocaleString("hu-HU")} HUF
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.success,
                      }}
                    >
                      {v.nextAvailable}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      backgroundColor: COLORS.accent,
                      border: "2px solid #FFFFFF",
                      boxShadow: "0 0 0 2px rgba(0,184,169,0.3)",
                      margin: "4px auto 0",
                    }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== VENUE DETAIL + BOOKING FLOW =====

const VenueDetailScreen = ({
  venue,
  onBack,
  onStartBooking,
  favorites,
  toggleFavorite,
}) => {
  if (!venue) return null;

  return (
    <div className="screen">
      {/* Image header */}
      <div style={{ position: "relative", margin: "-16px -16px 12px" }}>
        <img
          src={venue.image}
          alt={venue.name}
          style={{ width: "100%", maxHeight: 260, objectFit: "cover" }}
        />
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 32,
            height: 32,
            borderRadius: 999,
            border: "none",
            backgroundColor: "rgba(15,23,42,0.65)",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          ←
        </button>
        <button
          onClick={() => toggleFavorite(venue.id)}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 999,
            border: "none",
            backgroundColor: "rgba(15,23,42,0.65)",
            color: "#FFFFFF",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          {favorites.includes(venue.id) ? "♥" : "♡"}
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ ...TYPO.h1, marginBottom: 4 }}>{venue.name}</div>
        <div
          style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}
        >
          Budapest, District {venue.district} · {venue.distanceKm.toFixed(1)} km
        </div>
        <div style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{venue.rating.toFixed(1)} ★</span>{" "}
          ({venue.ratingCount} reviews)
        </div>
      </div>

      {/* Quick meta */}
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>Activities</div>
            <div style={{ fontSize: 13 }}>{venue.activities.join(" · ")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              From
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {venue.startingPrice.toLocaleString("hu-HU")} HUF/hour
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          Opening hours: {venue.openingHours}
        </div>
      </Card>

      {/* Description */}
      <SectionTitle>About</SectionTitle>
      <div
        style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}
      >
        {venue.description}
      </div>

      {/* Facilities */}
      <SectionTitle>Facilities</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {venue.facilities.map((f) => (
          <Chip key={f}>{f}</Chip>
        ))}
      </div>

      {/* Map preview */}
      <SectionTitle>Location</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            width: "100%",
            height: 140,
            borderRadius: RADIUS.md,
            background:
              "linear-gradient(135deg, #E5F9F6 0%, #F3F4F6 50%, #E5F9F6 100%)",
            marginBottom: 8,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: COLORS.accent,
              border: "3px solid #FFFFFF",
              boxShadow: "0 0 0 3px rgba(0,184,169,0.25)",
            }}
          ></div>
        </div>
        <div style={{ fontSize: 13 }}>Central Budapest · District {venue.district}</div>
      </Card>

      {/* Booking slots */}
      <SectionTitle>Available today</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 80 }}>
        {venue.slots.map((s) => (
          <Chip key={s}>{s}</Chip>
        ))}
      </div>

      {/* CTA */}
      <div className="sticky-bottom">
        <PrimaryButton full onClick={onStartBooking}>
          Book now
        </PrimaryButton>
      </div>
    </div>
  );
};

// ===== BOOKING FLOW =====

const BookingFlow = ({ venue, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [activity, setActivity] = useState(
    venue ? venue.activities[0] : null
  );
  const [date, setDate] = useState("Today");
  const [time, setTime] = useState(null);
  const [table, setTable] = useState("Table 1");
  const [duration, setDuration] = useState(1);
  const [players, setPlayers] = useState(2);

  if (!venue) return null;

  const hourlyPrice =
    venue.pricePerActivity[activity] || venue.startingPrice;
  const totalPrice = hourlyPrice * duration;

  const canNext =
    (step === 1 && activity) ||
    (step === 2 && date) ||
    (step === 3 && time) ||
    (step === 4 && table) ||
    (step === 5 && duration && players);

  const handleConfirm = () => {
    const booking = {
      id: Date.now(),
      venueId: venue.id,
      venueName: venue.name,
      activity,
      date,
      time,
      table,
      duration,
      players,
      totalPrice,
      status: "Confirmed",
    };
    onComplete(booking);
  };

  const stepLabel = (s) => {
    const labels = {
      1: "Select activity",
      2: "Choose date",
      3: "Time slot",
      4: "Table / lane / court",
      5: "Duration & players",
      6: "Review",
    };
    return labels[s];
  };

  return (
    <div className="screen">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button
          onClick={() => {
            if (step === 1) onClose();
            else setStep((s) => s - 1);
          }}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            marginRight: 8,
          }}
        >
          ←
        </button>
        <div style={{ ...TYPO.h1 }}>Book {venue.name}</div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: COLORS.textMuted,
          marginBottom: 12,
        }}
      >
        Step {step} of 6 · {stepLabel(step)}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          borderRadius: 999,
          backgroundColor: "#E5E7EB",
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(step / 6) * 100}%`,
            height: "100%",
            backgroundColor: COLORS.accent,
          }}
        ></div>
      </div>

      {/* Steps */}
      {step === 1 && (
        <>
          <SectionTitle>Select activity</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {venue.activities.map((a) => (
              <Card
                key={a}
                onClick={() => setActivity(a)}
                style={{
                  border:
                    activity === a
                      ? `1px solid ${COLORS.accent}`
                      : `1px solid transparent`,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ ...TYPO.h3 }}>{a}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.textMuted,
                      }}
                    >
                      From{" "}
                      {(venue.pricePerActivity[a] || venue.startingPrice).toLocaleString(
                        "hu-HU"
                      )}{" "}
                      HUF/hour
                    </div>
                  </div>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      border:
                        activity === a
                          ? `5px solid ${COLORS.accent}`
                          : `1px solid ${COLORS.border}`,
                    }}
                  ></div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <SectionTitle>Choose date</SectionTitle>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {["Today", "Tomorrow", "Fri", "Sat", "Sun"].map((d) => (
              <Chip
                key={d}
                selected={date === d}
                onClick={() => setDate(d)}
              >
                {d}
              </Chip>
            ))}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>
            Showing real-time availability for {date} (demo data).
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <SectionTitle>Time slot</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {venue.slots.map((s) => (
              <Chip
                key={s}
                selected={time === s}
                onClick={() => setTime(s)}
              >
                {s}
              </Chip>
            ))}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <SectionTitle>Table / lane / court</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Table 1", "Table 2", "Table 3", "VIP"].map((t) => (
              <Chip
                key={t}
                selected={table === t}
                onClick={() => setTable(t)}
              >
                {t}
              </Chip>
            ))}
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <SectionTitle>Duration</SectionTitle>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[1, 1.5, 2, 3].map((d) => (
              <Chip
                key={d}
                selected={duration === d}
                onClick={() => setDuration(d)}
              >
                {d} h
              </Chip>
            ))}
          </div>

          <SectionTitle>Players</SectionTitle>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[2, 3, 4, 5, 6].map((p) => (
              <Chip
                key={p}
                selected={players === p}
                onClick={() => setPlayers(p)}
              >
                {p} players
              </Chip>
            ))}
          </div>

          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <div style={{ fontSize: 13 }}>Price per hour</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {hourlyPrice.toLocaleString("hu-HU")} HUF
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <div style={{ fontSize: 13 }}>Duration</div>
              <div style={{ fontSize: 13 }}>{duration} hours</div>
            </div>
            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                marginTop: 6,
                paddingTop: 6,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Total</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {totalPrice.toLocaleString("hu-HU")} HUF
              </div>
            </div>
          </Card>
        </>
      )}

      {step === 6 && (
        <>
          <SectionTitle>Review booking</SectionTitle>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              <strong>{venue.name}</strong>
            </div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              {activity} · {date} at {time}
            </div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              {table} · {players} players · {duration} hours
            </div>
            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                marginTop: 6,
                paddingTop: 6,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 13 }}>Total</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {totalPrice.toLocaleString("hu-HU")} HUF
              </div>
            </div>
          </Card>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>
            By confirming, you agree to the venue’s rules and PLAY’s booking terms.
            This is a demo – no real payment will be processed.
          </div>
        </>
      )}

      {/* Bottom actions */}
      <div className="sticky-bottom" style={{ display: "flex", gap: 8 }}>
        {step < 6 && (
          <SecondaryButton
            full
            onClick={() => {
              if (!canNext) return;
              setStep((s) => s + 1);
            }}
          >
            Continue
          </SecondaryButton>
        )}
        {step === 6 && (
          <PrimaryButton full onClick={handleConfirm}>
            Confirm reservation
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

// ===== PROFILE & BOOKINGS =====

const BookingsScreen = ({ bookings }) => {
  const now = new Date();
  const upcoming = bookings;
  // For demo, treat all as upcoming; a real app would compare dates

  return (
    <div className="screen">
      <div style={{ ...TYPO.h1, marginBottom: 12 }}>My bookings</div>
      {upcoming.length === 0 && (
        <div
          style={{
            marginTop: 24,
            fontSize: 13,
            color: COLORS.textMuted,
          }}
        >
          You don’t have any reservations yet. Find a venue on Home or Explore to
          get started.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {upcoming.map((b) => (
          <Card key={b.id}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {b.venueName}
            </div>
            <div style={{ fontSize: 12, marginBottom: 2 }}>
              {b.activity} · {b.date} at {b.time}
            </div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              {b.table} · {b.players} players · {b.duration} h
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {b.totalPrice.toLocaleString("hu-HU")} HUF
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.success,
                  backgroundColor: "rgba(16,185,129,0.08)",
                  padding: "2px 6px",
                  borderRadius: 999,
                }}
              >
                {b.status}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ProfileScreen = ({ favorites, bookings }) => {
  const favoriteVenues = VENUES.filter((v) => favorites.includes(v.id));
  return (
    <div className="screen">
      <div style={{ ...TYPO.h1, marginBottom: 16 }}>Profile</div>
      <Card style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background:
              "url(https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200) center/cover",
            marginRight: 12,
          }}
        ></div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Alex Kovács</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>
            alex.kovacs@example.com
          </div>
        </div>
      </Card>

      <SectionTitle>Upcoming reservations</SectionTitle>
      {bookings.length === 0 ? (
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
          No upcoming reservations yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bookings.slice(0, 2).map((b) => (
            <Card key={b.id}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{b.venueName}</div>
              <div style={{ fontSize: 12 }}>
                {b.activity} · {b.date} at {b.time}
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle>Favorites</SectionTitle>
      {favoriteVenues.length === 0 ? (
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
          Save venues you like and they’ll appear here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {favoriteVenues.map((v) => (
            <Card key={v.id}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                {v.activities.join(" · ")}
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle>Settings</SectionTitle>
      <Card>
        <div style={{ fontSize: 13, marginBottom: 8 }}>Notifications</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
          Receive booking confirmations and reminders via email.
        </div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>Language</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>English (HU soon)</div>
      </Card>
    </div>
  );
};

// ===== ROOT APP WITH NAVIGATION =====

const TABS = {
  HOME: "HOME",
  EXPLORE: "EXPLORE",
  BOOKINGS: "BOOKINGS",
  PROFILE: "PROFILE",
};

const App = () => {
  const [activeTab, setActiveTab] = useState(TABS.HOME);
  const [filters, setFilters] = useState({
    activity: null,
    minRating: null,
    maxDistance: null,
    availableToday: true,
  });
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [bookingVenue, setBookingVenue] = useState(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (venueId) => {
    setFavorites((prev) =>
      prev.includes(venueId)
        ? prev.filter((id) => id !== venueId)
        : [...prev, venueId]
    );
  };

  const startBookingForVenue = (venue) => {
    setBookingVenue(venue);
    setBookingMode(true);
  };

  const handleBookingComplete = (booking) => {
    setBookings((prev) => [...prev, booking]);
    setBookingMode(false);
    setSelectedVenue(null);
    setActiveTab(TABS.BOOKINGS);
  };

  const renderContent = () => {
    if (bookingMode && bookingVenue) {
      return (
        <BookingFlow
          venue={bookingVenue}
          onClose={() => setBookingMode(false)}
          onComplete={handleBookingComplete}
        />
      );
    }

    if (selectedVenue) {
      return (
        <VenueDetailScreen
          venue={selectedVenue}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onBack={() => setSelectedVenue(null)}
          onStartBooking={() => startBookingForVenue(selectedVenue)}
        />
      );
    }

    switch (activeTab) {
      case TABS.HOME:
        return (
          <HomeScreen
            onOpenVenue={setSelectedVenue}
            filters={filters}
            setFilters={setFilters}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        );
      case TABS.EXPLORE:
        return (
          <ExploreScreen
            onOpenVenue={setSelectedVenue}
            filters={filters}
            setFilters={setFilters}
          />
        );
      case TABS.BOOKINGS:
        return <BookingsScreen bookings={bookings} />;
      case TABS.PROFILE:
        return (
          <ProfileScreen favorites={favorites} bookings={bookings} />
        );
      default:
        return null;
    }
  };

  const navItem = (tab, label, icon) => {
    const active = activeTab === tab;
    return (
      <button
        key={tab}
        onClick={() => {
          setSelectedVenue(null);
          setBookingMode(false);
          setActiveTab(tab);
        }}
        style={{
          flex: 1,
          border: "none",
          background: "transparent",
          padding: "6px 4px",
          cursor: "pointer",
          color: active ? COLORS.accent : COLORS.textMuted,
          fontSize: 11,
          fontWeight: active ? 600 : 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="app-root">
      <div className="app-shell">
        {renderContent()}

        {/* Bottom nav */}
        <div className="bottom-nav">
          {navItem(TABS.HOME, "Home", "🏠")}
          {navItem(TABS.EXPLORE, "Explore", "🗺️")}
          {navItem(TABS.BOOKINGS, "My bookings", "📅")}
          {navItem(TABS.PROFILE, "Profile", "👤")}
        </div>
      </div>
    </div>
  );
};

export default App;
