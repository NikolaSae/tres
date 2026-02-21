import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "TRES",
  tagline: "Telco Regulation & Expense System",
  favicon: "img/favicon.ico",

  url: "https://docs.tres-system.com",
  baseUrl: "/",

  organizationName: "NikolaSae",
  projectName: "tres",

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "sr",
    locales: ["sr", "en"],
    localeConfigs: {
      sr: {
        label: "Srpski",
        direction: "ltr",
        htmlLang: "sr",
      },
      en: {
        label: "English",
        direction: "ltr",
        htmlLang: "en",
      },
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          editUrl: "https://github.com/NikolaSae/tres/tree/main/docs/docs-site/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/tres-social.png",
    navbar: {
      title: "TRES Docs",
      logo: {
        alt: "TRES Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "mainSidebar",
          position: "left",
          label: "Dokumentacija",
        },
        {
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/NikolaSae/tres",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Dokumentacija",
          items: [
            { label: "Početak", to: "/" },
            { label: "Ugovori", to: "/features/contracts" },
            { label: "Provideri", to: "/features/providers" },
          ],
        },
        {
          title: "Funkcionalnosti",
          items: [
            { label: "Humanitarne Org.", to: "/features/humanitarian" },
            { label: "Parking Servisi", to: "/features/parking" },
            { label: "Analitika", to: "/features/analytics" },
          ],
        },
        {
          title: "Više",
          items: [
            { label: "GitHub", href: "https://github.com/NikolaSae/tres" },
            { label: "Arhitektura", to: "/architecture/overview" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TRES Development Team.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "typescript", "sql", "json"],
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;