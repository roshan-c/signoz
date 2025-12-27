package routerweb

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/SigNoz/signoz/pkg/errors"
	"github.com/SigNoz/signoz/pkg/factory"
	"github.com/SigNoz/signoz/pkg/http/middleware"
	"github.com/SigNoz/signoz/pkg/web"
	"github.com/gorilla/mux"
)

const (
	indexFileName string = "index.html"
)

type provider struct {
	config web.Config

	// indexHTMLOnce ensures we only process index.html once
	indexHTMLOnce sync.Once
	// indexHTMLContent holds the processed index.html with injected config
	indexHTMLContent []byte
	// indexHTMLError holds any error that occurred during processing
	indexHTMLError error
}

func NewFactory() factory.ProviderFactory[web.Web, web.Config] {
	return factory.NewProviderFactory(factory.MustNewName("router"), New)
}

func New(ctx context.Context, settings factory.ProviderSettings, config web.Config) (web.Web, error) {
	fi, err := os.Stat(config.Directory)
	if err != nil {
		return nil, errors.WrapInvalidInputf(err, errors.CodeInvalidInput, "cannot access web directory")
	}

	ok := fi.IsDir()
	if !ok {
		return nil, errors.NewInvalidInputf(errors.CodeInvalidInput, "web directory is not a directory")
	}

	fi, err = os.Stat(filepath.Join(config.Directory, indexFileName))
	if err != nil {
		return nil, errors.WrapInvalidInputf(err, errors.CodeInvalidInput, "cannot access %q in web directory", indexFileName)
	}

	if os.IsNotExist(err) || fi.IsDir() {
		return nil, errors.NewInvalidInputf(errors.CodeInvalidInput, "%q does not exist", indexFileName)
	}

	return &provider{
		config: config,
	}, nil
}

func (provider *provider) AddToRouter(router *mux.Router) error {
	cache := middleware.NewCache(0)
	err := router.PathPrefix(provider.config.Prefix).
		Handler(
			http.StripPrefix(
				provider.config.Prefix,
				cache.Wrap(http.HandlerFunc(provider.ServeHTTP)),
			),
		).GetError()
	if err != nil {
		return errors.WrapInternalf(err, errors.CodeInternal, "unable to add web to router")
	}

	return nil
}

// getProcessedIndexHTML returns the index.html content with runtime configuration injected.
// The configuration is injected once and cached for subsequent requests.
func (provider *provider) getProcessedIndexHTML() ([]byte, error) {
	provider.indexHTMLOnce.Do(func() {
		indexPath := filepath.Join(provider.config.Directory, indexFileName)
		content, err := os.ReadFile(indexPath)
		if err != nil {
			provider.indexHTMLError = errors.WrapInvalidInputf(err, errors.CodeInvalidInput, "cannot read index.html")
			return
		}

		// Normalize the prefix to ensure it has a trailing slash for the base href
		prefix := provider.config.Prefix
		if !strings.HasSuffix(prefix, "/") {
			prefix = prefix + "/"
		}

		// Create the runtime configuration script
		// This will be read by the frontend to configure routing and asset paths
		configScript := fmt.Sprintf(`<script>window.__SIGNOZ_CONFIG__ = { basePath: %q };</script>`, prefix)

		// Create the base tag for relative asset resolution
		baseTag := fmt.Sprintf(`<base href=%q />`, prefix)

		// Find the position to inject (right after <head> or before first <meta>)
		headIndex := bytes.Index(content, []byte("<head>"))
		if headIndex == -1 {
			provider.indexHTMLError = errors.NewInvalidInputf(errors.CodeInvalidInput, "index.html does not contain <head> tag")
			return
		}

		// Insert after <head>
		insertPos := headIndex + len("<head>")
		injection := []byte("\n\t" + baseTag + "\n\t" + configScript + "\n")

		// Build the new content
		newContent := make([]byte, 0, len(content)+len(injection))
		newContent = append(newContent, content[:insertPos]...)
		newContent = append(newContent, injection...)
		newContent = append(newContent, content[insertPos:]...)

		provider.indexHTMLContent = newContent
	})

	return provider.indexHTMLContent, provider.indexHTMLError
}

// serveIndexHTML serves the processed index.html with injected runtime configuration
func (provider *provider) serveIndexHTML(rw http.ResponseWriter, req *http.Request) {
	content, err := provider.getProcessedIndexHTML()
	if err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "text/html; charset=utf-8")
	// Disable caching for index.html to ensure users get the latest version
	rw.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	rw.Header().Set("Pragma", "no-cache")
	rw.Header().Set("Expires", "0")
	rw.Write(content)
}

func (provider *provider) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	// Join internally call path.Clean to prevent directory traversal
	path := filepath.Join(provider.config.Directory, req.URL.Path)

	// check whether a file exists or is a directory at the given path
	fi, err := os.Stat(path)
	if err != nil {
		// if the file doesn't exist, serve index.html with injected config
		if os.IsNotExist(err) {
			provider.serveIndexHTML(rw, req)
			return
		}

		// if we got an error (that wasn't that the file doesn't exist) stating the
		// file, return a 500 internal server error and stop
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}

	if fi.IsDir() {
		// path is a directory, serve index.html with injected config
		provider.serveIndexHTML(rw, req)
		return
	}

	// otherwise, use http.FileServer to serve the static file
	http.FileServer(http.Dir(provider.config.Directory)).ServeHTTP(rw, req)
}
