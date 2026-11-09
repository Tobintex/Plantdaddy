# Pflanzen-Wohnung als Android-App

Dieser Ordner enthält deine Pflanzen-App als fertiges Android-Projekt.
Daraus wird eine **APK-Datei** gebaut – die installierst du auf deinem Handy wie eine App.
Dann bekommst du auch echte **Gieß-Erinnerungen** als Benachrichtigung.

Es gibt zwei Wege. **Weg A ist der einfachste** (nichts installieren, alles im Browser).

---

## Weg A: GitHub baut die App für dich (empfohlen)

GitHub ist eine Webseite, auf der Programme gespeichert werden. Dort läuft kostenlos ein
„Bau-Roboter“ (GitHub Actions), der aus diesem Ordner die APK macht.

### 1. Kostenloses Konto anlegen
1. Öffne <https://github.com> und klicke auf **Sign up**.
2. E-Mail, Passwort und Benutzername eingeben, E-Mail bestätigen.

### 2. Neues Projekt („Repository“) anlegen
1. Oben rechts auf **+** → **New repository**.
2. Name: z. B. `pflanzen-wohnung`.
3. **Private** auswählen (dann sieht es niemand außer dir).
4. Auf **Create repository** klicken.

### 3. Dateien hochladen
1. Entpacke die ZIP-Datei `Pflanzen-Wohnung-Android.zip` auf deinem Computer.
2. Auf der Seite deines neuen Repositorys auf den Link **uploading an existing file** klicken.
3. Öffne den entpackten Ordner, markiere **alles darin** (Strg+A bzw. Cmd+A) und ziehe es
   in das Browserfenster. Wichtig: den **Inhalt** des Ordners ziehen, nicht den Ordner selbst.
4. Unten auf **Commit changes** klicken und warten, bis alles hochgeladen ist.

> **Achtung, versteckter Ordner `.github`:** Darin liegt die Bau-Anleitung für den Roboter.
> Ordner, die mit einem Punkt beginnen, sind oft unsichtbar:
> - **Mac:** Im Finder **Cmd + Shift + .** (Punkt) drücken – dann erscheint `.github`.
> - **Windows:** Im Explorer **Ansicht → Einblenden → Ausgeblendete Elemente** anhaken.
>
> Prüfe nach dem Hochladen: Auf der Repository-Seite muss ein Ordner **.github** zu sehen sein.
>
> **Falls `.github` fehlt** (Plan B, dauert 1 Minute):
> 1. Im Repository oben auf den Reiter **Actions** → **set up a workflow yourself**.
> 2. Den Dateinamen oben auf `build-apk.yml` ändern.
> 3. Den gesamten Inhalt der Datei `.github/workflows/build-apk.yml` aus dem entpackten Ordner
>    (mit einem Texteditor öffnen) hineinkopieren und **Commit changes** klicken.
>
> **Noch einfacher ohne Versteck-Probleme:** das kostenlose Programm **GitHub Desktop**
> (<https://desktop.github.com>). Dort *File → Add local repository* → entpackten Ordner wählen →
> „create a repository“ → **Publish repository**. Es lädt automatisch alles hoch, auch `.github`.

### 4. App bauen lassen
1. Im Repository oben auf den Reiter **Actions** klicken.
   (Falls eine Frage kommt, auf **I understand my workflows, go ahead and enable them** klicken.)
2. Links **APK bauen** auswählen → rechts **Run workflow** → grüner Knopf **Run workflow**.
   (Nach dem Hochladen startet er meist schon von selbst.)
3. Warten, bis ein **grüner Haken** erscheint (ca. 5–10 Minuten).
   Ein rotes X heißt: Fehler – klick drauf, dann siehst du, was schiefging.

### 5. APK herunterladen
1. Auf den Lauf mit dem grünen Haken klicken.
2. Ganz unten bei **Artifacts** auf **Pflanzen-Wohnung-APK** klicken – es wird eine ZIP-Datei geladen.
3. ZIP entpacken → darin liegt **app-debug.apk**.

### 6. Auf dem Handy installieren
1. Die Datei `app-debug.apk` aufs Handy bringen (z. B. per E-Mail an dich selbst, Google Drive,
   USB-Kabel – oder die Schritte 4–5 direkt im Handy-Browser machen).
2. Auf dem Handy die APK antippen.
3. Android fragt nach **„Unbekannte Apps installieren“ / „Unbekannte Quellen“** → für die App,
   mit der du die Datei geöffnet hast (z. B. Chrome oder „Dateien“), **erlauben**.
4. **Installieren** tippen. Falls „Play Protect“ warnt: **Trotzdem installieren** (die App ist
   von dir selbst gebaut, nicht aus dem Play Store – deshalb die Warnung).
5. App **Pflanzen-Wohnung** öffnen.

### 7. Erinnerung einschalten
1. In der App oben rechts **Meine Pflanzen** → Glocken-Symbol (oder Kompass → **Erinnerung**).
2. Schalter **Erinnerung** an → Android fragt nach Benachrichtigungen → **Zulassen**.
3. Uhrzeit wählen (Standard 08:00). Fertig.

Die App erinnert dich dann an jedem Tag, an dem mindestens eine Pflanze fällig ist, z. B.
„🌿 Pflanzen gießen – Heute: Monstera (400 ml), Calathea (260 ml)“.
Tippst du auf die Benachrichtigung, öffnet sich gleich die Gieß-Liste.
Geplant wird immer für die nächsten 21 Tage; jedes Öffnen der App plant neu.

---

## Weg B: Selbst bauen mit Android Studio (für Fortgeschrittene)

Dafür brauchst du zwei kostenlose Programme:
**Node.js** (<https://nodejs.org>, Version „LTS“, mindestens 22) und
**Android Studio** (<https://developer.android.com/studio>).

1. ZIP entpacken.
2. Im entpackten Ordner ein Terminal öffnen
   (Windows: im Ordner in die Adresszeile `cmd` tippen und Enter; Mac: Rechtsklick auf den Ordner →
   *Neues Terminal beim Ordner*) und nacheinander eingeben:
   ```
   npm install
   npx cap sync android
   ```
   (Das lädt die Capacitor-Bausteine – ohne diesen Schritt kann Android Studio das Projekt nicht öffnen.)
3. Android Studio starten → **Open** → den Unterordner **android** auswählen.
   Beim ersten Öffnen lädt Android Studio einiges herunter – warten, bis unten nichts mehr lädt.
4. Menü **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
5. Unten rechts erscheint „APK(s) generated“ → **locate** klicken.
   Die Datei liegt in `android/app/build/outputs/apk/debug/app-debug.apk`.
6. Weiter wie bei Weg A, Schritt 6.

(Ist dein Handy per USB verbunden und das Entwickler-Debugging aktiv, geht auch einfach der grüne
▶-Knopf in Android Studio – dann wird die App direkt aufs Handy installiert.)

---

## Gut zu wissen

- **Deine Pflanzen sind getrennt gespeichert:** Die Browser-Version und die Android-App haben
  jeweils ihren eigenen Speicher. In der App musst du die Pflanzen einmal neu platzieren.
- **Updates:** Eine neue APK einfach über die alte installieren – die gespeicherten Pflanzen bleiben
  erhalten (das Projekt enthält dafür einen festen Schlüssel `android/app/debug.keystore`).
  **Nicht** vorher deinstallieren, sonst sind die Daten weg.
- **Web-App ändern:** Neue Versionen von `index.html`, `app.js`, `plants.js`, `floorplan.js` in den
  Ordner **www** legen (bei GitHub: in den Ordner `www` hochladen) – der Bau-Roboter baut dann
  automatisch eine neue APK.
- **Erinnerung kommt nicht?** Android-Einstellungen → Apps → Pflanzen-Wohnung →
  Benachrichtigungen erlauben, und unter *Akku* „Nicht eingeschränkt“ wählen. Manche Handys
  (Xiaomi, Huawei, Samsung-Energiesparmodus) verzögern Erinnerungen sonst.
  Ab Android 14 können sie um einige Minuten später kommen, wenn „Wecker & Erinnerungen“
  für die App nicht erlaubt ist (Einstellungen → Apps → Pflanzen-Wohnung → *Wecker und Erinnerungen*).
- Die App braucht **kein Internet** und sendet keine Daten.
