# Private-beta data model

```text
admins/{parentUid}
  active

invites/{normalizedCode}
  displayCode
  active
  createdBy
  createdAt
  expiresAt
  usedBy
  usedAt

households/{parentUid}
  ownerUid
  parentEmail
  displayName
  inviteCode
  beta
  childProfileLimit
  adultProfileLimit
  createdAt
  updatedAt

households/{parentUid}/profiles/{profileId}
  nickname
  role: child | adult
  monkeStyle
  rank
  shinyRocks
  streak
  weeklyScore
  gameState
  settings
  createdAt
  updatedAt

households/{parentUid}/feedback/{feedbackId}
  category
  message
  expected
  profileId
  appVersion
  userAgent
  pageUrl
  status
  createdAt
```

## Public-friend fields reserved for a later release

If approved friend cards are introduced later, copy only these fields into a separate purpose-built document:

- nickname
- selected Monke avatar
- Shiny Rocks
- rank
- streak
- weekly score

Do not grant another household access to the full profile or `gameState` document.
