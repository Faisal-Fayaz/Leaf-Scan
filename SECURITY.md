# Security policy

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository. Do not include exploit details, private photos, credentials, or personal data in a public issue.

If private reporting is unavailable, open a minimal public issue asking the maintainer to enable a private contact channel. Do not disclose the vulnerability in that issue.

Include the affected version, platform, impact, reproduction conditions, and any safe mitigation you have identified. Maintainers should acknowledge a report within seven days and keep the reporter updated while the issue is assessed.

## Supported versions

Until the first public store release, security fixes are made on the latest `main` branch. Published support windows should be documented here before production distribution.

## Sensitive areas

Changes involving image storage, native permissions, model files, TensorFlow input/output handling, dependency install scripts, or future network services require explicit security review.

## Known dependency advisories

As of 2026-08-10, `npm audit` traces its open findings to transitive build-tool packages: `image-size` through Metro, `uuid` through the Xcode project parser, and `brace-expansion` through the Babel module-resolver test tooling. The supported Expo SDK 57 dependency graph does not currently offer non-breaking fixes for these paths. They are not imported into LeafScan's application runtime bundles.

Dependabot checks npm and GitHub Actions weekly. Re-evaluate these advisories with each Expo patch instead of applying an unsupported major-version override or `npm audit fix --force`.
