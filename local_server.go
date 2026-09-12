package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
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

func main() {
	port := flag.Int("port", 8765, "Startport fuer den lokalen Webserver")
	noBrowser := flag.Bool("no-browser", false, "Browser nicht automatisch oeffnen")
	flag.Parse()

	root, err := appRoot()
	if err != nil {
		log.Fatal(err)
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
