"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Table, ClubSettings, Booking } from "@/types/database";
import {
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
  CreditCard,
  ArrowRight,
  Search,
  Receipt,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Filter,
  Check,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const [tables, setTables] = useState<any[]>([]);
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Table filter state
  const [tableFilter, setTableFilter] = useState<"all" | "snooker" | "pool">("all");

  // Booking form state
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [bookingTime, setBookingTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    const h = String(d.getHours()).padStart(2, "0");
    return `${h}:00`;
  });
  const [duration, setDuration] = useState(60);
  const [bookingNotes, setBookingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Customer History Lookup state
  const [historyPhone, setHistoryPhone] = useState("");
  const [historyData, setHistoryData] = useState<any | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchClubData = async () => {
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      if (data.tables) setTables(data.tables);
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      console.error("Error loading tables:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
    const interval = setInterval(fetchClubData, 10000);
    return () => clearInterval(interval);
  }, []);

  const calculatedPrice = selectedTable
    ? Math.round((Number(selectedTable.hourly_rate) * duration) / 60)
    : 0;
  const depositRequired = selectedTable
    ? Math.round((calculatedPrice * (settings?.deposit_percentage || 25)) / 100)
    : 0;

  const handleSelectTableAndScroll = (table: any) => {
    setSelectedTable(table);
    setBookingSuccess(null);
    setBookingError(null);
    const el = document.getElementById("booking-box");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);

    const fullStartTime = new Date(`${bookingDate}T${bookingTime}:00`);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          tableId: selectedTable.id,
          startTime: fullStartTime.toISOString(),
          durationMinutes: duration,
          bookingType: "reservation",
          notes: bookingNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBookingError(data.error || "Failed to complete booking");
      } else {
        setBookingSuccess(data.booking);
        fetchClubData();
      }
    } catch (err: any) {
      setBookingError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyPhone.trim()) return;
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryData(null);

    try {
      const cleanPhone = historyPhone.trim().replace(/\D/g, "").slice(-10);
      const resCust = await fetch(`/api/customers?q=${cleanPhone}`);
      const custData = await resCust.json();

      if (!custData.customers || custData.customers.length === 0) {
        setHistoryError("No customer record found with this phone number.");
        setHistoryLoading(false);
        return;
      }

      const customer = custData.customers[0];
      const resHist = await fetch(`/api/customers?id=${customer.id}`);
      const fullHistory = await resHist.json();
      setHistoryData(fullHistory);
    } catch (err: any) {
      setHistoryError(err.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (tableFilter === "all") return true;
    return t.table_type === tableFilter;
  });

  return (
    <div className="min-h-screen bg-[#0B0E0C] text-[#F4F0E6] selection:bg-[#0C7049] selection:text-[#F4F0E6]">
      {/* 1. REFINED EDITORIAL NAVIGATION */}
      <header className="border-b border-[#303A31] bg-[#0B0E0C]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          {/* Brand Wordmark & Monogram */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="w-10 h-10 border border-[#D7BC83]/40 bg-[#111A14] flex items-center justify-center transition-colors group-hover:border-[#D7BC83]">
              <span className="font-display text-sm font-bold tracking-widest text-[#D7BC83]">CC</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg tracking-[0.18em] uppercase text-[#F4F0E6] font-semibold">
                Cue<span className="text-[#D7BC83]">Club</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#A7AEA6] -mt-0.5">
                Private Billiards & Lounge
              </span>
            </div>
          </Link>

          {/* Editorial Navigation Links */}
          <nav className="hidden md:flex items-center space-x-10 text-[11px] uppercase tracking-[0.22em] text-[#A7AEA6]">
            <a href="#tables" className="hover:text-[#F4F0E6] transition-colors">
              Tables
            </a>
            <a href="#experience" className="hover:text-[#F4F0E6] transition-colors">
              Club Experience
            </a>
            <a href="#booking-box" className="hover:text-[#F4F0E6] transition-colors">
              Reserve
            </a>
            <a href="#history" className="hover:text-[#F4F0E6] transition-colors">
              My Bookings
            </a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center space-x-4">
            <a
              href="#booking-box"
              className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#0B0E0C] bg-[#D7BC83] hover:bg-[#EAD7A6] transition-colors duration-200"
            >
              Reserve Table
            </a>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC PHOTOGRAPHIC HERO */}
      <section className="relative overflow-hidden border-b border-[#303A31] bg-[#0B0E0C]">
        {/* Dominant Photographic Canvas */}
        <div className="relative w-full h-[620px] sm:h-[700px] lg:h-[780px]">
          <Image
            src="/images/hero-snooker.jpg"
            alt="Championship 12ft snooker table under warm pendant light at CueClub"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter brightness-[0.72] contrast-[1.08]"
          />

          {/* Restrained cinematic dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E0C] via-[#0B0E0C]/40 to-[#0B0E0C]/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E0C] via-[#0B0E0C]/70 to-transparent" />

          {/* Editorial Content Container */}
          <div className="absolute inset-0 max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-end pb-16 sm:pb-20">
            <div className="max-w-3xl space-y-6">
              {/* Eyebrow */}
              <div className="flex items-center space-x-3">
                <span className="w-8 h-[1px] bg-[#D7BC83]" />
                <span className="text-[11px] uppercase tracking-[0.28em] text-[#D7BC83] font-semibold">
                  The Art of the Perfect Frame
                </span>
              </div>

              {/* Major Editorial Headline */}
              <h1 className="font-editorial text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-normal tracking-tight text-[#F4F0E6] leading-[1.02]">
                Your Table. <br />
                <span className="italic text-[#D7BC83] font-serif">Your Moment.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-[#A7AEA6] max-w-xl font-light leading-relaxed">
                Exceptional tables. Uninterrupted play. Every detail, considered. Experience authentic
                English wool baize, championship steel cushions, and effortless digital reservations.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="#booking-box"
                  className="px-7 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold text-[#0B0E0C] bg-[#D7BC83] hover:bg-[#EAD7A6] transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>Reserve Your Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#experience"
                  className="px-7 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold text-[#F4F0E6] border border-[#303A31] hover:border-[#D7BC83]/60 bg-[#111A14]/60 backdrop-blur-sm transition-colors duration-200"
                >
                  Discover CueClub
                </a>
              </div>
            </div>

            {/* Editorial Metadata Bar */}
            <div className="mt-12 pt-6 border-t border-[#303A31]/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs text-[#A7AEA6]">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#D7BC83] block">Club Arena</span>
                <span className="font-medium text-[#F4F0E6] mt-0.5 block">6 Tournament Tables</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#D7BC83] block">Cloth Standard</span>
                <span className="font-medium text-[#F4F0E6] mt-0.5 block">Strachan 6811 English Baize</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#D7BC83] block">Arrival Window</span>
                <span className="font-medium text-[#F4F0E6] mt-0.5 block">{settings?.grace_period_minutes || 10} Mins Grace Period</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#D7BC83] block">Reservation Lock</span>
                <span className="font-medium text-[#30BD83] mt-0.5 block">Zero Double-Booking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE BRAND DETAIL / HAIRLINE ACCENT */}
      <div className="hairline-separator" />

      {/* 4. TABLE DISCOVERY ("FIND YOUR TABLE") */}
      <section id="tables" className="py-20 sm:py-28 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#303A31] pb-8">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#D7BC83] font-semibold block">
              01 / Private Arenas
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[#F4F0E6]">
              Find Your Table
            </h2>
            <p className="text-sm text-[#A7AEA6] max-w-lg font-light leading-relaxed">
              Choose your table. We&apos;ll take care of the details. Real-time availability synced with our marshals.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center border border-[#303A31] bg-[#111A14] p-1 text-[11px] uppercase tracking-[0.16em]">
            <button
              onClick={() => setTableFilter("all")}
              className={`px-4 py-2 transition-colors ${
                tableFilter === "all" ? "bg-[#19221B] text-[#D7BC83] font-semibold" : "text-[#A7AEA6] hover:text-[#F4F0E6]"
              }`}
            >
              All Tables ({tables.length})
            </button>
            <button
              onClick={() => setTableFilter("snooker")}
              className={`px-4 py-2 transition-colors ${
                tableFilter === "snooker" ? "bg-[#19221B] text-[#D7BC83] font-semibold" : "text-[#A7AEA6] hover:text-[#F4F0E6]"
              }`}
            >
              12ft Snooker
            </button>
            <button
              onClick={() => setTableFilter("pool")}
              className={`px-4 py-2 transition-colors ${
                tableFilter === "pool" ? "bg-[#19221B] text-[#D7BC83] font-semibold" : "text-[#A7AEA6] hover:text-[#F4F0E6]"
              }`}
            >
              American Pool
            </button>
          </div>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border border-[#D7BC83] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#A7AEA6]">Syncing table statuses...</p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTables.map((table, idx) => {
              const isAvail = table.status === "available";
              const isInPlay = table.status === "in_play";
              const isReserved = table.status === "reserved";
              const isMaint = table.status === "maintenance";
              const isSelected = selectedTable?.id === table.id;

              return (
                <div
                  key={table.id}
                  onClick={() => {
                    if (!isMaint) handleSelectTableAndScroll(table);
                  }}
                  className={`border transition-all duration-300 relative flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? "border-[#D7BC83] bg-[#19221B] shadow-editorial-gold"
                      : "border-[#303A31] bg-[#111A14] hover:border-[#D7BC83]/60 hover:bg-[#19221B]"
                  }`}
                >
                  {/* Top Bar with Numbering & Status Badge */}
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between border-b border-[#303A31]/60 pb-3">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#D7BC83] font-mono">
                        N° 0{idx + 1}
                      </span>
                      {/* Clean Status Badge with accessible text label */}
                      <span
                        className={`text-[10px] uppercase tracking-[0.16em] font-semibold px-2.5 py-1 ${
                          isAvail
                            ? "status-badge-available"
                            : isInPlay
                            ? "status-badge-inplay"
                            : isReserved
                            ? "status-badge-reserved"
                            : "status-badge-maintenance"
                        }`}
                      >
                        {isAvail
                          ? "Available"
                          : isInPlay
                          ? "In Play"
                          : isReserved
                          ? "Reserved"
                          : "Maintenance"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#A7AEA6] block">
                        {table.table_type === "snooker" ? "12ft Championship Snooker" : "9ft Brunswick American Pool"}
                      </span>
                      <h3 className="font-editorial text-2xl font-normal text-[#F4F0E6] mt-1">
                        {table.name}
                      </h3>
                      <p className="text-xs text-[#A7AEA6] mt-2 font-light leading-relaxed line-clamp-2">
                        {table.description || "Precision English baize, steel block cushions, calibrated ball set."}
                      </p>
                    </div>
                  </div>

                  {/* Hourly Rate & Action */}
                  <div className="p-6 pt-4 border-t border-[#303A31]/60 flex items-end justify-between bg-[#0B0E0C]/40">
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#A7AEA6] block">Hourly Rate</span>
                      <div className="flex items-baseline space-x-1 mt-0.5">
                        <span className="font-display text-2xl font-bold text-[#D7BC83] tabular-nums">
                          ₹{table.hourly_rate}
                        </span>
                        <span className="text-xs text-[#A7AEA6] font-light">/ hour</span>
                      </div>
                      {table.peak_hourly_rate && (
                        <span className="text-[10px] text-[#A7AEA6] block">Peak: ₹{table.peak_hourly_rate}</span>
                      )}
                    </div>

                    <div>
                      {isAvail ? (
                        <span className="inline-flex items-center text-[10px] uppercase tracking-[0.18em] font-semibold text-[#D7BC83] group-hover:translate-x-1 transition-transform">
                          Select & Book →
                        </span>
                      ) : isMaint ? (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#A7AEA6]">Unavailable</span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#A7AEA6] group-hover:text-[#F4F0E6]">
                          Book Ahead →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. THE CLUB EXPERIENCE (EDITORIAL PHOTO & STORY SPREAD) */}
      <section id="experience" className="border-t border-b border-[#303A31] bg-[#111A14] py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Atmospheric Photography */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] w-full border border-[#303A31] overflow-hidden">
                <Image
                  src="/images/lounge-snooker.jpg"
                  alt="CueClub private lounge fireplace and snooker arena"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center filter brightness-[0.78] contrast-[1.05]"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#A7AEA6]">
                <span>Arena Riley Aristocrat II</span>
                <span className="text-[#D7BC83]">Strachan 6811 Gold Tournament Baize</span>
              </div>
            </div>

            {/* Right: Editorial Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-[1px] bg-[#D7BC83]" />
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#D7BC83] font-semibold">
                  02 / The Sanctuary
                </span>
              </div>

              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[#F4F0E6] leading-tight">
                Crafted for the Serious Player. <br />
                <span className="italic text-[#D7BC83]">Curated for Hospitality.</span>
              </h2>

              <p className="text-sm text-[#A7AEA6] font-light leading-relaxed">
                CueClub was conceived as an antidote to crowded, noisy pool halls. Here, every table occupies
                its own quiet acoustic zone, illuminated by custom brass pendant lighting calibrated to eliminate shadows across the baulk line.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#303A31]">
                <div>
                  <h4 className="font-display text-xs uppercase tracking-[0.2em] text-[#F4F0E6]">
                    Championship Slate
                  </h4>
                  <p className="text-xs text-[#A7AEA6] mt-1 font-light leading-relaxed">
                    Precision diamond-honed 5-piece Italian slate ensuring a flat, true roll for every shot.
                  </p>
                </div>
                <div>
                  <h4 className="font-display text-xs uppercase tracking-[0.2em] text-[#F4F0E6]">
                    Aramith 1G Ball Sets
                  </h4>
                  <p className="text-xs text-[#A7AEA6] mt-1 font-light leading-relaxed">
                    Laser-matched phenolic resin balls calibrated to within 1 gram tolerance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. THE BOOKING INTERFACE (ELEGANT 6-STEP RESERVATION) */}
      <section id="booking-box" className="py-20 sm:py-28 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="border border-[#303A31] bg-[#111A14] p-8 sm:p-12 space-y-10">
          {/* Header & Steps Progression */}
          <div className="border-b border-[#303A31] pb-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#D7BC83] font-semibold">
                03 — Reservation Desk
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A7AEA6] font-mono">
                Verified Conflict-Free Engine
              </span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[#F4F0E6]">
              Book Your Table
            </h2>
            <p className="text-xs sm:text-sm text-[#A7AEA6] font-light leading-relaxed">
              Complete the sequence below. All reservations are locked with row-level double-booking prevention.
            </p>

            {/* Visual Step Progress Strip */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-4">
              {[
                { num: "01", label: "Date" },
                { num: "02", label: "Table" },
                { num: "03", label: "Time" },
                { num: "04", label: "Duration" },
                { num: "05", label: "Player" },
                { num: "06", label: "Confirm" },
              ].map((s) => (
                <div
                  key={s.num}
                  className="p-2 border border-[#303A31] bg-[#0B0E0C] text-center"
                >
                  <span className="block text-[9px] font-mono text-[#D7BC83]">{s.num}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[#F4F0E6] font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {bookingSuccess ? (
            /* Confirmation Screen */
            <div className="p-8 border border-[#0C7049] bg-[#0B0E0C] text-center space-y-6 animate-fadeIn">
              <div className="w-12 h-12 border border-[#30BD83] flex items-center justify-center mx-auto text-[#30BD83]">
                <Check className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#30BD83] font-semibold">
                  Official Confirmation Issued
                </span>
                <h3 className="font-editorial text-3xl font-normal text-[#F4F0E6] mt-1">
                  Your Table is Reserved
                </h3>
                <p className="text-xs text-[#A7AEA6] mt-1">
                  Please present your booking reference upon arrival at the lounge reception.
                </p>
              </div>

              {/* Official Booking Reference Certificate */}
              <div className="max-w-md mx-auto border border-[#303A31] bg-[#111A14] p-6 text-left space-y-3 font-sans text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-[#303A31]">
                  <span className="text-[#A7AEA6] uppercase tracking-[0.16em] text-[10px]">Reference Code</span>
                  <span className="font-mono text-sm font-bold text-[#D7BC83]">{bookingSuccess.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A7AEA6]">Table:</span>
                  <span className="font-medium text-[#F4F0E6]">{bookingSuccess.table?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A7AEA6]">Scheduled Slot:</span>
                  <span className="font-medium text-[#F4F0E6]">
                    {new Date(bookingSuccess.start_time).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A7AEA6]">Estimated Total:</span>
                  <span className="font-bold text-[#D7BC83]">₹{bookingSuccess.estimated_price}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#303A31]">
                  <span className="text-[#D99B43] font-medium">Arrival Grace Deadline:</span>
                  <span className="font-mono text-[#D99B43] font-bold">
                    {new Date(bookingSuccess.grace_deadline).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccess(null);
                    setSelectedTable(null);
                  }}
                  className="px-6 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-[#0B0E0C] bg-[#D7BC83] hover:bg-[#EAD7A6] transition-colors"
                >
                  Book Another Table
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Booking Form */
            <form onSubmit={handleCreateBooking} className="space-y-6">
              {/* Conflict Error Banner */}
              {bookingError && (
                <div className="p-4 border border-rose-900 bg-rose-950/40 text-xs text-rose-300 flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-rose-200 uppercase tracking-wider text-[10px]">
                      Collision Detected
                    </span>
                    <span>{bookingError}</span>
                  </div>
                </div>
              )}

              {/* Step 1: Table Arena */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-[#D7BC83] font-semibold mb-2">
                  01 / Select Arena Table *
                </label>
                <select
                  className="w-full bg-[#0B0E0C] border border-[#303A31] px-4 py-3 text-sm text-[#F4F0E6] focus:outline-none focus:border-[#D7BC83] transition-colors"
                  value={selectedTable?.id || ""}
                  onChange={(e) => {
                    const t = tables.find((tbl) => tbl.id === e.target.value);
                    setSelectedTable(t || null);
                  }}
                  required
                >
                  <option value="">-- Choose from Available Tables --</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.status === "maintenance"}>
                      {t.name} ({t.table_type.toUpperCase()}) — ₹{t.hourly_rate}/hr [{t.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2, 3, 4: Date, Time & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-[#D7BC83] font-semibold mb-2">
                    02 / Date *
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#0B0E0C] border border-[#303A31] px-4 py-3 text-sm text-[#F4F0E6] focus:outline-none focus:border-[#D7BC83] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-[#D7BC83] font-semibold mb-2">
                    03 / Start Time *
                  </label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-[#0B0E0C] border border-[#303A31] px-4 py-3 text-sm text-[#F4F0E6] focus:outline-none focus:border-[#D7BC83] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-[#D7BC83] font-semibold mb-2">
                    04 / Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[#0B0E0C] border border-[#303A31] px-4 py-3 text-sm text-[#F4F0E6] focus:outline-none focus:border-[#D7BC83] transition-colors"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                    <option value={120}>120 Minutes (2 Hours)</option>
                    <option value={180}>180 Minutes (3 Hours)</option>
                    <option value={240}>240 Minutes (4 Hours)</option>
                  </select>
                </div>
              </div>

              {/* Step 5: Player Details */}
              <div className="pt-2 border-t border-[#303A31] space-y-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#D7BC83] font-semibold block">
                  05 / Player Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-[#A7AEA6] mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Verma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#0B0E0C] border border-[#303A31] px-4 py-2.5 text-sm text-[#F4F0E6] focus:outline-none focus:border-[#D7BC83]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A7AEA6] mb-1">Mobile (10 Digits) *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9820011223"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#0B0E0C] border border-[#303A31] px-4 py-2.5 text-sm text-[#F4F0E6] focus:outline-none focus:border-[#D7BC83]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A7AEA6] mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="player@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-[#0B0E0C] border border-[#303A31] px-4 py-2.5 text-sm text-[#F4F0E6] focus:outline-none focus:border-[#D7BC83]"
                    />
                  </div>
                </div>
              </div>

              {/* Price & Deposit Summary */}
              {selectedTable && (
                <div className="border border-[#303A31] bg-[#0B0E0C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-sans">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#A7AEA6] block">Estimated Session Bill</span>
                    <div className="font-display text-2xl font-bold text-[#D7BC83] tabular-nums mt-0.5">
                      ₹{calculatedPrice}
                    </div>
                    <span className="text-[11px] text-[#A7AEA6]">
                      {duration} mins @ ₹{selectedTable.hourly_rate}/hr rate
                    </span>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#303A31] pt-3 sm:pt-0 sm:pl-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#A7AEA6] block">
                      Required Deposit ({settings?.deposit_percentage || 25}%)
                    </span>
                    <div className="font-display text-lg font-bold text-[#30BD83] tabular-nums mt-0.5">
                      ₹{depositRequired}
                    </div>
                    <span className="text-[11px] text-[#A7AEA6]">Adjusted against final checkout</span>
                  </div>
                </div>
              )}

              {/* Confirm Submission */}
              <button
                type="submit"
                disabled={submitting || !selectedTable}
                className="w-full py-4 text-xs uppercase tracking-[0.22em] font-bold text-[#0B0E0C] bg-[#D7BC83] hover:bg-[#EAD7A6] disabled:opacity-50 transition-colors duration-200 cursor-pointer"
              >
                {submitting ? "Verifying Availability..." : "Confirm & Lock Reservation"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 7. PLAYER SESSION AUDIT & HISTORY ("MY BOOKINGS") */}
      <section id="history" className="border-t border-[#303A31] bg-[#0B0E0C] py-20 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="space-y-6">
          <div className="border-b border-[#303A31] pb-4">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#D7BC83] font-semibold block">
              04 / Player Ledger
            </span>
            <h2 className="font-editorial text-3xl font-normal text-[#F4F0E6] mt-1">
              Lookup Your Session History
            </h2>
            <p className="text-xs text-[#A7AEA6] font-light mt-1">
              Check completed visits, playing minutes, dues, and payment receipts by phone number.
            </p>
          </div>

          <form onSubmit={handleLookupHistory} className="flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={historyPhone}
              onChange={(e) => setHistoryPhone(e.target.value)}
              className="flex-1 bg-[#111A14] border border-[#303A31] px-4 py-3 text-sm text-[#F4F0E6] focus:outline-none focus:border-[#D7BC83]"
              required
            />
            <button
              type="submit"
              disabled={historyLoading}
              className="px-7 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-[#0B0E0C] bg-[#D7BC83] hover:bg-[#EAD7A6] transition-colors"
            >
              {historyLoading ? "Searching..." : "View History"}
            </button>
          </form>

          {historyError && (
            <div className="p-4 border border-rose-900 bg-rose-950/40 text-xs text-rose-300">
              {historyError}
            </div>
          )}

          {historyData && (
            <div className="space-y-6 pt-4 animate-fadeIn">
              {/* Profile Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-5 border border-[#303A31] bg-[#111A14] text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#A7AEA6] block">Player</span>
                  <span className="font-bold text-[#F4F0E6] mt-0.5 block">{historyData.customer?.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#A7AEA6] block">Total Visits</span>
                  <span className="font-bold text-[#30BD83] mt-0.5 block">{historyData.customer?.visit_count || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#A7AEA6] block">Play Time</span>
                  <span className="font-bold text-[#4D88AB] mt-0.5 block">
                    {Math.round((historyData.customer?.total_playing_minutes || 0) / 60)} hrs
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#A7AEA6] block">Spend</span>
                  <span className="font-bold text-[#D7BC83] mt-0.5 block">₹{historyData.customer?.total_spend || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#A7AEA6] block">Dues</span>
                  <span
                    className={`font-bold mt-0.5 block ${
                      historyData.customer?.pending_dues > 0 ? "text-rose-400" : "text-[#30BD83]"
                    }`}
                  >
                    ₹{historyData.customer?.pending_dues || 0}
                  </span>
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto border border-[#303A31]">
                <table className="w-full text-left text-xs text-[#A7AEA6]">
                  <thead className="bg-[#111A14] text-[#F4F0E6] uppercase text-[10px] tracking-wider border-b border-[#303A31]">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Table</th>
                      <th className="p-3.5">Booked / Actual</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Bill</th>
                      <th className="p-3.5">Receipt #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#303A31]/60">
                    {historyData.visits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-[#A7AEA6]">
                          No visits recorded yet.
                        </td>
                      </tr>
                    ) : (
                      historyData.visits.map((v: any) => (
                        <tr key={v.booking.id} className="hover:bg-[#111A14]/50">
                          <td className="p-3.5 font-medium text-[#F4F0E6]">
                            {new Date(v.booking.start_time).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-3.5 text-[#F4F0E6]">{v.table?.name || "Table"}</td>
                          <td className="p-3.5 font-mono">
                            {v.booking.duration_minutes}m / {v.session ? `${v.session.actual_minutes}m` : "--"}
                          </td>
                          <td className="p-3.5">
                            <span className="text-[10px] uppercase font-semibold text-[#D7BC83]">
                              {v.booking.status}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-[#D7BC83]">
                            ₹{v.payment?.total_amount || v.booking.estimated_price}
                          </td>
                          <td className="p-3.5 font-mono text-[10px]">
                            {v.payment?.receipt_id || "Pending"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 8. ARCHITECTURAL LUXURY FOOTER */}
      <footer className="border-t border-[#303A31] bg-[#0B0E0C] pt-16 pb-12 text-xs text-[#A7AEA6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-3">
              <span className="font-display text-lg tracking-[0.2em] uppercase text-[#F4F0E6] font-semibold block">
                Cue<span className="text-[#D7BC83]">Club</span>
              </span>
              <p className="text-xs text-[#A7AEA6] font-light leading-relaxed">
                A private sanctuary for the discipline of snooker and precision American pool. Powered by digital table-side timing and collision-free reservations.
              </p>
            </div>

            <div>
              <h4 className="font-display text-xs uppercase tracking-[0.2em] text-[#F4F0E6] mb-3">
                Club Hours
              </h4>
              <ul className="space-y-1.5 font-light">
                <li>Monday – Friday: 10:00 AM – 11:30 PM</li>
                <li>Saturday – Sunday: 09:00 AM – Midnight</li>
                <li className="text-[#D7BC83] pt-1">Advance reservations prioritized</li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-xs uppercase tracking-[0.2em] text-[#F4F0E6] mb-3">
                Lounge Etiquette
              </h4>
              <ul className="space-y-1.5 font-light">
                <li>• Quiet frames during active matches</li>
                <li>• Chalk provided at table-side</li>
                <li>• {settings?.grace_period_minutes || 10}-Minute arrival grace window</li>
                <li>• Non-marking soft footwear</li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-xs uppercase tracking-[0.2em] text-[#F4F0E6] mb-3">
                Administration
              </h4>
              <p className="text-xs text-[#A7AEA6] font-light mb-3">
                Authorized marshals & controller portal:
              </p>
              <Link
                href="/staff/login"
                className="inline-flex items-center space-x-2 text-[11px] uppercase tracking-[0.16em] text-[#D7BC83] hover:text-[#EAD7A6] transition-colors"
              >
                <span>Staff Console Login →</span>
              </Link>
            </div>
          </div>

          <div className="pt-8 border-t border-[#303A31] flex flex-col sm:flex-row items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#A7AEA6]/60">
            <p>© {new Date().getFullYear()} CueClub Billiards & Lounge Ltd. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Tournament Standard Management Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
