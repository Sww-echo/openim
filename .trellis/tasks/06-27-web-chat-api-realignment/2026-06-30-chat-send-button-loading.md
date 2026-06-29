# 2026-06-30 Chat send button loading

## Context

- User requested Trellis tracking and chat interaction optimization.
- Text message send button should show loading while the send flow is in progress.

## Implementation

- Added local `sending` state in `src/pages/chat/queryChat/ChatFooter/index.tsx`.
- Text sending now guards against repeated click/Enter submits while a message is being created or sent.
- The primary send button uses Ant Design `Button.loading`.
- The send button is disabled when the editor has no clean text content.

## Verification

- Planned static checks:
  - `npx eslint --quiet "src/pages/chat/queryChat/ChatFooter/index.tsx"`
  - Existing full `tsc --noEmit` failures remain outside this focused UI change.

## Notes

- File/image/video send flows already have upload toast loading in `SendActionBar`; this note records the text-message send-button loading improvement only.
