"use client";

import { useEffect, useState } from "react";
import TablesQR from "./TablesQR";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  QrCode,
  ChefHat,
  ReceiptText,
  ChartNoAxesCombined,
  Settings,
  ChevronRight,
  Search,
  Bell,
  Plus,
  ImagePlus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Coffee,
  ArrowUpRight,
  Store,
  Clock3,
  CircleCheck,
  Upload,
  X,
  Sparkles,
  Menu as MenuIcon,
} from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  image: string;
};

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Orders", icon: ClipboardList },
  { name: "Menu", icon: UtensilsCrossed },
  { name: "Tables & QR", icon: QrCode },
  { name: "Kitchen", icon: ChefHat },
  { name: "Billing", icon: ReceiptText },
  { name: "Reports", icon: ChartNoAxesCombined },
  { name: "Settings", icon: Settings },
];

const sectionStorageKey = "tablo-active-section";
const menuStorageKey = "tablo-menu-items";

const categories = ["Food", "Snacks", "Beverages", "Desserts", "Other"];

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Food");
  const [itemPrice, setItemPrice] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    try {
      const section = sessionStorage.getItem(sectionStorageKey);

      if (navigation.some((item) => item.name === section)) {
        // Intentional hydration from browser storage on initial mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActive(section!);
      }

      const saved = localStorage.getItem(menuStorageKey);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          // Intentional hydration from browser storage on initial mount.
           
          setMenuItems(
            parsed.map((item: Partial<MenuItem>) => ({
              id: item.id || crypto.randomUUID(),
              name: item.name || "",
              category: item.category || "Food",
              price: Number(item.price) || 0,
              available: item.available !== false,
              image: typeof item.image === "string" ? item.image : "",
            }))
          );
        }
      }
    } catch {
       
      setError("Saved browser data could not be loaded.");
    } finally {
       
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(menuStorageKey, JSON.stringify(menuItems));
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Storage is full. Try a smaller image.");
    }
  }, [menuItems, loaded]);

  function changeSection(section: string) {
    setActive(section);
    setMobileNav(false);

    try {
      sessionStorage.setItem(sectionStorageKey, section);
    } catch {
      // Navigation still works if session storage is unavailable.
    }

    setSearch("");
    setError("");
  }

  function resetForm() {
    setItemName("");
    setItemCategory("Food");
    setItemPrice("");
    setItemImage("");
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemPrice(String(item.price));
    setItemImage(item.image);
    setShowForm(true);
    setError("");
  }

  function saveItem() {
    const name = itemName.trim();
    const price = Number(itemPrice);

    if (!name) {
      setError("Please enter an item name.");
      return;
    }

    if (itemPrice.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (itemImage.length > 1_400_000) {
      setError("Image is too large. Please choose a smaller image.");
      return;
    }

    if (editingId) {
      setMenuItems((items) =>
        items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name,
                category: itemCategory,
                price,
                image: itemImage,
              }
            : item
        )
      );
    } else {
      setMenuItems((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          name,
          category: itemCategory,
          price,
          available: true,
          image: itemImage,
        },
      ]);
    }

    resetForm();
  }

  function deleteItem(id: string) {
    if (!window.confirm("Delete this menu item?")) return;
    setMenuItems((items) => items.filter((item) => item.id !== id));
  }

  function toggleAvailability(id: string) {
    setMenuItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  }

  function handleImage(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > 1_000_000) {
      setError("Image must be smaller than 1 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setItemImage(reader.result);
        setError("");
      } else {
        setError("Could not read this image.");
      }
    };

    reader.onerror = () => setError("Could not read this image.");
    reader.readAsDataURL(file);
  }

  const filteredItems = menuItems.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  const availableCount = menuItems.filter((item) => item.available).length;
  const averagePrice =
    menuItems.length > 0
      ? menuItems.reduce((sum, item) => sum + item.price, 0) /
        menuItems.length
      : 0;

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      {mobileNav && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileNav ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[82px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              tablo<span className="text-orange-500">.</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400">
              RESTAURANT MANAGEMENT
            </p>
          </div>
          <button
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
            Workspace
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const selected = active === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => changeSection(item.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                    selected
                      ? "bg-orange-50 text-orange-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} strokeWidth={selected ? 2.4 : 1.8} />
                  <span>{item.name}</span>
                  {selected && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              <span className="text-sm font-bold text-slate-800">
                Tablo workspace
              </span>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Manage your restaurant from one place.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Local preview
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] text-slate-400">
            TABLO • RESTAURANT SAAS
          </p>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <MenuIcon size={20} />
            </button>
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                Workspace / {active}
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                {active}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-slate-400 sm:block">
              Restaurant workspace
            </span>
            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-orange-500" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              T
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {active === "Dashboard" && (
            <>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-slate-500">
                    Here&apos;s what&apos;s happening in your workspace.
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Welcome to Tablo 👋
                  </h1>
                </div>
                <button
                  onClick={() => changeSection("Menu")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                >
                  <Plus size={18} />
                  Manage menu
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Menu items"
                  value={String(menuItems.length)}
                  note="Total items added"
                  icon={UtensilsCrossed}
                  tone="orange"
                />
                <StatCard
                  title="Available items"
                  value={String(availableCount)}
                  note="Currently available"
                  icon={CircleCheck}
                  tone="green"
                />
                <StatCard
                  title="Unavailable"
                  value={String(menuItems.length - availableCount)}
                  note="Hidden from ordering"
                  icon={EyeOff}
                  tone="purple"
                />
                <StatCard
                  title="Average price"
                  value={money(averagePrice)}
                  note="Across menu items"
                  icon={ChartNoAxesCombined}
                  tone="blue"
                />
              </div>

              <div className="mt-7 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Menu overview
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Your recently added items
                      </p>
                    </div>
                    <button
                      onClick={() => changeSection("Menu")}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700"
                    >
                      View menu <ArrowUpRight className="ml-1 inline" size={14} />
                    </button>
                  </div>

                  {menuItems.length === 0 ? (
                    <EmptyState
                      icon={UtensilsCrossed}
                      title="Your menu is empty"
                      description="Add your first food or beverage item to get started."
                      action="Add first item"
                      onAction={() => {
                        changeSection("Menu");
                        setShowForm(true);
                      }}
                    />
                  ) : (
                    <div className="mt-5 divide-y divide-slate-100">
                      {menuItems.slice(-5).reverse().map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 py-3"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Coffee size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {item.category}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-slate-800">
                            {money(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h3 className="font-bold text-slate-900">Quick access</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Navigate to common tasks
                  </p>
                  <div className="mt-5 space-y-3">
                    <QuickLink
                      icon={ClipboardList}
                      title="Orders"
                      description="View and manage orders"
                      onClick={() => changeSection("Orders")}
                    />
                    <QuickLink
                      icon={QrCode}
                      title="Tables & QR"
                      description="Manage restaurant tables"
                      onClick={() => changeSection("Tables & QR")}
                    />
                    <QuickLink
                      icon={ChefHat}
                      title="Kitchen"
                      description="Kitchen order workflow"
                      onClick={() => changeSection("Kitchen")}
                    />
                    <QuickLink
                      icon={ReceiptText}
                      title="Billing"
                      description="Bills and payment records"
                      onClick={() => changeSection("Billing")}
                    />
                  </div>
                </section>
              </div>

              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Clock3 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Development status
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      This dashboard currently stores menu data in this browser.
                    </p>
                  </div>
                </div>
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  This is a local UI prototype, not a live restaurant backend.
                  Orders, QR ordering, printer integration, authentication and
                  cloud database persistence still need implementation and testing.
                </p>
              </section>
            </>
          )}

          {active === "Menu" && (
            <>
              <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Menu management
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Add, update and manage your restaurant items.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-600"
                >
                  <Plus size={18} />
                  Add menu item
                </button>
              </div>

              <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <MiniStat label="Total items" value={menuItems.length} />
                <MiniStat label="Available" value={availableCount} />
                <MiniStat
                  label="Unavailable"
                  value={menuItems.length - availableCount}
                />
              </div>

              {showForm && (
                <section className="mb-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-7">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {editingId ? "Edit menu item" : "Add menu item"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Enter the item details below.
                      </p>
                    </div>
                    <button
                      onClick={resetForm}
                      aria-label="Close form"
                      className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                    >
                      <X size={19} />
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="item-name"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Item name *
                      </label>
                      <input
                        id="item-name"
                        value={itemName}
                        onChange={(event) => setItemName(event.target.value)}
                        placeholder="e.g. Masala dosa"
                        maxLength={100}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="item-category"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Category
                      </label>
                      <select
                        id="item-category"
                        value={itemCategory}
                        onChange={(event) => setItemCategory(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="item-price"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Price (₹) *
                      </label>
                      <input
                        id="item-price"
                        type="number"
                        min="0"
                        max="1000000"
                        step="0.01"
                        value={itemPrice}
                        onChange={(event) => setItemPrice(event.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Item image
                      </label>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 transition hover:border-orange-400 hover:bg-orange-50/40">
                        <Upload size={19} className="text-orange-500" />
                        <span className="text-sm text-slate-500">
                          Choose image (max 1 MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) =>
                            handleImage(event.target.files?.[0])
                          }
                        />
                      </label>
                    </div>
                  </div>

                  {itemImage && (
                    <div className="mt-4 flex items-center gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={itemImage}
                          alt="Menu item preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => setItemImage("")}
                        className="text-sm font-semibold text-red-500 hover:text-red-700"
                      >
                        Remove image
                      </button>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={resetForm}
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveItem}
                      className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600"
                    >
                      <CircleCheck size={17} />
                      {editingId ? "Save changes" : "Add item"}
                    </button>
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">All menu items</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {filteredItems.length} item(s)
                    </p>
                  </div>
                  <div className="relative w-full sm:max-w-xs">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search menu..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                {!loaded ? (
                  <div className="p-12 text-center text-sm text-slate-400">
                    Loading saved menu...
                  </div>
                ) : filteredItems.length === 0 ? (
                  <EmptyState
                    icon={ImagePlus}
                    title={search ? "No matching items" : "No menu items yet"}
                    description={
                      search
                        ? "Try a different search term."
                        : "Add your first item to start building your menu."
                    }
                    action={search ? undefined : "Add menu item"}
                    onAction={
                      search
                        ? undefined
                        : () => {
                            resetForm();
                            setShowForm(true);
                          }
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead className="bg-slate-50">
                        <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-5 py-4">Item</th>
                          <th className="px-5 py-4">Category</th>
                          <th className="px-5 py-4">Price</th>
                          <th className="px-5 py-4">Availability</th>
                          <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.map((item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                                  {item.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <ImagePlus
                                      size={18}
                                      className="text-slate-400"
                                    />
                                  )}
                                </div>
                                <span className="font-semibold text-slate-800">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-500">
                              {item.category}
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-slate-800">
                              {money(item.price)}
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => toggleAvailability(item.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                                  item.available
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    item.available
                                      ? "bg-emerald-500"
                                      : "bg-slate-400"
                                  }`}
                                />
                                {item.available ? "Available" : "Unavailable"}
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => toggleAvailability(item.id)}
                                  title={
                                    item.available
                                      ? "Make unavailable"
                                      : "Make available"
                                  }
                                  aria-label={
                                    item.available
                                      ? "Make unavailable"
                                      : "Make available"
                                  }
                                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-orange-200 hover:text-orange-600"
                                >
                                  {item.available ? (
                                    <Eye size={16} />
                                  ) : (
                                    <EyeOff size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => startEdit(item)}
                                  title="Edit item"
                                  aria-label={`Edit ${item.name}`}
                                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-blue-200 hover:text-blue-600"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  title="Delete item"
                                  aria-label={`Delete ${item.name}`}
                                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {active === "Tables & QR" && <TablesQR />}

{active !== "Dashboard" && active !== "Menu" && active !== "Tables & QR" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
              <div className="mx-auto max-w-lg py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  {(() => {
                    const item = navigation.find(
                      (entry) => entry.name === active
                    );
                    const Icon = item?.icon ?? Store;
                    return <Icon size={30} />;
                  })()}
                </div>
                <h1 className="mt-5 text-2xl font-black text-slate-900">
                  {active}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  This section&apos;s functionality has not been implemented
                  yet. The next steps will connect it to the restaurant
                  workflow and backend.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
                  <Clock3 size={15} />
                  Implementation pending
                </div>
                <div className="mt-7">
                  <button
                    onClick={() => changeSection("Dashboard")}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                  >
                    Back to dashboard
                  </button>
                </div>
              </div>
            </section>
          )}

          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <p>Tablo Restaurant Management</p>
            <p>Prototype • Local browser storage</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  note,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof LayoutDashboard;
  tone: "orange" | "green" | "purple" | "blue";
}) {
  const tones = {
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">{note}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-orange-100 hover:bg-orange-50/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      <ChevronRight size={16} className="text-slate-400" />
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
        <Icon size={25} />
      </div>
      <h3 className="mt-4 font-bold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
        >
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  );
}