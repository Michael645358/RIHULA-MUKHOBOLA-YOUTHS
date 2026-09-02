/*
 * RIHULA Supabase Database Guard
 *
 * Front-end readiness helper only.
 * This file does NOT change the Supabase URL, key, Auth, tables or SQL.
 */
(function () {
    "use strict";

    function databaseIsReady() {
        return !!(
            window.db &&
            window.RIHULA_SUPABASE_READY === true
        );
    }

    window.waitForRihulaDb = function (timeoutMs) {
        const timeout = Number(timeoutMs) > 0 ? Number(timeoutMs) : 15000;

        if (databaseIsReady()) {
            return Promise.resolve(window.db);
        }

        return new Promise(function (resolve, reject) {
            const started = Date.now();

            const timer = setInterval(function () {
                if (databaseIsReady()) {
                    clearInterval(timer);
                    resolve(window.db);
                    return;
                }

                if (Date.now() - started >= timeout) {
                    clearInterval(timer);
                    reject(new Error(
                        "RIHULA database is unavailable. Supabase could not be initialized."
                    ));
                }
            }, 100);
        });
    };

    if (databaseIsReady()) {
        console.info("RIHULA: Database ready.");
        return;
    }

    // Do not emit a red error while the CDN SDK is still loading.
    window.waitForRihulaDb(15000).then(function () {
        console.info("RIHULA: Database ready.");
    }).catch(function () {
        console.warn("RIHULA: Supabase did not become ready.");
    });
})();
