// osg_tts_guard.js - Globaler Mutex und Queue für playPauliVoice
(function() {
    let isSpeaking = false;
    let ttsQueue = [];
    const MAX_QUEUE_SIZE = 3;
    const originalPlayPauliVoice = window.playPauliVoice;

    // Hilfsfunktion: Verarbeitet den nächsten Eintrag in der Warteschlange
    async function processQueue() {
        if (isSpeaking || ttsQueue.length === 0) return;

        isSpeaking = true;
        const nextCall = ttsQueue.shift();

        try {
            // Führt das originale playPauliVoice aus und wartet, bis es fertig ist
            if (typeof originalPlayPauliVoice === 'function') {
                await originalPlayPauliVoice(nextCall.text, nextCall.options);
            } else {
                console.warn("Originales playPauliVoice nicht gefunden!");
            }
        } catch (error) {
            console.error("Fehler beim Abspielen der Pauli-Stimme:", error);
        } finally {
            isSpeaking = false;
            // Direkt den nächsten Eintrag anpacken
            processQueue();
        }
    }

    // Patch für die originale playPauliVoice Funktion
    window.playPauliVoice = function(text, options = {}) {
        // Wenn voll: Ältesten Eintrag rauswerfen (kein Aufstau)
        if (ttsQueue.length >= MAX_QUEUE_SIZE) {
            ttsQueue.shift();
            console.log("TTS-Queue voll! Älterer Eintrag verworfen.");
        }

        // Neuen Text in die Queue schieben
        ttsQueue.push({ text, options });

        // Queue-Verarbeitung anstoßen
        processQueue();
    };

    // --- Globale Hilfsfunktionen ---

    // Prüfen, ob Pauli gerade spricht
    window.osgIsPauliSpeaking = function() {
        return isSpeaking;
    };

    // Länge der Warteschlange abfragen
    window.osgPauliTtsQueueLength = function() {
        return ttsQueue.length;
    };

    // Warteschlange sofort leeren (z.B. wenn der Nutzer dazwischenquatscht)
    window.osgPauliTtsClearQueue = function() {
        ttsQueue = [];
        console.log("Pauli TTS-Queue wurde geleert.");
    };
})();
