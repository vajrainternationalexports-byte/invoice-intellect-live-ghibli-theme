/**
 * Vendors.tsx — Vendor master directory
 * Clean layout, instant search, premium drawer with full details.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ShieldCheck, ChevronRight, X, Building,
  User, Phone, Mail, MapPin, FileDown, Camera, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { DocumentExtractor } from "@/components/DocumentExtractor";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { downloadExcel } from "@/lib/excel-export";
import { useLocalFilter } from "@/hooks/useLocalFilter";
import { cn } from "@/lib/utils";

const TYPE_BADGE: Record<string, string> = {
  galvanizer: "badge-warning",
  supplier:   "badge-info",
};

export default function Vendors() {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showScanDrawer, setShowScanDrawer] = useState(false);
  const qc = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/vendors"] });

  const createMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/vendors", d).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/vendors"] }),
  });

  const { search, setSearch, filtered } = useLocalFilter({
    items: vendors,
    searchFields: ["name", "gstin", "city", "state"],
  });

  const handleExtract = async (data: any) => {
    const party = data.buyer || data.seller || data.bill_to || data.galvanizer || {};
    const payload = {
      name:          party.organization_name || party.name || party.company_name || "Unknown Vendor",
      gstin:         party.gstin,
      address:       party.address_line1 || party.address,
      city:          party.city,
      state:         party.state,
      pincode:       party.pincode,
      contactPerson: party.contact_person,
      phone:         party.contact_phone || party.contact_no,
      email:         party.contact_email,
      vendorType:    data.document_type === "LABOUR_INVOICE" ? "galvanizer" : "supplier",
    };
    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Vendor saved ✓");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  /* Group counts */
  const galvCount  = vendors.filter((v: any) => v.vendorType === "galvanizer").length;
  const suppCount  = vendors.filter((v: any) => v.vendorType !== "galvanizer").length;

  return (
    <div className="space-y-4 py-4 pb-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <span className="section-label block mb-1">Master Directory</span>
          <h1 className="text-3xl font-black text-blue-ink tracking-tight">Vendors</h1>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => downloadExcel(vendors, "Vendors_Master", "Vendors").then(() => toast.success("Exported"))}
            className="icon-btn">
            <FileDown size={18} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => setShowScanDrawer(true)}
            className="icon-btn icon-btn-primary">
            <Plus size={18} />
          </motion.button>
          <ProfileMenu />
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="fin-num text-2xl text-blue-ink">{galvCount}</p>
          <p className="section-label mt-1">Galvanizers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="fin-num text-2xl text-blue-ink">{suppCount}</p>
          <p className="section-label mt-1">Suppliers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-mid/40" size={16} />
        <input className="search-input" placeholder="Search name, GSTIN, city..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading && [1,2,3].map(i => <div key={i} className="skeleton h-20 w-full" />)}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center h-48 justify-center gap-3 text-blue-mid/30">
            <div className="h-16 w-16 rounded-[2rem] bg-white/60 flex items-center justify-center border border-blue-mid/10">
              <Building size={28} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">No vendors found</p>
            <button onClick={() => setShowScanDrawer(true)}
              className="btn-primary text-xs px-6 py-3 w-auto">
              + Scan Invoice
            </button>
          </div>
        )}

        <AnimatePresence>
          {filtered.map((vendor: any) => (
            <motion.div
              key={vendor.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              whileTap={{ scale: 0.982 }}
              onClick={() => setSelectedVendor(vendor)}
              className="card card-interactive p-4 flex items-center gap-4"
            >
              {/* Avatar */}
              <div className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0",
                vendor.vendorType === "galvanizer" ? "bg-amber-500" : "bg-blue-deep"
              )}>
                {(vendor.name || "?")[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-black text-blue-ink text-sm truncate">{vendor.name}</h3>
                  <span className={cn("badge flex-shrink-0", TYPE_BADGE[vendor.vendorType] ?? "badge-neutral")}>
                    {vendor.vendorType}
                  </span>
                </div>
                {vendor.gstin && (
                  <p className="text-[10px] font-mono text-blue-mid/60 truncate">{vendor.gstin}</p>
                )}
                {(vendor.city || vendor.state) && (
                  <p className="text-[10px] text-blue-mid/40 font-medium">
                    {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <ShieldCheck size={14} className="text-green-500 opacity-70" />
                <ChevronRight size={14} className="text-blue-mid/25" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Vendor Detail Drawer */}
      <Drawer open={!!selectedVendor} onOpenChange={o => !o && setSelectedVendor(null)}>
        <DrawerContent className="max-h-[90dvh] bg-blue-light border-blue-mid/10 rounded-t-[2.5rem]">
          {selectedVendor && (
            <div className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-10">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-black",
                    selectedVendor.vendorType === "galvanizer" ? "bg-amber-500" : "bg-blue-deep"
                  )}>
                    {(selectedVendor.name || "?")[0].toUpperCase()}
                  </div>
                  <DrawerClose className="icon-btn"><X size={18} /></DrawerClose>
                </div>
                <DrawerTitle className="text-2xl font-black text-blue-ink">{selectedVendor.name}</DrawerTitle>
                <DrawerDescription className="text-[10px] font-mono text-blue-mid/60 mt-1 uppercase tracking-widest">
                  {selectedVendor.gstin || "No GSTIN recorded"}
                </DrawerDescription>
              </DrawerHeader>

              <div className="card p-5 space-y-4">
                <span className="section-label">Contact Details</span>
                <div className="divider" />
                {[
                  selectedVendor.address     && { Icon: MapPin, label: "Address",  value: selectedVendor.address },
                  selectedVendor.city        && { Icon: MapPin, label: "City",     value: [selectedVendor.city, selectedVendor.state, selectedVendor.pincode].filter(Boolean).join(", ") },
                  selectedVendor.contactPerson && { Icon: User,  label: "Contact", value: selectedVendor.contactPerson },
                  selectedVendor.phone       && { Icon: Phone,  label: "Phone",    value: selectedVendor.phone },
                  selectedVendor.email       && { Icon: Mail,   label: "Email",    value: selectedVendor.email },
                ].filter(Boolean).map((row: any) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-light flex items-center justify-center text-blue-mid flex-shrink-0 mt-0.5">
                      <row.Icon size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-mid/50">{row.label}</p>
                      <p className="text-sm font-bold text-blue-ink">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pb-safe">
                <button onClick={() => setSelectedVendor(null)} className="btn-primary">Done</button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Scanner */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[92dvh] bg-white border-blue-mid/10 rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <DocumentExtractor docTypeHint="AUTO_DETECT" onExtract={handleExtract} onCancel={() => setShowScanDrawer(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
