"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, ClubSettings, Booking } from "@/types/database";

export default function HomePage() {
  const [tables, setTables] = useState<any[]>([]);
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchClubData, 10000); // live polling
    return () => clearInterval(interval);
  }, []);

  const calculatedPrice = selectedTable ? Math.round((Number(selectedTable.hourly_rate) * duration) / 60) : 0;
  const depositRequired = selectedTable ? Math.round((calculatedPrice * (settings?.deposit_percentage || 25)) / 100) : 0;

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
      // Find customer by phone
      const cleanPhone = historyPhone.trim().replace(/\D/g, "").slice(-10);
      const resCust = await fetch(`/api/customers?q=${cleanPhone}`);
      const custData = await resCust.json();

      if (!custData.customers || custData.customers.length === 0) {
        setHistoryError("No customer profile found with this phone number.");
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

  return (
    <div className="min-h-screen bg-[#070b09] text-gray-100">
      {/* Top Navigation */}
      <header className="border-b border-emerald-950/80 bg-[#0c1410]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-950">
              <span className="text-xl font-black text-white">🎱</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Cue<span className="text-amber-400">Club</span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-400 border border-emerald-800/40">
                  Live
                </span>
              </span>
              <p className="text-[11px] text-gray-400 -mt-0.5">Smart Snooker & Pool Club Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="#tables"
              className="text-xs text-gray-300 hover:text-amber-400 transition font-medium"
            >
              Tables & Rates
            </a>
            <a
              href="#booking-box"
              className="text-xs text-gray-300 hover:text-amber-400 transition font-medium hidden sm:inline-block"
            >
              Reserve Table
            </a>
            <a
              href="#lookup"
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-semibold tracking-wide shadow-md shadow-emerald-950 transition flex items-center gap-1.5"
            >
              <span>📋 My Visit History & Dues</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden py-10 px-4 sm:px-6 lg:px-8 border-b border-emerald-950/60 bg-gradient-to-b from-[#0c1611] to-[#070b09]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-800/50 text-emerald-300 text-xs font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Tournament Standard Tables • Real-Time Availability
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Reserve Your Table at <span className="text-amber-400">CueClub</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Experience authentic Riley tournament snooker and Brunswick American pool tables. Real-time availability,
              instant slot reservation with zero double-booking guarantee, digital session timing, and transparent billing.
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">Hours:</span>
                <span>{settings?.opening_time || "10:00"} - {settings?.closing_time || "23:30"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">Grace Period:</span>
                <span>{settings?.grace_period_minutes || 10} Mins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">Deposit:</span>
                <span>{settings?.deposit_percentage || 25}% to confirm</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href="#tables"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium text-xs shadow-lg shadow-emerald-950 transition"
            >
              Browse Tables
            </a>
            <a
              href="#lookup"
              className="px-5 py-2.5 rounded-lg bg-gray-900/80 hover:bg-gray-800 text-gray-300 font-medium text-xs border border-gray-700/60 transition"
            >
              Track My Dues / Bill
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Table Matrix */}
        <section id="tables" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Live Table Occupancy Board</span>
                <span className="text-xs font-normal text-gray-400">({tables.length} Tables Registered)</span>
              </h2>
              <p className="text-xs text-gray-400">
                Live statuses sync automatically. Click any available table to book a reserved slot.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Reserved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> In Play
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Maintenance
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading live table data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tables.map((table) => {
                const isAvail = table.status === "available";
                const isInPlay = table.status === "in_play";
                const isReserved = table.status === "reserved";
                const isMaint = table.status === "maintenance";

                return (
                  <div
                    key={table.id}
                    className={`rounded-xl border p-5 transition relative overflow-hidden flex flex-col justify-between ${
                      isAvail
                        ? "bg-[#0d1712]/90 border-emerald-800/60 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-950/40 cursor-pointer"
                        : isInPlay
                        ? "bg-[#0d181b]/90 border-cyan-900/60"
                        : isReserved
                        ? "bg-[#18150c]/90 border-amber-900/60"
                        : "bg-[#160e10]/90 border-rose-950/60 opacity-80"
                    }`}
                    onClick={() => {
                      if (!isMaint) {
                        setSelectedTable(table);
                        setBookingSuccess(null);
                        setBookingError(null);
                        // scroll to booking form
                        document.getElementById("booking-box")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-gray-900/80 text-gray-300 border border-gray-800">
                            {table.table_type}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-1.5">{table.name}</h3>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            isAvail
                              ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                              : isInPlay
                              ? "bg-cyan-950/80 text-cyan-300 border-cyan-800 animate-pulse-subtle"
                              : isReserved
                              ? "bg-amber-950/80 text-amber-300 border-amber-800"
                              : "bg-rose-950/80 text-rose-400 border-rose-900"
                          }`}
                        >
                          {table.status === "available"
                            ? "Available"
                            : table.status === "in_play"
                            ? "In Play"
                            : table.status === "reserved"
                            ? "Reserved"
                            : "Maintenance"}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{table.description}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-500 block text-[10px]">Hourly Rate</span>
                        <span className="text-amber-400 font-bold text-sm">₹{table.hourly_rate}/hr</span>
                        {table.peak_hourly_rate && (
                          <span className="text-[10px] text-gray-400 ml-1">(Peak: ₹{table.peak_hourly_rate})</span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-gray-500 block text-[10px]">Next Available</span>
                        <span className="font-medium text-gray-200">{table.next_available || "Now"}</span>
                      </div>
                    </div>

                    {isAvail && (
                      <div className="mt-3 pt-2 text-center text-[11px] text-emerald-400 font-medium">
                        Click to Book Slot →
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Booking Form Box */}
        <section id="booking-box" className="rounded-2xl border border-emerald-950 bg-[#0a120e] p-6 sm:p-8 shadow-xl">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-gray-800 pb-4">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Step 2 • Reservation</span>
              <h2 className="text-2xl font-bold text-white mt-1">Book a Match / Practice Session</h2>
              <p className="text-xs text-gray-400 mt-1">
                Enter your details to confirm your slot. All reservations are protected with server-side collision
                detection.
              </p>
            </div>

            {bookingSuccess ? (
              <div className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-white">Booking Confirmed Successfully!</h3>
                <p className="text-xs text-gray-300">
                  Booking ID: <span className="font-mono text-amber-400 font-bold">{bookingSuccess.id}</span>
                </p>
                <div className="text-xs text-gray-300 max-w-md mx-auto bg-black/40 rounded-lg p-3 space-y-1">
                  <div>Table: <span className="text-white font-medium">{bookingSuccess.table?.name}</span></div>
                  <div>
                    Scheduled:{" "}
                    <span className="text-white font-medium">
                      {new Date(bookingSuccess.start_time).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div>Estimated Bill: <span className="text-amber-400 font-bold">₹{bookingSuccess.estimated_price}</span></div>
                  <div>
                    Grace Period Deadline:{" "}
                    <span className="text-rose-400 font-semibold">
                      {new Date(bookingSuccess.grace_deadline).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  ⚠️ Please arrive within {settings?.grace_period_minutes || 10} minutes of your start time. Unclaimed
                  tables are automatically marked as No-Show and released for other players.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingSuccess(null)}
                  className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Book Another Table
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-5">
                {bookingError && (
                  <div className="rounded-lg border border-rose-900 bg-rose-950/50 p-3.5 text-xs text-rose-300 flex items-start gap-2">
                    <span className="font-bold text-sm">✕</span>
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Table Picker */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Selected Table</label>
                  <select
                    className="w-full bg-[#111c16] border border-emerald-900/60 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    value={selectedTable?.id || ""}
                    onChange={(e) => {
                      const t = tables.find((tbl) => tbl.id === e.target.value);
                      setSelectedTable(t || null);
                    }}
                    required
                  >
                    <option value="">-- Choose a Table --</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.status === "maintenance"}>
                        {t.name} ({t.table_type.toUpperCase()}) — ₹{t.hourly_rate}/hr [{t.status}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-[#111c16] border border-emerald-900/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-[#111c16] border border-emerald-900/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full bg-[#111c16] border border-emerald-900/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour (60 Min)</option>
                      <option value={90}>1.5 Hours (90 Min)</option>
                      <option value={120}>2 Hours (120 Min)</option>
                      <option value={180}>3 Hours (180 Min)</option>
                      <option value={240}>4 Hours (240 Min)</option>
                    </select>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Player Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Verma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#111c16] border border-emerald-900/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9820011223"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#111c16] border border-emerald-900/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. player@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-[#111c16] border border-emerald-900/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Cost Summary Box */}
                {selectedTable && (
                  <div className="rounded-xl bg-black/50 border border-emerald-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">Total Calculated Estimate:</span>
                      <div className="text-xl font-bold text-amber-400">₹{calculatedPrice}</div>
                      <span className="text-[11px] text-gray-500">
                        {duration} mins @ ₹{selectedTable.hourly_rate}/hr rate
                      </span>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-gray-800 pt-2 sm:pt-0 sm:pl-4">
                      <span className="text-gray-400">Required Deposit ({settings?.deposit_percentage || 25}%):</span>
                      <div className="text-base font-semibold text-emerald-400">₹{depositRequired}</div>
                      <span className="text-[11px] text-gray-500">Deducted from final table bill</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedTable}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950 transition"
                >
                  {submitting ? "Checking Conflict & Reserving..." : "Confirm & Reserve Slot"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Customer Visit History Lookup */}
        <section id="lookup" className="rounded-2xl border border-gray-800/80 bg-[#0a0f0d] p-6 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-gray-800 pb-3">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Player Record</span>
              <h2 className="text-xl font-bold text-white mt-1">Lookup Your Visit & Session History</h2>
              <p className="text-xs text-gray-400">
                Check your past sessions, actual vs booked minutes, dues, and payment receipts by phone number.
              </p>
            </div>

            <form onSubmit={handleLookupHistory} className="flex gap-3">
              <input
                type="tel"
                placeholder="Enter 10-digit registered phone number (e.g. 9820011223)"
                value={historyPhone}
                onChange={(e) => setHistoryPhone(e.target.value)}
                className="flex-1 bg-[#111b15] border border-gray-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
              <button
                type="submit"
                disabled={historyLoading}
                className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs tracking-wide transition"
              >
                {historyLoading ? "Searching..." : "View History"}
              </button>
            </form>

            {historyError && (
              <div className="p-3 text-xs text-rose-400 bg-rose-950/40 rounded-lg border border-rose-900">
                {historyError}
              </div>
            )}

            {historyData && (
              <div className="space-y-4 pt-2">
                {/* Customer Summary Card */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-black/40 border border-gray-800 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Player</span>
                    <span className="font-bold text-white">{historyData.customer?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Total Visits</span>
                    <span className="font-bold text-emerald-400">{historyData.customer?.visit_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Play Time</span>
                    <span className="font-bold text-cyan-300">
                      {Math.round((historyData.customer?.total_playing_minutes || 0) / 60)} hrs
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Total Spend</span>
                    <span className="font-bold text-amber-400">₹{historyData.customer?.total_spend || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Pending Dues</span>
                    <span className={`font-bold ${historyData.customer?.pending_dues > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      ₹{historyData.customer?.pending_dues || 0}
                    </span>
                  </div>
                </div>

                {/* Visit History Table */}
                <div className="overflow-x-auto border border-gray-800 rounded-xl">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#121a16] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Table</th>
                        <th className="p-3">Booked / Actual</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Bill</th>
                        <th className="p-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {historyData.visits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
                            No visits recorded yet.
                          </td>
                        </tr>
                      ) : (
                        historyData.visits.map((v: any) => (
                          <tr key={v.booking.id} className="hover:bg-white/5">
                            <td className="p-3">
                              {new Date(v.booking.start_time).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="p-3 font-medium text-white">{v.table?.name || "Table"}</td>
                            <td className="p-3">
                              {v.booking.duration_minutes}m / {v.session ? `${v.session.actual_minutes}m` : "--"}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  v.booking.status === "completed"
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                    : v.booking.status === "no_show"
                                    ? "bg-rose-950 text-rose-400 border border-rose-900"
                                    : "bg-amber-950 text-amber-300 border border-amber-800"
                                }`}
                              >
                                {v.booking.status}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-amber-400">
                              ₹{v.payment?.total_amount || v.booking.estimated_price}
                            </td>
                            <td className="p-3 font-mono text-[10px] text-gray-400">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-950 bg-[#080d0a] py-6 text-center text-xs text-gray-500">
        <p>CueClub Smart Snooker & Pool Management Platform • AI Nexus Hackathon PS ID: ANC-001</p>
      </footer>
    </div>
  );
}
