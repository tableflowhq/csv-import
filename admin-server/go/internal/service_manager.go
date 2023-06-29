package internal

import (
	"context"
	"sync"
)

var ShutdownWaitGroup sync.WaitGroup
var ShutdownCtx context.Context
var ShutdownCancelFunc context.CancelFunc
