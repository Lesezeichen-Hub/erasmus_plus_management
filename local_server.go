package main

import (
	"context"
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
)

func main() {
	port := flag.Int("port", 8765, "Startport fuer den lokalen Webserver")
	noBrowser := flag.Bool("no-browser", false, "Browser nicht automatisch oeffnen")
	flag.Parse()

	root, err := appRoot()
	if err != nil {
		log.Fatal(err)
	}

	address, listener, err := listenFrom(*port)
	if err != nil {
		log.Fatal(err)
	}
	defer listener.Close()

	server := &http.Server{
		Handler: securityHeaders(http.FileServer(noDirListing{fs: http.Dir(root)})),
	}

	url := "http://" + address + "/"
	fmt.Println("Erasmus+ Management lokaler Server")
	fmt.Println("Ordner:", root)
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
