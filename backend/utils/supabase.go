package utils

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
)

// SupabaseConfig holds Supabase Storage configuration
type SupabaseConfig struct {
	URL    string // e.g. https://xxxx.supabase.co
	Key    string // service_role key
	Bucket string // bucket name
}

// GetSupabaseConfig loads Supabase configuration from environment
func GetSupabaseConfig() SupabaseConfig {
	bucket := os.Getenv("SUPABASE_BUCKET")
	if bucket == "" {
		bucket = "webbinar-storage"
	}

	return SupabaseConfig{
		URL:    os.Getenv("SUPABASE_URL"),
		Key:    os.Getenv("SUPABASE_KEY"),
		Bucket: bucket,
	}
}

// IsSupabaseConfigured checks if Supabase credentials are available
func IsSupabaseConfigured() bool {
	config := GetSupabaseConfig()
	return config.URL != "" && config.Key != ""
}

// UploadToSupabase uploads a file to Supabase Storage and returns the public URL.
// storagePath is the path within the bucket, e.g. "profile/user_1_123456.jpg"
func UploadToSupabase(storagePath string, file multipart.File, contentType string) (string, error) {
	config := GetSupabaseConfig()

	if config.URL == "" || config.Key == "" {
		return "", fmt.Errorf("supabase not configured: URL=%q, Key length=%d", config.URL, len(config.Key))
	}

	// Trim trailing slash from URL to avoid double slashes
	baseURL := strings.TrimRight(config.URL, "/")

	// Read file content
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %v", err)
	}

	// Build the upload URL
	// POST https://<project>.supabase.co/storage/v1/object/<bucket>/<path>
	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", baseURL, config.Bucket, storagePath)

	fmt.Printf("📤 Supabase Upload Debug:\n")
	fmt.Printf("   URL: %s\n", uploadURL)
	fmt.Printf("   Bucket: %s\n", config.Bucket)
	fmt.Printf("   Path: %s\n", storagePath)
	fmt.Printf("   Content-Type: %s\n", contentType)
	fmt.Printf("   File size: %d bytes\n", len(fileBytes))
	fmt.Printf("   Key prefix: %s...\n", config.Key[:20])

	req, err := http.NewRequest("POST", uploadURL, bytes.NewReader(fileBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+config.Key)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true") // overwrite if exists

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("upload request failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		// Build public URL
		publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", baseURL, config.Bucket, storagePath)
		fmt.Printf("✅ File uploaded to Supabase: %s\n", publicURL)
		return publicURL, nil
	}

	errMsg := fmt.Sprintf("Supabase upload error (status %d): %s", resp.StatusCode, string(body))
	fmt.Printf("❌ %s\n", errMsg)
	return "", fmt.Errorf(errMsg)
}

// UploadFileHeaderToSupabase is a convenience wrapper that accepts *multipart.FileHeader
// (as returned by c.FormFile()) and uploads to Supabase
func UploadFileHeaderToSupabase(storagePath string, fileHeader *multipart.FileHeader) (string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	return UploadToSupabase(storagePath, file, contentType)
}

// DeleteFromSupabase deletes a file from Supabase Storage
func DeleteFromSupabase(storagePath string) error {
	config := GetSupabaseConfig()

	if config.URL == "" || config.Key == "" {
		return fmt.Errorf("supabase not configured")
	}

	// DELETE https://<project>.supabase.co/storage/v1/object/<bucket>/<path>
	deleteURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", config.URL, config.Bucket, storagePath)

	req, err := http.NewRequest("DELETE", deleteURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+config.Key)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("delete request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		fmt.Printf("✅ File deleted from Supabase: %s\n", storagePath)
		return nil
	}

	body, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("supabase delete error (status %d): %s", resp.StatusCode, string(body))
}

// GetStoragePathFromURL extracts the storage path from a full Supabase public URL
// e.g. "https://xxx.supabase.co/storage/v1/object/public/bucket/path/file.jpg" → "path/file.jpg"
func GetStoragePathFromURL(fullURL string) string {
	config := GetSupabaseConfig()
	prefix := fmt.Sprintf("%s/storage/v1/object/public/%s/", config.URL, config.Bucket)
	return strings.TrimPrefix(fullURL, prefix)
}
