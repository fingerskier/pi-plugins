# @fingerskier/pi-billing-footer

Portable Pi footer override for subscription-friendly billing display.

## What it changes

- Nominal OAuth/subscription usage displays `$✓` with a green check mark.
- API-key usage displays the estimated dollar amount.
- Subscription overage displays the estimated dollar amount.
- Anthropic OAuth is treated as billable extra usage because Pi warns that third-party harness usage draws from Anthropic extra usage rather than base Claude plan limits.

The package uses Pi's public `ctx.ui.setFooter()` extension API instead of patching the installed Pi npm package.

## Install

```bash
pi install npm:@fingerskier/pi-billing-footer
```

For local development:

```bash
pi install ./packages/pi-billing-footer
# or for one run only
pi -e ./packages/pi-billing-footer
```

## Notes

Only one custom footer can be active at a time. If another extension also calls `ctx.ui.setFooter()`, the last-loaded footer wins.
