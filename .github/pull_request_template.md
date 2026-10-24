## 📌 Pull Request Description

### Summary of Changes
<!-- Provide a clear, bulleted summary of what was changed and why. -->
- 

### Related Issue(s)
<!-- Link any related issues, e.g. Fixes #12 or Closes #34 -->
- Closes #

---

## 🔒 Security & Invariant Checklist

Please check all that apply before requesting review:

- [ ] **Zero Secret Leakage:** Confirmed no `.env`, private keys, seed phrases, or API credentials are committed or exposed in tests.
- [ ] **Cryptographic Parity:** EIP-712 typing and Base Sepolia domain configurations remain unaltered or tested with mathematical verification.
- [ ] **Floor Privacy Preserved:** Verified that Marzban's private cost and threshold formulas are strictly hidden from public tool outputs and chat responses.
- [ ] **Buyer Authorization Gate:** Confirmed that payment execution requires explicit, affirmative buyer confirmation.
- [ ] **Telemetry Redaction:** Any new logging or telemetry integrates `redactSensitiveData()`.

---

## 🧪 Verification Record

Commands executed locally:

- [ ] `npm test` passed (all 69+ tests passing)
- [ ] `npm run type-check` passed with 0 TypeScript errors
- [ ] `npm run build` compiled production bundles without error

---

## 📸 Screenshots / Visual Verification (If UI change)
<!-- Attach desktop and mobile screenshots demonstrating responsiveness, contrast, and interactive cursor behavior -->
