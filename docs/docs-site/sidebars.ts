import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: "doc",
      id: "intro",
      label: "🏠 Uvod",
    },
    {
      type: "category",
      label: "🚀 Početak",
      collapsed: false,
      items: [
        "getting-started/installation",
        "getting-started/configuration",
        "getting-started/first-steps",
      ],
    },
    {
      type: "category",
      label: "📋 Funkcionalnosti",
      collapsed: false,
      items: [
        "features/contracts",
        "features/providers",
        "features/humanitarian",
        "features/parking",
        "features/services",
        "features/complaints",
        "features/reports",
        "features/analytics",
        "features/notifications",
        "features/ai-chat",
      ],
    },
    {
      type: "category",
      label: "🔒 Autentifikacija & Sigurnost",
      items: [
        "security/authentication",
        "security/roles-permissions",
        "security/audit-logs",
      ],
    },
    {
      type: "category",
      label: "🏗️ Arhitektura",
      items: [
        "architecture/overview",
        "architecture/database",
        "architecture/api-routes",
        "architecture/folder-structure",
      ],
    },
    {
      type: "category",
      label: "📦 Import & Export",
      items: [
        "import-export/excel-import",
        "import-export/csv-import",
        "import-export/reports-export",
      ],
    },
  ],
};

export default sidebars;