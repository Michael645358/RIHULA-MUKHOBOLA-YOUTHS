/*
 * RIHULA Supabase Client Bootstrap
 * Reliable initialization for local/mobile browser previews.
 */

(function () {
    "use strict";

    const SUPABASE_URL =
        "https://qezbkcixzhdtntflljgy.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_lzTilJjSPerjRGlbuUpT-Q_WzonQy-d";


    /*
     * Create the Supabase client.
     */
    function initializeSupabase() {

        if (
            !window.supabase ||
            typeof window.supabase.createClient !== "function"
        ) {
            return false;
        }

        try {

            const client = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );

            // Make both names available to all RIHULA pages.
            window.db = client;
            window.supabaseClient = client;

            window.RIHULA_SUPABASE_READY = true;

            console.info(
                "RIHULA: Supabase client initialized successfully."
            );

            return true;

        } catch (error) {

            console.error(
                "RIHULA: Supabase client creation failed:",
                error
            );

            return false;
        }
    }


    /*
     * If the CDN SDK is already available,
     * initialize immediately.
     */
    if (initializeSupabase()) {
        initializeOneSignal();
        return;
    }


    /*
     * Load fallback SDK asynchronously.
     */
    const fallbackUrl =
        "https://unpkg.com/@supabase/supabase-js@2.103.3/dist/umd/supabase.js";

    const fallbackScript =
        document.createElement("script");

    fallbackScript.src = fallbackUrl;
    fallbackScript.async = false;


    fallbackScript.onload = function () {

        console.info(
            "RIHULA: Supabase fallback SDK loaded."
        );

        if (!initializeSupabase()) {

            console.error(
                "RIHULA: Supabase SDK loaded, " +
                "but the client could not be initialized."
            );

            window.db = null;
            window.supabaseClient = null;
            window.RIHULA_SUPABASE_READY = false;

            return;
        }

        initializeOneSignal();
    };


    fallbackScript.onerror = function () {

        console.error(
            "RIHULA: Supabase SDK could not be loaded. " +
            "Check internet/CDN access."
        );

        window.db = null;
        window.supabaseClient = null;
        window.RIHULA_SUPABASE_READY = false;
    };


    document.head.appendChild(fallbackScript);


    /*
     * OneSignal
     */
    function initializeOneSignal() {

        window.OneSignalDeferred =
            window.OneSignalDeferred || [];


        if (
            window.OneSignalDeferred &&
            typeof window.OneSignalDeferred.push === "function"
        ) {

            window.OneSignalDeferred.push(
                async function (OneSignal) {

                    try {

                        await OneSignal.init({
                            appId:
                                "453dc903-a736-4d52-b7e2-8b45f4f7da61",

                            notifyButton: {
                                enable: true
                            }
                        });

                        console.info(
                            "RIHULA: OneSignal initialized."
                        );

                    } catch (error) {

                        console.warn(
                            "RIHULA: OneSignal unavailable in this browser.",
                            error
                        );
                    }
                }
            );
        }
    }

})();