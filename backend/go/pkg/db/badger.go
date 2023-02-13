package db

import (
	"context"
	"fmt"
	"github.com/dgraph-io/badger/v3"
	"inquery/go/pkg/util"
	"os"
	"sync"
	"time"
)

const (
	// Default BadgerDB discardRatio. It represents the discard ratio for the BadgerDB GC.
	// Ref: https://godoc.org/github.com/dgraph-io/badger#DB.RunValueLogGC
	badgerDiscardRatio = 0.5
	// Default BadgerDB GC interval
	badgerGCInterval = 10 * time.Minute
	badgerDefaultDir = "/tmp/badger"
)

var (
	DB                    *BadgerDB
	DefaultConnectionName = "postgres"
	NamespaceConnections  = "connections"
	NamespaceActions      = "actions"
)

type (
	// BadgerDBInt defines an embedded key/value store database interface.
	BadgerDBInt interface {
		Get(namespace, key string) (value []byte, err error)
		Has(namespace, key string) (bool, error)
		Find(namespace string) (map[string][]byte, error)
		Set(namespace, key string, value []byte) error
		Delete(namespace, key string) error
		Close() error
	}
	// BadgerDB is a wrapper around a BadgerDB backend database that implements the BadgerDBInt interface.
	BadgerDB struct {
		db         *badger.DB
		ctx        context.Context
		cancelFunc context.CancelFunc
	}
)

// InitBadgerDB returns a new initialized BadgerDB database implementing the BadgerDBInt interface.
// If the database cannot be initialized, an error will be returned.
func InitBadgerDB(ctx context.Context, wg *sync.WaitGroup) error {
	dir := os.Getenv("DISK_DB_LOCATION")
	if len(dir) == 0 {
		dir = badgerDefaultDir
	}
	if err := os.MkdirAll(dir, 0774); err != nil {
		return err
	}
	opts := badger.DefaultOptions(dir).
		WithValueDir(dir).
		WithSyncWrites(false).
		WithLoggingLevel(badger.WARNING).
		WithNumVersionsToKeep(0).
		WithCompactL0OnClose(true).
		WithValueLogFileSize(1024 * 1024 * 16).
		WithMemTableSize(1024 * 1024 * 32)

	encryptionKey := os.Getenv("DISK_DB_ENCRYPTION_KEY")
	if len(encryptionKey) != 0 {
		opts = opts.WithEncryptionKey([]byte(encryptionKey)).
			WithIndexCacheSize(100 << 20)
	}
	badgerDB, err := badger.Open(opts)
	if err != nil {
		return err
	}
	DB = &BadgerDB{
		db: badgerDB,
	}
	DB.ctx, DB.cancelFunc = context.WithCancel(ctx)
	go DB.run(wg)
	util.Log.Debugw("BadgerDB started")
	return nil
}

// Get attempts to get a value for a given key and namespace.
// If the key does not exist in the provided namespace, an error is returned, otherwise the retrieved value.
func (bdb *BadgerDB) Get(namespace, key string) (value []byte, err error) {
	err = bdb.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get(namespaceKey(namespace, key))
		if err != nil {
			return err
		}
		return item.Value(func(v []byte) error {
			value = make([]byte, len(v))
			copy(value, v)
			return nil
		})
	})
	if err != nil {
		return nil, err
	}
	return value, nil
}

// Has returns a boolean reflecting if the database has a given key for a namespace or not.
// An error is only returned if an error to Get would be returned that is not of type badger.ErrKeyNotFound.
func (bdb *BadgerDB) Has(namespace, key string) (ok bool, err error) {
	_, err = bdb.Get(namespace, key)
	switch err {
	case badger.ErrKeyNotFound:
		ok, err = false, nil
	case nil:
		ok, err = true, nil
	}
	return
}

// Find attempts to get a map[key]values for a given namespace.
func (bdb *BadgerDB) Find(namespace string) (values map[string][]byte, err error) {
	values = make(map[string][]byte)
	err = bdb.db.View(func(txn *badger.Txn) error {
		it := txn.NewIterator(badger.DefaultIteratorOptions)
		defer it.Close()
		prefix := []byte(namespace)
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			item := it.Item()
			k := string(item.KeyCopy(nil))
			v, err := item.ValueCopy(nil)
			if err != nil {
				return err
			}
			values[k] = v
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return values, nil
}

// Set attempts to store a value for a given key and namespace.
// If the key/value pair cannot be saved, an error is returned.
func (bdb *BadgerDB) Set(namespace, key string, value []byte) error {
	err := bdb.db.Update(func(txn *badger.Txn) error {
		return txn.Set(namespaceKey(namespace, key), value)
	})
	if err != nil {
		util.Log.Debugw("Failed to set key", "key", key, "namespace", namespace, "error", err)
		return err
	}
	return nil
}

// Delete attempts to store a value for a given key and namespace.
// If the key/value pair cannot be saved, an error is returned.
func (bdb *BadgerDB) Delete(namespace, key string) error {
	err := bdb.db.Update(func(txn *badger.Txn) error {
		return txn.Delete(namespaceKey(namespace, key))
	})
	if err != nil {
		util.Log.Debugw("Failed to delete key", "key", key, "namespace", namespace, "error", err)
		return err
	}
	return nil
}

// Close closes the connection to the underlying BadgerDB database as well as invoking the context's cancel function.
func (bdb *BadgerDB) Close() error {
	bdb.cancelFunc()
	if err := bdb.db.Close(); err != nil {
		util.Log.Errorw("Failed to close BadgerDB", "error", err)
		return err
	}
	util.Log.Debugw("BadgerDB shutdown")
	return nil
}

// run triggers the garbage collection for the BadgerDB backend database and listens for context cancellation.
func (bdb *BadgerDB) run(wg *sync.WaitGroup) {
	defer wg.Done()
	ticker := time.NewTicker(badgerGCInterval)
	for {
		select {
		case <-ticker.C:
			err := bdb.db.RunValueLogGC(badgerDiscardRatio)
			if err != nil {
				// Don't report an error when GC didn't result in any cleanup
				if err == badger.ErrNoRewrite {
					util.Log.Debugw("No BadgerDB GC occurred", "error", err)
				} else {
					util.Log.Debugw("Failed to GC BadgerDB", "error", err)
				}
			}
		case <-bdb.ctx.Done():
			bdb.Close()
			return
		}
	}
}

// namespaceKey returns a composite key used for lookup and storage for a given namespace and key.
func namespaceKey(namespace, key string) []byte {
	return []byte(fmt.Sprintf("%s/%s", namespace, key))
}
