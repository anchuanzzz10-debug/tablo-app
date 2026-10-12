
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Plus,
  Trash2,
  QrCode,
  Download,
  Users,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

type RestaurantTable = {
  id: string;
  name: string;
  seats: number;
  status: "Available" | "Occupied";
};

const STORAGE_KEY = "tablo-restaurant-tables-v1";

function loadTables(): RestaurantTable[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is RestaurantTable =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.seats === "number" &&
        (item.status === "Available" || item.status === "Occupied")
    );
  } catch {
    console.error("Could not load saved tables.");
    return [];
  }
}

export default function TablesQR() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tableName, setTableName] = useState("");
  const [seats, setSeats] = useState("4");
  const [selected, setSelected] = useState<string | null>(null);
  const [qr, setQr] = useState("");
  const [origin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  useEffect(() => {
    let cancelled = false;

    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;

      setTables(loadTables());
      setLoaded(true);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    } catch {
      console.error("Could not save restaurant tables.");
    }
  }, [tables, loaded]);

  useEffect(() => {
    let cancelled = false;

    async function generateQR() {
      const table = tables.find((item) => item.id === selected);

      if (!table || !origin) {
        setQr("");
        return;
      }

      try {
        const url = `${origin}/order?table=${encodeURIComponent(table.id)}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        if (!cancelled) setQr(dataUrl);
      } catch {
        if (!cancelled) setQr("");
      }
    }

    void generateQR();

    return () => {
      cancelled = true;
    };
  }, [tables, selected, origin]);

  function addTable() {
    const name = tableName.trim();

    if (!name) {
      alert("Please enter a table name or number.");
      return;
    }

    if (
      tables.some(
        (table) => table.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("This table already exists.");
      return;
    }

    const newTable: RestaurantTable = {
      id: crypto.randomUUID(),
      name,
      seats: Math.max(1, Number(seats) || 4),
      status: "Available",
    };

    setTables((previous) => [...previous, newTable]);
    setSelected(newTable.id);
    setTableName("");
    setSeats("4");
  }

  function deleteTable(id: string) {
    if (!confirm("Delete this table?")) return;

    setTables((previous) => previous.filter((table) => table.id !== id));

    if (selected === id) {
      setSelected(null);
      setQr("");
    }
  }

  function toggleStatus(id: string) {
    setTables((previous) =>
      previous.map((table) =>
        table.id === id
          ? {
              ...table,
              status:
                table.status === "Available" ? "Occupied" : "Available",
            }
          : table
      )
    );
  }

  function downloadQR() {
    if (!qr) return;

    const table = tables.find((item) => item.id === selected);
    const link = document.createElement("a");
    link.href = qr;
    link.download = `tablo-${table?.name ?? "table"}-qr.png`;
    link.click();
  }

  const selectedTable = tables.find((table) => table.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Tables & QR
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage tables and generate QR codes for each table.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Summary
          label="Total Tables"
          value={tables.length}
          icon={<Users size={21} />}
        />
        <Summary
          label="Available"
          value={tables.filter((table) => table.status === "Available").length}
          icon={<CheckCircle2 size={21} />}
        />
        <Summary
          label="Occupied"
          value={tables.filter((table) => table.status === "Occupied").length}
          icon={<RefreshCw size={21} />}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Add New Table
        </h2>

        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            addTable();
          }}
        >
          <input
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            placeholder="Table name / number (e.g. Table 1)"
            maxLength={40}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
          />

          <select
            value={seats}
            onChange={(event) => setSeats(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            aria-label="Number of seats"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((number) => (
              <option key={number} value={number}>
                {number} seats
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600"
          >
            <Plus size={18} />
            Add Table
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Restaurant Tables
            </h2>
            <span className="text-xs text-slate-500">
              {tables.length} tables
            </span>
          </div>

          {!loaded ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading tables...
            </p>
          ) : tables.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-12 text-center">
              <QrCode className="mx-auto text-slate-400" size={36} />
              <p className="mt-3 font-semibold text-slate-700">
                No tables added yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add your first table above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`rounded-xl border p-4 ${
                    selected === table.id
                      ? "border-orange-400 bg-orange-50/50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(table.id)}
                      className="text-left"
                    >
                      <p className="font-bold text-slate-900">{table.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {table.seats} seats
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteTable(table.id)}
                      title="Delete table"
                      aria-label={`Delete ${table.name}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStatus(table.id)}
                    className={`mt-4 rounded-full px-3 py-1.5 text-xs font-bold ${
                      table.status === "Available"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {table.status}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelected(table.id)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <QrCode size={16} />
                    View QR Code
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Table QR Code
          </h2>

          {selectedTable && qr ? (
            <div className="text-center">
              <p className="font-bold text-slate-800">
                {selectedTable.name}
              </p>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={`QR code for ${selectedTable.name}`}
                className="mx-auto my-4 w-full max-w-[240px]"
              />

              <p className="break-all text-xs text-slate-500">
                {origin}/order?table={selectedTable.id}
              </p>

              <button
                type="button"
                onClick={downloadQR}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600"
              >
                <Download size={17} />
                Download QR PNG
              </button>

              <p className="mt-3 text-left text-xs leading-5 text-amber-700">
                QR generation works, but customer ordering requires the
                /order page and backend, which are not connected yet.
              </p>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <QrCode className="mx-auto" size={42} />
              <p className="mt-3 text-sm">
                Select a table to generate its QR code.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
