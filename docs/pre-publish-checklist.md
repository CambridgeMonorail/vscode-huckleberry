# Pre-Publishing Checklist

Use this checklist to verify that your extension is ready for publishing. It’s organised by topic (AI ethics, testing, docs, etc.) so you can systematically review each area. Ensuring each item is checked off will increase the likelihood of a smooth publication and a successful, compliant extension.

## ✅ Responsible AI and Ethics

- [ ] **AI Guidelines Reviewed:** I have read and understood Microsoft’s AI Tools & Practices guidelines and GitHub’s Copilot extensibility policy, and my extension conforms to these principles.
- [ ] **No Harmful Output:** The extension was tested with a variety of inputs to ensure it does not output or facilitate unsafe, harmful, or offensive content.
- [ ] **Content Filtering in Place:** If the AI can produce sensitive content, I have implemented reasonable content moderation filters or rely on Copilot’s filters to block disallowed content.
- [ ] **User Aware of AI:** The UI and documentation clearly notify users when AI is being used (e.g., AI-generated suggestions are indicated). Users are not misled into thinking AI output is from the extension logic itself.
- [ ] **Feedback Mechanism:** There is an obvious way for users to report issues or unacceptable AI outputs (such as a “Report Issue” command, or a link in README). I have provided contact info or an issue tracker and am ready to monitor it.
- [ ] **Fairness and Inclusivity:** I have considered fairness – the extension does not unfairly degrade for certain languages or groups. Any bias in AI output is noted and I will address issues if they arise. The language and examples used in the extension are inclusive and respectful.
- [ ] **No Dark Patterns:** The extension does not encourage the user to do anything unethical or violate terms. It does not, for example, try to trick users into providing data for unrelated purposes. All AI usage is transparent and for the user’s benefit.

## ✅ Robust Testing and Quality

- [ ] **Unit Tests Passed:** Core logic (prompt construction, result handling, etc.) has unit test coverage and all tests pass. Deterministic parts of the extension are verified for correctness.
- [ ] **Manual Testing Done:** I have manually tested the extension’s functionality in VS Code, including on different projects and file types, to ensure it behaves as expected.
- [ ] **Edge Cases Handled:** I’ve tested edge cases: empty files, very large files, no internet connection, API timeouts, invalid responses from the AI, rapidly repeated requests, cancellation of requests, etc. The extension handles these gracefully (no crashes, meaningful error messages).
- [ ] **No Performance Issues:** The extension does not noticeably slow down VS Code during normal use. Startup activation is as lazy as possible. Long-running AI calls are off the main thread.
- [ ] **Multiple Environments:** Tested on all relevant OS (Windows/Linux/macOS) or at least nothing OS-specific that could break. Also tested with latest VS Code version and the minimum VS Code version specified in engines to ensure compatibility.
- [ ] **Copilot Dependency:** Tested scenarios with and without the GitHub Copilot extension present. Confirmed that non-AI features of my extension still work without Copilot installed, and AI features either gracefully disable or instruct the user to enable Copilot. No hard failure when Copilot is absent.
- [ ] **Adversarial AI Testing:** Conducted adversarial testing (e.g., asking for disallowed content) and confirmed the extension/AI appropriately refuses or handles it. Ensured the extension doesn’t facilitate bypassing Copilot restrictions (it does not manipulate prompts to trick the AI into breaking rules).
- [ ] **Content Quality:** Checked quality of AI suggestions in supported languages. Verified that suggestions are relevant and insert correctly (formatting, spacing, etc.). While AI quality is not fully under my control, I ensured the extension provides sufficient context for good results.

## ✅ Documentation and Transparency

- [ ] **README Created:** A README.md is included and provides clear instructions on installation, usage, and features. It’s written in Markdown and ready to display on the Marketplace.
- [ ] **Features Listed:** All major features and commands of the extension are documented. Users know what to expect and how to activate each feature.
- [ ] **Screenshots/Examples:** Where useful, screenshots or GIFs demonstrate the extension in action. All embedded images use HTTPS links and no untrusted SVGs. Each image has descriptive alt text.
- [ ] **AI Disclosure:** The README has a section explaining that the extension uses GitHub Copilot (AI) to generate code suggestions. It clearly states that code/content will be sent to an AI service and that AI-generated outputs should be reviewed by the user.
- [ ] **Privacy Notice:** The documentation includes a privacy notice. It either explicitly states that the extension does not collect personal data, or if it does collect data (telemetry or otherwise), it explains what is collected and provides a link to a full privacy policy. Users have been informed how their data is handled in compliance with privacy laws.
- [ ] **Limitations Disclosed:** Any important limitations or potential issues are openly disclosed (e.g., “This extension requires an internet connection and a GitHub Copilot account”, “AI suggestions may contain errors – use at your own risk”, “Not tested on XYZ language”).
- [ ] **Contribution Guide:** There’s information for contributors or a link to a CONTRIBUTING guide. The README or Marketplace page links to the source repository and issue tracker, inviting feedback and contributions.
- [ ] **Changelog (Optional but Recommended):** A CHANGELOG.md is maintained listing changes for each version. This is helpful for users and for the Marketplace update notes.
- [ ] **British English Check:** Proofread the documentation to ensure British English spelling and grammar is used consistently (e.g. “behaviour”, “licence”) as per the project’s style guideline.

## ✅ Accessibility Best Practices

- [ ] **Keyboard Accessible:** All interactive UI elements introduced by the extension can be reached and used via keyboard alone. Tested tab order and arrow key navigation where applicable.
- [ ] **Screen Reader Friendly:** Verified with a screen reader (or using VS Code’s accessibility checker) that controls have proper labels and that important dynamic updates are announced. Added aria-label attributes to custom webview content or UI components with no visible label.
- [ ] **High Contrast Support:** Ensured that icons and UI elements are visible in high contrast themes. Custom colours have sufficient contrast. Used theming keys or CSS variables where possible to adapt to theme changes.
- [ ] **No Reliance on Colour Alone:** Any information conveyed with colour is also conveyed with text or icon. Any audio alerts are also shown visually.
- [ ] **Tested Accessibility Modes:** If the extension uses a Webview or custom HTML, it was tested with accessibility.support enabled (screen reader mode). All focusable elements are navigable and properly labeled.
- [ ] **Documentation Accessibility:** The README text itself is accessible (e.g., images have alt text, tables or code blocks are formatted for screen readers). While this is a minor point, it reflects overall care for accessibility.

## ✅ Extension Manifest and Metadata

- [ ] **Unique Name/ID:** The extension name is unique on the Marketplace and all lowercase. The displayName is human-friendly and also unique. No naming collisions or trademark issues exist with the chosen name.
- [ ] **Correct Version:** The version in package.json follows SemVer and is incremented appropriately for this release. (Remember: once published, you cannot re-use a version number, so the version here is new.)
- [ ] **Publisher Set:** The publisher field matches my Marketplace publisher ID.
- [ ] **Engine Compatibility:** The engines.vscode field is set to a valid VS Code version range that my extension supports (and I tested on that range).
- [ ] **Categories:** Relevant categories have been added. For an AI extension, “Machine Learning” (and possibly “Programming Languages” or “Other” if appropriate) are included.
- [ ] **Keywords:** I added a few keywords to help search (e.g. “AI”, “Copilot”, “GPT”, etc.). Kept it to <=5 as recommended.
- [ ] **Description:** The short description in package.json is present and less than 100 characters (so it shows fully in Marketplace search). It accurately summarises the extension.
- [ ] **Icon:** An appropriate icon is specified. The image file is included in the extension package, and its path is correctly listed under icon in package.json. The icon looks good on both dark and light backgrounds.
- [ ] **Extension Categories/Kind:** If the extension is not intended to run remotely, I have set extensionKind if needed (generally not needed unless I want to restrict to UI or workspace). If it’s a pure client-side extension and should run locally even on remote SSH, maybe extensionKind: ["ui"] is set. (Default is both ui & workspace).
- [ ] **Activation Events:** Activation events are specific and minimal. I did not use the overly broad * activation unless absolutely necessary.
- [ ] **Extension Dependencies:** No unnecessary dependencies. I did not add "extensionDependencies": ["GitHub.copilot"] (or any other ext) in package.json for the Copilot integration. The extension can operate (at least partially) without forcing the Copilot extension to install. Any truly required dependency is listed (unlikely in this case).
- [ ] **Bundle Check:** The packaged extension doesn’t include obviously unnecessary large files. (Ran vsce ls or checked the vsix – ensure no node_modules that are huge or dev dependencies accidentally included, etc.)
- [ ] **Marketplace Listing Details:** All relevant fields are populated so that the Marketplace page will have info: repository URL, bugs URL, categories, etc. The README.md and LICENSE are included for Marketplace to display. The Q&A is set to default (Marketplace) unless I opted out.
- [ ] **Preview Flag:** I have set "preview": true in package.json if and only if I want the extension marked as a Preview (early-stage) on the Marketplace. Otherwise, ensured it’s false/omitted for a stable release.

## ✅ Legal, Compliance and Support

- [ ] **Open Source Licence:** Included a LICENSE file with an OSI-approved licence. The license field in manifest is set (or “SEE LICENSE IN <file>”). This informs users of their rights and responsibilities.
- [ ] **Third-Party Notices:** (If applicable) Included attributions for any third-party code or assets used, as required by their licences.
- [ ] **GitHub Copilot Terms Compliance:** Verified the extension does not violate Copilot’s terms or policies. Specifically, it doesn’t store or reuse code suggestions outside the intended use, doesn’t use outputs for building any database, and doesn’t facilitate avoiding Copilot’s own filters or terms.
- [ ] **Privacy Compliance:** If any user data is handled by the extension, obtained user consent and provided a way to opt-out if necessary. A Privacy Policy is ready and linked (if needed). Complied with GDPR for EU (e.g., users have a way to request data deletion, though ideally we don’t store any data ourselves).
- [ ] **Trademark and Branding:** No misuse of trademarks in extension name or visuals. I have permission for any logos used. The extension name doesn’t impersonate another product.
- [ ] **No Legal Concerns:** The extension content and functionality do not violate any laws (e.g., it doesn’t export restricted info, doesn’t break encryption rules, etc. – likely not applicable, but a sanity check).
- [ ] **User Agreement:** Although not mandatory, I’ve included any necessary disclaimer or user agreement in the documentation. For example, a disclaimer that “This tool is provided as-is without warranties” (common for open source projects) and that users should comply with relevant licenses for AI-generated code.
- [ ] **Support Plan:** I am prepared to support the extension post-release. I’ve set up issue tracking and maybe a discussion channel. I will monitor the <copilot-partners@github.com> email for any direct reports from GitHub (as required by the partnership program) and respond promptly to any problems.
- [ ] **Future Updates:** I have a plan to maintain the extension, update it for VS Code API changes or Copilot API changes, and to periodically re-review ethical guidelines as the AI landscape evolves.

## ✅ Publishing Process

- [ ] **Publisher Account:** Publisher ID created on Marketplace (or I have access to an existing one) and it’s added to the extension package.json.
- [ ] **Personal Access Token:** PAT with Marketplace publishing rights is obtained and saved securely.
- [ ] **VSCE Configured:** Logged in via vsce login with the publisher ID.
- [ ] **No VSCE Errors:** Ran vsce package to test packaging. No errors or blocking warnings were reported (or they have been fixed). Confirmed that README and other files are included and correct.
- [ ] **Published Successfully:** Ran vsce publish and it completed without errors. The extension is now listed on the Marketplace.
- [ ] **Marketplace Verification:** Visited the Marketplace page to ensure everything looks good (description, images, version, etc.). Installed the extension from the Marketplace into VS Code as a final smoke test to ensure the published package works.
- [ ] **Announced/Documented:** (Optional) Announced the release to users, updated any project page or badges (e.g., add a Marketplace badge in the README).
