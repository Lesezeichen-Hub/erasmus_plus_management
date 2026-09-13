package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestVersionIsNewer(t *testing.T) {
	cases := []struct {
		candidate string
		current   string
		want      bool
	}{
		{"1.45.0", "1.44.3", true},
		{"1.45.0", "1.45.0", false},
		{"1.44.9", "1.45.0", false},
		{"v2.0.0", "1.99.99", true},
		{"invalid", "1.0.0", false},
		{"1.0.0", "invalid", true},
	}
	for _, tc := range cases {
		if got := versionIsNewer(tc.candidate, tc.current); got != tc.want {
			t.Errorf("versionIsNewer(%q, %q) = %v, want %v", tc.candidate, tc.current, got, tc.want)
		}
	}
}

func TestInstallUpdatedFilesPreservesOtherData(t *testing.T) {
	root := t.TempDir()
	for _, name := range updateFiles {
		if err := os.WriteFile(filepath.Join(root, name), []byte("old "+name), 0644); err != nil {
			t.Fatal(err)
		}
	}
	dataPath := filepath.Join(root, "data", "erasmus_plus_management.sqlite")
	if err := os.MkdirAll(filepath.Dir(dataPath), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(dataPath, []byte("local database"), 0644); err != nil {
		t.Fatal(err)
	}
	staged := map[string][]byte{}
	for _, name := range updateFiles {
		staged[name] = []byte("new " + name)
	}
	if err := installUpdatedFiles(root, staged); err != nil {
		t.Fatal(err)
	}
	for _, name := range updateFiles {
		contents, err := os.ReadFile(filepath.Join(root, name))
		if err != nil || string(contents) != "new "+name {
			t.Errorf("updated file %s was not installed", name)
		}
		if _, err := os.Stat(filepath.Join(root, "."+name+".backup")); !os.IsNotExist(err) {
			t.Errorf("temporary backup for %s remains", name)
		}
	}
	contents, err := os.ReadFile(dataPath)
	if err != nil || string(contents) != "local database" {
		t.Error("local SQLite data was changed")
	}
}
