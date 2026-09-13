package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

const (
	updateBaseURL     = "https://raw.githubusercontent.com/purfect/erasmus_plus_management/main/"
	maxUpdateFileSize = 10 << 20
)

// These are the only files the local server may replace from the fixed GitHub repository.
// Local databases, backups and the server executable are deliberately outside this list.
var updateFiles = []string{
	"index.html",
	"app.js",
	"management-reports.js",
	"styles.css",
	"reset_database.html",
	"LICENSE-lucide.txt",
	"version.json", // Kept last so the displayed version changes only after the app files are ready.
}

type appVersion struct {
	Version string `json:"version"`
}

type updateResult struct {
	Current string
	Latest  string
	Updated bool
}

func main() {
	port := flag.Int("port", 8765, "Startport fuer den lokalen Webserver")
	noBrowser := flag.Bool("no-browser", false, "Browser nicht automatisch oeffnen")
	checkUpdates := flag.Bool("updates", true, "Aktuelle Web-App-Dateien von GitHub beim Start pruefen")
	flag.Parse()

	root, err := appRoot()
	if err != nil {
		log.Fatal(err)
	}
	if *checkUpdates {
		result, updateErr := updateApplicationFiles(root)
		if updateErr != nil {
			fmt.Println("GitHub-Update: nicht verfuegbar (Start wird fortgesetzt):", updateErr)
		} else if result.Updated {
			fmt.Printf("GitHub-Update: %s -> %s installiert\n", result.Current, result.Latest)
		} else {
			fmt.Println("GitHub-Update: bereits aktuell (Version", result.Current+")")
		}
	}
	sqliteStore, sqliteErr := openSQLiteStore(root)
	if sqliteStore != nil {
		defer sqliteStore.Close()
	}

	address, listener, err := listenFrom(*port)
	if err != nil {
		log.Fatal(err)
	}
	defer listener.Close()

	mux := http.NewServeMux()
	mux.Handle("/api/sqlite/status", sqliteStatusHandler(sqliteStore, sqliteErr))
	mux.Handle("/api/sqlite/latest", sqliteLatestHandler(sqliteStore))
	mux.Handle("/api/sqlite/snapshot", sqliteSnapshotHandler(sqliteStore))
	mux.Handle("/", http.FileServer(noDirListing{fs: http.Dir(root)}))

	server := &http.Server{Handler: securityHeaders(mux)}

	url := "http://" + address + "/"
	fmt.Println("Erasmus+ Management lokaler Server")
	fmt.Println("Ordner:", root)
	if sqliteErr != nil {
		fmt.Println("SQLite-Datei: konnte nicht angelegt werden:", sqliteErr)
	} else {
		fmt.Println("SQLite-Datei:", sqliteStore.Path)
	}
	fmt.Println("URL:", url)
	fmt.Println("Beenden mit Strg+C")

	if !*noBrowser {
		go func() {
			time.Sleep(400 * time.Millisecond)
			_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
		}()
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt)
	go func() {
		<-done
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = server.Shutdown(ctx)
	}()

	err = server.Serve(listener)
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func updateApplicationFiles(root string) (updateResult, error) {
	local, err := readAppVersion(filepath.Join(root, "version.json"))
	if err != nil {
		return updateResult{}, fmt.Errorf("lokale version.json: %w", err)
	}
	remoteVersionData, err := downloadUpdateFile("version.json")
	if err != nil {
		return updateResult{Current: local.Version}, err
	}
	var remote appVersion
	if err := json.Unmarshal(remoteVersionData, &remote); err != nil || remote.Version == "" {
		if err == nil {
			err = errors.New("Versionsnummer fehlt")
		}
		return updateResult{Current: local.Version}, fmt.Errorf("GitHub version.json: %w", err)
	}
	result := updateResult{Current: local.Version, Latest: remote.Version}
	if !versionIsNewer(remote.Version, local.Version) {
		return result, nil
	}

	staged := make(map[string][]byte, len(updateFiles))
	for _, name := range updateFiles {
		contents, err := downloadUpdateFile(name)
		if err != nil {
			return result, fmt.Errorf("GitHub-Datei %s: %w", name, err)
		}
		staged[name] = contents
	}
	if err := installUpdatedFiles(root, staged); err != nil {
		return result, err
	}
	result.Updated = true
	return result, nil
}

func readAppVersion(path string) (appVersion, error) {
	contents, err := os.ReadFile(path)
	if err != nil {
		return appVersion{}, err
	}
	var version appVersion
	if err := json.Unmarshal(contents, &version); err != nil {
		return appVersion{}, err
	}
	if version.Version == "" {
		return appVersion{}, errors.New("Versionsnummer fehlt")
	}
	return version, nil
}

func downloadUpdateFile(name string) ([]byte, error) {
	client := &http.Client{Timeout: 8 * time.Second}
	response, err := client.Get(updateBaseURL + name)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %s", response.Status)
	}
	if response.ContentLength > maxUpdateFileSize {
		return nil, errors.New("Datei ist zu gross")
	}
	contents, err := io.ReadAll(io.LimitReader(response.Body, maxUpdateFileSize+1))
	if err != nil {
		return nil, err
	}
	if len(contents) == 0 || len(contents) > maxUpdateFileSize {
		return nil, errors.New("ungueltige Dateigroesse")
	}
	return contents, nil
}

func installUpdatedFiles(root string, staged map[string][]byte) error {
	for _, name := range updateFiles {
		if err := os.WriteFile(filepath.Join(root, "."+name+".update"), staged[name], 0644); err != nil {
			return fmt.Errorf("Update vorbereiten (%s): %w", name, err)
		}
	}
	installed := make([]string, 0, len(updateFiles))
	for _, name := range updateFiles {
		target := filepath.Join(root, name)
		temporary := filepath.Join(root, "."+name+".update")
		backup := filepath.Join(root, "."+name+".backup")
		_ = os.Remove(backup)
		if _, err := os.Stat(target); err == nil {
			if err := os.Rename(target, backup); err != nil {
				restoreUpdatedFiles(root, installed)
				return fmt.Errorf("Sicherung anlegen (%s): %w", name, err)
			}
		}
		if err := os.Rename(temporary, target); err != nil {
			_ = os.Rename(backup, target)
			restoreUpdatedFiles(root, installed)
			return fmt.Errorf("Update installieren (%s): %w", name, err)
		}
		installed = append(installed, name)
	}
	for _, name := range updateFiles {
		_ = os.Remove(filepath.Join(root, "."+name+".backup"))
		_ = os.Remove(filepath.Join(root, "."+name+".update"))
	}
	return nil
}

func restoreUpdatedFiles(root string, installed []string) {
	for index := len(installed) - 1; index >= 0; index-- {
		name := installed[index]
		target := filepath.Join(root, name)
		backup := filepath.Join(root, "."+name+".backup")
		_ = os.Remove(target)
		_ = os.Rename(backup, target)
	}
	for _, name := range updateFiles {
		_ = os.Remove(filepath.Join(root, "."+name+".update"))
	}
}

func versionIsNewer(candidate, current string) bool {
	parse := func(version string) ([3]int, bool) {
		var parts [3]int
		segments := strings.Split(strings.TrimPrefix(version, "v"), ".")
		if len(segments) != 3 {
			return parts, false
		}
		for index, segment := range segments {
			value, err := strconv.Atoi(segment)
			if err != nil || value < 0 {
				return parts, false
			}
			parts[index] = value
		}
		return parts, true
	}
	candidateParts, candidateOK := parse(candidate)
	currentParts, currentOK := parse(current)
	if !candidateOK {
		return false
	}
	if !currentOK {
		return true
	}
	for index := range candidateParts {
		if candidateParts[index] != currentParts[index] {
			return candidateParts[index] > currentParts[index]
		}
	}
	return false
}

func appRoot() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	root := filepath.Dir(exe)
	if _, err := os.Stat(filepath.Join(root, "index.html")); err == nil {
		return root, nil
	}
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	if _, err := os.Stat(filepath.Join(wd, "index.html")); err == nil {
		return wd, nil
	}
	return "", fmt.Errorf("index.html nicht gefunden")
}

type sqliteStore struct {
	DB   *sql.DB
	Path string
}

func openSQLiteStore(root string) (*sqliteStore, error) {
	dataDir := filepath.Join(root, "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, err
	}
	sqlitePath := filepath.Join(dataDir, "erasmus_plus_management.sqlite")
	db, err := sql.Open("sqlite", sqlitePath)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS snapshots (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			created_at TEXT NOT NULL,
			payload TEXT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at);
	`); err != nil {
		_ = db.Close()
		return nil, err
	}
	return &sqliteStore{DB: db, Path: sqlitePath}, nil
}

func (s *sqliteStore) Close() {
	_ = s.DB.Close()
}

func sqliteStatusHandler(store *sqliteStore, setupErr error) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if store == nil {
			writeJSON(w, http.StatusOK, map[string]any{"available": false, "error": setupErr.Error()})
			return
		}
		var count int
		_ = store.DB.QueryRow(`SELECT COUNT(*) FROM snapshots`).Scan(&count)
		writeJSON(w, http.StatusOK, map[string]any{"available": true, "path": store.Path, "snapshots": count})
	})
}

func sqliteLatestHandler(store *sqliteStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if store == nil {
			http.Error(w, "sqlite unavailable", http.StatusServiceUnavailable)
			return
		}
		var payload string
		err := store.DB.QueryRow(`SELECT payload FROM snapshots ORDER BY id DESC LIMIT 1`).Scan(&payload)
		if errors.Is(err, sql.ErrNoRows) {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write([]byte(payload))
	})
}

func sqliteSnapshotHandler(store *sqliteStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if store == nil {
			http.Error(w, "sqlite unavailable", http.StatusServiceUnavailable)
			return
		}
		defer r.Body.Close()
		var payload map[string]any
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 25<<20)).Decode(&payload); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		raw, err := json.MarshalIndent(payload, "", "  ")
		if err != nil {
			http.Error(w, "invalid payload", http.StatusBadRequest)
			return
		}
		if _, err := store.DB.Exec(`INSERT INTO snapshots(created_at, payload) VALUES(?, ?)`, time.Now().UTC().Format(time.RFC3339), string(raw)); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{"ok": true})
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func listenFrom(startPort int) (string, net.Listener, error) {
	for port := startPort; port < startPort+25; port++ {
		address := "127.0.0.1:" + strconv.Itoa(port)
		listener, err := net.Listen("tcp", address)
		if err == nil {
			return address, listener, nil
		}
	}
	return "", nil, fmt.Errorf("kein freier Port im Bereich %d-%d gefunden", startPort, startPort+24)
}

type noDirListing struct {
	fs http.FileSystem
}

func (n noDirListing) Open(name string) (http.File, error) {
	file, err := n.fs.Open(name)
	if err != nil {
		return nil, err
	}
	info, err := file.Stat()
	if err != nil {
		_ = file.Close()
		return nil, err
	}
	if info.IsDir() {
		index := strings.TrimRight(name, "/") + "/index.html"
		if index == "/index.html" {
			index = "index.html"
		}
		if _, err := n.fs.Open(index); err != nil {
			_ = file.Close()
			return nil, os.ErrNotExist
		}
	}
	return file, nil
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		next.ServeHTTP(w, r)
	})
}
