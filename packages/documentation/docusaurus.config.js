const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "yarn.build",
  tagline:
    "Build your local packages as fast as possible, only rebuilding whats changed.",
  url: "https://docs.yarn.build",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "ojkelly",
  projectName: "yarn.build",
  themeConfig: {
    navbar: {
      title: "yarn.build",
      logo: {
        alt: "yarn build",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "doc",
          docId: "intro",
          position: "left",
          label: "Tutorial",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://github.com/ojkelly/yarn.build",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Tutorial",
              to: "/docs/intro",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Github",
              href: "https://github.com/ojkelly/yarn.build",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/ojkelly",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "package.yaml",
              to: "docs/package-yaml/intro",
            },
            {
              label: "ojkelly.dev",
              href: "https://ojkelly.dev",
            },
            {
              label: "Other stuff I've built",
              href: "https://projects.owenkelly.com.au",
            },
          ],
        },
      ],
      copyright: `MIT ${new Date().getFullYear()}. Owen Kelly & contributors.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
      switchConfig: {
        darkIcon: "🌘",
        lightIcon: "🌔",
        darkIconStyle: {
          marginLeft: "2px",
        },
        lightIconStyle: {
          marginLeft: "1px",
        },
      },
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl:
            "https://github.com/ojkelly/yarn.build/edit/trunk/packages/documentation/",
        },
        blog: {
          showReadingTime: true,
          editUrl:
            "https://github.com/ojkelly/yarn.build/edit/trunk/packages/documentation/blog/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
  plugins: ["@internal/webpack5-node-api-polyfill"],
};
