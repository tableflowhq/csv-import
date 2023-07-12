package types

type Res struct {
	Err     string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

type UploadRow struct {
	Index  int            `json:"index" example:"0"`
	Values map[int]string `json:"values"`
}

type ImportRow struct {
	Index  int               `json:"index" example:"0"`
	Values map[string]string `json:"values"`
}
