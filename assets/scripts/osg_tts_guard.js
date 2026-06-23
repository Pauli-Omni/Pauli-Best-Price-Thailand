// osg_tts_guard.js - Synchronisierter globaler Mutex mit Promises für playPauliVoice
(function() {
    let isSpeaking = false;
    let ttsQueue = [];
    const MAX_QUEUE_SIZE = 3;
    const originalPlayPauliVoice = window.playPauliVoice;

    // Hilfsfunktion: Verarbeitet die Warteschlange Schritt für Schritt
    async function processQueue() {
        if (isSpeaking || ttsQueue.length === 0) return;

        isSpeaking = true;
        const current = ttsQueue.shift();

        try {
            if (typeof originalPlayPauliVoice === 'function') {
                // Wartet, bis die originale Sprachausgabe komplett fertig ist
                await originalPlayPauliVoice(current.text, current.options);
                // Meldet dem Aufrufer Erfolg
                current.resolve();
            } else {
                console.warn("Originales playPauliVoice nicht gefunden!");
                current.resolve();
            }
        } catch (error) {
            console.error("Fehler beim Abspielen der Pauli-Stimme:", error);
            current.reject(error);
        } finally {
            isSpeaking = false;
            // Nächsten Eintrag anstoßen
            processQueue();
        }
    }

    // Gepatchte Funktion, die jetzt ein echtes Promise zurückgibt!
    window.playPauliVoice = function(text, options = {}) {
        return new Promise((resolve, reject) => {
            // Wenn die Warteschlange voll ist, den ältesten Eintrag rauswerfen
            if (ttsQueue.length >= MAX_QUEUE_SIZE) {
                const dropped = ttsQueue.shift();
                dropped.resolve(); // Verhindert, dass der alte Aufruf ewig blockiert
                console.log("TTS-Queue voll! Älterer Eintrag übersprungen.");
            }

            // Text zusammen mit den Promise-Steuerungen in die Queue schieben
            ttsQueue.push({ text, options, resolve, reject });

            // Verarbeitung starten
            processQueue();
        });
    };

    // --- Globale Hilfsfunktionen ---

    window.osgIsPauliSpeaking = function() {
        return isSpeaking;
    };

    window.osgPauliTtsQueueLength = function() {
        return ttsQueue.length;
    };

    window.osgPauliTtsClearQueue = function() {
        ttsQueue.forEach(item => item.resolve());
        ttsQueue = [];
        console.log("Pauli TTS-Queue wurde vollständig geleert.");
    };
})();
