module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:5173/",
        "http://localhost:5173/login",
        "http://localhost:5173/register",
        "http://localhost:5173/dashboard",
        "http://localhost:5173/data-table",
        "http://localhost:5173/forms",
        "http://localhost:5173/api-testing",
        "http://localhost:5173/performance-test",
      ],
      settings: {
        chromeFlags: "--no-sandbox --headless",
      },
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "categories:pwa": ["warn", { minScore: 0.7 }],

        // Performance metrics
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
        "speed-index": ["warn", { maxNumericValue: 4000 }],

        // Accessibility audits
        "color-contrast": "error",
        "image-alt": "error",
        label: "error",
        "link-name": "error",
        "button-name": "error",
        "document-title": "error",
        "html-has-lang": "error",
        "html-lang-valid": "error",
        "meta-viewport": "error",
        "aria-allowed-attr": "error",
        "aria-hidden-body": "error",
        "aria-hidden-focus": "error",
        "aria-input-field-name": "error",
        "aria-required-attr": "error",
        "aria-roles": "error",
        "aria-valid-attr": "error",
        "aria-valid-attr-value": "error",
        "duplicate-id-aria": "error",
        "focus-traps": "error",
        "focusable-controls": "error",
        "heading-order": "error",
        "interactive-element-affordance": "error",
        "keyboard-navigation": "error",
        "landmark-one-main": "error",
        "link-in-text-block": "error",
        "managed-focus": "error",
        "skip-link": "error",
        tabindex: "error",
        "use-landmarks": "error",

        // Best practices
        "uses-https": "error",
        "uses-http2": "warn",
        "no-vulnerable-libraries": "error",
        "csp-xss": "warn",
        "is-on-https": "error",

        // SEO
        "meta-description": "warn",
        "http-status-code": "error",
        "crawlable-anchors": "error",
        "robots-txt": "warn",

        // PWA
        "service-worker": "warn",
        "installable-manifest": "warn",
        "splash-screen": "warn",
        "themed-omnibox": "warn",
        "content-width": "warn",
        viewport: "error",
        "without-javascript": "warn",
        "apple-touch-icon": "warn",
        "maskable-icon": "warn",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
