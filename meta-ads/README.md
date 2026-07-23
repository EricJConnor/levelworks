Scripts for talking to the Meta Marketing API (ad account 3071713068446, "What's Next" business portfolio).

## Setup

1. Copy `.env.example` to `.env` in this folder.
2. Fill in `META_ACCESS_TOKEN` with a System User access token (generate one in
   Meta Business Settings → Users → System Users → your system user →
   "Generate token", with `ads_management` and `business_management`
   permissions).
3. `.env` is gitignored — never commit it or paste the token into a commit,
   issue, or chat log that gets saved to the repo.

## Verify the connection

```
node --env-file=meta-ads/.env meta-ads/verify-connection.mjs
```

Prints the ad account's name and status if the token works.
