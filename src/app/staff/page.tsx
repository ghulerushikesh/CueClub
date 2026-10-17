"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, Booking, Session, Payment, Profile } from "@/types/database";

export default function StaffDashboardPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Walk-in form state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInTableId, setWalkInTableId] = useState("");
  const [walkInDuration, setWalkInDuration] = useState(60);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // Extend session modal
  const [extendBooking, setExtendBooking] = useState<Booking | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(30);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [extendLoading, setExtendLoading] = useState(false);

  // Billing & Payment modal
  const [billSession, setBillSession] = useState<any | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card">("upi");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");
  const [addonAmount, setAddonAmount] = useState<number>(0);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  // Customer search & history modal
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedCustomers, setSearchedCustomers] = useState<Profile[]>([]);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<any | null>(null);

  // No-show notification
  const [noShowMessage, setNoShowMessage] = useState<string | null>(null);

  // Bookings list filter
  const [bookingTab, setBookingTab] = useState<string>("confirmed");

  const handleRestoreBooking = async (bookingId: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Cannot restore this booking because the time slot has already been reserved.");
      } else {
        fetchStaffData();
      }
    } catch (e: any) {
      alert(e.message || "Failed to communicate with server.");
    }
  };

  const fetchStaffData = async () => {
    try {
      const [tRes, bRes] = await Promise.all([fetch("/api/tables"), fetch("/api/bookings")]);
      const tData = await tRes.json();
      const bData = await bRes.json();
      if (tData.tables) setTables(tData.tables);
      if (bData.bookings) setBookings(bData.bookings);
    } catch (e) {
      console.error("Error loading staff data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 5000); // 5-second polling for active sessions
    return () => clearInterval(interval);
  }, []);

  // Handle Walk-in Creation
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInSubmitting(true);
    setWalkInError(null);

    const startTime = new Date().toISOString();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: walkInName,
          customerPhone: walkInPhone,
          tableId: walkInTableId,
          startTime,
          durationMinutes: walkInDuration,
          bookingType: "walk_in",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWalkInError(data.error || "Failed to create walk-in session");
      } else {
        // Immediately check in the walk-in booking!
        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "check_in",
            bookingId: data.booking.id,
          }),
        });

        setShowWalkInModal(false);
        setWalkInName("");
        setWalkInPhone("");
        fetchStaffData();
      }
    } catch (err: any) {
      setWalkInError(err.message || "Network error");
    } finally {
      setWalkInSubmitting(false);
    }
  };

  // Handle Check-in
  const handleCheckIn = async (bookingId: string) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_in", bookingId }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchStaffData();
      } else {
        alert(data.error || "Check-in failed");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Handle Pause / Resume
  const handleTogglePause = async (sessionId: string) => {
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_pause", sessionId }),
      });
      fetchStaffData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Handle Extend Session
  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendBooking) return;
    setExtendLoading(true);
    setExtendError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend",
          bookingId: extendBooking.id,
          additionalMinutes: extendMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExtendError(data.error || "Failed to extend session");
      } else {
        setExtendBooking(null);
        fetchStaffData();
      }
    } catch (e: any) {
      setExtendError(e.message);
    } finally {
      setExtendLoading(false);
    }
  };

  // Handle End Session & Open Billing
  const handleEndSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBillSession({
          session: data.session,
          payment: data.payment,
        });
        setPaidAmount(data.payment.due_amount);
        fetchStaffData();
      } else {
        alert(data.error || "Failed to end session");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Handle Settle Payment
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billSession?.payment) return;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: billSession.payment.id,
          paidAmount,
          paymentMode,
          discountAmount,
          discountReason,
          addonAmount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveReceipt(data.payment);
        setBillSession(null);
        fetchStaffData();
      } else {
        alert(data.error || "Payment recording failed");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Trigger Automatic No-Show Release
  const handleProcessNoShows = async () => {
    try {
      const res = await fetch("/api/cron/no-show", { method: "POST" });
      const data = await res.json();
      setNoShowMessage(data.message);
      fetchStaffData();
      setTimeout(() => setNoShowMessage(null), 6000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Search Customers
  const handleSearchCustomers = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchedCustomers(data.customers || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  // Load customer full history
  const handleViewCustomerHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/customers?id=${id}`);
      const data = await res.json();
      setSelectedCustomerHistory(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  // Staff Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/staff-logout", { method: "POST" });
      window.location.href = "/staff/login";
    } catch {
      window.location.href = "/staff/login";
    }
  };

  // Key Dashboard Metrics
  const activeSessions = bookings.filter((b) => b.status === "in_play");
  const confirmedReservations = bookings.filter((b) => b.status === "confirmed");
  const completedToday = bookings.filter((b) => b.status === "completed");
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.payment?.paid_amount || 0), 0);
  const totalDues = bookings.reduce((sum, b) => sum + (b.payment?.due_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#070b09] text-gray-100">
      {/* Top Navbar */}
      <header className="border-b border-emerald-950/80 bg-[#0c1410]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">🎱 Cue<span className="text-amber-400">Club</span></span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
              Staff Operations Console
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleProcessNoShows}
              className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800/70 text-rose-300 text-xs font-semibold tracking-wide transition flex items-center gap-1.5"
            >
              <span>⏱️ Run No-Show Check</span>
            </button>

            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wide shadow-md shadow-emerald-950 transition flex items-center gap-1"
            >
              <span>+ New Walk-in</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* No Show Alert Banner */}
      {noShowMessage && (
        <div className="bg-amber-950/90 border-b border-amber-800/70 px-4 py-2.5 text-xs text-amber-200 text-center font-medium">
          {noShowMessage}
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="rounded-xl border border-emerald-900/40 bg-[#0c1410] p-4">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Active Sessions</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{activeSessions.length}</div>
            <span className="text-[10px] text-gray-500">Live tables in play</span>
          </div>

          <div className="rounded-xl border border-emerald-900/40 bg-[#0c1410] p-4">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Upcoming Reserved</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{confirmedReservations.length}</div>
            <span className="text-[10px] text-gray-500">Awaiting check-in</span>
          </div>

          <div className="rounded-xl border border-emerald-900/40 bg-[#0c1410] p-4">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Completed Today</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{completedToday.length}</div>
            <span className="text-[10px] text-gray-500">Sessions finished</span>
          </div>

          <div className="rounded-xl border border-emerald-900/40 bg-[#0c1410] p-4">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Revenue Collected</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">₹{totalRevenue}</div>
            <span className="text-[10px] text-gray-500">Cash / UPI / Card</span>
          </div>

          <div className="rounded-xl border border-emerald-900/40 bg-[#0c1410] p-4">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Pending Dues</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">₹{totalDues}</div>
            <span className="text-[10px] text-gray-500">Outstanding balance</span>
          </div>
        </div>

        {/* Live Table Controls & Real-time Timers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Active Tables & Session Timers</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </h2>
              <p className="text-xs text-gray-400">
                Start, pause, extend, and bill active table sessions in real-time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tables.map((table) => {
              const activeBooking = bookings.find(
                (b) => b.table_id === table.id && b.status === "in_play"
              );
              const upcomingBooking = bookings
                .filter((b) => b.table_id === table.id && b.status === "confirmed")
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

              return (
                <div
                  key={table.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between ${
                    activeBooking
                      ? "bg-[#0b1619] border-cyan-800/80 shadow-lg shadow-cyan-950/20"
                      : upcomingBooking
                      ? "bg-[#18150d] border-amber-800/80"
                      : table.status === "maintenance"
                      ? "bg-[#160e10] border-rose-950"
                      : "bg-[#0c1410] border-emerald-950"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                          {table.table_type} • ₹{table.hourly_rate}/hr
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">{table.name}</h3>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          activeBooking
                            ? "bg-cyan-950 text-cyan-300 border-cyan-700 animate-pulse-subtle"
                            : upcomingBooking
                            ? "bg-amber-950 text-amber-300 border-amber-700"
                            : table.status === "maintenance"
                            ? "bg-rose-950 text-rose-300 border-rose-800"
                            : "bg-emerald-950 text-emerald-300 border-emerald-800"
                        }`}
                      >
                        {activeBooking
                          ? "IN PLAY"
                          : upcomingBooking
                          ? "RESERVED"
                          : table.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Active Session details */}
                    {activeBooking && activeBooking.session && (
                      <div className="mt-4 p-3 bg-black/40 rounded-lg border border-cyan-950 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Player:</span>
                          <span className="font-bold text-white">{activeBooking.customer?.full_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Scheduled:</span>
                          <span className="font-mono text-gray-300">
                            {activeBooking.duration_minutes} min (Ends{" "}
                            {new Date(activeBooking.end_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            )
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Timer State:</span>
                          <span
                            className={`font-semibold ${
                              activeBooking.session.is_paused ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {activeBooking.session.is_paused ? "PAUSED" : "RUNNING"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Upcoming booking details & Check-in */}
                    {!activeBooking && upcomingBooking && (
                      <div className="mt-4 p-3 bg-black/40 rounded-lg border border-amber-950 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Reserved for:</span>
                          <span className="font-bold text-white">{upcomingBooking.customer?.full_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Start Time:</span>
                          <span className="font-mono text-amber-300">
                            {new Date(upcomingBooking.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Grace Deadline:</span>
                          <span className="font-mono text-rose-400 font-semibold">
                            {new Date(upcomingBooking.grace_deadline!).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-gray-800/60 flex flex-wrap gap-2">
                    {activeBooking && activeBooking.session && (
                      <>
                        <button
                          onClick={() => handleTogglePause(activeBooking.session!.id)}
                          className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold transition ${
                            activeBooking.session.is_paused
                              ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                              : "bg-amber-700 hover:bg-amber-600 text-white"
                          }`}
                        >
                          {activeBooking.session.is_paused ? "▶ Resume" : "⏸ Pause"}
                        </button>

                        <button
                          onClick={() => {
                            setExtendBooking(activeBooking);
                            setExtendError(null);
                          }}
                          className="py-1.5 px-3 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition"
                        >
                          + Extend
                        </button>

                        <button
                          onClick={() => handleEndSession(activeBooking.session!.id)}
                          className="py-1.5 px-3 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition"
                        >
                          End & Bill
                        </button>
                      </>
                    )}

                    {!activeBooking && upcomingBooking && (
                      <button
                        onClick={() => handleCheckIn(upcomingBooking.id)}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow transition"
                      >
                        ✓ Check-In Customer & Start Play
                      </button>
                    )}

                    {!activeBooking && !upcomingBooking && table.status === "available" && (
                      <button
                        onClick={() => {
                          setWalkInTableId(table.id);
                          setShowWalkInModal(true);
                        }}
                        className="w-full py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-semibold text-xs tracking-wide transition"
                      >
                        + Assign Walk-In Session
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Master Reservations & Bookings Schedule */}
        <section className="rounded-2xl border border-gray-800 bg-[#0a100d] p-6 space-y-4">
          <div className="border-b border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Reservations & Bookings Schedule</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                  {bookings.filter((b) => b.status === "confirmed").length} Upcoming Confirmed
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Authoritative record of all customer reservations, walk-ins, and session statuses.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: "confirmed", label: "Confirmed" },
                { id: "all", label: "All Bookings" },
                { id: "in_play", label: "In Play" },
                { id: "completed", label: "Completed" },
                { id: "no_show", label: "No-Shows" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBookingTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    bookingTab === tab.id
                      ? "bg-amber-600 text-white shadow"
                      : "bg-[#111915] text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  {tab.label} (
                  {tab.id === "all"
                    ? bookings.length
                    : bookings.filter((b) => b.status === tab.id).length}
                  )
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-800 rounded-xl">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#111915] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-3">Booking ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Table</th>
                  <th className="p-3">Scheduled Slot</th>
                  <th className="p-3">Duration & Bill</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {bookings
                  .filter((b) => (bookingTab === "all" ? true : b.status === bookingTab))
                  .sort(
                    (a, b) =>
                      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
                  )
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-white/5">
                      <td className="p-3 font-mono text-[11px] text-gray-400">{b.id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{b.customer?.full_name || "Guest"}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{b.customer?.phone}</div>
                      </td>
                      <td className="p-3 font-medium text-white">{b.table?.name || "Table"}</td>
                      <td className="p-3">
                        <div className="text-white font-medium">
                          {new Date(b.start_time).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-amber-400 font-mono">
                          {new Date(b.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(b.end_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{b.duration_minutes} Mins</div>
                        <div className="font-bold text-amber-400">₹{b.estimated_price}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            b.status === "confirmed"
                              ? "bg-amber-950 text-amber-300 border-amber-800"
                              : b.status === "in_play"
                              ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                              : b.status === "completed"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : "bg-rose-950 text-rose-300 border-rose-800"
                          }`}
                        >
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => handleCheckIn(b.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow transition"
                          >
                            ✓ Check-In
                          </button>
                        )}
                        {b.status === "no_show" && (
                          <button
                            onClick={() => handleRestoreBooking(b.id)}
                            className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] font-semibold transition"
                            title="Restore booking after verifying slot availability"
                          >
                            ↺ Restore Booking
                          </button>
                        )}
                        {b.status === "in_play" && (
                          <span className="text-[11px] text-cyan-400 font-semibold">Active at Table</span>
                        )}
                        {b.status === "completed" && (
                          <span className="text-[11px] text-gray-500">Finished</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {bookings.filter((b) => (bookingTab === "all" ? true : b.status === bookingTab)).length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">
                      No bookings found for &quot;{bookingTab}&quot; category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Customer Directory & History Lookup Section */}
        <section className="rounded-2xl border border-gray-800 bg-[#0a100d] p-6 space-y-5">
          <div className="border-b border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Customer Database & Full Visit Audit</h2>
              <p className="text-xs text-gray-400">Search customer records by name or phone to inspect complete session histories.</p>
            </div>

            <form onSubmit={handleSearchCustomers} className="flex gap-2">
              <input
                type="text"
                placeholder="Search name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#121c17] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 w-48 sm:w-64"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition"
              >
                Search
              </button>
            </form>
          </div>

          {searchedCustomers.length > 0 && (
            <div className="overflow-x-auto border border-gray-800 rounded-xl">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#111915] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Visits</th>
                    <th className="p-3">Total Play Time</th>
                    <th className="p-3">Total Spend</th>
                    <th className="p-3">Dues</th>
                    <th className="p-3">No-Shows</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {searchedCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td className="p-3 font-semibold text-white">{c.full_name}</td>
                      <td className="p-3 font-mono">{c.phone}</td>
                      <td className="p-3 text-emerald-400 font-bold">{c.visit_count}</td>
                      <td className="p-3">{Math.round(c.total_playing_minutes / 60)} hrs</td>
                      <td className="p-3 font-bold text-amber-400">₹{c.total_spend}</td>
                      <td className="p-3">
                        <span className={`font-bold ${c.pending_dues > 0 ? "text-rose-400" : "text-gray-400"}`}>
                          ₹{c.pending_dues}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-semibold ${c.no_show_count > 0 ? "text-rose-400" : "text-gray-400"}`}>
                          {c.no_show_count}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleViewCustomerHistory(c.id)}
                          className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] font-semibold transition"
                        >
                          View Full History →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedCustomerHistory && (
            <div className="rounded-xl border border-amber-900/60 bg-[#141209] p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-amber-300">
                  Session Log for {selectedCustomerHistory.customer?.full_name}
                </h3>
                <button
                  onClick={() => setSelectedCustomerHistory(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-800 rounded-lg">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/50 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Table</th>
                      <th className="p-2.5">Booked / Actual</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Total Bill</th>
                      <th className="p-2.5">Receipt ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {selectedCustomerHistory.visits.map((v: any) => (
                      <tr key={v.booking.id}>
                        <td className="p-2.5">{new Date(v.booking.start_time).toLocaleDateString()}</td>
                        <td className="p-2.5 font-medium text-white">{v.table?.name}</td>
                        <td className="p-2.5">
                          {v.booking.duration_minutes}m / {v.session ? `${v.session.actual_minutes}m` : "--"}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-900 border border-gray-700 text-gray-300">
                            {v.booking.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-amber-400">
                          ₹{v.payment?.total_amount || v.booking.estimated_price}
                        </td>
                        <td className="p-2.5 font-mono text-[10px] text-gray-400">
                          {v.payment?.receipt_id || "None"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1713] border border-emerald-900 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Immediate Walk-In Session</h3>
              <button onClick={() => setShowWalkInModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {walkInError && (
              <div className="p-2.5 text-xs text-rose-300 bg-rose-950/60 rounded border border-rose-900">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleCreateWalkIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sameer Kapoor"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full bg-[#131f1a] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Customer Phone *</label>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full bg-[#131f1a] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Table *</label>
                <select
                  value={walkInTableId}
                  onChange={(e) => setWalkInTableId(e.target.value)}
                  className="w-full bg-[#131f1a] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                >
                  <option value="">-- Choose Available Table --</option>
                  {tables
                    .filter((t) => t.status === "available")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.table_type.toUpperCase()}) — ₹{t.hourly_rate}/hr
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Duration</label>
                <select
                  value={walkInDuration}
                  onChange={(e) => setWalkInDuration(Number(e.target.value))}
                  className="w-full bg-[#131f1a] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (1 Hr)</option>
                  <option value={90}>90 Minutes (1.5 Hr)</option>
                  <option value={120}>120 Minutes (2 Hr)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide"
                >
                  {walkInSubmitting ? "Starting..." : "Start Session Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Session Modal */}
      {extendBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1713] border border-emerald-900 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">Extend Playing Time</h3>
              <button onClick={() => setExtendBooking(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {extendError && (
              <div className="p-2.5 text-xs text-rose-300 bg-rose-950/60 rounded border border-rose-900">
                {extendError}
              </div>
            )}

            <form onSubmit={handleExtend} className="space-y-4 text-xs">
              <p className="text-gray-300">
                Table: <span className="font-bold text-white">{extendBooking.table?.name}</span>
              </p>
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Additional Minutes</label>
                <select
                  value={extendMinutes}
                  onChange={(e) => setExtendMinutes(Number(e.target.value))}
                  className="w-full bg-[#131f1a] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={15}>+15 Minutes</option>
                  <option value={30}>+30 Minutes</option>
                  <option value={45}>+45 Minutes</option>
                  <option value={60}>+60 Minutes</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendBooking(null)}
                  className="flex-1 py-2 rounded bg-gray-800 text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extendLoading}
                  className="flex-1 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  {extendLoading ? "Checking..." : "Confirm Extension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill & Payment Settlement Modal */}
      {billSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1713] border border-emerald-900 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">Itemized Bill & Payment</h3>
              <button onClick={() => setBillSession(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="bg-black/40 rounded-xl p-4 border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Actual Play Time:</span>
                <span className="text-white font-bold">{billSession.session.actual_minutes} Mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white font-bold">₹{billSession.payment.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GST (5%):</span>
                <span className="text-white">₹{billSession.payment.tax_amount}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-800 text-sm">
                <span className="text-gray-300 font-bold">Total Bill:</span>
                <span className="text-amber-400 font-extrabold">₹{billSession.payment.total_amount}</span>
              </div>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full bg-[#131f1a] border border-gray-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Add-ons / Drinks (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={addonAmount}
                    onChange={(e) => setAddonAmount(Number(e.target.value))}
                    className="w-full bg-[#131f1a] border border-gray-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["upi", "cash", "card"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-1.5 rounded-lg border font-bold uppercase text-[11px] transition ${
                        paymentMode === mode
                          ? "bg-amber-600 text-white border-amber-500"
                          : "bg-gray-900 text-gray-400 border-gray-800 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Amount to Pay Now (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full bg-[#131f1a] border border-gray-800 rounded-lg px-3 py-2 text-white font-bold text-sm"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBillSession(null)}
                  className="flex-1 py-2 rounded bg-gray-800 text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Collect & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b130f] border border-amber-800/80 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center space-y-1 border-b border-gray-800 pb-3">
              <span className="text-2xl">🎱</span>
              <h3 className="text-base font-bold text-white">CueClub Official Receipt</h3>
              <p className="text-[10px] text-gray-400">Grand Snooker & Pool Lounge</p>
              <div className="font-mono text-amber-400 text-xs font-bold pt-1">
                Receipt #{activeReceipt.receipt_id}
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-gray-300">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(activeReceipt.paid_at || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="uppercase font-bold text-white">{activeReceipt.payment_mode}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{activeReceipt.subtotal}</span>
              </div>
              {activeReceipt.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span>-₹{activeReceipt.discount_amount}</span>
                </div>
              )}
              {activeReceipt.addon_amount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Add-ons / Food:</span>
                  <span>+₹{activeReceipt.addon_amount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{activeReceipt.tax_amount}</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-gray-800 pt-2 text-sm">
                <span>Total Amount:</span>
                <span className="text-amber-400">₹{activeReceipt.total_amount}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400">
                <span>Amount Paid:</span>
                <span>₹{activeReceipt.paid_amount}</span>
              </div>
              {activeReceipt.due_amount > 0 && (
                <div className="flex justify-between font-bold text-rose-400">
                  <span>Pending Due:</span>
                  <span>₹{activeReceipt.due_amount}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-800">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs"
              >
                🖨️ Print
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
