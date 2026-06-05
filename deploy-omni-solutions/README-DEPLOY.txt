PAULI BEST PRICE / Omni Solutions Global — deployment notes (omni-solutions-global.com)
==========================================================================================

cpanel-style hosting often cannot run "node server.js" 24/7 unless your plan offers "Node.js
Selector" / Passenger. Two common patterns:

A) Node on the api subdomain (preferred if your host supports it)
   - Upload the full project (not only /deploy-omni-solutions).
   - Point api.omni-solutions-global.com to the app root; start Node with .env from .env.example.
   - Upload static files + index.html to the main site; in index.html set API base to
     https://api.omni-solutions-global.com (see osg-runtime-config.example.js).

B) PHP proxy on api subdomain + Node somewhere else (VPS, PaaS)
   - Upload deploy-omni-solutions/php-proxy/ contents to the document root of api.* .
   - Copy osg-proxy-config.example.php to osg-proxy-config.php and set upstream_base to your
     real Node URL (keep that file out of public git if it reveals internal URLs).
   - The proxy only forwards paths starting with /api/ .

Data directory
--------------
The Express app writes under /data (leads.jsonl, referral_*, vip_codes.json). Ensure that folder
is writable and persisted across redeploys.

MySQL / SQLite
--------------
Purchase verification (e.g. 59 THB) is not implemented in server.js yet. Use OSG_DATABASE_URL or
OSG_SQLITE_PATH when your developer adds the route — see .env.example comments.

FTP upload checklist
--------------------
1) Project files + node_modules installed on the target OR run npm install on the server.
2) .env (never commit) from .env.example with real OSG_INSTALL_FP_SALT and keys.
3) data/ permissions.
4) After go-live: GET https://api.omni-solutions-global.com/api/health → {"ok":true}
5) PHP proxy path B: curl -sSI 'https://api.omni-solutions-global.com/api/health' should return HTTP 200 with JSON body (or forward errors from upstream — fix osg-proxy-config.php upstream_base if not).
