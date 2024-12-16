(async function () {
    const port = window.CONFIG && window.CONFIG.API.port ? `:${window.CONFIG.API.port}` : "";
    const serverUrl = window.DOCAPI;
    const version = window.CONFIG && window.CONFIG.API.version ? window.CONFIG.API.version : "v1";
    const baseurl = `${serverUrl}/api/${version}`;

    const urlAddress = window.TYPE === 'PTW' ? `${baseurl}/Login/Planet-Time-Web` : `TODO`;

    const oggetto = {
        apiRoute: window.PTAPI,
        apiKey: window.TOKEN,
        sessionId: window.SESSION_ID,
        rememberMe: true
    };

    let previousNotificationCount = 0; // Variabile per salvare il numero di notifiche precedenti

    // Dichiarare notificationCheckInterval all'inizio del blocco
    let notificationCheckInterval = null;

    try {
        // Effettua il login
        const loginResponse = await fetch(new Request(urlAddress, {
            method: 'POST',
            credentials: 'include', // Include i cookie per la sessione
            body: JSON.stringify(oggetto),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        }));

        if (loginResponse.status < 200 || loginResponse.status >= 300) {
            throw new Error("Login failed");
        }

        // Una volta autenticati, esegui il primo controllo delle notifiche
        console.log("Login successful. Starting first notification check...");

        // Avvia il ciclo di controllo periodico solo dopo il primo controllo
        startNotificationCheck();
    } catch (error) {
        console.error("Error:", error);
    }

    // Funzione per richiamare l'API e aggiornare il badge delle notifiche
    async function checkNotifications() {
        try {
            const notificationsResponse = await fetch(`${baseurl}/FileNotifications/Unsent?q=1&filter=notificationType`, {
                method: 'GET',
                credentials: 'include', // Include i cookie della sessione autenticata
                headers: new Headers({ 'Content-Type': 'application/json' }),
            });

            if (notificationsResponse.ok) {
                const notifications = await notificationsResponse.json();
                const currentNotificationCount = notifications.length;

                // Controlla se ci sono nuove notifiche
                if (currentNotificationCount > previousNotificationCount) {
                    console.log("New notifications received:", currentNotificationCount - previousNotificationCount);
                }

                // Aggiorna il numero precedente e il badge
                previousNotificationCount = currentNotificationCount;
                updateNotificationBadge(currentNotificationCount);
            } else {
                console.error("Failed to fetch notifications:", notificationsResponse.statusText);
                updateNotificationBadge(0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            updateNotificationBadge(0);
        }
    }

    // Funzione per aggiornare il badge
    function updateNotificationBadge(count) {
        const badge = document.getElementById('notifiche_doc');
        badge.textContent = count;
    }

    // Funzione per avviare il controllo periodico delle notifiche
    function startNotificationCheck() {
        // Verifica se il controllo delle notifiche è già in esecuzione
        if (notificationCheckInterval !== null) {
            console.warn("Notification check is already running.");
            return;
        }

        //console.log("Starting periodic notification check...");
        async function checkNotificationsPeriodically() {
            try {
                await checkNotifications();
            } catch (error) {
                console.error("Error during notification check:", error);
                return; // Esci se si verifica un errore
            }

            // Pianifica il prossimo controllo solo se non ci sono stati errori
            notificationCheckInterval = setTimeout(checkNotificationsPeriodically, 10000);
        }

        // Avvia il primo ciclo periodico
        checkNotificationsPeriodically();
    }
})()
