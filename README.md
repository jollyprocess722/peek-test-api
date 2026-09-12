# peek-test-api

Minimal zero-dependency Node HTTP service used to verify peek.dev multi-repo
previews. Serves `GET /api/hello` (JSON) on `process.env.PORT` (default 3001).

The peek.dev pipeline starts it with `PORT=<primary+100> npm start` when this
repo is mounted as an additional repository.
