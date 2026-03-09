"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Header } from "@/components/header";
import { ImportExportTabs } from "@/components/import-export/import-export-tabs";
import { UploadFileTab } from "@/components/import-export/upload-file-tab";
import { ManualEntryTab } from "@/components/import-export/manual-entry-tab";
import { AddConnectionTab } from "@/components/import-export/add-connection-tab";
import { ViewConnectionsTab } from "@/components/import-export/view-connections-tab";
import { ManageExportTab } from "@/components/import-export/manage-export-tab";
import type { ImportExportTab } from "@/lib/import-export-types";

export const dynamic = "force-dynamic";

export default function ImportExportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as ImportExportTab) || "upload";
  const [activeTab, setActiveTab] = useState<ImportExportTab>(initialTab);

  function handleTabChange(tab: ImportExportTab) {
    setActiveTab(tab);
    router.replace(`/dashboard/import-export?tab=${tab}`, { scroll: false });
  }

  return (
    <div>
      <Header />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
          <ArrowUpDown size={22} className="text-accent" />
          Import & Export
        </h1>
        <p className="text-sm text-muted mt-1">
          Upload trades, enter manually, connect brokers, or export your data.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <ImportExportTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 min-w-0">
          {activeTab === "upload" && <UploadFileTab />}
          {activeTab === "manual" && <ManualEntryTab />}
          {activeTab === "add-sync" && <AddConnectionTab />}
          {activeTab === "connections" && <ViewConnectionsTab />}
          {activeTab === "export" && <ManageExportTab />}
        </div>
      </div>
    </div>
  );
}
