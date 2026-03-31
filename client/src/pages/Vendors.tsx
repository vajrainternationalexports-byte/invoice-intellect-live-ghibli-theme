import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, ShieldAlert, AlertTriangle, ChevronRight, X, Building, User, Hash, Landmark, FileDown, Camera, Plus, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { downloadExcel } from "@/lib/excel-export";
import { toast } from "sonner";
import { DocumentExtractor } from "@/components/DocumentExtractor";

export default function Vendors() {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showScanDrawer, setShowScanDrawer] = useState(false);

  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/vendors", data).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/vendors"] }),
  });

  const handleDownloadExcel = async () => {
    await downloadExcel(vendors, "Vendors_Master", "Vendors");
    toast.success("Vendors exported to Excel");
  };

  const handleExtract = async (data: any) => {
    const party = data.buyer || data.seller || data.bill_to || data.galvanizer || {};
    const vendorPayload = {
      name: party.organization_name || party.name || party.company_name || "Unknown Vendor",
      gstin: party.gstin,
      address: party.address_line1 || party.address,
      city: party.city,
      state: party.state,
      pincode: party.pincode,
      contactPerson: party.contact_person,
      phone: party.contact_phone || party.contact_no,
      email: party.contact_email,
      vendorType: data.document_type === "LABOUR_INVOICE" ? "galvanizer" : "supplier",
    };
    try {
      await createMutation.mutateAsync(vendorPayload);
      setShowScanDrawer(false);
      toast.success("Vendor extracted and saved");
    } catch (e: any) {
      toast.error("Failed to save vendor: " + e.message);
    }
  };

  return (
    <div className="p-4 space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Master directory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanDrawer(true)} className="h-9 w-9 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all">
            <Camera size={16} />
          </button>
          <button onClick={handleDownloadExcel} className="h-9 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-90 transition-all text-xs font-bold uppercase tracking-wider">
            <FileDown size={16} /> Excel
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
        {isLoading && <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading vendors...</div>}

        {!isLoading && vendors.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <Building size={36} className="opacity-30" />
            <p className="text-sm font-medium text-center">No vendors yet.<br />Scan an invoice to auto-extract vendor details.</p>
            <button onClick={() => setShowScanDrawer(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-all">
              <Camera size={14} /> Scan Invoice
            </button>
          </div>
        )}

        {vendors.map((vendor: any) => (
          <div
            key={vendor.id}
            onClick={() => setSelectedVendor(vendor)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    {vendor.name}
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide",
                      vendor.vendorType === "galvanizer" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {vendor.vendorType}
                    </span>
                  </h3>
                  {vendor.gstin && (
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">GSTIN: {vendor.gstin}</p>
                  )}
                </div>
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              </div>

              {(vendor.city || vendor.state) && (
                <p className="text-[10px] text-gray-400">{[vendor.city, vendor.state].filter(Boolean).join(", ")}</p>
              )}
              {vendor.contactPerson && (
                <p className="text-[10px] text-gray-500 font-medium mt-1">Contact: {vendor.contactPerson}</p>
              )}
            </div>
            <ChevronRight className="text-gray-300 ml-2" size={20} />
          </div>
        ))}
      </div>

      {/* Vendor Detail Drawer */}
      <Drawer open={!!selectedVendor} onOpenChange={open => !open && setSelectedVendor(null)}>
        <DrawerContent className="max-h-[85dvh] bg-gray-50 p-0 rounded-t-[2.5rem]">
          {selectedVendor && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-2">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Building size={32} />
                  </div>
                  <DrawerClose className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <X size={20} />
                  </DrawerClose>
                </div>
                <DrawerTitle className="text-2xl font-bold">{selectedVendor.name}</DrawerTitle>
                <DrawerDescription className="text-gray-500 font-mono text-xs">
                  {selectedVendor.gstin ? `GSTIN: ${selectedVendor.gstin}` : "No GSTIN recorded"}
                </DrawerDescription>
              </DrawerHeader>

              <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Details</h4>
                <div className="space-y-3">
                  {selectedVendor.address && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Address</p>
                      <p className="text-sm font-medium text-gray-900">{selectedVendor.address}</p>
                    </div>
                  )}
                  {(selectedVendor.city || selectedVendor.state) && (
                    <div className="flex gap-6">
                      {selectedVendor.city && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">City</p>
                          <p className="text-sm font-bold text-gray-900">{selectedVendor.city}</p>
                        </div>
                      )}
                      {selectedVendor.state && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">State</p>
                          <p className="text-sm font-bold text-gray-900">{selectedVendor.state}</p>
                        </div>
                      )}
                      {selectedVendor.pincode && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Pincode</p>
                          <p className="text-sm font-bold text-gray-900">{selectedVendor.pincode}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedVendor.contactPerson && (
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                      <div className="h-9 w-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><User size={16} /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Contact Person</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedVendor.contactPerson}</p>
                      </div>
                    </div>
                  )}
                  {selectedVendor.phone && (
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Hash size={16} /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedVendor.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedVendor.email && (
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Mail size={16} /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedVendor.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pb-safe pt-2">
                <button className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all" onClick={() => setSelectedVendor(null)}>
                  Done
                </button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Scanner Drawer */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[90dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <DocumentExtractor
              docTypeHint="AUTO_DETECT"
              onExtract={handleExtract}
              onCancel={() => setShowScanDrawer(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
